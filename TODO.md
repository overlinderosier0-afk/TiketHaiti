# Tikè Ayiti MVP - Implementation Progress

## Phase 1: Backend Core - Database & Schema
- [x] Create TODO.md
- [x] Redesign Prisma schema (cities, categories, UUIDs, all event fields)
- [x] Generate migration (`apps/api/prisma/migrations/20260923000000_init`)
- [x] Update .env.example
- [x] Install missing deps (qrcode, pdfkit, tsx, @types/*)

## Phase 2: Backend API - Missing Endpoints
- [x] Auth: Add GET /auth/me
- [x] Users: Add PATCH /users/profile, GET /users/tickets
- [x] Events: Add filtering, slug, proper DTOs, pagination
- [x] Orders: Add GET /orders/:id, GET /orders/my (route order fixed)
- [x] Payments: Refactor MonCash/NatCash, webhooks (HMAC verify + idempotent), status
- [x] Tickets: PDF (pdfkit), check-in (persisted), secure QR (canonical HMAC)
- [x] Admin: Full CRUD events, orders/payments, dashboard

## Phase 3: Backend Infrastructure
- [x] Rate limiting (Throttler guard applied globally)
- [x] Global exception filter with logging (single registration)
- [x] Admin role guard (dedicated AdminGuard)
- [x] Pagination helper

## Phase 4: Frontend - Foundation
- [x] API client layer (`lib/api.ts`, token in localStorage)
- [x] Auth context & token management (`lib/auth.tsx`)
- [x] Registration page (wired to /auth/register)
- [x] Protected routes (login redirects via ?next=)
- [x] Install missing deps

## Phase 5: Frontend - Pages
- [x] Home: dynamic events (section "À l'affiche" chargée via GET /events?limit=3)
- [x] Events: filters + pagination
- [x] Event detail: full info + quantity + order creation
- [x] Checkout: working flow (provider choice, initiate, status polling)
- [x] Tickets: QR display + PDF download
- [x] Profile: info + order history + edit form (PATCH /users/profile)
- [x] Admin pages (dashboard, create event, check-in, event list)

## Phase 6: Documentation & Polish
- [ ] Swagger decorators
- [x] Update README
- [x] Unit tests (qr tamper, webhook signature)

## Known limitations / next steps
- [ ] DB-dependent validation not run here (no PostgreSQL on this VM): `prisma migrate deploy`, seed, API boot, e2e smoke test — run via docker-compose on dev machine
- [ ] Conditional stock decrement (updateMany with ticketsAvailable >= quantity) for concurrent purchases
- [x] Expiration of unpaid PENDING orders (release reserved seats) — lazy expiry on reads + `POST /admin/orders/sweep-expired`
- [ ] Provider check on webhook (payment provider must match recorded payment)
- [ ] Admin event form: city/category selectors instead of raw IDs
- [x] PATCH /users/profile edit form in profile page
- [ ] Real MonCash/NatCash credentials + verified webhook contract (currently sandbox contract)
- [ ] Order confirmation emails (resend)
- [ ] WhatsApp delivery of tickets (in addition to on-site "Mes billets")

## Phase 7: Paiement manuel (modèle lerichetopup)
- [x] Référence courte `TH-XXXXXX` à recopier dans la note du transfert
- [x] `POST /payments/{moncash,natcash}/initiate` renvoie les instructions manuelles (numéro marchand depuis env)
- [x] `PaymentSettlementService` : chemin de règlement unique (webhook signé OU validation admin), idempotent
- [x] Admin : `GET /admin/orders/pending`, `POST /admin/orders/:id/confirm`, `POST /admin/orders/:id/cancel`
- [x] Checkout : affichage des instructions (numéro + référence copiables, étapes, expiration)
- [x] Admin UI : section "Paiements en attente" avec confirmer/annuler + purge des expirées
- [x] Migration `20260923020000_manual_payments` (orders.expires_at, payments.confirmed_by)
- [x] Tests unitaires du service (14 tests Jest OK)
