import { Module, Controller, Get, Param, UseGuards, Req, Post, Body, BadRequestException, UnauthorizedException, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';
import { QrService } from './qr.service';
import { PdfService } from './pdf.service';

@Controller('tickets')
class TicketsController {
  constructor(private prisma: PrismaService, private qr: QrService, private pdf: PdfService) {}

  @Get(':id')
  @UseGuards(JwtGuard)
  async get(@Param('id') id: string, @Req() req: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { event: { include: { city: true, category: true } }, order: true }
    });

    if (!ticket || ticket.userId !== req.user.sub) {
      throw new UnauthorizedException('Billet introuvable');
    }

    return ticket;
  }

  @Get(':id/pdf')
  @UseGuards(JwtGuard)
  async downloadPdf(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { event: { include: { city: true } }, user: true, order: true }
    });

    if (!ticket || ticket.userId !== req.user.sub) {
      throw new UnauthorizedException('Billet introuvable');
    }
    if (ticket.order.paymentStatus !== 'PAID') {
      throw new BadRequestException('Billet non payé');
    }

    const buffer = await this.pdf.ticketPdf({
      ticketId: ticket.id,
      eventTitle: ticket.event.title,
      eventDate: new Date(ticket.event.eventDate).toLocaleString('fr-HT'),
      city: ticket.event.city.name,
      venue: ticket.event.address || '',
      holderName: `${ticket.user.firstName} ${ticket.user.lastName}`,
      qrImageDataUrl: ticket.qrImage
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="tike-ayiti-${ticket.id}.pdf"`,
      'Content-Length': buffer.length
    });
    res.send(buffer);
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

    let parsed: any;
    try {
      parsed = JSON.parse(body.qrPayload);
    } catch {
      return { status: 'error', message: 'QR illisible' };
    }

    const ticket = await this.prisma.ticket.findUnique({ where: { id: parsed.ticketId } });
    if (!ticket) return { status: 'error', message: 'Billet inconnu' };
    if (ticket.checkedIn) {
      return { status: 'error', message: `Billet déjà utilisé le ${ticket.checkedInAt?.toISOString()}` };
    }

    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { checkedIn: true, checkedInAt: new Date() }
    });

    return { status: 'ok', message: 'Billet validé — entrée autorisée' };
  }
}

@Module({
  controllers: [TicketsController],
  providers: [PrismaService, QrService, PdfService],
  exports: [QrService]
})
export class TicketsModule {}
