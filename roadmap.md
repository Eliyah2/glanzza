# Glanzza — Roadmap naar de eerste betalende klant

> Eerlijke volgorde: **eerst bewijzen dat bedrijven betalen, dan pas bouwen.** Elke stap hieronder heeft een duidelijke "go/no-go".

## Fase 0 — Live marketing-site (klaar ✅)

- [x] Landingspagina + demo + lead-formulier
- [x] Vercel-configuratie + security-headers
- [x] Node/Postgres-backend-skeleton (`/api/lead`, `/api/bookings`)
- [ ] **Jij:** Formspree-ID invullen (of `/api/lead` + `DATABASE_URL` koppelen) en deployen

**Doel:** een publiek visitekaartje + wachtlijst. Nog géén betalingen aannemen.

## Fase 1 — Valideren (week 1–3)

1. Gebruik de leadlijst (`POTENTIELE_KLANTEN.md`): 20 gesprekken met detailers.
2. Stel de moedervraag: *"Wat kost een no-show je per maand?"* en *"Zou je €20/maand betalen om dit op te lossen?"*
3. **Go/no-go:** ≥8 van de 20 zegt "ja/waarschijnlijk" → ga door naar Fase 2. Minder → pas de niche aan of switch naar plan B (gastouder, zie rapport).

## Fase 2 — Echte betaling (week 3–6)

1. Koppel **Mollie testmodus** (gratis account, geen echte kosten) → Wero-aanbetaling echt laten werken.
2. Bouw **gebruikersaccounts** (vervang `x-user-id` door echte login + JWT/sessie).
3. Laat de eerste 3 "ja"-zeggers **echt betalen** (founders-tarief €15/maand).
4. **Go/no-go:** 3 echte betalingen binnen → product bewezen. 0 → stop en heroverweeg.

## Fase 3 — Eerste 10 klanten (maand 2–3)

1. Automatiseer reminders (sms via Twilio/MessageBird in de Pro-tier).
2. Persoonlijke outreach: 20 mails/DM's per week (sjablonen in `FASE5_VALIDATIE_EN_OUTREACH.md`).
3. **Doel:** 10 betalende klanten = €150–250 MRR.

## Fase 4 — €1.000 MRR (maand 4–9)

1. SEO: landingspagina's per stad ("autodetailing boeken [stad]").
2. Referral-programma voor detailers.
3. **Doel:** 40 klanten × €25 = €1.000 MRR.

## Fase 5 — €10.000 MRR (jaar 1–2)

1. Dezelfde engine klonen naar aangrenzende niches (carwash, velgen/banden, PPF-wrappers, rijscholen).
2. Partneren met detailing-leveranciers en opleidingen.
3. **Doel:** 300–400 klanten.

## Aannames die nog getest moeten worden (altijd zichtbaar houden)

- [ ] Betalen solo-detailers daadwerkelijk €25/maand? (Fase 1)
- [ ] Is het aantal bereikbare NL-detailers groot genoeg voor €10k? (tel de directory-scrape)
- [ ] Verlaagt Wero-aanbetaling no-shows meetbaar? (meet een testgroep)
- [ ] Is SEO haalbaar? (keyword-onderzoek in Fase 4)

## Beveiligings-backlog vóór echte betalingen

- [ ] JWT/sessie-auth i.p.v. `x-user-id` header
- [ ] CSRF-tokens op alle formulieren
- [ ] Rate-limiting op login en lead-endpoint
- [ ] Rate-limiting + webhook-validatie op Mollie
- [ ] AVG/privacyverklaring
- [ ] `.env`/secrets nooit in git
