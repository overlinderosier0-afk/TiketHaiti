import { Module, Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { IsString, IsInt, IsDateString, IsOptional, Min, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';

class EventCreateDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsString() slug!: string;
  @IsString() bannerUrl!: string;
  @IsInt() cityId!: number;
  @IsInt() categoryId!: number;
  @IsString() address!: string;
  @IsOptional() latitude?: number;
  @IsOptional() longitude?: number;
  @IsDateString() eventDate!: string;
  @IsOptional() doorsOpen?: string;
  @IsString() artistName!: string;
  @IsInt() @Min(1) price!: number;
  @IsInt() @Min(1) capacity!: number;
  @IsInt() @Min(0) ticketsAvailable!: number;
}

@Controller('events')
class EventsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('date') date?: string
  ) {
    const filters: any = {
      status: 'PUBLISHED'
    };

    if (city) {
      filters.city = { name: { contains: city, mode: 'insensitive' } };
    }

    if (category) {
      filters.category = { name: { contains: category, mode: 'insensitive' } };
    }

    if (date) {
      filters.eventDate = { gte: new Date(date) };
    }

    return this.prisma.event.findMany({
      where: filters,
      include: { city: true, category: true },
      orderBy: { eventDate: 'asc' }
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: { city: true, category: true, tickets: true }
    });
  }
}

@Module({ controllers: [EventsController], providers: [PrismaService] })
export class EventsModule {}

