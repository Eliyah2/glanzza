// ============================================================
//  Glanzza — centrale backend (Google Apps Script)
//  Eén centrale Google Sheet + dit script bedienen ALLE bedrijven.
//  Flow: aanmelding = 'wacht' → jij laat betalen → Status op 'actief'
//        → systeem maakt automatisch Sheet + Agenda aan en mailt het bedrijf.
//
//  SETUP (eenmalig):
//  1. Google Sheet + Extensies → Apps Script → plak deze code.
//  2. Services → Google Calendar API → Toevoegen (voor het delen van agenda's).
//  3. Implementeren → Nieuwe implementatie → Web-app (Uitvoeren als: Ik, Toegang: Iedereen).
//  4. Eenmalig setupDailyTrigger() uitvoeren → zet de dagelijkse lead-scan (08:00)
//     én de herinneringsmails naar klanten (09:00) aan.
//  5. Zet je leads-sleutel: Projectinstellingen → Scripteigenschappen → LEADS_KEY = je pincode.
//     Zonder sleutel geeft het lead-endpoint niets vrij (veilig by default).
// ============================================================

const SHEET_BEDRIJVEN = 'Bedrijven';
const SHEET_BOEKINGEN = 'Boekingen';
const SHEET_LEADS = 'Leads';
const CALENDAR_ID = '';                            // optioneel: vaste agenda-ID
const SPREADSHEET_ID = '';                         // alleen nodig als het script niet aan de Sheet hangt
const SITE_URL = 'https://glanzza.vercel.app';     // jouw site (voor links in e-mails)
const ADMIN_EMAIL = 'eliyahimpelmans9@gmail.com';  // hier komen je meldingen (leads + aanmeldingen)
const STATUS_KOLOM = 9;                            // kolom I = Status in "Bedrijven"
const LEADS_KEY = '';                              // laat leeg; zet je sleutel via Scripteigenschappen → LEADS_KEY

const BEDRIJF_KOLOMMEN = ['ID', 'Naam', 'Aanbetaling', 'Betaallink', 'Diensten', 'E-mail', 'Sheet-ID', 'Agenda-ID', 'Status', 'Gratis tot', 'Open van', 'Open tot', 'Gesloten', 'Beheer-code'];
const BOEK_KOLOMMEN = ['Tijdstip', 'Naam', 'Telefoon', 'Dienst', 'Prijs', 'Datum', 'Tijd', 'Voertuig', 'Opmerkingen', 'Aanbetaling', 'Betaalstatus', 'Duur', 'E-mail', 'Herinnering'];

// --- lezen (boekingspagina haalt hier 1 bedrijf op) ---
function doGet(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const callback = veiligeCallback(p.callback);
    // Leadlijsten (OpenStreetMap + je eigen lijst) alleen met de juiste sleutel.
    if (p.leads || p.outreach) {
      const toegang = leadsToegang(p.key);
      if (toegang !== 'ok') {
        const fout = { ok: false, error: (toegang === 'geen_sleutel' ? 'geen_sleutel' : 'geen_toegang') };
        const payloadFout = JSON.stringify(fout);
        if (callback) return ContentService.createTextOutput(callback + '(' + payloadFout + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
        return json(fout);
      }
      const arr = p.outreach ? OUTREACH_LEADS : getOsmLeads(30);
      const obj = { ok: true, leads: arr };
      const payloadLeads = JSON.stringify(obj);
      if (callback) return ContentService.createTextOutput(callback + '(' + payloadLeads + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
      return json(obj);
    }
    let data;
    if (p.beheer) {
      data = getBusiness(String(p.beheer || '').trim());
      if (data && data.gevonden && String(data.beheerCode) !== String(p.code || '')) {
        data = { gevonden: false, error: 'code' };
      } else if (data && data.gevonden) {
        delete data.row;
        data.bezet = getBookedSlots(data);
      }
    } else {
      const bid = String(p.bedrijf || '').trim();
      if (!bid) {
        data = { gevonden: false, error: 'geen_id' };
      } else {
        data = getBusiness(bid);
        if (data && data.gevonden) {
          data.bezet = getBookedSlots(data);
          delete data.email; delete data.sheetId; delete data.calendarId; delete data.row; delete data.gratisTot; delete data.beheerCode;
        }
      }
    }
    const payload = JSON.stringify(data || { gevonden: false });
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + payload + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    Logger.log('doGet fout: ' + msg);
    const out = JSON.stringify({ gevonden: false, error: msg });
    const cb = veiligeCallback(e && e.parameter ? e.parameter.callback : '');
    if (cb) return ContentService.createTextOutput(cb + '(' + out + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  }
}

// --- schrijven (lead / aanmelding / boeking) ---
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.type === 'lead') { addLead(d); return ok(); }
    if (d.type === 'onboard') { addBusiness(d); return ok(); }
    if (d.type === 'update') { updateBusiness(d); return ok(); }
    addBooking(d);
    return ok();
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function getBusiness(id) {
  const sh = sheet(SHEET_BEDRIJVEN, BEDRIJF_KOLOMMEN);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === id) {
      const rawStatus = String(rows[i][8] || '');
      const gt = rows[i][9];
      let gratisTotMs = NaN;
      if (gt instanceof Date) gratisTotMs = gt.getTime();
      else if (gt) { const dd = new Date(String(gt)); if (!isNaN(dd.getTime())) gratisTotMs = dd.getTime(); }
      // Proefperiode verlopen? → status wordt 'verlopen' (pagina gaat offline)
      let status = rawStatus;
      if (rawStatus.toLowerCase() === 'actief' && !isNaN(gratisTotMs) && gratisTotMs < Date.now()) status = 'verlopen';
      const b = {
        gevonden: true, row: i + 1,
        id: rows[i][0], naam: rows[i][1], aanbetaling: Number(rows[i][2]) || 0,
        betaalLink: rows[i][3] || '', diensten: safeJson(rows[i][4]),
        email: String(rows[i][5] || ''), sheetId: String(rows[i][6] || ''),
        calendarId: String(rows[i][7] || ''), status: status, gratisTot: (isNaN(gratisTotMs) ? '' : gt),
        openVan: String(rows[i][10] || '09:00'), openTot: String(rows[i][11] || '18:00'),
        gesloten: String(rows[i][12] || ''), beheerCode: String(rows[i][13] || '')
      };
      // Lazy-activatie: Status = 'actief' maar nog geen Sheet/Agenda? → nu aanmaken.
      if (b.status.toLowerCase() === 'actief' && (!b.sheetId || !b.calendarId)) {
        try { activateBusiness(sh, i + 1); } catch (e) {}
        const r2 = sh.getRange(i + 1, 1, 1, BEDRIJF_KOLOMMEN.length).getValues()[0];
        b.sheetId = String(r2[6] || ''); b.calendarId = String(r2[7] || '');
      }
      return b;
    }
  }
  return { gevonden: false };
}

