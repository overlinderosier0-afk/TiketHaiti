import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Vérifie la signature HMAC-SHA256 d'un webhook (corps brut) contre l'en-tête
 * `x-signature` envoyé par le fournisseur de paiement.
 */
export function verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  let b: Buffer;
  try {
    b = Buffer.from(signatureHeader, 'hex');
  } catch {
    return false;
  }
  return a.length === b.length && timingSafeEqual(a, b);
}
