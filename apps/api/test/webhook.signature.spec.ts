import { createHmac } from 'crypto';
import { verifyWebhookSignature } from '../src/payments/webhook-signature';

const SECRET = 'test-secret';
const BODY = JSON.stringify({ paymentReference: 'pay_123', transactionReference: 'tx_abc', status: 'succeeded' });

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

describe('verifyWebhookSignature', () => {
  it('accepts a valid signature', () => {
    expect(verifyWebhookSignature(BODY, sign(BODY, SECRET), SECRET)).toBe(true);
  });

  it('rejects a tampered body', () => {
    const sig = sign(BODY, SECRET);
    expect(verifyWebhookSignature(BODY + ' ', sig, SECRET)).toBe(false);
  });

  it('rejects a wrong secret', () => {
    const sig = sign(BODY, 'other-secret');
    expect(verifyWebhookSignature(BODY, sig, SECRET)).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(verifyWebhookSignature(BODY, undefined, SECRET)).toBe(false);
  });

  it('rejects malformed (non-hex) signatures without throwing', () => {
    expect(verifyWebhookSignature(BODY, 'not-hex-at-all', SECRET)).toBe(false);
  });

  it('accepts a Buffer body', () => {
    expect(verifyWebhookSignature(Buffer.from(BODY, 'utf8'), sign(BODY, SECRET), SECRET)).toBe(true);
  });
});