function addBusiness(d) {
  const id = String(d.id || '').trim();
  const naam = String(d.naam || '').trim();
  if (!id || !naam) return;
  const sh = sheet(SHEET_BEDRIJVEN, BEDRIJF_KOLOMMEN);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) { if (String(rows[i][0]) === id) return; }
  const diensten = (Array.isArray(d.diensten) ? d.diensten : [])
    .filter(function (s) { return s && s.naam; })
    .map(function (s) { return { naam: String(s.naam).trim(), prijs: Number(s.prijs) || 0, duur: Number(s.duur) || 60 }; });
  const email = String(d.email || '').trim();
  // Aanmelding = 'wacht'. Sheet + Agenda worden pas NA betaling aangemaakt.
  sh.appendRow([id, naam, schoonBedrag(d.aanbetaling, diensten), String(d.betaalLink || '').trim(), JSON.stringify(diensten), email, '', '', 'wacht', '', String(d.openVan || '09:00').trim(), String(d.openTot || '18:00').trim(), String(d.gesloten || '').trim(), String(d.code || '').trim()]);
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: 'Nieuwe aanmelding: ' + naam,
      body: 'Nieuwe aanmelding op Glanzza.\n\nBedrijf: ' + naam + '\nLinknaam: ' + id + '\nE-mail: ' + email +
        '\n\nActie: laat betalen. Zet daarna in de tab "Bedrijven" de Status van deze rij op "actief" — het systeem maakt dan automatisch de Sheet + Agenda aan en mailt het bedrijf zijn link.'
    });
  } catch (e) {}
}

// Eigenaar past later zijn gegevens aan (via beheer-pagina, met code)
function updateBusiness(d) {
  const id = String(d.id || '').trim();
  const code = String(d.code || '').trim();
  if (!id || !code) return;
  const sh = sheet(SHEET_BEDRIJVEN, BEDRIJF_KOLOMMEN);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === id && String(rows[i][13]) === code) {
      const r = i + 1;
      const diensten = (Array.isArray(d.diensten) ? d.diensten : [])
        .filter(function (s) { return s && s.naam; })
        .map(function (s) { return { naam: String(s.naam).trim(), prijs: Number(s.prijs) || 0, duur: Number(s.duur) || 60 }; });
      sh.getRange(r, 2).setValue(String(d.naam || '').trim());
      sh.getRange(r, 3).setValue(schoonBedrag(d.aanbetaling, diensten));
      sh.getRange(r, 4).setValue(String(d.betaalLink || '').trim());
      sh.getRange(r, 5).setValue(JSON.stringify(diensten));
      sh.getRange(r, 6).setValue(String(d.email || '').trim());
      sh.getRange(r, 11).setValue(String(d.openVan || '09:00').trim());
      sh.getRange(r, 12).setValue(String(d.openTot || '18:00').trim());
      sh.getRange(r, 13).setValue(String(d.gesloten || '').trim());
      return;
    }
  }
}

// Activeert een bedrijf: maakt eigen Sheet + Agenda aan, deelt ze, mailt het bedrijf.
function activateBusiness(sh, row) {
  const id = String(sh.getRange(row, 1).getValue() || '');
  const naam = String(sh.getRange(row, 2).getValue() || '');
  const email = String(sh.getRange(row, 6).getValue() || '').trim();

  let sheetId = String(sh.getRange(row, 7).getValue() || '');
  if (!sheetId) {
    try {
      const ss = SpreadsheetApp.create('Glanzza boekingen — ' + naam);
      const tab = ss.getSheets()[0]; tab.setName(SHEET_BOEKINGEN); tab.appendRow(BOEK_KOLOMMEN);
      sheetId = ss.getId(); sh.getRange(row, 7).setValue(sheetId);
      if (email) { try { ss.addEditor(email); } catch (err) {} }
    } catch (err) {}
  }

  let calendarId = String(sh.getRange(row, 8).getValue() || '');
  if (!calendarId) {
    try {
      const cal = CalendarApp.createCalendar('Glanzza agenda — ' + naam);
      calendarId = cal.getId(); sh.getRange(row, 8).setValue(calendarId);
      if (email) { try { Calendar.Acl.insert({ role: 'writer', scope: { type: 'user', value: email } }, calendarId); } catch (err) {} }
    } catch (err) {}
  }

  if (String(sh.getRange(row, STATUS_KOLOM).getValue()).toLowerCase() !== 'actief') {
    sh.getRange(row, STATUS_KOLOM).setValue('actief');
  }

  if (email) {
    try {
      MailApp.sendEmail({
        to: email,
        subject: 'Je Glanzza-pagina is actief! 🎉',
        body: 'Hoi ' + naam + ',\n\nJe betaling is ontvangen — je boekingspagina staat nu live.\n\nJe boekingslink:\n' + SITE_URL + '/boeken.html?bedrijf=' + id +
          '\n\nJe ontvangt ook een eigen Google Sheet + Agenda (met je gedeeld).\n\nSucces!\nGlanzza'
      });
    } catch (err) {}
  }
}

