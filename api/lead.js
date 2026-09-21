// Glanzza — lead-capture endpoint (Vercel serverless function).
// Ontvangt het founders-formulier van de landingspagina.
// Route: POST /api/lead
import { getPool } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const bedrijf = String(body.bedrijf || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const bericht = String(body.bericht || '').trim();

  if (!bedrijf || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(422).json({ ok: false, error: 'Vul een geldige bedrijfsnaam en e-mailadres in.' });
  }

  try {
    if (process.env.DATABASE_URL) {
      const pool = getPool();
      await pool.query(
        'INSERT INTO leads (bedrijf, email, bericht) VALUES ($1, $2, $3)',
        [bedrijf, email, bericht]
      );
    } else {
      // Geen database gekoppeld: log de lead zodat die in Vercel Function Logs staat.
      // Koppel DATABASE_URL (Neon/Supabase) om leads in een DB op te slaan.
      console.log('[lead]', JSON.stringify({ bedrijf, email, bericht, tip: 'Koppel DATABASE_URL om leads in een DB op te slaan.' }));
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[lead] opslaan mislukt:', err.message);
    return res.status(500).json({ ok: false, error: 'Opslaan mislukt. Controleer DATABASE_URL.' });
  }
}
