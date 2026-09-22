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
// ============================================================

const SHEET_BEDRIJVEN = 'Bedrijven';
const SHEET_BOEKINGEN = 'Boekingen';
const SHEET_LEADS = 'Leads';
const CALENDAR_ID = '';                            // optioneel: vaste agenda-ID
const SPREADSHEET_ID = '';                         // alleen nodig als het script niet aan de Sheet hangt
const SITE_URL = 'https://glanzza.vercel.app';     // jouw site (voor links in e-mails)
const STATUS_KOLOM = 9;                            // kolom I = Status in "Bedrijven"

const BEDRIJF_KOLOMMEN = ['ID', 'Naam', 'Aanbetaling', 'Betaallink', 'Diensten', 'E-mail', 'Sheet-ID', 'Agenda-ID', 'Status', 'Gratis tot', 'Open van', 'Open tot', 'Gesloten', 'Beheer-code'];
const BOEK_KOLOMMEN = ['Tijdstip', 'Naam', 'Telefoon', 'Dienst', 'Prijs', 'Datum', 'Tijd', 'Voertuig', 'Opmerkingen', 'Aanbetaling', 'Betaalstatus', 'Duur'];

// --- lezen (boekingspagina haalt hier 1 bedrijf op) ---
function doGet(e) {
  const callback = e.parameter.callback || '';
  let data;
  if (e.parameter.beheer) {
    data = getBusiness(e.parameter.beheer);
    if (data && data.gevonden && String(data.beheerCode) !== String(e.parameter.code || '')) {
      data = { gevonden: false, error: 'code' };
    } else if (data && data.gevonden) {
      delete data.row;
      data.bezet = getBookedSlots(data);
    }
  } else {
    data = getBusiness(e.parameter.bedrijf || '');
    if (data && data.gevonden) {
      data.bezet = getBookedSlots(data);
      delete data.email; delete data.sheetId; delete data.calendarId; delete data.row; delete data.gratisTot; delete data.beheerCode;
    }
  }
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
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
  sh.appendRow([id, naam, Number(d.aanbetaling) || 0, String(d.betaalLink || '').trim(), JSON.stringify(diensten), email, '', '', 'wacht', '', String(d.openVan || '09:00').trim(), String(d.openTot || '18:00').trim(), String(d.gesloten || '').trim(), String(d.code || '').trim()]);
  try {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
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
      sh.getRange(r, 3).setValue(Number(d.aanbetaling) || 0);
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

  const row = [new Date(), d.naam || '', d.telefoon || '', d.dienst || '', d.prijs || '', d.datum || '', d.tijd || '', d.auto || '', d.opmerkingen || '', d.aanbetaling || '', 'openstaand', duur];
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
function ok() { return json({ ok: true }); }
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
