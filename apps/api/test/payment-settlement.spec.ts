import { PaymentSettlementService } from '../src/payments/payment-settlement.service';

describe('PaymentSettlementService (paiement manuel)', () => {
  const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) } };
  const notifications = { notifyCustomerTicketsReady: jest.fn() };
  const svc = new PaymentSettlementService(prisma as any, {} as any, notifications as any);

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

describe('PaymentSettlementService — cancelFreeOrder', () => {
  function makeSvc(order: any) {
    const tx = {
      ticket: { deleteMany: jest.fn(async () => ({})) },
      order: { update: jest.fn(async () => ({})) },
      event: { update: jest.fn(async () => ({})) }
    };
    const prisma: any = {
      order: { findUnique: jest.fn(async () => order) },
      $transaction: jest.fn(async (cb: any) => cb(tx))
    };
    const svc = new PaymentSettlementService(prisma, {} as any, {} as any);
    return { svc, prisma, tx };
  }

  it('annule une commande gratuite soldée : billets supprimés, places libérées', async () => {
    const { svc, prisma, tx } = makeSvc({
      id: 'o1', eventId: 'e1', quantity: 2, paymentStatus: 'PAID', total: 0
    });

    const res = await svc.cancelFreeOrder('o1');
    expect(res).toEqual({ cancelled: true });
    expect(tx.ticket.deleteMany).toHaveBeenCalledWith({ where: { orderId: 'o1' } });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' }, data: { paymentStatus: 'CANCELLED' }
    });
    expect(tx.event.update).toHaveBeenCalledWith({
      where: { id: 'e1' }, data: { ticketsAvailable: { increment: 2 } }
    });
  });

  it('refuse une commande en attente (pas encore soldée)', async () => {
    const { svc, prisma } = makeSvc({ id: 'o1', paymentStatus: 'PENDING', total: 0 });
    expect(await svc.cancelFreeOrder('o1')).toEqual({ cancelled: false });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuse une commande payante (remboursement = support manuel)', async () => {
    const { svc, prisma } = makeSvc({ id: 'o1', paymentStatus: 'PAID', total: 500 });
    expect(await svc.cancelFreeOrder('o1')).toEqual({ cancelled: false });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuse une commande inexistante', async () => {
    const { svc, prisma } = makeSvc(null);
    expect(await svc.cancelFreeOrder('nope')).toEqual({ cancelled: false });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
