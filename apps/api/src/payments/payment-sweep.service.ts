import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentSettlementService } from './payment-settlement.service';

/**
 * Purge automatique des commandes impayées dont le délai de paiement
 * est dépassé (PAYMENT_EXPIRY_HOURS, 2h par défaut). Les places
 * réservées sont libérées. Avant ce cron, le nettoyage n'était que
 * paresseux (au polling / à la main via l'admin) : sans trafic, les
 * places restaient bloquées indéfiniment.
 *
 * Fréquence configurable via PAYMENT_SWEEP_CRON (défaut : toutes les
 * 10 minutes). Réutilise exactement la même logique que l'endpoint
 * admin POST /admin/orders/sweep-expired.
 */
@Injectable()
export class PaymentSweepService {
  private readonly logger = new Logger(PaymentSweepService.name);

  constructor(private readonly settlement: PaymentSettlementService) {}

  @Cron(process.env.PAYMENT_SWEEP_CRON || CronExpression.EVERY_10_MINUTES)
  async sweepExpiredOrders(): Promise<void> {
    try {
      const { expired } = await this.settlement.expireStaleOrders();
      if (expired > 0) {
        this.logger.log(`Purge : ${expired} commande(s) expirée(s) annulée(s), places libérées.`);
      }
    } catch (err) {
      // Le cron ne doit jamais faire tomber l'application.
      this.logger.error('Échec de la purge des commandes expirées', err as Error);
    }
  }
}
