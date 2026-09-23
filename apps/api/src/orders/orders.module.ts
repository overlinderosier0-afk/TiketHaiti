import { Module, Controller, Post, Body, UseGuards, Req, Get, Param, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IsInt, IsString, Min, Max } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';

class CreateOrderDto {
  @IsString() eventId!: string;
  @IsInt() @Min(1) @Max(20) quantity!: number;
  @IsString() paymentMethod!: 'MONCASH' | 'NATCASH';
}

@Controller('orders')
class OrdersController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
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
          paymentMethod: dto.paymentMethod,
          paymentStatus: 'PENDING',
          paymentReference: `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
        }
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: dto.paymentMethod,
          amount: total,
          currency: 'HTG',
          status: 'PENDING'
        }
      });

      return order;
    });

    return {
      order: result,
      checkoutUrl: `/payments/${dto.paymentMethod.toLowerCase()}/initiate`,
      orderId: result.id
    };
  }

  // IMPORTANT : la route statique 'my' DOIT être déclarée avant ':id',
  // sinon GET /orders/my est capturé par le paramètre :id.
  @Get('my')
  @UseGuards(JwtGuard)
  async my(@Req() req: any) {
    return this.prisma.order.findMany({
      where: { userId: req.user.sub },
      include: { payments: true, tickets: true, event: { include: { city: true, category: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async detail(@Param('id') id: string, @Req() req: any) {
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

@Module({ controllers: [OrdersController], providers: [PrismaService] })
export class OrdersModule {}
