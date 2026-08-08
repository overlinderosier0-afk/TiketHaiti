import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class QrService {
  private readonly secret = process.env.QR_SECRET || 'change-me-to-another-random-secret-at-least-32-chars';

  signPayload(payload: Record<string, unknown>) {
    const canonical = JSON.stringify(payload);
    const signature = createHmac('sha256', this.secret).update(canonical).digest('hex');
    return { payload, signature };
  }

  verify(payload: string, signature: string) {
    const parsed = JSON.parse(payload);
    const expected = createHmac('sha256', this.secret).update(JSON.stringify(parsed)).digest('hex');

    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  }
}

