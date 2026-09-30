import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OrdersController } from '../src/orders/orders.module';

const future = new Date(Date.now() + 30 * 24 * 3600_000);

function makeTx(overrides: any = {}) {
  return {
    event: {
      findUnique: jest.fn(async () => ({
        id: 'e1', status: 'PUBLISHED', eventDate: future, price: 0
      })),
      updateMany: jest.fn(async () => ({ count: 1 }))
    },
    order: {
      aggregate: jest.fn(async () => ({ _sum: { quantity: 0 } })),
      create: jest.fn(async (args: any) => ({ id: 'o1', userId: 'u1', eventId: 'e1', quantity: 2, ...args.data }))
    },
    ...overrides
  };
}

function makeController(tx: any, orderFindUnique: any = async () => null) {
  const prisma: any = {
    $transaction: jest.fn(async (cb: any) => cb(tx)),
    order: { findUnique: jest.fn(orderFindUnique) },
    event: { findUnique: jest.fn(async () => ({ title: 'Fête' })) },
    user: { findUnique: jest.fn(async () => ({ firstName: 'Jean', lastName: 'Paul', email: 'j@p.com' })) }
  };
  const settlement: any = {
    issueTickets: jest.fn(async () => {}),
    cancelOrder: jest.fn(async () => ({ cancelled: true })),
    cancelFreeOrder: jest.fn(async () => ({ cancelled: true })),
    generatePaymentReference: jest.fn(async () => 'TH-ABCDEF'),
    expiryFromNow: jest.fn(() => future)
  };
  const notifications: any = { notifyCustomerTicketsReady: jest.fn(async () => {}) };
  const ctrl = new OrdersController(prisma, settlement, notifications);
  return { ctrl, prisma, settlement, notifications };
}

const req = { user: { sub: 'u1' } } as any;

describe('OrdersController — plafond de billets gratuits (anti-abus)', () => {
  afterEach(() => {
    delete process.env.FREE_TICKETS_PER_USER;
  });

  it('refuse quand le cumul dépasse le plafond (défaut 4)', async () => {
    const tx = makeTx();
    tx.order.aggregate.mockResolvedValue({ _sum: { quantity: 4 } });
    const { ctrl } = makeController(tx);

    await expect(ctrl.create({ eventId: 'e1', quantity: 1 } as any, req))
      .rejects.toThrow(BadRequestException);
    await expect(ctrl.create({ eventId: 'e1', quantity: 1 } as any, req))
      .rejects.toThrow('Limite de 4');
  });

  it('accepte quand le cumul reste dans le plafond', async () => {
    const tx = makeTx();
    tx.order.aggregate.mockResolvedValue({ _sum: { quantity: 2 } });
    const { ctrl, notifications } = makeController(tx);

    const res: any = await ctrl.create({ eventId: 'e1', quantity: 2 } as any, req);
    expect(res.free).toBe(true);
    expect(res.order.id).toBe('o1');
    // L'email « billets prêts » part en fire-and-forget : on laisse le
    // micro-cycle s'écouler avant d'assert.
    await new Promise((r) => setTimeout(r, 20));
    expect(notifications.notifyCustomerTicketsReady).toHaveBeenCalled();
  });

  it('respecte FREE_TICKETS_PER_USER quand la variable est définie', async () => {
    process.env.FREE_TICKETS_PER_USER = '2';
    const tx = makeTx();
    tx.order.aggregate.mockResolvedValue({ _sum: { quantity: 2 } });
    const { ctrl } = makeController(tx);

    await expect(ctrl.create({ eventId: 'e1', quantity: 1 } as any, req))
      .rejects.toThrow('Limite de 2');
  });

  it('ne compte pas les commandes annulées dans le cumul', async () => {
    const tx = makeTx();
    const { ctrl } = makeController(tx);

    await ctrl.create({ eventId: 'e1', quantity: 1 } as any, req);
    expect(tx.order.aggregate).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        eventId: 'e1',
        total: 0,
        paymentStatus: { not: 'CANCELLED' }
      },
      _sum: { quantity: true }
    });
  });
});

describe('OrdersController — annulation par le client (POST /orders/:id/cancel)', () => {
  it('annule une commande en attente et libère les places', async () => {
    const { ctrl, settlement } = makeController(makeTx(), async () => ({
      id: 'o1', userId: 'u1', paymentStatus: 'PENDING', total: 500
    }));

    const res = await ctrl.cancel('o1', req);
    expect(settlement.cancelOrder).toHaveBeenCalledWith('o1');
    expect(res).toMatchObject({ orderId: 'o1', cancelled: true });
  });

  it('annule une commande gratuite déjà émise (billets supprimés)', async () => {
    const { ctrl, settlement } = makeController(makeTx(), async () => ({
      id: 'o1', userId: 'u1', paymentStatus: 'PAID', total: 0
    }));

    const res = await ctrl.cancel('o1', req);
    expect(settlement.cancelFreeOrder).toHaveBeenCalledWith('o1');
    expect(res).toMatchObject({ orderId: 'o1', cancelled: true });
  });

  it('refuse une commande payée (remboursement = support)', async () => {
    const { ctrl } = makeController(makeTx(), async () => ({
      id: 'o1', userId: 'u1', paymentStatus: 'PAID', total: 500
    }));

    await expect(ctrl.cancel('o1', req)).rejects.toThrow(BadRequestException);
  });

  it("refuse la commande d'un autre utilisateur", async () => {
    const { ctrl } = makeController(makeTx(), async () => ({
      id: 'o1', userId: 'u2', paymentStatus: 'PENDING', total: 500
    }));

    await expect(ctrl.cancel('o1', req)).rejects.toThrow(UnauthorizedException);
  });
});