// Aanbetaling opschonen: 0–500 en nooit hoger dan de goedkoopste dienst.
// (De beheer-/onboardingpagina controleert dit al; dit is de tweede slot op de deur.)
function schoonBedrag(v, diensten) {
  var n = Math.floor(Number(v) || 0);
  if (isNaN(n) || n < 0) n = 0;
  if (n > 500) n = 500;
  if (Array.isArray(diensten) && diensten.length) {
    const min = Math.min.apply(null, diensten.map(function (x) { return Number(x && x.prijs) || 0; }));
    if (n > min) n = min;
  }
  return n;
}

function addLead(d) {
  sheet(SHEET_LEADS, ['Tijdstip', 'Bedrijf', 'E-mail', 'Bericht'])
    .appendRow([new Date(), d.bedrijf || '', d.email || '', d.bericht || '']);
}

function addBooking(d) {
  if (!d.naam || !d.dienst || !d.datum || !d.tijd) return;         // verplichte velden
  const b = getBusiness(d.bedrijf);
  if (!b || !b.gevonden || b.status.toLowerCase() !== 'actief') return;  // alleen actieve bedrijven

  // Dubbele afspraak voorkomen (overlappende tijd op dezelfde dag)
  const duur = Number(d.duur) || 60;
  const slots = getBookedSlots(b);
  for (let i = 0; i < slots.length; i++) {
    if (slotsOverlap(d.datum, d.tijd, duur, slots[i].d, slots[i].t, slots[i].m)) return;
  }

  const row = [new Date(), d.naam || '', d.telefoon || '', d.dienst || '', d.prijs || '', d.datum || '', d.tijd || '', d.auto || '', d.opmerkingen || '', d.aanbetaling || '', 'openstaand', duur, String(d.email || '').trim(), ''];
  let written = false;
  if (b.sheetId) {
    try {
      const target = SpreadsheetApp.openById(b.sheetId);
      let t = target.getSheetByName(SHEET_BOEKINGEN);
      if (!t) { t = target.insertSheet(SHEET_BOEKINGEN); t.appendRow(BOEK_KOLOMMEN); }
      t.appendRow(row); written = true;
    } catch (e) { written = false; }
  }
  if (!written) {
    sheet(SHEET_BOEKINGEN, ['Tijdstip', 'Bedrijf', 'Naam', 'Telefoon', 'Dienst', 'Prijs', 'Datum', 'Tijd', 'Auto', 'Opmerkingen', 'Aanbetaling', 'Betaalstatus'])
      .appendRow([new Date(), d.bedrijf || '', d.naam || '', d.telefoon || '', d.dienst || '', d.prijs || '', d.datum || '', d.tijd || '', d.auto || '', d.opmerkingen || '', d.aanbetaling || '', 'openstaand']);
  }

  try { createCalendarEvent(d, b.calendarId); } catch (e) {}
  try { notifyBusiness(d); } catch (e) {}
}

function notifyBusiness(d) {
  const b = getBusiness(d.bedrijf);
  if (!b || !b.gevonden || !b.email) return;
  MailApp.sendEmail({
    to: b.email,
    subject: 'Nieuwe boeking: ' + d.dienst + ' (' + d.datum + ' ' + d.tijd + ')',
    body: 'Nieuwe boeking via Glanzza!\n\n' +
      'Dienst: ' + d.dienst + '\n' +
      'Datum: ' + d.datum + ' ' + d.tijd + '\n' +
      'Naam: ' + d.naam + '\n' +
      'Telefoon: ' + d.telefoon + '\n' +
      'Voertuig: ' + (d.auto || '-') + '\n' +
      'E-mail klant: ' + (d.email || '-') + '\n' +
      'Aanbetaling: €' + (d.aanbetaling || 0) + '\n\n' +
      'Alle boekingen vind je in je eigen Google Sheet.'
  });
}

function createCalendarEvent(d, calendarId) {
  if (!d.datum || !d.tijd) return;
  const start = new Date(d.datum + 'T' + d.tijd + ':00');
  if (isNaN(start.getTime())) return;
  const eind = new Date(start.getTime() + (Number(d.duur) || 60) * 60000);
  let cal = null;
  const cid = calendarId || CALENDAR_ID;
  if (cid) { try { cal = CalendarApp.getCalendarById(cid); } catch (e) { cal = null; } }
  if (!cal) cal = CalendarApp.getDefaultCalendar();
  cal.createEvent(d.naam + ' — ' + d.dienst, start, eind, {
    description: 'Telefoon: ' + (d.telefoon || '') + '\nVoertuig: ' + (d.auto || '') + '\nPrijs: €' + (d.prijs || '') + '\nAanbetaling: €' + (d.aanbetaling || '')
  });
}

