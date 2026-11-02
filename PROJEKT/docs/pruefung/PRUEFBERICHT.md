# MischWerk – Vorhang und Logohintergrund 0.1.106

Stand: 02.11.2026. Nur lokal geändert und paketiert; kein FTP-Upload, Knuddels-Update oder Neustart.

## Änderung

Der senkrechte Strich stammte aus dem zusätzlichen Rand der gespiegelten zweiten Vorhanghälfte. Der Vorhang nutzt jetzt einen durchgängigen statischen CSS-Stoffverlauf ohne mittlere Trennung. Die Inhaltskarte ist deckend #23231f und besitzt einen eigenen isolierten Mischbereich. Damit blendet die bestehende lighten-Darstellung den schwarzen Logo-Hintergrund in die Kartenfarbe ein, ohne sichtbares Bildrechteck. Die Original-Logo-Datei bleibt bytegleich erhalten.

Keine Änderung an Maßen, Texten, Fokus, Vorhangzustand, Rechten, Werbung oder Audio. Kompakte Rückmeldungen aus 0.1.105 und Startkorrektur 0.1.104 bleiben erhalten. Keine neue Plattformmethode oder Laufzeitdatei.

## Prüfung

- 118 Backend-/Vorschaufälle im Paketbau bestanden.
- Fünf bestehende Browserfälle bestanden: parserbasierte Knuddels-Einbindung aller fünf Fenster sowie Vorhangdarstellung, Ausnahmen und Privatsteuerung, unabhängige Werbung, Lautstärke/Fehler und echte native Wiedergabe der MP3.
- Breite und schmale Vorhangansicht visuell geprüft: [1360 px](vorhang/Vorhang-1360.png) und [320 px](vorhang/Vorhang-320.png). Keine zusätzliche Mittelnaht, kein dunkles Rechteck am Logo. Lokale Beispieldaten.
- Rhino 1.7.7.2 und 1.9.1 jeweils 729 Prüfungen, 125 Wünsche und zwölf abgewiesene Links einschließlich Sendeplan und Studioansagen bestanden.
- Syntax, API-Signaturen, Modulverdrahtung, Inventare, Textlängen und Paketabgleich bestanden.
- Vollständiger vorheriger Browserlauf unter 0.1.104: 105 Fälle bestanden. Für die reine CSS-Änderung gezielte Prüfung.

## Paket

Version 0.1.106: 84 Laufzeitdateien, 82 Texte und zwei Binärdateien; 27 Servermodule, 36 Frontendkomponenten und 15 Stylesheets. Radio-Ladeplan unverändert: 18 JavaScript-Dateien einschließlich Einstieg und acht Stylesheets. main.js weiterhin drei Zeilen / 163 Bytes. Größte Laufzeittextdatei 8.551 Zeichen, größtes Manifest 9.293 Zeichen; jeweils strikt unter 9.500.

Uploadordner: C:\Users\Yves\Desktop\MischWerk\UPLOAD\MischWerk.

ZIP: C:\Users\Yves\Desktop\MischWerk\ANLEITUNGEN\Paket\MischWerk-Knuddels-LIVE-0.1.106.zip.

ZIP-SHA-256: 365396F05B6A4B2C8C84816585992AD11961EFA0B04666D5F884910CF2D81000.

Überholtes eigenes Paket 0.1.105 erst nach erfolgreicher Prüfung von 0.1.106 entfernt. Keine Sicherung oder zweite ZIP-Ablage erzeugt. Veröffentlichung und echte Abnahme bleiben separat; ANLEITUNGEN/INSTALLIEREN-LIVE.md beachten.