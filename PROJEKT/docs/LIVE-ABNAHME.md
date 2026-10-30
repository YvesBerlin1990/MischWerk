# MischWerk – LIVE-Abnahme

Lokaler Stand **0.1.32 mit RadioKing** ist nicht veröffentlicht. Uploadordner, ZIP und Manifest sind ausschließlich lokal vorbereitet. Im echten App-Log wurde am 30.10.2026 **0.1.31** als laufendes LIVE beobachtet; `WISH_SUBMIT` bestätigte den Abbruch des inzwischen entfernten Speicher-/Identitätsunterbaus. Ohne neue ausdrückliche Freigabe erfolgen weder FTP-Upload noch Knuddels-Update oder Serverneustart.

## Bestätigtes LIVE-Ziel

- App-ID: `knuddelsDEV.30807196.MischWerk`
- Installations-ID: `30807196.MischWerk`
- Channel: `MischWerk`
- Besitzer: `Otterchen`
- FTP-Ziel: `/ftp/MischWerk` auf `appupload.knuddels.de`
- Im echten App-Log beobachtete LIVE-Version: `0.1.31`

Zugangspasswörter gehören weder in dieses Projekt noch in die App. Maßgeblich für einen späteren Upload sind [INSTALLIEREN-LIVE.md](../../ANLEITUNGEN/INSTALLIEREN-LIVE.md), das aktuelle Manifest und die ZIP-Prüfsumme.

## Vor einem freigegebenen Update

- AppPersistence für Thema, Wunschbox-Status, Radio-Team und Studiozustand sichern. Die Wunschqueue ist ab 0.1.32 bewusst flüchtig.
- Prüfen, dass `UPLOAD/MischWerk/` ausschließlich die sechs freigegebenen Laufzeitdateien enthält.
- Quellcode, Uploadordner, ZIP, Manifest und SHA-256 gegeneinander prüfen.
- Alle 105 lokalen Tests und `node tools/check.cjs` erfolgreich ausführen.
- Erst nach ausdrücklicher Freigabe alle sechs Dateien vollständig übertragen und anschließend kontrolliert aktualisieren beziehungsweise neu starten.

## Offene echte Abnahme für 0.1.32

- Besitzer: Studiozugriff, An-/Abmeldung, Verlängerung und Ablauf prüfen.
- Normaler Hörer: kein Studiozugriff; manipulierte Moderationsereignisse müssen abgewiesen werden.
- Channel-CM: kein automatischer Studiozugriff. Danach denselben Account als Radiomoderator ernennen, Studiozugriff verwenden, wieder entfernen und den sofortigen Entzug prüfen.
- Radio-Team: nur als Channelinhaber sichtbar/änderbar; unbekannten Nick ablehnen, Liste und Ernennung nach Neustart erhalten.
- Moderationsfenster: neue Konsole auf Desktop und schmalem K3 prüfen; kein früherer Fußtext, keine abgeschnittenen Steuerungen, sichtbare Ablaufzeit nur bei aktiver Anmeldung.
- Wunschbox: „Aha – Take on me (Testwunsch)“ senden. Der Hörer muss über `mw:wish.receipt` sofort die gut sichtbare Meldung „Dein Musikwunsch wurde an die Moderation gesendet.“ erhalten; ausschließlich im Moderationsfenster darf der Wunsch in der Warteschlange erscheinen. Link ablehnen, echten Hörer-Nick prüfen, Wunsch bearbeiten und bei deaktivierter Wunschbox Frontend und Backend sperren. Im App-Log darf bei diesem Weg weder `WISH_SUBMIT` noch eine Speicherkennung erscheinen. Nach einem kontrollierten App-Neustart muss die Wunschqueue leer sein.
- Thema: speichern, bei anderen Hörern anzeigen, entfernen und nach Neustart auf Persistenz prüfen.
- RadioKing: `started`, `stopped`, unbekannten Status, Medienfehler, bewussten Play-Klick, Stop und Wiederanlauf ohne Autostart prüfen.
- Desktop-JX sowie K3/Web/Mobil: 320–2560 px, Tastaturbedienung, Popups, Channelwechsel, Hintergrund/Wiederaufnahme und scrollfreie Darstellung prüfen.
- Mit einem zweiten echten Account Vertraulichkeit, echten Nick und Rechteabgrenzung bestätigen.

Die lokalen Browser-Mocks ersetzen diese Abnahme nicht. Der aktuelle technische Nachweis steht in [PRUEFUNG-0.1.32.md](PRUEFUNG-0.1.32.md). Die ausführliche Historie der früheren LIVE-Versionen und Anbieter liegt ausschließlich im Archiv.