function ss() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('Geen spreadsheet gevonden. Maak het script vanuit je Sheet (Extensies → Apps Script) of zet SPREADSHEET_ID in Code.gs.');
}

function sheet(name, headers) {
  const s = ss();
  let sh = s.getSheetByName(name);
  if (!sh) { sh = s.insertSheet(name); sh.appendRow(headers); return sh; }
  // Controleer rij 1
  const first = sh.getRange(1, 1, 1, headers.length).getValues()[0].map(function (v) { return String(v || '').trim(); });
  if (first[0] === headers[0]) {
    // rij 1 is de kopregel → vul ontbrekende koppen aan (voor oudere sheets)
    let changed = false;
    for (let i = 0; i < headers.length; i++) { if (!first[i]) { first[i] = headers[i]; changed = true; } }
    if (changed) sh.getRange(1, 1, 1, headers.length).setValues([first]);
  } else if (sh.getLastRow() === 0) {
    // lege sheet → zet de kopregel
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    // rij 1 bevat DATA (geen kop) → voeg een kopregel bovenaan in
    sh.insertRowBefore(1);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

function safeJson(v) {
  try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch (e) { return []; }
}

// --- bezette tijden + overlap ---
function getBookedSlots(b) {
  const out = [];
  if (!b || !b.sheetId) return out;
  try {
    const t = SpreadsheetApp.openById(b.sheetId).getSheetByName(SHEET_BOEKINGEN);
    if (!t) return out;
    const rows = t.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const dd = fmtD(rows[i][5]), tt = fmtT(rows[i][6]);
      if (dd && tt) out.push({ d: dd, t: tt, m: Number(rows[i][11]) || 60 });
    }
  } catch (e) {}
  return out;
}
function fmtD(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const s = String(v || '').trim(); return s ? s.slice(0, 10) : '';
}
function fmtT(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm');
  const s = String(v || '').trim(); return s ? s.slice(0, 5) : '';
}
function toMin(t) { const p = String(t).split(':'); return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0); }
function slotsOverlap(d1, t1, m1, d2, t2, m2) {
  if (d1 !== d2) return false;
  const s1 = toMin(t1), s2 = toMin(t2);
  return s1 < s2 + m2 && s2 < s1 + m1;
}
// ================== NIEUWE LEADS VINDEN (OpenStreetMap, gratis) ==================
var OSM_NICHES = [
  { k: 'shop', v: 'hairdresser', label: 'kapsalon' },
  { k: 'shop', v: 'beauty', label: 'schoonheidssalon' },
  { k: 'shop', v: 'car_repair', label: 'autobedrijf' },
  { k: 'amenity', v: 'car_wash', label: 'carwash' },
  { k: 'shop', v: 'pet_grooming', label: 'trimsalon' },
  { k: 'shop', v: 'tattoo', label: 'tattooshop' },
  { k: 'shop', v: 'massage', label: 'massage' },
  { k: 'leisure', v: 'fitness_centre', label: 'fitness' },
  { k: 'shop', v: 'hairdresser_supply', label: 'kapsalon' },
  { k: 'amenity', v: 'driving_school', label: 'rijschool' }
];
var OSM_CITIES = ['Roermond', 'Venlo', 'Weert', 'Sittard', 'Geleen', 'Heerlen', 'Maastricht', 'Venray', 'Echt', 'Kerkrade'];
const OSM_KOLOMMEN = ['Naam', 'Niche', 'Stad', 'Telefoon', 'E-mail', 'Website', 'Adres', 'Gevonden'];

