# Glanzza — Draaiboek: live gaan & geld verdienen

> Werk dit van boven naar beneden af. Alles wat niet afgevinkt is, is nog te doen.

## Hoe het product werkt (nieuw)

```
Bedrijf meldt zich aan (onboarding.html)
        │  schrijft naar
        ▼
Centrale Google Sheet ("Bedrijven")  ◀── privé, alleen jij ziet dit
        │  wordt gelezen door (via ?bedrijf=<id>)
        ▼
Boekingspagina (boeken.html?bedrijf=<id>)  ── klant boekt + betaalt aanbetaling
        │  schrijft naar
        ▼
Google Sheet ("Boekingen" + "Leads") + Google Agenda
```

Elk bedrijf ziet **alleen zijn eigen** gegevens. Er staat niets publiek in een bestand.

## Stap 1 — Centrale backend aanzetten (eenmalig, ±10 min)

1. Maak een nieuwe Google Sheet aan (naam maakt niet uit).
2. Menu **Extensies → Apps Script**.
3. Verwijder de voorbeeldcode en plak de hele inhoud van `google-apps-script/Code.gs`.
4. Sla op (Ctrl+S).
5. Klik **Implementeren → Nieuwe implementatie → type: Web-app**:
   - Uitvoeren als: **Ik**
   - Wie heeft toegang: **Iedereen**
6. Klik Deploy, autoriseer, en **kopieer de Web-app-URL**. Dit is je **centrale URL**.
7. Maak (in dezelfde Sheet) alvast drie tabbladen: `Bedrijven`, `Boekingen`, `Leads`.
   (Als je dat vergeet, maakt de code ze automatisch aan bij het eerste gebruik.)

## Stap 2 — De centrale URL invullen (3 plekken)

| Bestand | Wat aanpassen |
|---|---|
| `boeken.html` | `var CENTRAL_URL = "";` → jouw Web-app-URL |
| `onboarding.html` | `var CENTRAL_URL = "";` → jouw Web-app-URL |
| `assets/js/main.js` | `var LEAD_GAS_URL = "";` → jouw Web-app-URL |

## Stap 3 — Testen (vóór je verkoopt)

1. Open `onboarding.html` → vul een testbedrijf in → klik "Maak mijn pagina".
2. Je ziet je boekingslink. Open die link.
3. Doe een testboeking → check of de rij in **Boekingen** staat.
4. Check of de afspraak in je **Google Agenda** staat.
5. Check of je **Wero/Tikkie-link** werkt.

**Pas als alle 5 ✓ zijn, is het product echt werkend.** Dit is je bewijs.

## Stap 4 — Site online zetten

Zie `DEPLOY.md` (Vercel). Je uploadt de map; de `CENTRAL_URL` zit al in de bestanden.

## Stap 5 — Eerste betalende klanten (het echte werk)

1. Open `POTENTIELE_KLANTEN.md` (26 echte leads) en `OUTREACH_EMAILS.md`.
2. Bel/DM er **3–5 per dag** (persoonlijk, geen massamail).
3. Doel = **gesprek**, niet meteen verkopen: *"hoe vangen jullie no-shows nu op?"*
4. Laat live je boekingspagina zien met hún diensten → dat overtuigt.
5. **Go/no-go:** ≥8 van de 20 zeggen "ja/waarschijnlijk" → ga door. Minder → pas aan of switch naar plan B (gastouder, zie ONDERZOEKSRAPPORT).

## Stap 6 — Prijzen incasseren

- Founders-prijs: €15/maand (levenslang) voor de eerste 10 klanten.
- Later Start €25 / Pro €49 per maand.
- Zonder KVK ontvang je aanbetalingen via Tikkie/Wero; met KVK schakel je over op Mollie live.

## Wat nog te verbeteren (na de eerste klanten)

- Bedrijven hun gegevens later zelf laten wijzigen (login).
- Per-bedrijf Google Agenda i.p.v. één centrale agenda.
- SMS-herinneringen (Twilio).

## Regels (veiligheid)

- Gebruik alleen **testbetalingen** tot je echt live gaat.
- Verzin geen klanten, reviews of resultaten.
- Verstuur geen massamails; één-op-één, max ~5/dag, met afmeldoptie.
