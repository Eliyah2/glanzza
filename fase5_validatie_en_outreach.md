# Glanzza — Fase 5: Testen, valideren & eerste klanten

> Dit document bevat GEEN verzonnen testimonials, klantresultaten of betaalde klanten. Alles hieronder is strategie en sjabloonmateriaal dat jij zelf controleert en verstuurt.

---

## 1. Validatiemethode (hoe test ik echte vraag?)

Doel: binnen 2–3 weken aantonen dat detailers €15–25/maand willen betalen, vóór je verder bouwt.

1. **20 gesprekken in 3 weken.** Bel of DM 20 detailers uit je lijst (zie §2). Geen verkooppraatje, maar een echt gesprek:
   - "Hoe komen boekingen nu bij je binnen?"
   - "Hoe vaak komt iemand niet opdagen, en wat kost je dat per maand?"
   - "Vraag je nu een aanbetaling? Waarom niet?"
2. **De "moedervraag" aan het einde:** "Zou je €20/maand betalen voor een tool die dit automatisch regelt?" → Noteer ja/nee/misschien en waarom.
3. **Succesmaatstaf:** als ≥8 van de 20 "ja" of "waarschijnlijk" zegt, is de vraag bewezen → ga door. Minder → pas aan of kies plan B (gastouder).
4. **Pay-in-advance-test:** bied de eerste 3 "ja"-zeggers een founders-tarief van €15/maand (levenslang) en vraag direct te starten. Echte betaling is de enige harde validatie.

---

## 2. Outreachstrategie (eerste 20 potentiële klanten)

**Kanaal 1 — Instagram DM (hoofdkanaal).** Detailing is visueel en speelt zich af op Instagram. Reageer op actieve accounts, niet via mass-DM.
**Kanaal 2 — E-mail.** Scrape e-mailadressen via Google Maps ("auto poetsen / detailing <stad>") en websites.
**Kanaal 3 — Lokale start:** begin in Limburg (Roermond, Venlo, Weert, Sittard, Maastricht) — dichtbij, makkelijk om te bellen/bezoeken.

**Scrapen (handmatig, netjes):**
- Google Maps: zoek per stad op "detailing", "auto poetsen", "carwash", "PPF", "velgen reinigen".
- Verzamel: naam, stad, Instagram, website, telefoon, e-mail → zet in een spreadsheet (20 rijen).

**Cadans:** 5 persoonlijke DM's + 3 e-mails per dag, maximaal 1 opvolging per persoon. Geen spam.

**Personaliseer op minimaal één van deze punten (niet allemaal):**
1. Een recente post van hun Instagram (welke auto, welke behandeling).
2. Hun diensten/prijzen van de site.
3. Hun regio/stad.
4. Iets concreets dat je zag (bijv. "je werkt veel met coatings").

---

## 3. Gepersonaliseerde voorbeeldmails (zelf controleren en versturen)

### Sjabloon A — Instagram DM (kort)

> Hoi [naam], je werk op [auto/behandeling uit recente post] ziet er strak uit. 👌
> Mag ik je één vraag stellen? Hoe vangen jullie nu de no-shows op? Ik bouw namelijk een simpele tool voor detailers waarmee klanten online boeken én een Wero-aanbetaling doen, zodat no-shows je geen omzet meer kosten. Zou je daar 5 minuten over willen sparren? (Gewoon feedback, geen verkoop.)

### Sjabloon B — E-mail (iets langer)

> Onderwerp: [naam bedrijf] — wat kosten no-shows jullie per maand?
>
> Hoi [naam],
>
> Ik zag [concreet detail: jullie werken met ceramic coatings / jullie zitten in Venlo / jullie zijn net gestart] en heb een korte vraag.
>
> Veel detailers regelen boekingen nog via WhatsApp en Instagram. Dat werkt, tot iemand niet komt opdagen — dan sta je 2 uur stil zonder betaling.
>
> Ik ben een tool aan het bouwen die dat oplost: online boeken, automatische herinneringen, en een Wero-aanbetaling zodat no-shows verdwijnen. Simpel, Nederlandstalig, vanaf €15–25/maand.
>
> Ik zoek nog geen klanten — ik zoek 5 minuten feedback van echte detailers. Mag ik je bellen of een korte vragenlijst sturen?
>
> Groet,
> [jouw naam]
> Glanzza

### Sjabloon C — Follow-up (na 4–5 dagen, alleen als nog geen reactie)

> Hoi [naam], ik snap dat je het druk hebt — vandaar nog één korte vraag. Als no-shows of booking-chaos bij jou geen probleem zijn, hoor ik het ook graag. Zo niet, dan heb ik een 5-minuten-demo die je tijd kan schelen. Laat maar weten wat je fijn vindt.

### Checklist vóór verzenden
- [ ] Naam bedrijf + naam eigenaar kloppen.
- [ ] Minimaal één echt, specifiek detail (geen templategevoel).
- [ ] Geen valse claims ("al 50 klanten") — die bestaan nog niet.
- [ ] Verzonden vanuit jouw eigen account, handmatig, met toestemming.

---

## 4. Bug- & risicolijst (Fase 5)

**Bekende beperkingen van de huidige MVP:**
1. Wero-aanbetaling is **gesimuleerd** (geen echte Mollie/Stripe-koppeling actief).
2. SMS- en e-mailherinneringen zijn **placeholder-tekst**, nog niet echt verzonden.
3. PHP-backend mist **CSRF-tokens** op formulieren (toevoegen vóór livegang).
4. Login heeft nog **geen rate-limiting** (brute-force-risico).
5. Demo-data staat hardcoded in de browser (geen echte database-koppeling in de demo).

**Risico's (onderneming):**
- **Bereidheid om te betalen** is nog onbewezen → valideren vóór schalen (zie §1).
- **Marktgrootte NL** is een schatting → eerst directory-scrape tellen.
- **Seizoensgevoeligheid** (winter rustiger) → plan Pro-upsell (sms) en evt. aangrenzende niches.
- **AVG:** klantgegevens opslaan vraagt nette verwerking en een privacyverklaring vóór livegang.
- **API-sleutels:** nooit in git; gebruik `config.php` (staat al in README).

---

## 5. Volgorde van aanpak (concreet)

1. ✅ Marktonderzoek + keuze (dit project).
2. ✅ MVP-skeleton + demo (dit project).
3. ⏭️ **Nu:** scrape 20 detailers in Limburg → spreadsheet.
4. ⏭️ Start de 20 gesprekken (3 weken) → valideer of ga naar plan B.
5. ⏭️ Bij ≥8 "ja": koppel echte Mollie-testbetaling + sms, laat 3 founders betalen.
6. ⏭️ Schaal naar 40 klanten → €1.000 MRR.
