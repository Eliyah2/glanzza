// Glanzza — Postgres-verbinding voor Vercel serverless functions.
// Gebruik een Neon of Supabase Postgres-database (gratis tier).
// Zet in Vercel → Project → Settings → Environment Variables:
//   DATABASE_URL = postgres://user:pass@host:5432/glanzza?sslmode=require
import { Pool } from 'pg';

let pool = null;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL ontbreekt. Zet een Neon/Supabase Postgres-URL in Vercel env-vars.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}
