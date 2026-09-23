import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma.service';
import { QrService } from '../tickets/qr.service';

export type Provider = 'MONCASH' | 'NATCASH';

export interface SettleOptions {
  provider: Provider;
  succeeded: boolean;
  transactionReference?: string | null;
  /** Charge utile brute (webhook) ou contexte de confirmation manuelle. */
  payload?: any;
  /** Id de l'admin ayant validé manuellement le transfert. Null = webhook. */
  confirmedBy?: string | null;
}

/**
 * Point de passage unique pour finaliser une commande : qu'elle soit
 * confirmée automatiquement (webhook fournisseur signé) ou manuellement
 * (l'admin vérifie le transfert MonCash/NatCash puis valide), le même
 * chemin met à jour le paiement, la commande et émet les billets.
 * Idempotent : une commande déjà traitée ne déclenche rien.
 */
@Injectable()
export class PaymentSettlementService {
  constructor(private prisma: PrismaService, private qr: QrService) {}

  /**
   * Référence courte que le client recopie dans la note de son transfert
   * MonCash/NatCash — c'est elle qui permet à l'admin de rapprocher le
   * transfert reçu de la commande.
   */
  async generatePaymentReference(): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 10; i++) {
      let ref = 'TH-';
      for (let j = 0; j < 6; j++) {
        ref += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      const existing = await this.prisma.order.findUnique({ where: { paymentReference: ref } });
      if (!existing) return ref;
    }
    // Repli quasi impossible : horodatage en base 36.
    return `TH-${Date.now().toString(36).toUpperCase()}`;
  }

  paymentExpiryHours(): number {
    const h = parseInt(process.env.PAYMENT_EXPIRY_HOURS || '2', 10);
    return Number.isFinite(h) && h > 0 ? h : 2;
  }

  expiryFromNow(): Date {
    return new Date(Date.now() + this.paymentExpiryHours() * 3600_000);
  }

  /** Numéro marchand configuré (jamais de numéro en dur dans le code). */
  merchantNumber(provider: Provider): string {
    return provider === 'MONCASH'
      ? process.env.MERCHANT_MONCASH_NUMBER || ''
      : process.env.MERCHANT_NATCASH_NUMBER || '';
  }

  async settleOrder(orderId: string, opts: SettleOptions) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });
    if (!order || order.paymentStatus !== 'PENDING') {
      return { settled: false as const, reason: 'already-processed' as const };
    }

    await this.prisma.$transaction(async (tx) => {
      const payment = order.payments[0];
      const paymentData = {
        status: (opts.succeeded ? 'SUCCEEDED' : 'FAILED') as 'SUCCEEDED' | 'FAILED',
        transactionReference: opts.transactionReference ?? payment?.transactionReference ?? null,
        webhookPayload: opts.payload === undefined ? undefined : opts.payload,
        confirmedBy: opts.confirmedBy ?? null
      };
      if (payment) {
        await tx.payment.update({ where: { id: payment.id }, data: paymentData });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: opts.provider,
            amount: order.total,
            currency: 'HTG',
            status: paymentData.status,
            transactionReference: paymentData.transactionReference,
            webhookPayload: paymentData.webhookPayload ?? undefined,
            confirmedBy: paymentData.confirmedBy
          }
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: opts.succeeded ? 'PAID' : 'FAILED',
          paymentMethod: order.paymentMethod ?? opts.provider
        }
      });

      if (opts.succeeded) {
        // Émission des billets avec QR signé HMAC.
        for (let i = 0; i < order.quantity; i++) {
          const ticketId = `${order.id}-T${i + 1}`;
          const qrPayload = {
            ticketId,
            orderId: order.id,
            eventId: order.eventId,
            userId: order.userId,
            issuedAt: new Date().toISOString()
          };
          const { signature: qrSignature } = this.qr.signPayload(qrPayload);
          const qrImage = await QRCode.toDataURL(JSON.stringify({ ...qrPayload, signature: qrSignature }));

          await tx.ticket.create({
            data: {
              id: ticketId,
              orderId: order.id,
              eventId: order.eventId,
              userId: order.userId,
              qrPayload: JSON.stringify(qrPayload),
              qrSignature,
              qrImage
            }
          });
        }
      } else {
        // Échec : on libère les places réservées.
        await tx.event.update({
          where: { id: order.eventId },
          data: { ticketsAvailable: { increment: order.quantity } }
        });
      }
    });

    return { settled: true as const, status: (opts.succeeded ? 'paid' : 'failed') as 'paid' | 'failed' };
  }

  /** Annule une commande PENDING et libère les places réservées. */
  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentStatus !== 'PENDING') {
      return { cancelled: false as const };
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { paymentStatus: 'CANCELLED' } });
      await tx.event.update({
        where: { id: order.eventId },
        data: { ticketsAvailable: { increment: order.quantity } }
      });
    });
    return { cancelled: true as const };
  }

  /**
   * Annule les commandes PENDING dont le délai de paiement est dépassé.
   * Appelée paresseusement (aucun cron requis) : au chargement des
   * commandes d'un utilisateur, au polling du statut, et via l'admin.
   */
  async expireStaleOrders(userId?: string) {
    const stale = await this.prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        expiresAt: { lt: new Date() },
        ...(userId ? { userId } : {})
      },
      select: { id: true }
    });
    for (const o of stale) {
      await this.cancelOrder(o.id);
    }
    return { expired: stale.length };
  }
}
