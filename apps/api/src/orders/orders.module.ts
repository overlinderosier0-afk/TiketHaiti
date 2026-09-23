import { Module, Controller, Post, Body, UseGuards, Req, Get, Param, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentSettlementService } from '../payments/payment-settlement.service';

class CreateOrderDto {
  @IsString() eventId!: string;
  @IsInt() @Min(1) @Max(20) quantity!: number;
  @IsOptional() @IsString() paymentMethod?: 'MONCASH' | 'NATCASH';
}

@Controller('orders')
class OrdersController {
  constructor(private prisma: PrismaService, private settlement: PaymentSettlementService) {}

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    // Référence courte générée avant la transaction (unicité vérifiée).
    const paymentReference = await this.settlement.generatePaymentReference();
    const expiresAt = this.settlement.expiryFromNow();

    // Réserve les places et crée la commande dans une transaction pour
    // éviter toute survente en cas de requêtes concurrentes.
    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: dto.eventId } });
      if (!event) throw new NotFoundException('Événement introuvable');
      if (event.status !== 'PUBLISHED') throw new BadRequestException('Événement non disponible à la vente');
      if (event.ticketsAvailable < dto.quantity) {
        throw new BadRequestException(`Plus que ${event.ticketsAvailable} place(s) disponible(s)`);
      }

      await tx.event.update({
        where: { id: dto.eventId },
        data: { ticketsAvailable: { decrement: dto.quantity } }
      });

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

      return order;
    });

    return {
      order: result,
      checkoutUrl: dto.paymentMethod ? `/payments/${dto.paymentMethod.toLowerCase()}/initiate` : null,
      orderId: result.id
    };
  }

  // IMPORTANT : la route statique 'my' DOIT être déclarée avant ':id',
  // sinon GET /orders/my est capturé par le paramètre :id.
  @Get('my')
  @UseGuards(JwtGuard)
  async my(@Req() req: any) {
    // Expiration paresseuse : les commandes impayées trop anciennes sont
    // annulées et leurs places libérées, sans cron dédié.
    await this.settlement.expireStaleOrders(req.user.sub);
    return this.prisma.order.findMany({
      where: { userId: req.user.sub },
      include: { payments: true, tickets: true, event: { include: { city: true, category: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async detail(@Param('id') id: string, @Req() req: any) {
    await this.settlement.expireStaleOrders(req.user.sub);
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payments: true, tickets: true, event: { include: { city: true, category: true } } }
    });

    if (!order || order.userId !== req.user.sub) {
      throw new UnauthorizedException('Commande inaccessible');
    }

    return order;
  }
}

@Module({
  imports: [PaymentsModule],
  controllers: [OrdersController],
  providers: [PrismaService]
})
export class OrdersModule {}
