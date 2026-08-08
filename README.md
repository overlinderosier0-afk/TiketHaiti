# Tikè Ayiti MVP

Plateforme de billetterie haïtienne : événements, commandes, paiement MonCash/NatCash et billets QR sécurisés.

## Vue d'ensemble

Ce dépôt contient un MVP de billetterie électronique pour Haïti, structuré en monorepo avec un backend NestJS, une base PostgreSQL et un frontend Next.js.

### Rôles
- Utilisateur : inscription, connexion, commandes, historique, billets numériques.
- Administrateur : gestion des événements, visualisation des commandes/paiements et tableau de bord.

### API REST
- Authentification : `/auth/register`, `/auth/login`, `/auth/me`.
- Utilisateurs : `/users/profile`, `/users/tickets`.
- Événements : `/events`, `/events/:id` + filtres par ville, catégorie et date.
- Commandes : `/orders`, `/orders/:id`, `/orders/my`.
- Paiements : `/payments/moncash/initiate`, `/payments/natcash/initiate`, webhooks et `/payments/status/:orderId`.
- Billets : `/tickets/:id`, `/tickets/:id/pdf`, `/tickets/checkin`.
- Administration : `/admin/events`, `/admin/orders`, `/admin/payments`, `/admin/dashboard`.

## Prérequis
Node.js 20+, pnpm 9+, Docker et PostgreSQL 16.

## Démarrage
```bash
cp .env.example .env
corepack pnpm install
# Sur cette machine, le plugin Compose n'est pas interprété comme attendu par l'API Docker CLI.
# Utiliser le binaire historique si besoin : docker-compose up -d postgres
# Alternative compatible si le plugin Compose est bien installé : docker compose up -d postgres

docker-compose up -d postgres
corepack pnpm --filter @tike-ayiti/api prisma:generate
corepack pnpm --filter @tike-ayiti/api prisma:migrate
corepack pnpm dev
```
API : http://localhost:3001/docs · Web : http://localhost:3000

## Schéma Prisma
Le schéma est documenté dans [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) et couvre les modèles `User`, `City`, `Category`, `Event`, `Order`, `Ticket` et `Payment` dans la structure demandée.

## Sécurité
- JWT pour les sessions privées.
- Hashage `bcrypt` des mots de passe.
- Validation et transformation via `ValidationPipe` NestJS.
- CORS + Helmet activés.
- Swagger/OpenAPI au point d’entrée `/docs`.
- Rate limiting fourni par le module `@nestjs/throttler`.
- Le QR est généré et vérifié avec HMAC SHA-256 via une clé `QR_SECRET` / `APP_SECRET`.

Les intégrations de paiement sont des stubs sandbox : remplacer les appels dans le module de paiement avant production.

# TiketHaiti

Une plateforme de vente de ticket d’événement.
