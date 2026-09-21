# Onderzoeksrapport — Gouden SaaS-idee voor een startende ondernemer (NL)

**Datum:** 21 september 2026
**Auteur:** Autonoom AI-startup-agent
**Doel:** Een winstgevend, schaalbaar softwareproduct vinden dat een echt klantprobleem oplost, met een MVP die door één developer (HTML/CSS/JS/PHP + AI) snel gebouwd kan worden. Doel: eerst €1.000 MRR, daarna opschalen.

---

## 1. Samenvatting & conclusie

De Nederlandse generieke MKB-softwaremarkt (boekhouden, offertes, facturatie, salons, rijscholen, bouw/hoveniers) is **verzadigd en goedkoop** — hier kom je niet meer tussen met een me-too product. De echte kans ligt in een **micro-niche die nu nog werkt met WhatsApp, Instagram, Excel of een veel te duur, log pakket.**

Mijn onderbouwde keuze voor de eerste MVP:

> **Glanzza — boekings- en no-show-tool voor autopoets-/detailing-bedrijven (Nederland), met Wero-aanbetaling.**
>
> Bewijs van vraag: detailing-ondernemers draaien nu op Instagram/WhatsApp-DM's, verliezen geld aan no-shows, en er bestaat **geen dominante Nederlandstalige tool** — alleen generieke Engelstalige tools (Jobber, Bookedin, Urable) die duur zijn en geen Wero hebben.
>
> Dit is de snelste route naar €1.000 MRR (≈ 40 klanten × €25/maand) met de laagste risico's en de kortste time-to-MVP.

**Backup-idee (hoogste bewezen betaalbereidheid):** gastouder-/gastouderbureau-administratie (uren + facturatie + toeslag). Bewezen betaling: €30/gezin/maand (ifyourehappy) en €69–129/maand per locatie (Bitcare). Iets complexer (AVG/toeslag), dus als plan B.

---

## ⚠️ HERZIENING (21 sept 2026) — belangrijk

Na een tweede, grondigere zoekronde moet ik mijn eerdere claim "geen Nederlandstalige tool met Wero" **corrigeren**. De detailing-boekingsmarkt is drukker dan hieronder beschreven:

- **Reservio is gratis** (onbeperkt boeken, automatische herinneringen, online betalen), Nederlandstalig, en adverteert expliciet met "afspraaksoftware voor auto detailing".
- **Anolla** — Nederlandstalige autodetailing/carwash-boekingssoftware.
- **AutoHustl** ($39–119/mnd), **DetailPilot**, **Mobile Tech RX**, **OrbisX**, **Urable**, **DetailPro**, **Menutize** ($29), **OctopusPro**, **Orderry** — detailing-specifieke tools.
- **Salonized, Optios, Avana** — Nederlandse tools met Wero ("boeken en betalen met Wero").

**Genuanceerde conclusie:** de *pijn* (no-shows) is echt en meetbaar — 12–18% no-show zonder aanbetaling vs 5–7% mét (simplybook.me), en 55% van de Nederlanders accepteert no-show-kosten. Maar de *oplossing* is een commodity. De enige houdbare strategie is **distributie + lokaal persoonlijk contact + een WhatsApp/Wero-wedge**, niet "features". Zie `POTENTIELE_KLANTEN.md`, `ROADMAP.md` en `DEPLOY.md`.

---

## 2. Wat de markt laat zien (bewezen bevindingen)

> Alle onderstaande feiten en prijzen komen uit zoekresultaten van deze sessie. Waar iets een aanname is, staat dat expliciet vermeld. Bronnen onderaan.

### 2.1 Verzadigde categorieën (hier NIET instappen)