// ================== EIGEN LEADLIJST ==================
// Deze 16 bedrijven zaten eerder als platte tekst in de outreach-pagina en waren dus
// voor iedereen leesbaar. Ze komen nu alleen vrij met de juiste sleutel.
const OUTREACH_LEADS = [
      { n: "Trimsalon Nono", s: "Trimsalon", c: "(NL)", e: "info@trimsalonnono.nl", o: "even over jullie no-show-beleid", b: "Hoi,\n\nIk zag dat jullie een no-show-beleid hebben — dus jullie weten hoe vervelend het is als iemand gewoon niet komt.\n\nIk ben een boekingssysteem aan het maken speciaal voor trimsalons, waarbij klanten vooraf een kleine aanbetaling doen. Mag ik je 5 minuutjes vragen hoe jullie dat nu aanpakken?\n\nGroet,\nEliyah" },
      { n: "Hondentrimsalon Murphy", s: "Trimsalon", c: "Geleen", e: "info@hondentrimsalonmurphy.nl", o: "hoe plannen jullie de afspraken?", b: "Hoi,\n\nEven een vraagje: hoe komen afspraken bij jullie nu binnen — WhatsApp, telefoon of online?\n\nIk ben namelijk een simpel boekingssysteem aan het maken voor trimsalons (met aanbetaling vooraf). Zou je 5 minuten hebben om me te vertellen hoe jullie dat nu doen?\n\nGroet,\nEliyah" },
      { n: "Jixer's Trimsalon", s: "Trimsalon", c: "Geleen", e: "info@jixers.nl", o: "kost een no-show jou veel?", b: "Hoi,\n\nMag ik je iets vragen? Wat kost een no-show jou aan het eind van de maand?\n\nIk maak een boekingssysteem met aanbetaling voor trimsalons en zoek echte ervaringen van ondernemers. 5 minuutjes sparren?\n\nGroet,\nEliyah" },
      { n: "Hondentrimsalon Spaubeek", s: "Trimsalon", c: "Spaubeek", e: "info@hondentrimsalonspaubeek.nl", o: "vraagje over no-shows", b: "Hoi,\n\nHoe gaan jullie eigenlijk om met klanten die niet komen opdagen? Dat blijkt bij veel trimsalons een groot probleem.\n\nIk ben een eenvoudig boekingssysteem aan het bouwen (klant betaalt een aanbetaling bij het boeken). Vertel je me in 5 minuten hoe jullie dat nu doen?\n\nGroet,\nEliyah" },
      { n: "Trimsalon Het Hondje", s: "Trimsalon", c: "Landgraaf", e: "info@trimsalonhethondje.nl", o: "hoe regelen jullie afspraken?", b: "Hoi,\n\nIk zag Trimsalon Het Hondje in Landgraaf. Hoe snel zijn jullie volgeboekt, en hoe vaak komt er iemand niet?\n\nIk maak een boekingssysteem met aanbetaling voor trimsalons. Mag ik jullie daar 5 minuten over vragen stellen?\n\nGroet,\nEliyah" },
      { n: "Trimsalon Hond & Hip", s: "Trimsalon", c: "Zuid-Limburg", e: "info@hondenhip.nl", o: "online boeken voor jullie salon?", b: "Hoi,\n\nKunnen klanten bij jullie online boeken of gaat dat via WhatsApp?\n\nIk maak een simpele boekingspagina met aanbetaling voor trimsalons. Zou je 5 minuutjes hebben om me te vertellen wat jullie het liefst zouden willen?\n\nGroet,\nEliyah" },
      { n: "Happy Dog Trimsalon", s: "Trimsalon", c: "Venlo", e: "info@happydogvenlo.nl", o: "no-shows bij Happy Dog", b: "Hoi,\n\nEen trimsalon-afspraak kost je zo een half uur extra werk — een no-show is dan extra zuur.\n\nIk ben een boekingssysteem met aanbetaling aan het maken voor trimsalons. Mag ik je 5 minuten vragen hoe jullie dit nu opvangen?\n\nGroet,\nEliyah" },
      { n: "Trimsalon Make It Easy", s: "Trimsalon", c: "(NL)", e: "coatcare@outlook.com", o: "vraagje over jullie afspraken", b: "Hoi,\n\nIk las dat jullie afspraken via WhatsApp en e-mail regelen. Werkt dat voor jullie, of kost het veel tijd?\n\nIk bouw een simpele boekingspagina met aanbetaling voor trimsalons. 5 minuten sparren zou me enorm helpen.\n\nGroet,\nEliyah" },
      { n: "Brilliant Detailing", s: "Detailing", c: "Venlo", e: "info@brilliantdetailing.eu", o: "vraag over jullie afspraken", b: "Hoi,\n\nJullie doen van die mooie, lange behandelingen. Als er dan iemand niet komt opdagen, is dat een flinke hap uit je dag.\n\nIk ben een eenvoudige boekingspagina aan het maken met een aanbetaling vooraf. Mag ik jullie 5 minuten vragen hoe jullie dat nu oplossen?\n\nGroet,\nEliyah" },
      { n: "Hair & Looks (Roermond)", s: "Kapsalon", c: "Roermond", e: "roermond-centrum@hairandlooks.nl", o: "hoe vangen jullie no-shows op?", b: "Hoi,\n\nIk zag Hair & Looks in Roermond. Hoe vangen jullie het op als een klant niet komt?\n\nIk maak een Nederlandstalige boekingspagina met aanbetaling voor kappers en salons. Zou je me 5 minuten vertellen hoe jullie dat nu doen?\n\nGroet,\nEliyah" },
      { n: "Kop Sittard", s: "Kapsalon", c: "Sittard", e: "info@kopsittard.nl", o: "even een vraagje", b: "Hoi,\n\nMag ik je iets vragen over de planning bij Kop in Sittard? Hoe vaak komt het voor dat een klant niet komt opdagen, en vraagt een aanbetaling dan iets af?\n\nIk ben een simpel boekingssysteem met aanbetaling aan het maken. 5 minuten?\n\nGroet,\nEliyah" },
      { n: "Schoonheidsinstituut Pour Vous", s: "Schoonheidssalon", c: "Roermond", e: "mail@pourvousschoonheidsinstituut.nl", o: "vraagje over no-shows", b: "Hoi,\n\nBehandelingen bij jullie duren vaak een uur — een no-show kost dan echt geld.\n\nIk maak een boekingspagina met aanbetaling voor lokale salons. Mag ik je 5 minuten om je ervaring vragen?\n\nGroet,\nEliyah" },
      { n: "Carwash Number 1", s: "Carwash", c: "Roermond", e: "info@carwashnumber1.nl", o: "hoe plannen klanten bij jullie?", b: "Hoi,\n\nKorte vraag: komen klanten bij Carwash Number 1 op afspraak of gewoon langs?\n\nIk maak een boekingspagina met aanbetaling voor autobedrijven. Zou je 5 minuten hebben om me te vertellen hoe jullie het nu doen?\n\nGroet,\nEliyah" },
      { n: "Carwash Roermond", s: "Carwash", c: "Roermond", e: "info@carwash-roermond.nl", o: "vraagje over afspraken", b: "Hoi,\n\nEven nieuwsgierig: hoe komen afspraken bij jullie binnen, en heb je weleens last van klanten die niet komen opdagen?\n\nIk maak een Nederlandstalige boekingspagina met aanbetaling. 5 minuten sparren?\n\nGroet,\nEliyah" },
      { n: "Claro Carwash", s: "Carwash", c: "Roermond", e: "info@claro-carwash.com", o: "kunnen jullie hier iets mee?", b: "Hoi,\n\nHoeveel klanten komen er bij jullie per maand niet opdagen? En vraagt een aanbetaling dan iets af?\n\nIk ben zoiets aan het maken: online boeken + iDEAL-aanbetaling in één. Zou je 5 minuten hebben om me feedback te geven?\n\nGroet,\nEliyah" },
      { n: "WasArena (bij Wealer)", s: "Carwash/poets", c: "Venlo", e: "info@dewasarena.nl", o: "poets-afspraken plannen", b: "Hoi,\n\nHoe plannen jullie poets-afspraken nu — telefoon, WhatsApp of via de site?\n\nIk maak een simpele boekingspagina met aanbetaling voor lokale bedrijven. Mag ik jullie 5 minuten om feedback vragen?\n\nGroet,\nEliyah" }
    ];

