import { Module, Controller, Get, Post, Body, Param, Req, UseGuards, Headers, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { Request } from 'express';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';
import { QrService } from '../tickets/qr.service';
import { verifyWebhookSignature } from './webhook-signature';

class InitiatePaymentDto {
  @IsString() orderId!: string;
}

const PROVIDER_CONFIG = {
  MONCASH: {
    checkoutBase: () => process.env.MONCASH_API_URL || 'https://sandbox.moncashbutton.digicelgroup.com',
    secret: () => process.env.MONCASH_WEBHOOK_SECRET || ''
  },
  NATCASH: {
    checkoutBase: () => process.env.NATCASH_API_URL || 'https://sandbox.natcash.com',
    secret: () => process.env.NATCASH_WEBHOOK_SECRET || ''
  }
} as const;

type Provider = keyof typeof PROVIDER_CONFIG;

@Controller('payments')
class PaymentsController {
  constructor(private prisma: PrismaService, private qr: QrService) {}

  @Post('moncash/initiate')
  @UseGuards(JwtGuard)
  async initiateMonCash(@Body() dto: InitiatePaymentDto, @Req() req: any) {
    return this.initiate('MONCASH', dto, req.user.sub);
  }

  @Post('natcash/initiate')
  @UseGuards(JwtGuard)
  async initiateNatCash(@Body() dto: InitiatePaymentDto, @Req() req: any) {
    return this.initiate('NATCASH', dto, req.user.sub);
  }

  private async initiate(provider: Provider, dto: InitiatePaymentDto, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId }, include: { payments: true } });
    if (!order || order.userId !== userId) {
      throw new UnauthorizedException('Commande inaccessible');
    }
    if (order.paymentStatus !== 'PENDING') {
      throw new BadRequestException('Cette commande est déjà traitée');
    }

    // NOTE : intégration sandbox. En production, appeler ici l'API du
    // fournisseur (création de la transaction, redirection vers leur page
    // de paiement). Le webhook finalise la commande côté serveur.
    return {
      provider,
      orderId: order.id,
      amount: order.total,
      currency: 'HTG',
      checkoutUrl: `${PROVIDER_CONFIG[provider].checkoutBase()}/pay?order=${order.paymentReference}`,
      status: 'PENDING'
    };
  }

  @Post('webhook/moncash')
  async moncashWebhook(@Body() payload: any, @Req() req: Request, @Headers('x-signature') signature?: string) {
    return this.handleWebhook(payload, 'MONCASH', req, signature);
  }

  @Post('webhook/natcash')
  async natcashWebhook(@Body() payload: any, @Req() req: Request, @Headers('x-signature') signature?: string) {
    return this.handleWebhook(payload, 'NATCASH', req, signature);
  }

  @Get('status/:orderId')
  @UseGuards(JwtGuard)
  async status(@Param('orderId') orderId: string, @Req() req: any) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
    if (!order || order.userId !== req.user.sub) {
      throw new UnauthorizedException('Commande inaccessible');
    }
    return {
      orderId,
      paymentStatus: order.paymentStatus,
      paymentProvider: order.payments[0]?.provider ?? null,
      providerStatus: order.payments[0]?.status ?? null
    };
  }

  private async handleWebhook(payload: any, provider: Provider, req: Request, signature?: string) {
    // 1) Vérification de la signature HMAC du fournisseur.
    const secret = PROVIDER_CONFIG[provider].secret();
    const skip = process.env.WEBHOOK_SKIP_SIGNATURE === 'true';
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!skip) {
      if (!secret) throw new BadRequestException('Secret webhook non configuré');
      if (!rawBody || !verifyWebhookSignature(rawBody, signature, secret)) {
        throw new ForbiddenException('Signature webhook invalide');
      }
    }

    if (!payload?.transactionReference || !payload?.paymentReference) {
      throw new BadRequestException('Webhook invalide : transactionReference et paymentReference requis');
    }

    // 2) Idempotence : une commande déjà traitée ne déclenche rien de plus.
    const order = await this.prisma.order.findUnique({
      where: { paymentReference: payload.paymentReference },
      include: { payments: true, tickets: true }
    });
    if (!order || order.paymentStatus !== 'PENDING') {
      return { received: true, idempotent: true, status: 'ignored' };
    }

    const providerStatus = String(payload.status || 'SUCCEEDED').toUpperCase();
    const succeeded = providerStatus === 'SUCCEEDED' || providerStatus === 'SUCCESS' || providerStatus === 'PAID';

    await this.prisma.$transaction(async (tx) => {
      const payment = order.payments[0];
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: succeeded ? 'SUCCEEDED' : 'FAILED',
            transactionReference: payload.transactionReference,
            webhookPayload: payload
          }
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: succeeded ? 'PAID' : 'FAILED' }
      });

      if (succeeded) {
        // Émission des billets avec QR signé HMAC.
        for (let i = 0; i < order.quantity; i++) {
          const ticketId = `${order.id}-T${i + 1}`;
          const qrPayload = {
            ticketId,
            orderId: order.id,
            eventId: order.eventId,
            userId: order.userId,
            issuedAt: new Date().toISOString()
          };
          const { signature: qrSignature } = this.qr.signPayload(qrPayload);
          const qrImage = await QRCode.toDataURL(JSON.stringify({ ...qrPayload, signature: qrSignature }));

          await tx.ticket.create({
            data: {
              id: ticketId,
              orderId: order.id,
              eventId: order.eventId,
              userId: order.userId,
              qrPayload: JSON.stringify(qrPayload),
              qrSignature,
              qrImage
            }
          });
        }
      } else {
        // Échec : on libère les places réservées.
        await tx.event.update({
          where: { id: order.eventId },
          data: { ticketsAvailable: { increment: order.quantity } }
        });
      }
    });

    return { received: true, idempotent: true, status: succeeded ? 'paid' : 'failed' };
  }
}

@Module({
  controllers: [PaymentsController],
  providers: [PrismaService, QrService]
})
export class PaymentsModule {}