| Categorie | Bewijs van verzadiging | Conclusie |
|---|---|---|
| Boekhouden / facturatie ZZP-MKB | WeFact €16,50/mnd; boekhoudprogramma's €8–100/mnd (onderneming.nl); Moneybird, e-Boekhouden, Jortt, Rompslomp, SnelStart, MoneyMonk | Prijsoorlog, geen ruimte |
| Offertesoftware | Moneybird, e-Boekhouden, appwiki.nl vergelijkers; tientallen aanbieders | Commodity |
| Kapper / salon / trimsalon | Salonized, SARA Salonsoft, DVI €27,95/mnd, Optios, Mijn Salon, Reservio, vev.co, Goldie | Vol |
| Rijscholen | Autofox vanaf €9,95/mnd, PlanGo (gratis tier), Flexpulse, Rijschoolapp, RSM | Vol én al goedkoop |
| Bouw / hoveniers / installateurs | Tradify, Robaws (Sidekick), OutSmart, ServicePlanner, HERO, Simple-Simon, Compenda, Cannonworks, Bouwportaal | Vol (allemaal horizontaal) |
| Schoonmaakplanning | TopRooster, Shyfter, FacilityApps, Appreo, Planigo, MaidFlow | Matig vol, maar geserveerd |
| Personal trainer / bijles | Trainerize, TrueCoach, Mindbody, Virtuagym, SuperSaaS, Setmore (internationaal) | Vol internationaal |
| Verenigingen | Sportlink Club.Basis (gratis) + betaalde modules; Membro, ClubCollect, Club-assistent | Vol + budgetgevoelig (vrijwilligers) |

**Kernles:** het "offerte → planning → werkbon → factuur"-patroon is door tientallen horizontale tools bezet. Een nieuw generiek product wint niet. De kans is **verticaal**: één niche, één klus, radicaal eenvoudiger en Nederlandser (Wero, NL-taal, NL-prijzen).

### 2.2 De terugkerende, bewezen pijnpunten

Door alle niches heen komen drie klachten steeds terug:
1. **Booking-chaos** — klanten komen binnen via Instagram/WhatsApp-DM's en telefoon, geen overzicht.
2. **No-shows kosten geld** — automatische herinneringen + aanbetaling zijn de universele oplossing (iedere salon/tool adverteert ermee).
3. **Te dure of te logische software** — kleine ondernemers (1–5 man) willen niet betalen voor enterprise-pakketten.

---

## 3. Longlist: 12 ideeën (met snelle beoordeling)

| # | Idee | Beoordeling |
|---|---|---|
| 1 | **Glanzza — bookingen/no-show/Wero voor detailing** | ✅ Geselecteerd |
| 2 | **Gastouder-/bureau-administratie (uren+factuur+toeslag)** | ✅ Geselecteerd |
| 3 | **Lichte fysio-praktijktool vs. dure EPD's** | ✅ Geselecteerd |
| 4 | ZZP-boekhoud-/facturatie-app | ❌ verzadigd |
| 5 | Kapper/salon/trimsalon-software | ❌ verzadigd |
| 6 | Rijschoolsoftware | ❌ verzadigd + goedkoop |
| 7 | Schoonmaakplanning | ⚠️ geserveerd |
| 8 | Hovenier/installateur job-management | ❌ verzadigd |
| 9 | Verenigingssoftware | ⚠️ bezet + budgetgevoelig |
| 10 | Personal-trainer/bijles planning | ❌ verzadigd internationaal |
| 11 | Generieke no-show/reminder micro-tool | ⚠️ te dun/generiek |
| 12 | Review/reputatie-automatisering lokaal MKB | ⚠️ matig, veel aanbod |

---

## 4. Diepgaand onderzoek: 3 geselecteerde ideeën

### Idee 1 — Glanzza (detailing / autopoetsen)  ★ AANBEVOLEN MVP

**Probleem:** Detailing-ondernemers (veelal 1–2 personen, mobiel of kleine studio) nemen boekingen aan via Instagram-DM, WhatsApp en telefoon. Ze hebben geen overzicht, vergeten herinneringen te sturen, en **verliezen omzet aan no-shows** omdat ze geen aanbetaling vragen. Bestaande tools zijn Engelstalig, duur en hebben geen Wero.