// Draait dagelijks (via trigger): zoekt nieuwe bedrijven, zet ze in de sheet, mailt jou.
// Kant-en-klare mail per niche
function mailVoorLead(label, naam, stad) {
  const N = {
    'kapsalon': { o: 'vraagje over jullie planning', b: 'Hoi,\n\nIk zag [NAAM] in [STAD]. Mag ik je iets vragen: hoe komen afspraken bij jullie nu binnen, en vraagt een aanbetaling dan iets af?\n\nIk maak een Nederlandstalige boekingspagina met aanbetaling voor kappers. 5 minuutjes sparren?\n\nGroet,\nEliyah' },
    'trimsalon': { o: 'vraagje over jullie afspraken', b: 'Hoi,\n\nIk zag [NAAM] in [STAD]. Hoe komen afspraken bij jullie nu binnen — WhatsApp, telefoon of online? En heb je weleens last van klanten die niet komen opdagen?\n\nIk ben een boekingssysteem met aanbetaling aan het maken voor trimsalons. 5 minuten?\n\nGroet,\nEliyah' },
    'schoonheidssalon': { o: 'even een vraagje', b: 'Hoi,\n\nIk zag [NAAM] in [STAD]. Hoe vangen jullie het op als een klant niet komt opdagen?\n\nIk maak een boekingspagina met aanbetaling voor lokale salons. Mag ik je 5 minuten om je ervaring vragen?\n\nGroet,\nEliyah' },
    'autobedrijf': { o: 'vraagje over afspraken', b: 'Hoi,\n\nIk zag [NAAM] in [STAD]. Hoe plannen klanten bij jullie een afspraak, en kosten no-shows weleens een dagdeel?\n\nIk maak een simpele boekingspagina met aanbetaling voor autobedrijven. 5 minuten feedback?\n\nGroet,\nEliyah' },
    'carwash': { o: 'hoe plannen klanten bij jullie?', b: 'Hoi,\n\nKorte vraag: komen klanten bij [NAAM] in [STAD] op afspraak of gewoon langs?\n\nIk maak een boekingspagina met iDEAL-aanbetaling voor autobedrijven. Zou je 5 minuten hebben om me te vertellen hoe jullie het nu doen?\n\nGroet,\nEliyah' },
    'tattooshop': { o: 'vraagje over jullie afspraken', b: 'Hoi,\n\nIk zag [NAAM] in [STAD]. Een tattoo-afspraak is vaak lang — een no-show kost dan echt geld.\n\nIk maak een boekingspagina met aanbetaling. Mag ik je 5 minuten vragen hoe jullie dat nu oplossen?\n\nGroet,\nEliyah' },
    'massage': { o: 'even een vraagje', b: 'Hoi,\n\nIk zag [NAAM] in [STAD]. Hoe gaan jullie om met klanten die niet komen opdagen?\n\nIk maak een simpele boekingspagina met aanbetaling. 5 minuten sparren?\n\nGroet,\nEliyah' },
    'fitness': { o: 'vraagje over jullie planning', b: 'Hoi,\n\nIk zag [NAAM] in [STAD]. Hoe plannen jullie afspraken en proeflessen nu?\n\nIk maak een boekingspagina met aanbetaling. Mag ik je 5 minuten om feedback vragen?\n\nGroet,\nEliyah' },
    'rijschool': { o: 'vraagje over jullie planning', b: 'Hoi,\n\nIk zag [NAAM] in [STAD]. Hoe plannen jullie rijlessen nu — telefoon of online?\n\nIk maak een simpele boekingspagina met aanbetaling. 5 minuten sparren?\n\nGroet,\nEliyah' },
    'algemeen': { o: 'vraagje over jullie afspraken', b: 'Hoi,\n\nIk zag [NAAM] in [STAD]. Mag ik je een korte vraag stellen: hoe komen afspraken bij jullie nu binnen, en kosten no-shows weleens geld?\n\nIk maak een boekingspagina met aanbetaling voor lokale bedrijven. 5 minuten feedback?\n\nGroet,\nEliyah' }
  };
  const t = N[String(label || '').toLowerCase()] || N['algemeen'];
  return { o: t.o, b: t.b.replace(/\[NAAM\]/g, naam).replace(/\[STAD\]/g, stad || '') };
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function dailyLeads() {
  try {
    const sh = sheet('Leads-OSM', OSM_KOLOMMEN);
    const existing = {};
    sh.getDataRange().getValues().forEach(function (r, i) { if (i > 0) existing[String(r[0]) + '|' + String(r[2])] = 1; });
    const niche = OSM_NICHES[Math.floor(Math.random() * OSM_NICHES.length)];
    const stad = OSM_CITIES[Math.floor(Math.random() * OSM_CITIES.length)];
    const q = '[out:json][timeout:25];area["name"="' + stad + '"]->.a;nwr["' + niche.k + '"="' + niche.v + '"](area.a);out tags center 40;';
    const res = UrlFetchApp.fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q), { muteHttpExceptions: true, headers: { 'User-Agent': 'glanzza-leads' } });
    const j = JSON.parse(res.getContentText());
    const nieuw = [];
    (j.elements || []).forEach(function (e) {
      const t = e.tags || {}; const naam = t.name; if (!naam) return;
      const key = naam + '|' + stad; if (existing[key]) return; existing[key] = 1;
      let email = t['contact:email'] || t.email || '';
      const tel = t.phone || t['contact:phone'] || '';
      const web = t.website || t['contact:website'] || '';
      // Probeer het e-mailadres uit de website te halen (als die bekend is)
      if (!email && web) { try { const html = UrlFetchApp.fetch(web, { muteHttpExceptions: true, followRedirects: true }).getContentText(); const mm = html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/); if (mm) email = mm[0]; } catch (e) {} }
      const adres = [t['addr:street'], t['addr:housenumber'], t['addr:postcode'], t['addr:city']].filter(Boolean).join(' ');
      sh.appendRow([naam, niche.label, stad, tel, email, web, adres, new Date()]);
      nieuw.push({ naam: naam, label: niche.label, stad: stad, tel: tel, email: email, web: web });
    });
    if (nieuw.length) {
      const helper = SITE_URL + '/o-k7m2x9q.html';
      const SUBJ = 'sub' + 'ject';
      const AMP = String.fromCharCode(38);
      const kaarten = nieuw.map(function (x, i) {
        const m = mailVoorLead(x.label, x.naam, x.stad);
        const mto = x.email ? ('mailto:' + x.email + '?' + SUBJ + '=' + encodeURIComponent(m.o) + AMP + 'bo' + 'dy=' + encodeURIComponent(m.b)) : '';
        return '<div style="border:1px solid #dcdcdc;border-radius:12px;padding:14px 16px;margin:10px 0">'
          + '<div style="font-weight:700;font-size:16px">' + (i + 1) + '. ' + esc(x.naam) + '</div>'
          + '<div style="color:#666;font-size:13px;margin:2px 0 8px">' + esc(x.label) + ' · ' + esc(x.stad) + (x.tel ? ' · ' + esc(x.tel) : '') + (x.email ? ' · ' + esc(x.email) : '') + (x.web ? ' · ' + esc(x.web) : '') + '</div>'
          + '<div style="background:#f5f5f5;border-radius:8px;padding:10px 12px;font-size:13px;white-space:pre-wrap;color:#222">' + esc('Onderwerp: ' + m.o + '\n\n' + m.b) + '</div>'
          + (mto ? '<a href="' + mto + '" style="display:inline-block;margin-top:10px;background:#111;color:#c9f24d;text-decoration:none;padding:9px 14px;border-radius:8px;font-size:13px;font-weight:700">Stuur deze mail →</a>' : '<div style="margin-top:10px;color:#a05a00;font-size:13px">Geen e-mail gevonden — zoek contact via de helper.</div>')
          + '</div>';
      }).join('');
      const html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;color:#222">'
        + '<h2 style="margin:0 0 4px">🎯 ' + nieuw.length + ' nieuwe koude leads</h2>'
        + '<p style="color:#666;margin:0 0 6px">' + esc(niche.label) + ' in ' + esc(stad) + '. Per bedrijf staat hieronder al een kant-en-klare mail — klik op "Stuur deze mail" of kopieer de tekst.</p>'
        + kaarten
        + '<p style="color:#666;font-size:13px">Open de <a href="' + helper + '" style="color:#111">outreach-helper</a> voor de hele lijst en 1-klik verzenden.<br>Je site staat live op <a href="' + SITE_URL + '" style="color:#111">' + SITE_URL + '</a>.</p>'
        + '</div>';
      MailApp.sendEmail({ to: ADMIN_EMAIL, subject: '🎯 ' + nieuw.length + ' nieuwe koude leads: ' + niche.label + ' in ' + stad, htmlBody: html });
    }
  } catch (e) { Logger.log('dailyLeads-fout: ' + (e && e.message ? e.message : e)); }
}

