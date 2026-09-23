# Tikè Ayiti API contract

The API is exposed through NestJS controllers and rendered as an OpenAPI document by Swagger at `/docs`.

## Main resources
- Auth: `/auth/register`, `/auth/login`, `/auth/me`
- Users: `/users/profile`, `/users/tickets`
- Events: `/events`, `/events/:id`
- Orders: `/orders`, `/orders/:id`, `/orders/my`
- Payments: `/payments/moncash/initiate`, `/payments/natcash/initiate` (renvoient les instructions de transfert manuel : numéro marchand + référence `TH-XXXXXX` à recopier en note), `/payments/webhook/*`, `/payments/status/:orderId`
- Tickets: `/tickets/:id`, `/tickets/:id/pdf`, `/tickets/checkin`
- Admin: `/admin/events`, `/admin/orders`, `/admin/orders/pending`, `/admin/orders/:id/confirm`, `/admin/orders/:id/cancel`, `/admin/orders/sweep-expired`, `/admin/payments`, `/admin/dashboard`

The runtime governance follows a JWT bearer authentication flow.