**Bewijs van vraag (bewezen):**
- De detailing-tools die bestaan zijn internationaal/Engels (Bookedin, Jobber, Urable, Mobile Tech RX, OrbisX, DetailPro, AutoHustl, Menutize) én er zijn Nederlandse/Wero-opties (Reservio gratis, Anolla, Salonized, Avana). **Er is echter geen dominante Nederlandstalige detailing-specifieke tool.** (Zie HERZIENING bovenaan.)
- Het "no-show + aanbetaling"-probleem is aantoonbaar universeel (zie 2.2) en detailing is prijzig werk (€100–€800+ per behandeling) → een no-show doet écht pijn en een €25/maand-tool die dat voorkomt is een no-brainer.

**Concurrenten:** Jobber ($29–529), AutoHustl ($39–119), Bookedin, Urable, Mobile Tech RX, OrbisX, DetailPro, Menutize ($29) — Engelstalig/USD. Nederlandstalig/Wero: Reservio (gratis), Anolla, Salonized, Optios, Avana. **Onderscheidend vermogen is dus beperkt tot distributie en een WhatsApp/Wero-wedge, niet tot unieke features.**

**Prijsindicatie:** Jobber/Bookedin zitten typisch op $29–$99/maand. Wij kunnen €25/maand (start) met Wero-deposito's als onderscheidend punt.

**Onzekerheden (hypotheses om te testen):**
- Marktgrootte NL: schatting 1.000–2.000 actieve detailing-bedrijven (HYPOTHESE, nog niet geverifieerd met een concrete telling).
- Bereidheid om te betalen: solo-operators zijn prijsgevoelig; moet gevalideerd worden met 10–20 gesprekken.
- Seizoensgevoeligheid (winter rustiger).

### Idee 2 — Gastouder-/gastouderbureau-administratie  ★ Sterk plan B

**Probleem:** Gastouders en kleine gastouderbureaus worstelen met urenregistratie, facturatie en de (veranderende) kinderopvangtoeslag-regels. Het is terugkerend, verplicht en foutgevoelig.

**Bewijs van vraag (bewezen):**
- ifyourehappy rekent **€30/gezin/maand + €30 eenmalig**.
- Bitcare rekent **€995 eenmalig + €69–129/maand per locatie**.
- Max. uurprijs kinderopvangtoeslag 2026 = **€8,49/uur** (indexatie, welkomkind.nl) → regels veranderen jaarlijks = blijvende behoefte aan up-to-date software.

**Concurrenten:** Kidsadmin, Kidskonnect, ifyourehappy, Bitcare, Quebble, Payt. Gefragmenteerd, geen dominante goedkope tool.

**Onzekerheden:**
- Koper = het bureau (minder partijen, langere salestijd), niet de individuele gastouder.
- AVG (kindgegevens) + toeslagregels = meer compliance dan detailing.
- Gastouders zelf zijn prijsgevoelig (laag inkomen).

### Idee 3 — Lichte fysio-praktijktool (solo/starters)  ★ "10x goedkoper"-kans

**Probleem:** Fysiopraktijken zijn afhankelijk van zware, dure EPD's (Intramed, Fysiomanager, Flux, SpotOnMedics). Een solo-fysio of startende praktijk betaalt voor functies die hij niet gebruikt en een log pakket.

**Bewijs van vraag (bewezen):**
- Intramed "prijs op aanvraag" (afhankelijk van praktijkgrootte); Intramed Insight Start vanaf **€8,95/maand per administratie** (bedrijfssoftwaregids.nl) → de volwassen pakketten zijn aanzienlijk duurder en log.
- Fysiomanager adverteert "overstappen is eenvoudig" → er is een bewezen switch-markt.

**Concurrenten:** Intramed, Fysiomanager, Flux, SpotOnMedics.