// ================== HERINNERINGEN NAAR KLANTEN (24 uur voor de afspraak) ==================
// Stuurt één e-mail per boeking naar het adres dat de klant zelf invulde.
// Draait dagelijks via de trigger hieronder; kolom 'Herinnering' voorkomt dubbele mails.
function sendReminders() {
  var verstuurd = 0;
  try {
    const sh = sheet(SHEET_BEDRIJVEN, BEDRIJF_KOLOMMEN);
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const status = String(rows[i][8] || '').toLowerCase();
      const sheetId = String(rows[i][6] || '');
      if (status !== 'actief' || !sheetId) continue;
      const bedrijf = { naam: String(rows[i][1] || ''), email: String(rows[i][5] || '') };
      try { verstuurd += herinnerBedrijf(sheetId, bedrijf); } catch (e) {}
    }
    Logger.log('Herinneringen verstuurd: ' + verstuurd);
  } catch (e) {
    Logger.log('sendReminders-fout: ' + (e && e.message ? e.message : e));
  }
  return verstuurd;
}

function herinnerBedrijf(sheetId, bedrijf) {
  const t = SpreadsheetApp.openById(sheetId).getSheetByName(SHEET_BOEKINGEN);
  if (!t || t.getLastRow() < 2) return 0;
  // Oudere sheets missen de laatste twee kolommen → aanvullen (rij 1 blijft de kopregel)
  const breed = Math.max(t.getLastColumn(), BOEK_KOLOMMEN.length);
  const kop = t.getRange(1, 1, 1, breed).getValues()[0];
  if (String(kop[12] || '') !== 'E-mail' || String(kop[13] || '') !== 'Herinnering') {
    t.getRange(1, 13, 1, 2).setValues([['E-mail', 'Herinnering']]);
  }
  const rows = t.getDataRange().getValues();
  const morgen = dagCode(new Date(Date.now() + 24 * 60 * 60 * 1000));
  let n = 0;
  for (let i = 1; i < rows.length; i++) {
    const datum = fmtD(rows[i][5]);
    const email = String(rows[i][12] || '').trim();
    const alGestuurd = String(rows[i][13] || '').toLowerCase() === 'ja';
    if (!datum || datum !== morgen || !email || alGestuurd) continue;
    if (!/.+@.+\..+/.test(email)) continue;
    const r = {
      naam: String(rows[i][1] || ''), dienst: String(rows[i][3] || ''),
      datum: datum, tijd: fmtT(rows[i][6]),
      aanbetaling: rows[i][9], betaalstatus: String(rows[i][10] || '')
    };
    try {
      MailApp.sendEmail({
        to: email,
        subject: 'Herinnering: je afspraak morgen bij ' + (bedrijf.naam || 'ons'),
        body: herinnerTekst(bedrijf, r)
      });
      t.getRange(i + 1, 14).setValue('ja');
      n++;
    } catch (e) {}
  }
  return n;
}

