import { Module, Controller, Get, Post, Body, Param, Req, UseGuards, Headers, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';

class InitiatePaymentDto {
  @IsString() eventId!: string;
  @IsOptional() @IsString() orderId?: string;
}

@Controller('payments')
class PaymentsController {
  constructor(private prisma: PrismaService) {}

  @Post('moncash/initiate')
  @UseGuards(JwtGuard)
  async initiateMonCash(@Body() dto: InitiatePaymentDto, @Req() req: any) {
    return {
      provider: 'MONCASH',
      orderId: dto.orderId ?? randomUUID(),
      checkoutUrl: 'https://sandbox.moncashbutton.digicelgroup.com/pay/live',
      status: 'PENDING'
    };
  }

  @Post('natcash/initiate')
  @UseGuards(JwtGuard)
  async initiateNatCash(@Body() dto: InitiatePaymentDto, @Req() req: any) {
    return {
      provider: 'NATCASH',
      orderId: dto.orderId ?? randomUUID(),
      checkoutUrl: 'https://sandbox.natcash.com/pay/live',
      status: 'PENDING'
    };
  }

  @Post('webhook/moncash')
  async moncashWebhook(@Body() payload: any, @Headers('x-signature') signature?: string) {
    return this.handleWebhook(payload, 'MONCASH', signature);
  }

  @Post('webhook/natcash')
  async natcashWebhook(@Body() payload: any, @Headers('x-signature') signature?: string) {
    return this.handleWebhook(payload, 'NATCASH', signature);
  }

  @Get('status/:orderId')
  @UseGuards(JwtGuard)
  async status(@Param('orderId') orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new BadRequestException('Order payment not found');

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    return {
      orderId,
      paymentStatus: order?.paymentStatus,
      paymentProvider: payment.provider,
      providerStatus: payment.status
    };
  }

  private async handleWebhook(payload: any, provider: 'MONCASH' | 'NATCASH', signature?: string) {
    if (!payload?.transactionReference) {
      throw new BadRequestException('Webhook invalid');
    }

    const order = await this.prisma.order.findFirst({
      where: { paymentReference: payload.transactionReference }
    });

    if (!order || order.paymentStatus !== 'PENDING') {
      return { received: true, idempotent: true, status: 'ignored' };
    }

    const payment = await this.prisma.payment.findUnique({ where: { orderId: order.id } });
    if (!payment) throw new BadRequestException('Payment record missing');

    await this.prisma.payment.update({
      where: { orderId: order.id },
      data: {
        status: 'SUCCEEDED',
        transactionReference: payload.transactionReference,
        webhookPayload: payload
      }
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PAID' }
    });

    return { received: true, idempotent: true, status: 'paid' };
  }
}

@Module({ controllers: [PaymentsController], providers: [PrismaService] })
export class PaymentsModule {}