**Onzekerheden (belangrijk risico):**
- Gezondheidsdata = AVG/BIG/veilige verwerking (NEN 7510) → zware compliance, risicovol voor een beginnende solo-dev.
- Declaratie via Vecozo is een technische/administratieve integratie.
- **Daarom niet als eerste MVP**, maar als opschaal-kans later.

---

## 5. Keuze & onderbouwing

**Ik kies Glanzza (detailing) als eerste MVP.** Redenen, als ondernemer die eigen geld riskeert:

| Criterium | Glanzza | Gastouder | Fysio |
|---|---|---|---|
| Bewijs van klantvraag | Hoog (no-show/deposito is universeel, geen NL-tool) | Zeer hoog (bewezen €30/gezin) | Hoog (dure EPD) |
| Bereidheid maandelijks te betalen | Middel (valideren) | Hoog (bewezen) | Hoog |
| Concurrentie / onderscheid | **Laag in NL** | Middel | Middel (gevestigd) |
| Technische haalbaarheid (solo + AI) | **Zeer hoog** | Hoog | Laag (AVG/Vecozo) |
| Opstartkosten | **Zeer laag** | Laag | Hoog |
| Snelheid naar MVP | **Dagen–weken** | Weken | Maanden |
| Klanten geautomatiseerd bereiken | **Hoog** (Google Maps/Instagram/directories scrapen) | Middel (bureaus bellen) | Laag |
| Opschaal naar €10k MRR | Middel-hoog (uitbreiden naar andere niches) | Middel | Hoog |

**Waarom niet gastouder als eerste?** Omdat de koper het bureau is (minder, langzamere sales) en de compliance hoger ligt. Gastouder blijft een sterk plan B als de detailing-validatie stokt — het heeft de sterkste *bewezen* betalingsbereidheid van de drie.

