import { Module, Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';
import { AdminGuard } from '../auth/admin.guard';
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

@Controller('admin')
@UseGuards(JwtGuard, AdminGuard)
class AdminController {
  constructor(private prisma: PrismaService) {}

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

@Module({ controllers: [AdminController], providers: [PrismaService] })
export class AdminModule {}
