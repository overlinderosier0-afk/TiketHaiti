-- Paiement manuel (transfert MonCash/NatCash + validation admin) :
-- expiration des commandes impayées et traçabilité de la confirmation manuelle.
ALTER TABLE "orders" ADD COLUMN "expires_at" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN "confirmed_by" TEXT;
