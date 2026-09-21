# Glanzza — Live zetten op Vercel (handleiding)

> **Eerlijke status vóór je begint:** wat je nu live kunt zetten is de **landingspagina + demo** (statisch).
> Het échte product (echte boekingen, accounts, Wero-betalingen) bestaat nog niet — de PHP/MySQL-backend
> draait **niet** op Vercel. Zie §3 voor wat wel/niet werkt.

## 1. Wat er live gaat

- `index.html` — landingspagina (verkoopt het idee, verzamelt leads)
- `demo.html` — interactieve demo (fictieve data, geen echte betalingen)
- `assets/` — styling en script

Dit is **géén werkend boekingsproduct** — het is een marketing-site + lead-capture. Dat is bewust: het is de eerlijke eerste stap om interesse en een wachtlijst op te bouwen vóór je verder bouwt.

## 2. Stap voor stap deployen

### 2a. Lead-formulier (werkt al, geen account nodig)
Het formulier post naar je eigen `/api/lead`-endpoint (Vercel serverless function). Zonder database worden leads gelogd in **Vercel → Project → Logs**; koppel later `DATABASE_URL` (Neon/Supabase) om ze netjes in een database op te slaan. Geen Formspree of andere externe account nodig.

### 2b. Deployen via Vercel (twee opties)

**Snelste weg — het launch-script:**
```powershell
.\launch.ps1
```
Dit logt je één keer in (`vercel login`) en deployt daarna live. Daarna volstaat `vercel --prod --yes`.

**Optie 1 — Vercel Dashboard (geen installatie):**
1. Maak een account op [vercel.com](https://vercel.com) (gratis tier is genoeg).
2. Klik **"Add New → Project"**.
3. Importeer de map `glanzza` (of push hem eerst naar een GitHub-repo en importeer die repo — aanbevolen).
4. Vercel detecteert automatisch een statische site. Klik **Deploy**.
5. Je krijgt een URL zoals `glanzza.vercel.app`.

**Optie 2 — Vercel CLI (lokaal):**
```bash
# eenmalig installeren + inloggen (jouw Vercel-account)
npm i -g vercel
vercel login

# vanuit de projectmap:
cd glanzza
vercel          # preview
vercel --prod   # live
```

### 2c. Eigen domein (later)
In Vercel → Project → Settings → Domains, koppel je `glanzza.nl` (na registratie — zie veiligheidsregels: **geen domein registreren zonder jouw toestemming**).

## 3. Wat WEL / NIET werkt op Vercel

| Onderdeel | Status op Vercel |
|---|---|
| Landingspagina | ✅ werkt |
| Demo (fictieve data) | ✅ werkt (client-side) |
| Lead-formulier | ✅ werkt (Formspree óf `/api/lead` + Postgres) |
| Backend-API (`/api/lead`, `/api/bookings`) | ✅ klaar — vereist `DATABASE_URL` (Neon/Supabase) |
| Echte gebruikersaccounts | ⚠️ skelet, auth nog toe te voegen |
| Echte Wero-betaling (Mollie) | ❌ nog aansluiten (zie ROADMAP) |

### Backend-API aansluiten (optioneel, later)
1. Maak een gratis [Neon](https://neon.tech) of [Supabase](https://supabase.com) Postgres-database.
2. Importeer `database/schema.postgres.sql` in die database.
3. Zet in Vercel → Settings → Environment Variables: `DATABASE_URL = postgres://...`.
4. Deploy opnieuw. `POST /api/lead` slaat nu leads op; `GET/POST /api/bookings` werkt met header `x-user-id`.

## 4. Belangrijk: verkoop eerlijk

- **Verkoop geen product dat nog niet werkt.** Je landingspagina mag interesse en een wachtlijst verzamelen, maar je mag nog **niet** geld aannemen voor boekingen/Wero totdat dat echt werkt.
- Gebruik de leadlijst ([POTENTIELE_KLANTEN.md](POTENTIELE_KLANTEN.md)) om de eerste gesprekken te voeren — niet om meteen te verkopen.
- Alle demo-data is fictief. Geen verzonnen testimonials of "al 50 klanten".

## 5. Route naar het échte product (later)

Wil je dat boekingen + Wero echt werken, volg dan `ROADMAP.md`. Samengevat:
- **Frontend:** blijft HTML/CSS/JS (of stap over naar Next.js).
- **Backend:** de `/api/`-functies (Node) draaien al op Vercel; koppel `DATABASE_URL`.
- **Betalingen:** Mollie (testmodus → live).
- **Auth:** vervang `x-user-id` door een echte login + JWT/sessie.

Doe dit pas ná de 20 validatie-gesprekken. Eerst bewijzen dat bedrijven betalen, dán bouwen.
