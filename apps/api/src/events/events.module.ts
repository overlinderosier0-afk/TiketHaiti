import { Module, Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { parsePage, pageResult } from '../common/pagination';

@Controller('events')
class EventsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const filters: any = { status: 'PUBLISHED' };

    if (city) {
      filters.city = { name: { contains: city, mode: 'insensitive' } };
    }
    if (category) {
      filters.category = { name: { contains: category, mode: 'insensitive' } };
    }
    if (date) {
      filters.eventDate = { gte: new Date(date) };
    }

    const { page: p, limit: l } = parsePage({ page, limit });
    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where: filters,
        include: { city: true, category: true },
        orderBy: { eventDate: 'asc' },
        skip: (p - 1) * l,
        take: l
      }),
      this.prisma.event.count({ where: filters })
    ]);

    return pageResult(items, total, { page: p, limit: l });
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const event = await this.prisma.event.findFirst({
      where: { OR: [{ id }, { slug: id }], status: 'PUBLISHED' },
      include: { city: true, category: true }
    });
    if (!event) throw new NotFoundException('Événement introuvable');
    return event;
  }
}

@Module({ controllers: [EventsController], providers: [PrismaService] })
export class EventsModule {}
