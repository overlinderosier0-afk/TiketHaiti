import { Module, Controller, Post, Body, UseGuards, Req, Get, Param, UnauthorizedException } from '@nestjs/common';
import { IsInt, IsString, Min } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';

class CreateOrderDto {
  @IsString() eventId!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsString() paymentMethod!: 'MONCASH' | 'NATCASH';
}

@Controller('orders')
class OrdersController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    const event = await this.prisma.event.findUnique({ where: { id: dto.eventId } });
    if (!event) throw new UnauthorizedException('Événement introuvable');

    const total = event.price * dto.quantity;
    const order = await this.prisma.order.create({
      data: {
        userId: req.user.sub,
        total,
        paymentMethod: dto.paymentMethod,
        paymentStatus: 'PENDING',
        paymentReference: `ORDER-${Date.now()}`
      }
    });

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: dto.paymentMethod === 'MONCASH' ? 'MONCASH' : 'NATCASH',
        amount: total,
        currency: 'HTG',
        status: 'PENDING'
      }
    });

    return {
      order,
      checkoutUrl: `/payments/${dto.paymentMethod.toLowerCase()}/initiate/${order.id}`
    };
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async detail(@Param('id') id: string, @Req() req: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payments: true, tickets: true }
    });

    if (!order || order.userId !== req.user.sub) {
      throw new UnauthorizedException('Commande inaccessible');
    }

    return order;
  }

  @Get('my')
  @UseGuards(JwtGuard)
  async my(@Req() req: any) {
    return this.prisma.order.findMany({
      where: { userId: req.user.sub },
      include: { payments: true, tickets: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

@Module({ controllers: [OrdersController], providers: [PrismaService] })
export class OrdersModule {}

