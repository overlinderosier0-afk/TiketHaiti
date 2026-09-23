import { Injectable, Logger, Module } from '@nestjs/common';
import { Resend } from 'resend';

export interface PendingPaymentNotification {
  provider: 'MONCASH' | 'NATCASH';
  orderId: string;
  reference: string | null;
  amount: number;
  eventTitle: string;
  customerName: string;
  customerContact: string;
  expiresAt: Date | null;
}

/**
 * Notifications sortantes (actuellement : email admin via Resend).
 *
 * Le service est volontairement dégradé : si RESEND_API_KEY ou
 * ADMIN_EMAIL ne sont pas configurés, il se contente d'un log propre
 * et le flux métier continue normalement. Il ne lève JAMAIS
 * d'exception : un échec d'envoi ne doit pas casser un paiement.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly resend: Resend | null;
  private readonly adminEmail: string | undefined;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.adminEmail = process.env.ADMIN_EMAIL;
    this.from = process.env.RESEND_FROM || 'no-reply@tikeayiti.ht';
    this.resend = apiKey && this.adminEmail ? new Resend(apiKey) : null;
    if (!this.resend) {
      this.logger.warn(
        'Notifications email désactivées : renseignez RESEND_API_KEY et ADMIN_EMAIL pour prévenir ' +
          "l'admin des paiements en attente."
      );
    }
  }

  /** Prévient l'admin qu'un paiement manuel attend sa validation. */
  async notifyAdminPendingPayment(n: PendingPaymentNotification): Promise<void> {
    const summary =
      `Paiement ${n.provider} en attente — réf ${n.reference ?? '?'} — ` +
      `${n.amount.toLocaleString('fr-FR')} HTG — ${n.eventTitle} — ${n.customerName} (${n.customerContact})`;
    if (!this.resend || !this.adminEmail) {
      this.logger.log(`[notification ignorée] ${summary}`);
      return;
    }
    try {
      await this.resend.emails.send({
        from: this.from,
        to: this.adminEmail,
        subject: `[Tikè Ayiti] Paiement ${n.provider} à valider — ${n.reference}`,
        html: `
          <h2>Paiement manuel en attente de validation</h2>
          <p>Un client a initié un paiement <strong>${n.provider}</strong>. Vérifiez la réception
          du transfert sur votre compte marchand, puis validez depuis l'admin
          (« Paiements en attente »).</p>
          <ul>
            <li><strong>Référence :</strong> ${n.reference ?? '—'}</li>
            <li><strong>Montant :</strong> ${n.amount.toLocaleString('fr-FR')} HTG</li>
            <li><strong>Événement :</strong> ${n.eventTitle}</li>
            <li><strong>Client :</strong> ${n.customerName} (${n.customerContact})</li>
            <li><strong>Expire le :</strong> ${n.expiresAt ? new Date(n.expiresAt).toLocaleString('fr-FR') : '—'}</li>
            <li><strong>Commande :</strong> ${n.orderId}</li>
          </ul>
          <p>La référence ci-dessus doit apparaître dans la note du transfert reçu.</p>
        `
      });
      this.logger.log(`Email admin envoyé : ${summary}`);
    } catch (err) {
      this.logger.error(`Échec d'envoi de l'email admin : ${summary}`, err as Error);
    }
  }
}

@Module({
  providers: [NotificationService],
  exports: [NotificationService]
})
export class NotificationsModule {}
