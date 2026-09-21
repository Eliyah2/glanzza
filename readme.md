# Glanzza — Boekings- en no-show-tool voor afspraakbedrijven

> Elke klant (bedrijf) krijgt zijn **eigen** boekingspagina met eigen diensten, prijzen en Wero-aanbetaling. Gegevens zijn afgeschermd: elk bedrijf ziet alleen het zijne.

## Structuur

```
Glanzza/
├── index.html                 # landingspagina (marketing)
├── onboarding.html            # bedrijven melden zich hier zelf aan
├── boeken.html                # boekingspagina per bedrijf (?bedrijf=<id>)
├── assets/css/style.css       # design system
├── assets/js/main.js          # interactie + lead-formulier
├── google-apps-script/Code.gs # centrale backend (lezen + schrijven + agenda)
├── api/ + lib/                # optionele Node/Postgres backend (later)
├── app/                       # optionele PHP backend (alternatief)
├── database/                  # SQL-schema's
├── vercel.json, package.json, launch.ps1
├── VANDAAG_LIVE.md            # ← begin hier (draaiboek)
├── POTENTIELE_KLANTEN.md, OUTREACH_EMAILS.md
├── ONDERZOEKSRAPPORT.md, FASE5_VALIDATIE_EN_OUTREACH.md, ROADMAP.md
└── DEPLOY.md, README.md
```

## Hoe het werkt

| Actie | Bestand | Data |
|---|---|---|
| Bedrijf meldt zich aan | `onboarding.html` | → Sheet "Bedrijven" |
| Klant boekt | `boeken.html?bedrijf=<id>` | → Sheet "Boekingen" + Agenda |
| Interesse-formulier | `index.html` (via `main.js`) | → Sheet "Leads" |
| Bedrijf ophalen | `boeken.html` (JSONP) | ← Sheet "Bedrijven" (alleen eigen id) |

De backend is **één centrale Apps Script** (`Code.gs`) met een centrale Google Sheet. Zie `VANDAAG_LIVE.md` voor de setup.

## Snel starten

1. **Bekijken:** open `index.html`, dan `onboarding.html`, dan `boeken.html`.
2. **Live zetten:** volg `VANDAAG_LIVE.md` (backend) + `DEPLOY.md` (hosting).

## Kwaliteit & beveiliging

- Responsive (desktop + mobiel), hover/focus/disabled/loading/success/error-staten.
- Formuliervalidatie (verplichte velden, e-mail, telefoon, datum niet in verleden).
- Bescherming: dubbele linknaam geblokkeerd, geen overschrijven van bestaande bedrijven, onzin-diensten gefilterd.
- Toegankelijkheid: skip-link, aria-labels, `aria-live`, focus-ringen, `prefers-reduced-motion`.
- Geen externe afhankelijkheden: alles lokaal/inline.
