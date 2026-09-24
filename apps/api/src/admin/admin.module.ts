import { Module, Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { IsString, IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';
import { AdminGuard } from '../auth/admin.guard';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentSettlementService, Provider } from '../payments/payment-settlement.service';
import { parsePage, pageResult } from '../common/pagination';

class AdminEventDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsString() slug!: string;
  @IsOptional() @IsString() bannerUrl?: string;
  @IsInt() cityId!: number;
  @IsInt() categoryId!: number;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() artistName?: string;
  @IsDateString() eventDate!: string;
  @IsOptional() @IsDateString() doorsOpen?: string;
  @IsInt() @Min(1) price!: number;
  @IsInt() @Min(1) capacity!: number;
}

class ConfirmOrderDto {
  @IsOptional() @IsString() transactionReference?: string;
}

@Controller('admin')
@UseGuards(JwtGuard, AdminGuard)
class AdminController {
  constructor(private prisma: PrismaService, private settlement: PaymentSettlementService) {}

  @Get('events')
  async events() {
    return this.prisma.event.findMany({
      include: { city: true, category: true },
      orderBy: { eventDate: 'asc' }
    });
  }

  @Post('events')
  async createEvent(@Body() dto: AdminEventDto) {
    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        slug: dto.slug,
        bannerUrl: dto.bannerUrl ?? null,
        cityId: dto.cityId,
        categoryId: dto.categoryId,
        address: dto.address ?? null,
        artistName: dto.artistName ?? null,
        eventDate: new Date(dto.eventDate),
        doorsOpen: dto.doorsOpen ? new Date(dto.doorsOpen) : null,
        price: dto.price,
        capacity: dto.capacity,
        ticketsAvailable: dto.capacity,
        status: 'PUBLISHED'
      }
    });
  }

  @Patch('events/:id')
  async updateEvent(@Param('id') id: string, @Body() dto: Partial<AdminEventDto>) {
    const data: any = { ...dto };
    if (dto.eventDate) data.eventDate = new Date(dto.eventDate);
    if (dto.doorsOpen) data.doorsOpen = new Date(dto.doorsOpen);
    delete data.capacity; // la capacité se gère via ticketsAvailable, pas en édition directe
    return this.prisma.event.update({ where: { id }, data });
  }

  @Delete('events/:id')
  async deleteEvent(@Param('id') id: string) {
    return this.prisma.event.delete({ where: { id } });
  }

  @Get('orders')
  async orders() {
    return this.prisma.order.findMany({
      include: { user: true, payments: true, tickets: true, event: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  /**
   * Commandes en attente de paiement manuel : l'admin y vérifie les
   * transferts MonCash/NatCash reçus (montant + référence en note)
   * puis confirme ou annule.
   */
  @Get('orders/pending')
  async pendingOrders() {
    return this.prisma.order.findMany({
      where: { paymentStatus: 'PENDING' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        payments: true,
        event: { select: { id: true, title: true, eventDate: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  /**
   * Validation manuelle : l'admin a vu le transfert arriver sur son
   * MonCash/NatCash. Utilise le même chemin de règlement que les
   * webhooks — les billets sont émis automatiquement.
   */
  @Post('orders/:id/confirm')
  async confirmOrder(@Param('id') id: string, @Body() dto: ConfirmOrderDto, @Req() req: any) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.paymentStatus !== 'PENDING') {
      throw new BadRequestException('Cette commande est déjà traitée');
    }
    if (order.expiresAt && order.expiresAt < new Date()) {
      await this.settlement.cancelOrder(id);
      throw new BadRequestException('Commande expirée : elle a été annulée');
    }

    const provider = (order.paymentMethod as Provider | null) ?? 'MONCASH';
    const result = await this.settlement.settleOrder(id, {
      provider,
      succeeded: true,
      transactionReference: dto.transactionReference?.trim() || null,
      payload: {
        manual: true,
        confirmedBy: req.user.sub,
        confirmedAt: new Date().toISOString(),
        transactionReference: dto.transactionReference?.trim() || null
      },
      confirmedBy: req.user.sub
    });
    return { orderId: id, ...result };
  }

  /** Annule une commande en attente et libère les places réservées. */
  @Post('orders/:id/cancel')
  async cancelOrder(@Param('id') id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable');
    return { orderId: id, ...(await this.settlement.cancelOrder(id)) };
  }

  /** Purge les commandes impayées dont le délai est dépassé. */
  @Post('orders/sweep-expired')
  async sweepExpired() {
    return this.settlement.expireStaleOrders();
  }

  @Get('payments')
  async payments() {
    return this.prisma.payment.findMany({ include: { order: true }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  @Get('dashboard')
  async dashboard() {
    const [events, orders, tickets, payments, revenue] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.order.count(),
      this.prisma.ticket.count(),
      this.prisma.payment.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: 'PAID' }
      })
    ]);

    return {
      events,
      orders,
      tickets,
      payments,
      revenue: revenue._sum.total ?? 0
    };
  }

  // Check-in manuel : l'admin saisit l'ID du billet (visible sur le billet / QR).
  @Post('checkin')
  async checkin(@Body() body: { code: string }) {
    const code = (body?.code || '').trim();
    if (!code) throw new BadRequestException('Code billet requis');
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: code },
      include: { event: true, order: true, user: true }
    });
    if (!ticket) throw new NotFoundException('Billet introuvable');
    if (ticket.order.paymentStatus !== 'PAID') throw new BadRequestException('Billet non payé');
    if (ticket.checkedIn) throw new BadRequestException('Billet déjà scanné');
    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { checkedIn: true, checkedInAt: new Date() }
    });
    return { message: `Entrée validée : ${ticket.event.title} — ${ticket.user.firstName} ${ticket.user.lastName}` };
  }

  // Référentiels pour les formulaires admin.
  @Get('cities')
  async cities() {
    return this.prisma.city.findMany({ orderBy: { name: 'asc' } });
  }

  @Get('categories')
  async categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}

@Module({ imports: [PaymentsModule], controllers: [AdminController], providers: [PrismaService] })
export class AdminModule {}
