import { Module, Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { IsString, IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';

class AdminEventDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsString() slug!: string;
  @IsString() bannerUrl!: string;
  @IsInt() cityId!: number;
  @IsInt() categoryId!: number;
  @IsString() address!: string;
  @IsDateString() eventDate!: string;
  @IsInt() @Min(1) price!: number;
  @IsInt() @Min(1) capacity!: number;
}

@Controller('admin')
class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('events')
  @UseGuards(JwtGuard)
  async events() {
    return this.prisma.event.findMany();
  }

  @Post('events')
  @UseGuards(JwtGuard)
  async createEvent(@Body() dto: AdminEventDto, @Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new UnauthorizedException('Admin only');

    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        slug: dto.slug,
        bannerUrl: dto.bannerUrl,
        cityId: dto.cityId,
        categoryId: dto.categoryId,
        address: dto.address,
        eventDate: new Date(dto.eventDate),
        price: dto.price,
        capacity: dto.capacity,
        ticketsAvailable: dto.capacity,
        status: 'PUBLISHED'
      }
    });
  }

  @Patch('events/:id')
  @UseGuards(JwtGuard)
  async updateEvent(@Param('id') id: string, @Body() dto: Partial<AdminEventDto>, @Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.prisma.event.update({ where: { id }, data: dto });
  }

  @Delete('events/:id')
  @UseGuards(JwtGuard)
  async deleteEvent(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.prisma.event.delete({ where: { id } });
  }

  @Get('orders')
  @UseGuards(JwtGuard)
  async orders(@Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.prisma.order.findMany({ include: { user: true, payments: true, tickets: true } });
  }

  @Get('payments')
  @UseGuards(JwtGuard)
  async payments(@Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.prisma.payment.findMany({ include: { order: true } });
  }

  @Get('dashboard')
  @UseGuards(JwtGuard)
  async dashboard(@Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new UnauthorizedException('Admin only');

    const [events, orders, tickets, payments] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.order.count(),
      this.prisma.ticket.count(),
      this.prisma.payment.count()
    ]);

    return { events, orders, tickets, payments };
  }
}

@Module({ controllers: [AdminController], providers: [PrismaService] })
export class AdminModule {}

