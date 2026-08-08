# Tikè Ayiti MVP - Implementation Progress

## Phase 1: Backend Core - Database & Schema
- [x] Create TODO.md
- [ ] Redesign Prisma schema (cities, categories, UUIDs, all event fields)
- [ ] Generate migration
- [ ] Update .env.example
- [ ] Install missing deps (qrcode, zod, resend)

## Phase 2: Backend API - Missing Endpoints
- [ ] Auth: Add GET /auth/me
- [ ] Users: Add PATCH /users/profile, GET /users/tickets
- [ ] Events: Add filtering, slug, proper DTOs
- [ ] Orders: Add GET /orders/:id, GET /orders/my
- [ ] Payments: Refactor MonCash/NatCash, webhooks, status
- [ ] Tickets: PDF, check-in, secure QR
- [ ] Admin: Full CRUD events, orders/payments, dashboard

## Phase 3: Backend Infrastructure
- [ ] Rate limiting
- [ ] Global exception filter with logging
- [ ] Admin role guard
- [ ] Pagination helper

## Phase 4: Frontend - Foundation
- [ ] API client layer
- [ ] Auth context & token management
- [ ] Registration page
- [ ] Protected routes
- [ ] Install missing deps

## Phase 5: Frontend - Pages
- [ ] Home: dynamic events
- [ ] Events: filters
- [ ] Event detail: full info
- [ ] Checkout: working flow
- [ ] Tickets: QR display
- [ ] Profile: edit, history
- [ ] Admin pages

## Phase 6: Documentation & Polish
- [ ] Swagger decorators
- [ ] Update README
- [ ] Unit tests

