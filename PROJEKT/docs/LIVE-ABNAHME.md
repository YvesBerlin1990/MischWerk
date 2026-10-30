# MischWerk – LIVE-Abnahme

Lokaler Stand **0.1.31 mit RadioKing** ist nicht veröffentlicht. Uploadordner, ZIP und Manifest sind ausschließlich lokal vorbereitet. Im echten App-Log wurde am 30.10.2026 **0.1.30** als laufendes LIVE beobachtet; `REQUEST_ADD` bestätigte den Abbruch im inzwischen vollständig entfernten alten Wunschpfad. Ohne neue ausdrückliche Freigabe erfolgen weder FTP-Upload noch Knuddels-Update oder Serverneustart.

## Bestätigtes LIVE-Ziel

- App-ID: `knuddelsDEV.30807196.MischWerk`
- Installations-ID: `30807196.MischWerk`
- Channel: `MischWerk`
- Besitzer: `Otterchen`
- FTP-Ziel: `/ftp/MischWerk` auf `appupload.knuddels.de`
- Im echten App-Log beobachtete LIVE-Version: `0.1.30`

Zugangspasswörter gehören weder in dieses Projekt noch in die App. Maßgeblich für einen späteren Upload sind [INSTALLIEREN-LIVE.md](../../ANLEITUNGEN/INSTALLIEREN-LIVE.md), das aktuelle Manifest und die ZIP-Prüfsumme.

## Vor einem freigegebenen Update

- AppPersistence sichern; offene Wünsche, Wunschbox-Status und Thema müssen erhalten bleiben.
- Prüfen, dass `UPLOAD/MischWerk/` ausschließlich die sechs freigegebenen Laufzeitdateien enthält.
- Quellcode, Uploadordner, ZIP, Manifest und SHA-256 gegeneinander prüfen.
- Alle 105 lokalen Tests und `node tools/check.cjs` erfolgreich ausführen.
- Erst nach ausdrücklicher Freigabe alle sechs Dateien vollständig übertragen und anschließend kontrolliert aktualisieren beziehungsweise neu starten.

## Offene echte Abnahme für 0.1.31

- Besitzer: Studiozugriff, An-/Abmeldung, Verlängerung und Ablauf prüfen.
- Normaler Hörer: kein Studiozugriff; manipulierte Moderationsereignisse müssen abgewiesen werden.
- Channel-CM: kein automatischer Studiozugriff. Danach denselben Account als Radiomoderator ernennen, Studiozugriff verwenden, wieder entfernen und den sofortigen Entzug prüfen.
- Radio-Team: nur als Channelinhaber sichtbar/änderbar; unbekannten Nick ablehnen, Liste und Ernennung nach Neustart erhalten.
- Moderationsfenster: neue Konsole auf Desktop und schmalem K3 prüfen; kein früherer Fußtext, keine abgeschnittenen Steuerungen, sichtbare Ablaufzeit nur bei aktiver Anmeldung.
- Wunschbox: Nach dem Update mit vorhandenem AppPersistence-Bestand ausdrücklich „Aha – Take on me (Testwunsch)“ senden. Der Wunsch muss über `mw:wish.receipt` bestätigt werden, in der Warteschlange erscheinen und die sichtbare Erfolgsmeldung auslösen. Link ablehnen, Studioquittung und korrekten Moderator-Nick prüfen; bei deaktivierter Wunschbox Frontend und Backend sperren. Im App-Log dürfen weder `REQUEST_ADD` noch `PERSIST_PREPARE` für einen neuen Wunsch erscheinen, weil diese Wege nicht mehr beteiligt sind.
- Thema: speichern, bei anderen Hörern anzeigen, entfernen und nach Neustart auf Persistenz prüfen.
- RadioKing: `started`, `stopped`, unbekannten Status, Medienfehler, bewussten Play-Klick, Stop und Wiederanlauf ohne Autostart prüfen.
- Desktop-JX sowie K3/Web/Mobil: 320–2560 px, Tastaturbedienung, Popups, Channelwechsel, Hintergrund/Wiederaufnahme und scrollfreie Darstellung prüfen.
- Mit einem zweiten echten Account Vertraulichkeit, echten Nick und Rechteabgrenzung bestätigen.

Die lokalen Browser-Mocks ersetzen diese Abnahme nicht. Der aktuelle technische Nachweis steht in [PRUEFUNG-0.1.31.md](PRUEFUNG-0.1.31.md). Die ausführliche Historie der früheren LIVE-Versionen und Anbieter liegt ausschließlich im Archiv.
