import { QrService } from '../src/tickets/qr.service';

describe('QrService', () => {
  it('signs and verifies a payload using HMAC SHA256', () => {
    const qr = new QrService();
    const payload = {
      ticketId: '123e4567-e89b-12d3-a456-426614174000',
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      issuedAt: new Date().toISOString()
    };

    const signed = qr.signPayload(payload);
    const raw = JSON.stringify(signed.payload);
    const valid = qr.verify(raw, signed.signature);

    expect(valid).toBe(true);
  });
});
