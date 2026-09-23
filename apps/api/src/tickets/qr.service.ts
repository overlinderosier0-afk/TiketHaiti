import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Canonicalise un objet en JSON à clés triées (récursivement) pour que la
 * signature HMAC soit stable quel que soit l'ordre des clés à la création.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const entries = keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`);
  return `{${entries.join(',')}}`;
}

@Injectable()
export class QrService {
  private readonly secret = process.env.QR_SECRET || 'change-me-to-another-random-secret-at-least-32-chars';

  signPayload(payload: Record<string, unknown>) {
    const canonical = stableStringify(payload);
    const signature = createHmac('sha256', this.secret).update(canonical).digest('hex');
    return { payload, signature };
  }

  verify(payload: string, signature: string): boolean {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return false;
    }
    const expected = createHmac('sha256', this.secret).update(stableStringify(parsed)).digest('hex');

    const expectedBuffer = Buffer.from(expected, 'hex');
    let receivedBuffer: Buffer;
    try {
      receivedBuffer = Buffer.from(signature, 'hex');
    } catch {
      return false;
    }

    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  }
}
