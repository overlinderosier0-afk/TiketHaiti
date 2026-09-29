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
    @Query('past') past?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const filters: any = { status: 'PUBLISHED' };

    if (city) {
      filters.city = { name: { contains: city, mode: 'insensitive' } };
    }
    if (category) {
      filters.category = { contains: category, mode: 'insensitive' };
    }
    // Par défaut, seuls les événements à venir sont listés — les événements
    // terminés ne sont plus proposés à la vente. ?past=true pour les inclure.
    if (past === 'true') {
      if (date) filters.eventDate = { gte: new Date(date) };
    } else {
      filters.eventDate = { gte: date ? new Date(date) : new Date() };
    }

    const { page: p, limit: l } = parsePage({ page, limit });
    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where: filters,
        include: { city: true },
        orderBy: { eventDate: 'asc' },
        skip: (p - 1) * l,
        take: l
      }),
      this.prisma.event.count({ where: filters })
    ]);

    return pageResult(items, total, { page: p, limit: l });
  }

  /**
   * Catégories réellement utilisées (texte libre écrit par l'admin),
   * dédupliquées depuis les événements publiés — alimente les filtres.
   * Déclaré AVANT ':id' : sinon GET /events/categories est capturé par le paramètre :id.
   */
  @Get('categories')
  async categories(): Promise<string[]> {
    const rows = await this.prisma.event.findMany({
      where: { status: 'PUBLISHED', category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });
    return rows.map((r) => r.category).filter((c): c is string => !!c);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const event = await this.prisma.event.findFirst({
      where: { OR: [{ id }, { slug: id }], status: 'PUBLISHED' },
      include: { city: true }
    });
    if (!event) throw new NotFoundException('Événement introuvable');
    return event;
  }
}

@Module({ controllers: [EventsController], providers: [PrismaService] })
export class EventsModule {}
