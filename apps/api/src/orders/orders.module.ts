import { Module, Controller, Post, Body, UseGuards, Req, Get, Param, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentSettlementService } from '../payments/payment-settlement.service';
import { NotificationsModule, NotificationService } from '../notifications/notifications.module';

class CreateOrderDto {
  @IsString() eventId!: string;
  @IsInt() @Min(1) @Max(20) quantity!: number;
  @IsOptional() @IsString() paymentMethod?: 'MONCASH' | 'NATCASH';
}

@Controller('orders')
export class OrdersController {
  constructor(
    private prisma: PrismaService,
    private settlement: PaymentSettlementService,
    private notifications: NotificationService
  ) {}

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    // Réserve les places et crée la commande dans une transaction pour
    // éviter toute survente en cas de requêtes concurrentes.
    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: dto.eventId } });
      if (!event) throw new NotFoundException('Événement introuvable');
      if (event.status !== 'PUBLISHED') throw new BadRequestException('Événement non disponible à la vente');
      if (new Date(event.eventDate) < new Date()) {
        throw new BadRequestException('Cet événement est déjà terminé');
      }

      // Anti-abus (événements payants) : plafond de billets « en attente de
      // paiement » par utilisateur et par événement. Sans ça, un seul
      // compte peut réserver tout l'inventaire avec des commandes impayées
      // (les places sont décrémentées dès la création de la commande).
      // Seules les commandes non expirées comptent. Configurable via
      // PENDING_TICKETS_PER_USER, défaut 20.
      if (event.price > 0) {
        const maxPending = this.pendingTicketsPerUser();
        const pending = await tx.order.aggregate({
          where: {
            userId: req.user.sub,
            eventId: dto.eventId,
            paymentStatus: 'PENDING',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          _sum: { quantity: true },
        });
        const held = pending._sum.quantity ?? 0;
        if (held + dto.quantity > maxPending) {
          throw new BadRequestException(
            `Limite de ${maxPending} billet(s) en attente de paiement par personne pour cet événement` +
              (held > 0 ? ` (tu en as déjà ${held} en attente)` : '') +
              '. Termine ou annule tes commandes en cours avant d\u2019en créer une nouvelle.'
          );
        }
      }

      // Décrément atomique et conditionnel : une seule requête réserve les
      // places, donc deux achats simultanés ne peuvent pas vendre plus que
      // la capacité (pas de survente en cas de requêtes concurrentes).
      const stock = await tx.event.updateMany({
        where: { id: dto.eventId, ticketsAvailable: { gte: dto.quantity } },
        data: { ticketsAvailable: { decrement: dto.quantity } }
      });
      if (stock.count === 0) {
        const fresh = await tx.event.findUnique({ where: { id: dto.eventId }, select: { ticketsAvailable: true } });
        throw new BadRequestException(`Plus que ${fresh?.ticketsAvailable ?? 0} place(s) disponible(s)`);
      }

      // Événement gratuit (prix 0) : pas de paiement, commande soldée et
      // billets émis immédiatement — aucun passage par le checkout.
      if (event.price <= 0) {
        // Anti-abus : plafond de billets gratuits par utilisateur et par
        // événement, cumulé sur toutes ses commandes non annulées.
        const maxFree = this.freeTicketsPerUser();
        const existing = await tx.order.aggregate({
          where: {
            userId: req.user.sub,
            eventId: dto.eventId,
            total: 0,
            paymentStatus: { not: 'CANCELLED' }
          },
          _sum: { quantity: true }
        });
        const already = existing._sum.quantity ?? 0;
        if (already + dto.quantity > maxFree) {
          throw new BadRequestException(
            `Limite de ${maxFree} billet(s) gratuit(s) par personne pour cet événement` +
              (already > 0 ? ` (tu en as déjà ${already})` : '') +
              '.'
          );
        }

        const order = await tx.order.create({
          data: {
            userId: req.user.sub,
            eventId: dto.eventId,
            quantity: dto.quantity,
            total: 0,
            paymentMethod: null,
            paymentStatus: 'PAID',
            paymentReference: null,
            expiresAt: null
          }
        });
        await this.settlement.issueTickets(tx, order);
        return { order, free: true as const };
      }

      // Référence courte générée avant la création (unicité vérifiée).
      const paymentReference = await this.settlement.generatePaymentReference();
      const expiresAt = this.settlement.expiryFromNow();

      const total = event.price * dto.quantity;
      const order = await tx.order.create({
        data: {
          userId: req.user.sub,
          eventId: dto.eventId,
          quantity: dto.quantity,
          total,
          paymentMethod: dto.paymentMethod ?? null,
          paymentStatus: 'PENDING',
          paymentReference,
          expiresAt
        }
      });

      // Ligne de paiement pré-créée seulement si le fournisseur est déjà
      // connu. Sinon, le checkout choisit MonCash/NatCash plus tard et la
      // validation (admin ou webhook) met à jour la commande.
      if (dto.paymentMethod) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: dto.paymentMethod,
            amount: total,
            currency: 'HTG',
            status: 'PENDING'
          }
        });
      }

      return { order, free: false as const };
    });

    // Événement gratuit : billets déjà émis — on prévient le client.
    // "Fire and forget" : l'email ne retarde ni ne casse jamais la réponse.
    if (result.free) {
      void this.notifyFreeTicketsReady(result.order).catch(() => {});
    }

    return {
      order: result.order,
      checkoutUrl: result.free ? null : (dto.paymentMethod ? `/payments/${dto.paymentMethod.toLowerCase()}/initiate` : null),
      orderId: result.order.id,
      free: result.free
    };
  }

  // IMPORTANT : la route statique 'my' DOIT être déclarée avant ':id',
  // sinon GET /orders/my est capturé par le paramètre :id.
  @Get('my')
  @UseGuards(JwtGuard)
  async my(@Req() req: any) {
    // Expiration paresseuse : les commandes impayées trop anciennes sont
    // annulées et leurs places libérées (doublée par le cron, ceinture et
    // bretelles).
    await this.settlement.expireStaleOrders(req.user.sub);
    const orders = await this.prisma.order.findMany({
      where: { userId: req.user.sub },
      include: { payments: true, tickets: true, event: { include: { city: true } } },
      orderBy: { createdAt: 'desc' }
    });
    // Les commandes en attente embarquent leurs instructions de paiement
    // (référence, numéro marchand) : l'utilisateur les retrouve ici même
    // s'il a fermé l'onglet du checkout.
    return orders.map((o) => ({ ...o, manualPayment: this.manualPaymentInfo(o) }));
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async detail(@Param('id') id: string, @Req() req: any) {
    await this.settlement.expireStaleOrders(req.user.sub);
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payments: true, tickets: true, event: { include: { city: true } } }
    });

    if (!order || order.userId !== req.user.sub) {
      throw new UnauthorizedException('Commande inaccessible');
    }

    return { ...order, manualPayment: this.manualPaymentInfo(order) };
  }

  /**
   * Annulation par le client lui-même : commande en attente (places
   * libérées) ou commande gratuite déjà émise (billets supprimés,
   * places libérées). Une commande payée ne peut pas être annulée ici
   * (remboursement manuel via le support).
   */
  @Post(':id/cancel')
  @UseGuards(JwtGuard)
  async cancel(@Param('id') id: string, @Req() req: any) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== req.user.sub) {
      throw new UnauthorizedException('Commande inaccessible');
    }
    if (order.paymentStatus === 'PENDING') {
      return { orderId: id, ...(await this.settlement.cancelOrder(id)) };
    }
    if (order.paymentStatus === 'PAID' && order.total <= 0) {
      return { orderId: id, ...(await this.settlement.cancelFreeOrder(id)) };
    }
    throw new BadRequestException(
      order.paymentStatus === 'PAID'
        ? 'Commande payée : contacte le support pour une annulation.'
        : 'Cette commande ne peut plus être annulée.'
    );
  }

  /**
   * Plafond de billets gratuits par utilisateur et par événement
   * (anti-abus). Configurable via FREE_TICKETS_PER_USER, défaut 4.
   */
  private freeTicketsPerUser(): number {
    const n = parseInt(process.env.FREE_TICKETS_PER_USER || '4', 10);
    return Number.isFinite(n) && n > 0 ? n : 4;
  }

  /**
   * Plafond de billets en attente de paiement par utilisateur et par
   * événement (anti-abus, événements payants). Configurable via
   * PENDING_TICKETS_PER_USER, défaut 20.
   */
  private pendingTicketsPerUser(): number {
    const n = parseInt(process.env.PENDING_TICKETS_PER_USER || '20', 10);
    return Number.isFinite(n) && n > 0 ? n : 20;
  }

  /**
   * Email « billets prêts » pour une commande gratuite (billets émis
   * immédiatement à la création). Le NotificationService garantit
   * qu'aucune exception ne remonte.
   */
  private async notifyFreeTicketsReady(order: any): Promise<void> {
    const [event, user] = await Promise.all([
      this.prisma.event.findUnique({ where: { id: order.eventId }, select: { title: true } }),
      this.prisma.user.findUnique({
        where: { id: order.userId },
        select: { firstName: true, lastName: true, email: true }
      })
    ]);
    if (!user?.email) return;
    await this.notifications.notifyCustomerTicketsReady(user.email, {
      eventTitle: event?.title ?? 'Événement',
      quantity: order.quantity,
      customerName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    });
  }

  /**
   * Instructions de paiement manuel pour une commande en attente :
   * null si la commande n'est plus en attente ou sans méthode choisie.
   * Lecture seule — aucune logique métier modifiée.
   */
  private manualPaymentInfo(order: any) {
    if (order.paymentStatus !== 'PENDING' || !order.paymentMethod) return null;
    const provider = order.paymentMethod as 'MONCASH' | 'NATCASH';
    const merchantNumber = this.settlement.merchantNumber(provider);
    const providerLabel = provider === 'MONCASH' ? 'MonCash' : 'NatCash';
    return {
      provider,
      providerLabel,
      merchantNumber,
      reference: order.paymentReference ?? null,
      amount: order.total,
      expiresAt: order.expiresAt ?? null,
      instructions:
        `Envoyez ${order.total.toLocaleString('fr-FR')} HTG au ${merchantNumber || '(numéro à configurer)'} ` +
        `via ${providerLabel}, puis recopiez exactement la référence ${order.paymentReference} dans la ` +
        `note du transfert. Notre équipe vérifie la réception et vos billets sont émis automatiquement.`
    };
  }
}

@Module({
  imports: [PaymentsModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [PrismaService]
})
export class OrdersModule {}
