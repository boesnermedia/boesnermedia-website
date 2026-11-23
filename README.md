# boesnermedia.de

Die Website von Bösner Media. Gebaut mit Claude, gepflegt über das CMS unter **boesnermedia.de/admin**.

## So funktioniert die Seite

- **Inhalte** liegen in `src/_data/startseite.json` (Startseite) und `src/_data/site.json` (Kontaktdaten). Im CMS bearbeitest du sie in Formularen, ohne Code.
- **Bilder und Videos**, die du im CMS hochlädst, landen in `src/assets/uploads/`.
- **Seiten-Vorlagen** liegen in `src/*.njk`, das Aussehen in `src/assets/css/main.css` (Farben und Schrift aus dem Design System „Bösner Media 2.0“).
- **Jede Änderung** wird hier als Version gespeichert und lässt sich rückgängig machen.

## Was du selbst machst – und was Claude macht

| Du im CMS | Claude im Chat |
| --- | --- |
| Texte ändern, Bilder und Videos tauschen, Kundenlogos pflegen, Kontaktdaten | Neue Seiten und Funktionen, Design, Formular-Server, Updates, Fehler |

## Datenschutz und Sicherheit

- Keine Cookies, kein Tracking, keine Schriften oder Skripte von fremden Servern. Montserrat und das CMS werden von der eigenen Seite ausgeliefert.
- Bedienung nach den Regeln im Konzept: Klickflächen ab 44 px, Tastatur-Bedienung, „Bewegung reduzieren“ wird beachtet, Videos laufen nie mit Ton von selbst.

## Stand

- [x] Grundstruktur, Startseite, Kontakt mit Anfrageformular, Impressum und Datenschutz als Platzhalter
- [x] Automatisches Veröffentlichen bei Bunny (`.github/workflows/deploy.yml`)
- [ ] Domain boesnermedia.de bei Wix auf Bunny zeigen lassen
- [x] Formular-Server: Skript `google-apps-script/Anfrage.gs` läuft in Google Workspace (Projekt „Website-Anfragen“)
- [x] Paketseite THE EXPLAINER (`src/loesungen/erklaervideo.md`, Vorlage `src/_includes/paket.njk`)
- [ ] Inhalte: Showreel, Fotos, Kundenlogos, echte Kennzahl, Impressum und Datenschutzerklärung

## Für Entwickler

```
npm install
npm start      # lokale Vorschau unter http://localhost:8080
npm run build  # fertige Seite in _site/
```

## Stand Strategie 2027
- Startseite: Claim „Performance im Fokus.“, 5 Leistungsfelder, „Ein Dreh, alle Kanäle“, Case, THE LAB
- Leistungsseiten (`src/leistungen/`, Vorlage `src/_includes/paket.njk`): /dokumentation, /erklaervideos, /social-media, /unternehmenskommunikation, /ki-workshops – ohne Preise
- /ueber-mich (Inhalt `src/_data/ueber.json`), /projekte (Inhalt `src/_data/projekte.json`, erstes Projekt erscheint auf der Startseite)
- SEO: Sitemap, robots.txt, strukturierte Daten (Firma, Leistung, FAQ)
