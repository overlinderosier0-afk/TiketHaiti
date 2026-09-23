import { Module, Controller, Get, Post, Body, Param, Req, UseGuards, Headers, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';
import { QrService } from '../tickets/qr.service';
import { PaymentSettlementService, Provider } from './payment-settlement.service';
import { verifyWebhookSignature } from './webhook-signature';

class InitiatePaymentDto {
  @IsString() orderId!: string;
}

const PROVIDER_CONFIG = {
  MONCASH: {
    secret: () => process.env.WEBHOOK_MONCASH_SECRET || process.env.WEBHOOK_SECRET || ''
  },
  NATCASH: {
    secret: () => process.env.WEBHOOK_NATCASH_SECRET || process.env.WEBHOOK_SECRET || ''
  }
} as const;

@Controller('payments')
class PaymentsController {
  constructor(private prisma: PrismaService, private settlement: PaymentSettlementService) {}

  /**
   * Le client choisit MonCash/NatCash au checkout. En l'absence d'API
   * marchande officielle, le paiement se fait par transfert manuel :
   * on renvoie le numéro marchand configuré et la référence à recopier
   * dans la note du transfert. La commande passe PAID quand l'admin
   * valide la réception (ou quand un webhook officiel arrivera : même
   * chemin de règlement via PaymentSettlementService).
   */
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
    if (order.expiresAt && order.expiresAt < new Date()) {
      await this.settlement.cancelOrder(order.id);
      throw new BadRequestException('Délai de paiement dépassé : la commande a été annulée, veuillez recommencer');
    }

    const merchantNumber = this.settlement.merchantNumber(provider);

    // Mémorise le fournisseur choisi, (ré)arme l'expiration et prépare la
    // ligne de paiement — la validation arrivera plus tard (admin/webhook).
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentMethod: provider,
          expiresAt: order.expiresAt ?? this.settlement.expiryFromNow()
        }
      });
      const existing = order.payments[0];
      if (existing) {
        await tx.payment.update({
          where: { id: existing.id },
          data: { provider, status: 'PENDING' }
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider,
            amount: order.total,
            currency: 'HTG',
            status: 'PENDING'
          }
        });
      }
    });

    const fresh = await this.prisma.order.findUnique({ where: { id: order.id } });

    return {
      provider,
      orderId: order.id,
      amount: order.total,
      currency: 'HTG',
      status: 'PENDING',
      expiresAt: fresh?.expiresAt ?? null,
      manualPayment: {
        configured: merchantNumber.length > 0,
        merchantNumber,
        referenceNote: order.paymentReference,
        instructions:
          `Envoyez ${order.total.toLocaleString('fr-FR')} HTG au ${merchantNumber || '(numéro à configurer)'} ` +
          `via ${provider === 'MONCASH' ? 'MonCash' : 'NatCash'}, puis recopiez exactement la référence ` +
          `${order.paymentReference} dans la note du transfert. Notre équipe vérifie la réception et vos ` +
          `billets sont émis automatiquement.`
      }
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
    // Expiration paresseuse : le polling du checkout déclenche le nettoyage.
    await this.settlement.expireStaleOrders(req.user.sub);
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
    if (!order || order.userId !== req.user.sub) {
      throw new UnauthorizedException('Commande inaccessible');
    }
    return {
      orderId,
      paymentStatus: order.paymentStatus,
      paymentProvider: order.payments[0]?.provider ?? null,
      providerStatus: order.payments[0]?.status ?? null,
      paymentReference: order.paymentReference,
      expiresAt: order.expiresAt
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

    // 2) Idempotence + règlement via le chemin partagé (même code que la
    // validation manuelle admin).
    const order = await this.prisma.order.findUnique({
      where: { paymentReference: payload.paymentReference }
    });
    if (!order) {
      return { received: true, idempotent: true, status: 'ignored' };
    }

    const providerStatus = String(payload.status || 'SUCCEEDED').toUpperCase();
    const succeeded = providerStatus === 'SUCCEEDED' || providerStatus === 'SUCCESS' || providerStatus === 'PAID';

    const result = await this.settlement.settleOrder(order.id, {
      provider,
      succeeded,
      transactionReference: payload.transactionReference,
      payload
    });

    return { received: true, idempotent: true, status: result.settled ? result.status : 'ignored' };
  }
}

@Module({
  controllers: [PaymentsController],
  providers: [PrismaService, QrService, PaymentSettlementService],
  exports: [PaymentSettlementService]
})
export class PaymentsModule {}
