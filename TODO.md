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
- [ ] Home: dynamic events (still static hero — wire to /events)
- [x] Events: filters + pagination
- [x] Event detail: full info + quantity + order creation
- [x] Checkout: working flow (provider choice, initiate, status polling)
- [x] Tickets: QR display + PDF download
- [x] Profile: info + order history
- [x] Admin pages (dashboard, create event, check-in, event list)

## Phase 6: Documentation & Polish
- [ ] Swagger decorators
- [x] Update README
- [x] Unit tests (qr tamper, webhook signature)

## Known limitations / next steps
- [ ] DB-dependent validation not run here (no PostgreSQL on this VM): `prisma migrate deploy`, seed, API boot, e2e smoke test — run via docker-compose on dev machine
- [ ] Conditional stock decrement (updateMany with ticketsAvailable >= quantity) for concurrent purchases
- [ ] Expiration of unpaid PENDING orders (release reserved seats)
- [ ] Provider check on webhook (payment provider must match recorded payment)
- [ ] Admin event form: city/category selectors instead of raw IDs
- [ ] PATCH /users/profile edit form in profile page
- [ ] Real MonCash/NatCash credentials + verified webhook contract (currently sandbox contract)
- [ ] Order confirmation emails (resend)
