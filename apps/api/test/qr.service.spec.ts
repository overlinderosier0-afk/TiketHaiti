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

describe('QrService tamper resistance', () => {
  it('rejects an altered payload', () => {
    const qr = new QrService();
    const signed = qr.signPayload({
      ticketId: '123e4567-e89b-12d3-a456-426614174000',
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      issuedAt: new Date().toISOString()
    } as any);
    const tampered = JSON.stringify({ ...signed.payload, ticketId: 'forged-id' });
    expect(qr.verify(tampered, signed.signature)).toBe(false);
  });

  it('rejects a wrong signature', () => {
    const qr = new QrService();
    const signed = qr.signPayload({
      ticketId: '123e4567-e89b-12d3-a456-426614174000',
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      issuedAt: new Date().toISOString()
    } as any);
    expect(qr.verify(JSON.stringify(signed.payload), 'deadbeef')).toBe(false);
  });
});
