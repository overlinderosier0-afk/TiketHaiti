CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');
CREATE TYPE "PaymentProvider" AS ENUM ('MONCASH', 'NATCASH');
CREATE TYPE "PaymentProviderStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "phone" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "cities" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE
);

CREATE TABLE "categories" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE
);

CREATE TABLE "events" (
  "id" UUID PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "banner_url" TEXT,
  "gallery" JSONB DEFAULT '[]',
  "city_id" INT NOT NULL REFERENCES "cities"("id"),
  "category_id" INT NOT NULL REFERENCES "categories"("id"),
  "address" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "event_date" TIMESTAMPTZ NOT NULL,
  "doors_open" TIMESTAMPTZ,
  "artist_name" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "capacity" INT NOT NULL,
  "tickets_available" INT NOT NULL DEFAULT 0,
  "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "orders" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "total" DOUBLE PRECISION NOT NULL,
  "payment_method" TEXT,
  "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "payment_reference" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "tickets" (
  "id" UUID PRIMARY KEY,
  "order_id" UUID NOT NULL REFERENCES "orders"("id"),
  "event_id" UUID NOT NULL REFERENCES "events"("id"),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "qr_payload" TEXT NOT NULL,
  "qr_signature" TEXT NOT NULL,
  "qr_image" TEXT,
  "checked_in" BOOLEAN NOT NULL DEFAULT FALSE,
  "checked_in_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "payments" (
  "id" SERIAL PRIMARY KEY,
  "order_id" UUID NOT NULL UNIQUE REFERENCES "orders"("id"),
  "provider" "PaymentProvider" NOT NULL,
  "transaction_reference" TEXT UNIQUE,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'HTG',
  "status" "PaymentProviderStatus" NOT NULL DEFAULT 'PENDING',
  "webhook_payload" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
