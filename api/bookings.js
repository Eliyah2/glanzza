// Glanzza — boekings-API (Vercel serverless function).
// GET  /api/bookings           -> lijst boekingen (header x-user-id)
// POST /api/bookings           -> nieuwe boeking (JSON body)
//
// NB: x-user-id is een tijdelijke MVP-vereenvoudiging.
// Voor livegang vervangen door een echte sessie/JWT (zie ROADMAP.md).
import { getPool } from '../lib/db.js';

export default async function handler(req, res) {
  let pool;
  try {
    pool = getPool();
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }

  const userId = Number(req.headers['x-user-id'] || 0);
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'Niet ingelogd (x-user-id header ontbreekt).' });
  }

  if (req.method === 'GET') {
    const { rows } = await pool.query(
      `SELECT b.id, b.starts_at, b.deposit_cents, b.deposit_paid, b.status,
              s.name AS service, c.name AS customer
       FROM bookings b
       JOIN services s  ON s.id = b.service_id
       JOIN customers c ON c.id = b.customer_id
       WHERE b.user_id = $1
       ORDER BY b.starts_at ASC`,
      [userId]
    );
    return res.status(200).json({ ok: true, bookings: rows });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { service_id, customer_id, starts_at } = body || {};
    const depositCents = Number(body?.deposit_cents) || 0;

    if (!service_id || !customer_id || !starts_at) {
      return res.status(422).json({ ok: false, error: 'service_id, customer_id en starts_at zijn verplicht.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO bookings (user_id, service_id, customer_id, starts_at, deposit_cents)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, service_id, customer_id, starts_at, depositCents]
    );
    return res.status(201).json({ ok: true, id: rows[0].id, deposit_cents: depositCents });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
