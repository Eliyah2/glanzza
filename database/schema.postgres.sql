-- Glanzza — Postgres-schema (voor Vercel + Neon/Supabase).
-- Importeer dit in je Neon/Supabase database vóór je de /api-functies gebruikt.

CREATE TABLE IF NOT EXISTS leads (
  id         SERIAL PRIMARY KEY,
  bedrijf    TEXT NOT NULL,
  email      TEXT NOT NULL,
  bericht    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'start',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  price_cents  INTEGER NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60
);

CREATE TABLE IF NOT EXISTS customers (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id    INTEGER NOT NULL REFERENCES services(id),
  customer_id   INTEGER NOT NULL REFERENCES customers(id),
  starts_at     TIMESTAMPTZ NOT NULL,
  deposit_cents INTEGER NOT NULL DEFAULT 0,
  deposit_paid  BOOLEAN NOT NULL DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'confirmed',
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_starts ON bookings (user_id, starts_at);