function dagCode(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

function herinnerTekst(bedrijf, r) {
  var s = 'Hoi ' + (r.naam || '') + ',\n\n';
  s += 'Even een herinnering: morgen om ' + (r.tijd || '') + ' uur heb je een afspraak bij ' + (bedrijf.naam || 'ons') + '.\n\n';
  s += 'Dienst: ' + (r.dienst || '') + '\n';
  s += 'Datum: ' + (r.datum || '') + ' om ' + (r.tijd || '') + '\n';
  if (r.aanbetaling && Number(r.aanbetaling) > 0) {
    s += 'Aanbetaling: €' + r.aanbetaling + (String(r.betaalstatus).toLowerCase() === 'betaald' ? ' (ontvangen)' : ' (nog te voldoen)') + '\n';
  }
  s += '\nKun je toch niet komen? Laat het zo snel mogelijk weten, dan kan iemand anders jouw plek innemen.\n';
  s += '\nTot morgen!\n' + (bedrijf.naam || '');
  return s;
}

function setupRemindersTrigger() {
  try {
    ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sendReminders') ScriptApp.deleteTrigger(t); });
    ScriptApp.newTrigger('sendReminders').timeBased().everyDays(1).atHour(9).create();
    Logger.log('OK: herinneringen-trigger staat (elke dag 09:00).');
  } catch (e) {
    Logger.log('FOUT bij trigger maken: ' + (e && e.message ? e.message : e));
    throw e;
  }
  try { var n = sendReminders(); Logger.log('OK: sendReminders uitgevoerd - ' + n + ' herinnering(en) verzonden.'); }
  catch (e) { Logger.log('FOUT bij sendReminders: ' + (e && e.message ? e.message : e)); }
}

// Eenmalig uitvoeren om de dagelijkse triggers aan te zetten (daarna draait het vanzelf)
function setupDailyTrigger() {
  try {
    ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'dailyLeads') ScriptApp.deleteTrigger(t); });
    ScriptApp.newTrigger('dailyLeads').timeBased().everyDays(1).atHour(8).create();
    Logger.log('OK: dagelijkse trigger staat (elke dag 08:00).');
  } catch (e) {
    Logger.log('FOUT bij trigger maken: ' + (e && e.message ? e.message : e));
    throw e;
  }
  try { dailyLeads(); Logger.log('OK: dailyLeads uitgevoerd - check je mail.'); }
  catch (e) { Logger.log('FOUT bij dailyLeads: ' + (e && e.message ? e.message : e)); }
  try { setupRemindersTrigger(); }
  catch (e) { Logger.log('FOUT bij herinneringen-trigger: ' + (e && e.message ? e.message : e)); }
}

// --- toegang tot de leadlijsten ---
// De sleutel hoort in Scripteigenschappen te staan (LEADS_KEY), niet in de code:
// zo staat hij niet in dit bestand en niet in een publiek leesbare pagina.
function leadsSleutel() {
  var k = '';
  try { k = String(PropertiesService.getScriptProperties().getProperty('LEADS_KEY') || ''); } catch (e) {}
  return k || LEADS_KEY;
}
// Geeft 'ok', 'fout' of 'geen_sleutel'.
function leadsToegang(k) {
  const want = leadsSleutel();
  if (!want) return 'geen_sleutel';
  return String(k || '') === want ? 'ok' : 'fout';
}
// Alleen een geldige JS-naam als JSONP-callback accepteren (voorkomt scriptinjectie).
function veiligeCallback(cb) {
  cb = String(cb || '');
  return /^[A-Za-z_$][A-Za-z0-9_$.]{0,60}$/.test(cb) ? cb : '';
}

function getOsmLeads(n) {
  n = n || 30; const out = [];
  try {
    const sh = sheet('Leads-OSM', OSM_KOLOMMEN);
    const rows = sh.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1 && out.length < n; i--) {
      out.push({ naam: rows[i][0], niche: rows[i][1], stad: rows[i][2], tel: rows[i][3], email: rows[i][4], web: rows[i][5], adres: rows[i][6] });
    }
  } catch (e) {}
  return out;
}

function ok() { return json({ ok: true }); }
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
