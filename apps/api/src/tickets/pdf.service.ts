import { Injectable, NotFoundException } from '@nestjs/common';
// pdfkit n'exporte pas de types propres en ESM strict, on l'importe en require.
 // eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

interface TicketPdfData {
  ticketId: string;
  eventTitle: string;
  eventDate: string;
  city: string;
  venue: string;
  holderName: string;
  qrImageDataUrl: string | null;
}

@Injectable()
export class PdfService {
  async ticketPdf(data: TicketPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(22).fillColor('#b3541e').text('Tikè Ayiti', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).fillColor('#111').text(data.eventTitle, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#555').text(`${data.eventDate} — ${data.venue}, ${data.city}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(11).fillColor('#111').text(`Titulaire : ${data.holderName}`);
      doc.text(`Billet : ${data.ticketId}`);
      doc.moveDown();

      if (data.qrImageDataUrl) {
        const base64 = data.qrImageDataUrl.split(',')[1];
        const img = Buffer.from(base64, 'base64');
        doc.image(img, { fit: [220, 220], align: 'center' });
      }

      doc.moveDown();
      doc.fontSize(9).fillColor('#777').text('Présentez ce QR à l’entrée. Un billet = une entrée.', { align: 'center' });
      doc.end();
    });
  }
}
