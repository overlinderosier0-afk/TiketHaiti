# Tikè Ayiti MVP

Plateforme de billetterie haïtienne : événements, commandes, paiement MonCash/NatCash et billets QR sécurisés.

## Vue d'ensemble

Ce dépôt contient un MVP de billetterie électronique pour Haïti, structuré en monorepo avec un backend NestJS, une base PostgreSQL et un frontend Next.js.

### Rôles
- Utilisateur : inscription, connexion, commandes, historique, billets numériques.
- Administrateur : gestion des événements, visualisation des commandes/paiements et tableau de bord.

### API REST
- Authentification : `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
- Utilisateurs : `PATCH /users/profile`, `GET /users/tickets`.
- Événements : `GET /events` (pagination, filtres ville/catégorie/date/statut), `GET /events/:idOrSlug`.
- Commandes : `POST /orders`, `GET /orders/:id`, `GET /orders/my`.
- Paiements : `POST /payments/moncash/initiate/:orderId`, `POST /payments/natcash/initiate/:orderId`, `POST /payments/webhooks/moncash`, `POST /payments/webhooks/natcash`, `GET /payments/status/:orderId`.
- Billets : `GET /tickets/:id`, `GET /tickets/:id/pdf`, `POST /tickets/checkin` (admin).
- Administration : `/admin/events`, `/admin/orders`, `/admin/payments`, `/admin/dashboard`.

## Prérequis
Node.js 20+, pnpm 9+, Docker et PostgreSQL 16.

## Démarrage
```bash
cp apps/api/.env.example apps/api/.env
# Adapter les secrets : JWT_SECRET, QR_SECRET, WEBHOOK_SECRET
pnpm install
docker-compose up -d postgres
pnpm --filter @tike-ayiti/api prisma:generate
pnpm --filter @tike-ayiti/api prisma:migrate
pnpm --filter @tike-ayiti/api prisma:seed   # villes, catégories, 2 événements, compte admin (SEED_ADMIN_*)
pnpm dev
```
API : http://localhost:3001/docs · Web : http://localhost:3000

Le frontend appelle l'API via `NEXT_PUBLIC_API_URL` (défaut : `http://localhost:3001`).

### Webhooks (sandbox)
En dev local uniquement : `WEBHOOK_SKIP_SIGNATURE=true` accepte les webhooks sans signature.
En dehors du dev, les webhooks exigent l'en-tête `x-signature` = HMAC-SHA256 du corps brut
avec `WEBHOOK_SECRET`. Les doublons sont ignorés (idempotence sur `transactionReference`).

## Schéma Prisma
Le schéma est documenté dans [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) et couvre les modèles `User`, `City`, `Category`, `Event`, `Order`, `Ticket` et `Payment`.

## Sécurité
- JWT pour les sessions privées (enregistré globalement).
- Hashage `bcrypt` des mots de passe.
- Validation et transformation via `ValidationPipe` NestJS.
- CORS + Helmet activés.
- Swagger/OpenAPI au point d’entrée `/docs`.
- Rate limiting global via `@nestjs/throttler`.
- QR signé HMAC-SHA256 (charge utile canonique JSON), vérifié côté check-in ; double scan refusé.
- Filtre global d'exceptions avec format JSON stable.
- Guard `AdminGuard` dédié sur toutes les routes admin.

Les intégrations de paiement sont des stubs sandbox : le contrat webhook (`paymentReference`, `transactionReference`, `status`) est interne. Remplacer les appels dans le module de paiement et valider le contrat officiel avant production.
