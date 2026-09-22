// ============================================================
//  Glanzza — centrale backend (Google Apps Script)
//  Eén centrale Google Sheet + dit script bedienen ALLE bedrijven.
//  Gegevens zijn AFGESCHERMD: de boekingspagina krijgt alleen het
//  bedrijf dat in de link staat (?bedrijf=<id>).
//
//  SETUP (eenmalig):
//  1. Maak een Google Sheet aan.
//  2. Extensies → Apps Script → plak deze code → Sla op.
//  3. Implementeren → Nieuwe implementatie → Web-app:
//       Uitvoeren als: "Ik"  |  Toegang: "Iedereen"
//  4. Kopieer de Web-app-URL. Dit is jouw CENTRALE URL.
//     Die vul je in boeken.html, onboarding.html en main.js in.
// ============================================================

const SHEET_BEDRIJVEN = 'Bedrijven';
const SHEET_BOEKINGEN = 'Boekingen';
const SHEET_LEADS = 'Leads';
const CALENDAR_ID = '';      // optioneel: vaste agenda-ID, anders je standaardagenda
const SPREADSHEET_ID = '';   // alleen nodig als het script NIET vanuit de Sheet is gemaakt (zie uitleg)

// Kolommen van de boekingen-sheet (zowel centraal als per bedrijf)
const BOEK_KOLOMMEN = ['Tijdstip', 'Naam', 'Telefoon', 'Dienst', 'Prijs', 'Datum', 'Tijd', 'Voertuig', 'Opmerkingen', 'Aanbetaling', 'Betaalstatus'];

// --- lezen (boekingspagina haalt hier 1 bedrijf op) ---
function doGet(e) {
  const id = e.parameter.bedrijf || '';
  const callback = e.parameter.callback || '';
  const data = getBusiness(id);
  if (data && data.gevonden) { delete data.email; }   // PRIVÉ: e-mail nooit naar de publieke pagina sturen
  const json = JSON.stringify(data);
  if (callback) {
    // JSONP: werkt zonder CORS-gedoe
    return ContentService.createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// --- schrijven (lead / aanmelding / boeking) ---
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.type === 'lead') { addLead(d); return ok(); }
    if (d.type === 'onboard') { addBusiness(d); return ok(); }
    addBooking(d);
    return ok();
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function getBusiness(id) {
  const rows = sheet(SHEET_BEDRIJVEN, ['ID', 'Naam', 'Aanbetaling', 'Betaallink', 'Diensten', 'E-mail', 'Sheet-ID']).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === id) {
      return {
        gevonden: true,
        id: rows[i][0],
        naam: rows[i][1],
        aanbetaling: Number(rows[i][2]) || 0,
        betaalLink: rows[i][3] || '',
        diensten: safeJson(rows[i][4]),
        email: String(rows[i][5] || ''),
        sheetId: String(rows[i][6] || '')
      };
    }
  }
  return { gevonden: false };
}

function addBusiness(d) {
  const id = String(d.id || '').trim();
  const naam = String(d.naam || '').trim();
  if (!id || !naam) return;
  const sh = sheet(SHEET_BEDRIJVEN, ['ID', 'Naam', 'Aanbetaling', 'Betaallink', 'Diensten', 'E-mail', 'Sheet-ID']);
  // Voorkom overschrijven: als dit id al bestaat, niets doen.
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === id) return;
  }
  const diensten = (Array.isArray(d.diensten) ? d.diensten : [])
    .filter(function (s) { return s && s.naam; })
    .map(function (s) { return { naam: String(s.naam).trim(), prijs: Number(s.prijs) || 0, duur: Number(s.duur) || 60 }; });

  // Eigen, afgeschermde Google Sheet per bedrijf
  let sheetId = '';
  try {
    const ss = SpreadsheetApp.create('Glanzza boekingen — ' + naam);
    const tab = ss.getSheets()[0];
    tab.setName(SHEET_BOEKINGEN);
    tab.appendRow(BOEK_KOLOMMEN);
    sheetId = ss.getId();
    if (d.email) { try { ss.addEditor(String(d.email).trim()); } catch (e) {} }
  } catch (e) { sheetId = ''; }

  sh.appendRow([id, naam, Number(d.aanbetaling) || 0, String(d.betaalLink || '').trim(), JSON.stringify(diensten), String(d.email || '').trim(), sheetId]);
}

function addLead(d) {
  sheet(SHEET_LEADS, ['Tijdstip', 'Bedrijf', 'E-mail', 'Bericht'])
    .appendRow([new Date(), d.bedrijf || '', d.email || '', d.bericht || '']);
}

function addBooking(d) {
  if (!d.naam || !d.dienst || !d.datum || !d.tijd) return;   // verplichte velden
  const row = [new Date(), d.naam || '', d.telefoon || '', d.dienst || '', d.prijs || '', d.datum || '', d.tijd || '', d.auto || '', d.opmerkingen || '', d.aanbetaling || '', 'openstaand'];
  const b = getBusiness(d.bedrijf);
  let written = false;
  // Bij voorkeur naar de EIGEN sheet van dit bedrijf
  if (b && b.gevonden && b.sheetId) {
    try {
      const target = SpreadsheetApp.openById(b.sheetId);
      let t = target.getSheetByName(SHEET_BOEKINGEN);
      if (!t) { t = target.insertSheet(SHEET_BOEKINGEN); t.appendRow(BOEK_KOLOMMEN); }
      t.appendRow(row);
      written = true;
    } catch (e) { written = false; }
  }
  if (!written) {
    // terugval: centrale sheet (met Bedrijf-kolom)
    sheet(SHEET_BOEKINGEN, ['Tijdstip', 'Bedrijf', 'Naam', 'Telefoon', 'Dienst', 'Prijs', 'Datum', 'Tijd', 'Auto', 'Opmerkingen', 'Aanbetaling', 'Betaalstatus'])
      .appendRow([new Date(), d.bedrijf || '', d.naam || '', d.telefoon || '', d.dienst || '', d.prijs || '', d.datum || '', d.tijd || '', d.auto || '', d.opmerkingen || '', d.aanbetaling || '', 'openstaand']);
  }
  try { createCalendarEvent(d); } catch (e) { /* agenda mag boeking niet blokkeren */ }
  try { notifyBusiness(d); } catch (e) { /* mail mag boeking niet blokkeren */ }
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
      'Aanbetaling: €' + (d.aanbetaling || 0) + '\n\n' +
      'Alle boekingen vind je in je Google Sheet.'
  });
}

function createCalendarEvent(d) {
  if (!d.datum || !d.tijd) return;
  const start = new Date(d.datum + 'T' + d.tijd + ':00');
  if (isNaN(start.getTime())) return;
  const eind = new Date(start.getTime() + (Number(d.duur) || 60) * 60000);
  const cal = CALENDAR_ID ? CalendarApp.getCalendarById(CALENDAR_ID) : CalendarApp.getDefaultCalendar();
  cal.createEvent(d.naam + ' — ' + d.dienst, start, eind, {
    description: 'Telefoon: ' + (d.telefoon || '') + '\nAuto: ' + (d.auto || '') + '\nPrijs: €' + (d.prijs || '') + '\nAanbetaling: €' + (d.aanbetaling || '')
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
  if (!sh) { sh = s.insertSheet(name); sh.appendRow(headers); }
  return sh;
}

function safeJson(v) {
  try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch (e) { return []; }
}
function ok() { return json({ ok: true }); }
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