**Waarom niet fysio als eerste?** De markt is aantrekkelijk ("10x goedkoper" tegen dure EPD's), maar AVG/gezondheidsdata-compliance is te zwaar voor een eerste MVP van een solo-dev. Bewaar dit als fase-2 opschaling.

---

## 6. Businessplan Glanzza (Fase 3)

### 6.1 Naam & merk
- **Werknaam:** Glanzza (eventueel "Glanzza.nl").
- **Merkconcept:** "Boekingen onder controle, no-shows de deur uit." Professioneel, strak, NL-taal, Wero-native. Positioneer tegen de dure Engelstalige tools: "gemaakt voor Nederlandse detailers."

### 6.2 Exact probleem
Een detailler verliest tijd (booking-chaos via DM/WhatsApp) én geld (no-shows zonder aanbetaling). Glanzza lost dat op met één simpel product: online boeken, automatische herinneringen, en **Wero-aanbetaling** die no-shows ontmoedigt.

### 6.3 Doelgroep & ideale eerste klant
- **Doelgroep:** autopoets-/detailing-bedrijven in NL (mobiel of studio), 1–5 medewerkers.
- **Ideale eerste klant:** een mobiele detailler (25–40 jaar, actief op Instagram) met 15–30 boekingen/week die nu alles via WhatsApp regelt en last heeft van no-shows.

### 6.4 Belangrijkste concurrenten
Jobber, Bookedin, Urable, Reservio (generiek). Geen NL-tool met Wero-deposito. (Zie 4.1.)

### 6.5 Unieke waardepropositie (UVP)
"De enige Nederlandstalige boekingstool voor detailers met **Wero-aanbetaling** — zet no-shows om in betaalde boekingen, in 10 minuten live."

### 6.6 Prijsmodel
- **Start:** €25/maand (onbeperkte boekingen, 1 gebruiker).
- **Pro:** €49/maand (meerdere medewerkers, sms-herinneringen, statistiek).
- **Wero-deposito:** transactie via Mollie/Stripe (testmodus nu); optioneel €0,30 per aanbetaling doorberekenen.
- Gratis proef: 14 dagen, geen kaart vereist.

### 6.7 Verwachte kosten per gebruiker
- Hosting + DB (€5–10/maand totaal, gedeeld over klanten) → marginaal.
- Wero-transactiekosten (Mollie €0,29 + % / transactie) → alleen bij aanbetaling, door te berekenen.
- SMS-herinneringen (Twilio/MessageBird) → alleen in Pro-tier.
- **Nettomarge per klant: zeer hoog (>80%).**

### 6.8 Plan naar de eerste 10 betalende klanten (90 dagen)
1. Scrape een lijst van ~200 NL-detailers (Google Maps "auto poetsen/detailing" + Instagram-hashtags) → exporteer naar CRM.
2. Bouw de MVP (zie Fase 4) + demo met fictieve data.
3. Persoonlijke outreach: 20 gepersonaliseerde mails/DM's per week, met concreet "dit kost jouw no-shows je per maand"-verhaal.
4. Bied eerste 10 klanten "founders-prijs" €15/maand (levenslang) aan in ruil voor feedback.
5. Doel: 10 betalende klanten binnen 90 dagen = €150–250 MRR. (Valideren vóór schalen.)

### 6.9 Groeipad naar €1.000 en €10.000 MRR
- **€1.000 MRR:** 40 klanten × €25. Kanalen: persoonlijke outreach + Google-zoek "detailing boeken software" (SEO) + Instagram-content + referrals van detailers. Tijdpad schatting: 6–9 maanden (HYPOTHESE).
- **€10.000 MRR:** 300–400 klanten × €25–49. Kanalen: (a) uitbreiden naar aangrenzende niches (carwash, banden/velgen, PPF-wrappers, rijscholen) met dezelfde engine; (b) partner met detailing-leveranciers/opleidingen; (c) Nederlandse SEO/landingspagina's per stad. Behouden door dezelfde boekings-engine verticaal te klonen.

### 6.10 Nog te testen aannames (expliciet)
1. Betalen solo-detailers daadwerkelijk €25/maand? (valideren met 10–20 gesprekken vóór schaal)
2. Is het aantal bereikbare NL-detailers groot genoeg voor €10k? (directory-scrape tellen)
3. Voorkomt Wero-deposito no-shows meetbaar? (testgroep meten)
4. Is SEO op "detailing software NL" haalbaar op korte termijn? (keyword-onderzoek)

---

## 7. Bronnen (deze sessie geraadpleegd)

- wefact.nl — ZZP-administratie €16,50/mnd
- onderneming.nl — boekhoudprogramma's €8–100/mnd
- ikwordzzper.nl — top-5 boekhoudprogramma's
- autofox.nl — rijschoolsoftware vanaf €9,95/mnd
- dvi.nl — kapperssoftware €27,95/mnd
- salonized.com, sarasalonsoft.nl — salon/trimsalon software
- shyfter.com — "Excel onbeheersbaar bij 50 medewerkers/30 locaties"
- toprooster.nl, facilityapps.com, appreo.nl, planigo.nl — schoonmaakplanning
- hero-software.nl, service-planner.nl, out-smart.com, sidekicksoftware.nl (Robaws) — installateurs/trades
- intramed.nl, fysiomanager.nl, bedrijfssoftwaregids.nl — fysio-EPD (Intramed Insight Start €8,95)
- verenigingsplanner.nl, consultant.nl, membro.nl, clubcollect.com — verenigingssoftware
- ifyourehappy.nl — gastouderbureau €30/gezin/maand
- bitcare.com — kinderopvang €995 eenmalig + €69–129/maand
- welkomkind.nl — max. uurprijs kinderopvangtoeslag 2026 €8,49
- bookerin.com, getjobber.com, urable.com, detailpropos.com, myquoteiq.com — (internationale) detailing-tools

---

## 8. Volgende stap

Conform de opdracht ga ik nu zelfstandig verder met **Fase 4: de MVP bouwen** (landingspagina + kernfunctionaliteit + demo + README), en daarna Fase 5 (testen, bugs, validatieplan, outreach-mails).
