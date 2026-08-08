import { Module, Controller, Get, Param, UseGuards, Req, Post, Body, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';
import { QrService } from './qr.service';

@Controller('tickets')
class TicketsController {
  constructor(private prisma: PrismaService, private qr: QrService) {}

  @Get(':id')
  @UseGuards(JwtGuard)
  async get(@Param('id') id: string, @Req() req: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { event: true, order: true, user: true }
    });

    if (!ticket || ticket.userId !== req.user.sub) {
      throw new UnauthorizedException('Billet introuvable');
    }

    return ticket;
  }

  @Get(':id/pdf')
  @UseGuards(JwtGuard)
  async pdf(@Param('id') id: string) {
    return { ticketId: id, pdfUrl: `/tickets/${id}/pdf` };
  }

  @Post('checkin')
  async checkin(@Body() body: { qrPayload: string; signature: string }) {
    if (!body.qrPayload || !body.signature) {
      throw new BadRequestException('QR requis');
    }

    const valid = this.qr.verify(body.qrPayload, body.signature);
    if (!valid) {
      return { status: 'error', message: 'Signature invalide' };
    }

    return { status: 'ok', message: 'Billet validé' };
  }
}

@Module({ controllers: [TicketsController], providers: [PrismaService, QrService], exports: [QrService] })
export class TicketsModule {}

