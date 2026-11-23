/**
 * Anfrageformular von boesnermedia.de
 * Empfängt das Formular, schickt dir eine E-Mail und dem Kunden eine Bestätigung.
 * Läuft in deinem Google-Workspace-Konto (info@boesnermedia.de).
 */

var EMPFAENGER = 'info@boesnermedia.de';
var ABSENDER_NAME = 'Niklas Bösner · Bösner Media';
// Paketnamen aus dem Formular in verständliche Leistungen übersetzen
var LEISTUNGEN = {
  'THE MOMENTUM': 'Dokumentation & Kampagne (THE MOMENTUM)',
  'THE EXPLAINER': 'Technische Erklärvideos (THE EXPLAINER)',
  'THE CONTENT SPRINT': 'Social Media Content (THE CONTENT SPRINT)',
  'THE STATEMENT': 'Unternehmenskommunikation (THE STATEMENT)',
  'THE LAB': 'KI-Workshops (THE LAB)'
};
var SIGNATUR = 'Viele Grüße\nNiklas Bösner\nBösner Media · Karlstraße 4 · 71364 Winnenden · +49 173 6094285\nwww.boesnermedia.de';

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    // Spam-Schutz: unsichtbares Feld muss leer sein, Ausfüllen muss länger als 3 Sekunden dauern
    if (p.website) return antwort(true);
    if (Number(p.t || 0) < 3000) return antwort(true);

    var f = function (name, max) { return String(p[name] || '').trim().slice(0, max || 200); };
    var d = {
      kundentyp: f('kundentyp', 20),
      interesse: f('interesse'),
      anliegen: f('anliegen'),
      name: f('name'),
      unternehmen: f('unternehmen'),
      email: f('email'),
      telefon: f('telefon', 50),
      zeitraum: f('zeitraum'),
      auftragsnummer: f('auftragsnummer', 50),
      dringlichkeit: f('dringlichkeit'),
      nachricht: f('nachricht', 5000)
    };

    if (!d.kundentyp || !d.name || !d.unternehmen || !d.nachricht || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) {
      return antwort(false, 'Angaben unvollständig');
    }

    // Höchstens eine Anfrage pro E-Mail-Adresse alle 10 Minuten
    var cache = CacheService.getScriptCache();
    var key = 'anfrage_' + d.email.toLowerCase();
    if (cache.get(key)) return antwort(true);
    cache.put(key, '1', 600);

    var neu = d.kundentyp === 'Neukunde';
    var zeit = Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM.yyyy, HH:mm') + ' Uhr';

    var zeilen = [
      ['Kundentyp', d.kundentyp],
      neu ? ['Interesse', LEISTUNGEN[d.interesse] || d.interesse] : ['Anliegen', d.anliegen],
      ['Name', d.name],
      ['Unternehmen', d.unternehmen],
      ['E-Mail', d.email],
      ['Telefon', d.telefon]
    ];
    if (neu) zeilen.push(['Zeitraum', d.zeitraum]);
    else zeilen.push(['Auftragsnummer', d.auftragsnummer], ['Dringlichkeit', d.dringlichkeit]);
    var uebersicht = zeilen
      .filter(function (z) { return z[1]; })
      .map(function (z) { return z[0] + ': ' + z[1]; })
      .join('\n');

    // 1. E-Mail an dich. „Antworten“ geht direkt an den Kunden.
    MailApp.sendEmail({
      to: EMPFAENGER,
      subject: 'Neue Anfrage über boesnermedia.de',
      replyTo: d.email,
      name: 'Website boesnermedia.de',
      body: uebersicht + '\n\nNachricht:\n' + d.nachricht + '\n\nEingegangen: ' + zeit
    });

    // 2. Bestätigung an den Kunden
    var satz = neu
      ? 'Ich melde mich innerhalb von 24 Stunden mit zwei, drei Terminvorschlägen für die kostenlose Potenzial-Analyse.'
      : 'Ich melde mich innerhalb von 24 Stunden zu Ihrem Anliegen „' + (d.anliegen || 'Ihre Anfrage') + '“.';
    MailApp.sendEmail({
      to: d.email,
      subject: 'Ihre Anfrage bei Bösner Media',
      replyTo: EMPFAENGER,
      name: ABSENDER_NAME,
      body: 'Guten Tag ' + d.name + ',\n\n'
        + 'danke für Ihre Anfrage, sie ist bei mir angekommen. ' + satz + '\n\n'
        + 'Ihre Angaben im Überblick:\n' + uebersicht + '\n\nIhre Nachricht:\n' + d.nachricht + '\n\n'
        + SIGNATUR
    });

    return antwort(true);
  } catch (err) {
    console.error(err);
    return antwort(false, 'Fehler');
  }
}

function antwort(ok, fehler) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: ok, fehler: fehler || null }))
    .setMimeType(ContentService.MimeType.JSON);
}
