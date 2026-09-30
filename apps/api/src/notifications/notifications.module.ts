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

export interface CustomerPaymentInstructions {
  provider: 'MONCASH' | 'NATCASH';
  providerLabel: string;
  merchantNumber: string;
  reference: string | null;
  amount: number;
  eventTitle: string;
  customerName: string;
  expiresAt: Date | null;
}

export interface CustomerTicketsReady {
  eventTitle: string;
  quantity: number;
  customerName: string;
}

export interface WelcomeEmail {
  customerName: string;
}

export interface NewLoginAlert {
  customerName: string;
  at: Date;
}

/**
 * Notifications sortantes (emails via Resend).
 *
 * Le service est volontairement dégradé : si RESEND_API_KEY n'est pas
 * configuré, il se contente d'un log propre et le flux métier continue
 * normalement. Il ne lève JAMAIS d'exception : un échec d'envoi ne doit
 * pas casser une commande ou un paiement.
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
    this.from = process.env.RESEND_FROM || 'Tikè Ayiti <no-reply@tikeayiti.com>';
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!this.resend) {
      this.logger.warn(
        'Notifications email désactivées : renseignez RESEND_API_KEY pour activer ' +
          "les emails client et la notification admin des paiements en attente."
      );
    } else if (!this.adminEmail) {
      this.logger.warn('ADMIN_EMAIL non configuré : la notification admin sera ignorée (les emails client restent actifs).');
    }
  }

  /** Envoi bas niveau : dégradé propre, ne lève jamais. */
  private async send(to: string, subject: string, html: string, label: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[notification ignorée] ${label} → ${to}`);
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
      this.logger.log(`Email envoyé (${label}) → ${to}`);
    } catch (err) {
      this.logger.error(`Échec d'envoi (${label}) → ${to}`, err as Error);
    }
  }

  private wrap(content: string, footerNote?: string): string {
    return `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #0F172A;">
        <div style="background: linear-gradient(120deg, #2F5BFF, #1E3FAE); padding: 24px; border-radius: 12px 12px 0 0;">
          <div style="color: #fff; font-size: 22px; font-weight: 800;">🎟️ Tikè Ayiti</div>
        </div>
        <div style="border: 1px solid #E2E8F0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          ${content}
          <p style="margin-top: 24px; font-size: 12px; color: #64748B;">
            Tikè Ayiti — Tikè ou, nan poch ou.<br/>
            ${footerNote ?? "Si vous n'êtes pas à l'origine de cette commande, ignorez cet email."}
          </p>
        </div>
      </div>`;
  }

  /** Prévient l'admin qu'un paiement manuel attend sa validation. */
  async notifyAdminPendingPayment(n: PendingPaymentNotification): Promise<void> {
    const summary =
      `Paiement ${n.provider} en attente — réf ${n.reference ?? '?'} — ` +
      `${n.amount.toLocaleString('fr-FR')} HTG — ${n.eventTitle} — ${n.customerName} (${n.customerContact})`;
    if (!this.adminEmail) {
      this.logger.log(`[notification admin ignorée] ${summary}`);
      return;
    }
    await this.send(
      this.adminEmail,
      `[Tikè Ayiti] Paiement ${n.provider} à valider — ${n.reference}`,
      `
          <h2 style="margin-top: 0;">Paiement manuel en attente de validation</h2>
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
        `,
      `admin: ${summary}`
    );
  }

  /** Envoie au client les instructions du paiement manuel (numéro, montant, référence). */
  async notifyCustomerPaymentInstructions(to: string, n: CustomerPaymentInstructions): Promise<void> {
    const expiry = n.expiresAt ? new Date(n.expiresAt).toLocaleString('fr-FR') : '—';
    await this.send(
      to,
      `[Tikè Ayiti] Finalize pyeman w — réf ${n.reference ?? ''}`,
      this.wrap(`
          <h2 style="margin-top: 0;">Bonjou ${n.customerName} 👋</h2>
          <p>Ou fè yon kòmand pou <strong>${n.eventTitle}</strong>. Pou finalize acha w la :</p>
          <ol>
            <li>Voye <strong>${n.amount.toLocaleString('fr-FR')} HTG</strong> nan nimewo <strong>${n.merchantNumber || '(nimewo a konfigire)'}</strong> via <strong>${n.providerLabel}</strong>.</li>
            <li>Mete referans <strong>${n.reference ?? '—'}</strong> nan nòt transfè a — <em>egzakteman</em> jan li ekri.</li>
          </ol>
          <p>N ap verifye resepsyon an, epi tikè QR ou yo ap pare nan kont ou. Kòmand lan ekspire <strong>${expiry}</strong>.</p>
          <p style="text-align: center; margin-top: 20px;">
            <a href="https://tikeayiti.com/tickets" style="display: inline-block; background: #2F5BFF; color: #fff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 700;">Wè kòmand mwen</a>
          </p>
        `),
      `instructions de paiement ${n.reference ?? ''}`
    );
  }

  /** Prévient le client que ses billets sont émis et disponibles. */
  async notifyCustomerTicketsReady(to: string, n: CustomerTicketsReady): Promise<void> {
    await this.send(
      to,
      `[Tikè Ayiti] Tikè ou yo pare! 🎉 — ${n.eventTitle}`,
      this.wrap(`
          <h2 style="margin-top: 0;">Bòn nouvèl, ${n.customerName}! 🎉</h2>
          <p>Peman w lan konfime — <strong>${n.quantity} tikè</strong> pou <strong>${n.eventTitle}</strong> ap tann ou.</p>
          <p>Montre QR tikè ou yo nan pòt la (sou telefòn ou oswa enprime).</p>
          <p style="text-align: center; margin-top: 20px;">
            <a href="https://tikeayiti.com/tickets" style="display: inline-block; background: #2F5BFF; color: #fff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 700;">Wè tikè mwen yo</a>
          </p>
        `),
      `billets prêts (${n.eventTitle})`
    );
  }

  /** Email de bienvenue après la création d'un compte. */
  async notifyWelcome(to: string, n: WelcomeEmail): Promise<void> {
    await this.send(
      to,
      `[Tikè Ayiti] Byenveni! 🎉`,
      this.wrap(
        `
          <h2 style="margin-top: 0;">Byenveni sou Tikè Ayiti, ${n.customerName}! 🎉</h2>
          <p>Kont ou an kreye. Kounye a ou ka :</p>
          <ul>
            <li>Achte tikè pou pi bèl evènman yo</li>
            <li>Resevwa tikè QR ou yo pa imèl</li>
            <li>Swiv kòmand ou yo nan espas ou</li>
          </ul>
          <p style="text-align: center; margin-top: 20px;">
            <a href="https://tikeayiti.com/events" style="display: inline-block; background: #2F5BFF; color: #fff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 700;">Dekouvri evènman yo</a>
          </p>
        `,
        'Si ou pa t kreye kont sa a, kontakte nou touswit.'
      ),
      'bienvenue'
    );
  }

  /** Alerte de sécurité : prévient le titulaire à chaque nouvelle connexion. */
  async notifyNewLogin(to: string, n: NewLoginAlert): Promise<void> {
    const when = new Date(n.at).toLocaleString('fr-FR');
    await this.send(
      to,
      `[Tikè Ayiti] Nouvèl koneksyon sou kont ou`,
      this.wrap(
        `
          <h2 style="margin-top: 0;">Bonjou ${n.customerName} 👋</h2>
          <p>Yon koneksyon fèt sou kont Tikè Ayiti ou a <strong>${when}</strong>.</p>
          <p>Si se ou menm, pa gen pwoblèm — ou ka inyore imèl sa a. Si se pa ou,
          <strong>chanje modpas ou touswit</strong> epi kontakte nou.</p>
        `,
        "Si se pa ou ki konekte, chanje modpas ou touswit."
      ),
      'nouvelle connexion'
    );
  }
}

@Module({
  providers: [NotificationService],
  exports: [NotificationService]
})
export class NotificationsModule {}
