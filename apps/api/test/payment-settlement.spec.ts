import { PaymentSettlementService } from '../src/payments/payment-settlement.service';

describe('PaymentSettlementService (paiement manuel)', () => {
  const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) } };
  const svc = new PaymentSettlementService(prisma as any, {} as any);

  afterEach(() => {
    delete process.env.PAYMENT_EXPIRY_HOURS;
    delete process.env.MERCHANT_MONCASH_NUMBER;
    delete process.env.MERCHANT_NATCASH_NUMBER;
  });

  it('génère une référence courte au format TH-XXXXXX (à recopier dans la note du transfert)', async () => {
    const ref = await svc.generatePaymentReference();
    expect(ref).toMatch(/^TH-[A-Z2-9]{6}$/);
    expect(prisma.order.findUnique).toHaveBeenCalledWith({ where: { paymentReference: ref } });
  });

  it("calcule l'expiration depuis PAYMENT_EXPIRY_HOURS (défaut 2h)", () => {
    process.env.PAYMENT_EXPIRY_HOURS = '3';
    const before = Date.now();
    const exp = svc.expiryFromNow();
    const delta = exp.getTime() - before;
    expect(delta).toBeGreaterThan(3 * 3600_000 - 5000);
    expect(delta).toBeLessThanOrEqual(3 * 3600_000);
    expect(svc.paymentExpiryHours()).toBe(3);
  });

  it('retombe sur 2h si la variable est absente ou invalide', () => {
    process.env.PAYMENT_EXPIRY_HOURS = 'nawak';
    expect(svc.paymentExpiryHours()).toBe(2);
  });

  it("lit le numéro marchand depuis l'environnement, jamais en dur", () => {
    process.env.MERCHANT_MONCASH_NUMBER = '+50911111111';
    process.env.MERCHANT_NATCASH_NUMBER = '+50922222222';
    expect(svc.merchantNumber('MONCASH')).toBe('+50911111111');
    expect(svc.merchantNumber('NATCASH')).toBe('+50922222222');
  });
});
