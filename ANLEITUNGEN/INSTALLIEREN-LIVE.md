# MischWerk auf Knuddels LIVE installieren

Stand: 02.11.2026 · lokale Paketversion 0.1.106 · Ziel wurde vom Nutzer ausdrücklich als LIVE bestätigt.

Startkorrektur 0.1.104: Die echte Knuddels-Dateieinbindung konnte beim bisherigen Aufruf nach DOMContentLoaded das HTML löschen. Dateien werden jetzt während des Parsens angefordert und erst nach fertigem HTML zusammengesetzt. Vorhang, Werbung und alle Funktionen sind erhalten. Das vollständige aktuelle Paket übertragen, danach /update und die Radioleiste mit /mischwerk erneut öffnen. Erst dann lässt sich die echte Darstellung bestätigen.

Aktuell nur lokal vorbereitet: Uploadordner, ZIP und Manifest enthalten alle neuesten Änderungen. Kein Upload und kein Server-Neustart erfolgt; im echten App-Log wurde zuletzt LIVE 0.1.103 mit leerer Oberfläche beobachtet. Die folgenden Übertragungs- und Neustartschritte gelten erst nach einer erneuten ausdrücklichen Freigabe des Nutzers.

Seit 0.1.103: Ein Vorhang verdeckt die Radioleiste zunächst für Hörer. Otterchen und Polaroid sehen sie direkt. Otterchen als Channelinhaber kann über seinen eigenen Button den Vorhang global öffnen und schließen; der Zustand bleibt gespeichert. Werbung starten spielt die eigene MP3 ausschließlich beim klickenden Hörer und öffnet den Vorhang nicht. Die MP3 wird erst beim Klick geladen. Darum auch www/audio/werbung.mp3 aus dem aktuellen Paket mit übertragen.

## Deine festen Angaben

| Angabe | Wert |
| --- | --- |
| Channel / Besitzer | MischWerk / Otterchen |
| Entwickler-ID und bestätigter FTP-Benutzername | 30807196 |
| LIVE-Server | appupload.knuddels.de, Port 21 |
| Verbindung | FTP mit explizitem TLS; Zertifikat gültig geprüft |
| Zielverzeichnis | /ftp/MischWerk |
| App-ID laut tatsächlicher Appverwaltung | knuddelsDEV.30807196.MischWerk |
| Eingabe im Installationsdialog | 30807196.MischWerk |
| App öffnen | /mischwerk |

Das Passwort wird ausschließlich im FTP-Programm eingegeben. Die Entwickler-ID ersetzt kein Passwort. In `PROJEKT/app/app.config` steht für die Entwickler-Zuordnung der Nick Otterchen; die numerische ID bildet mit Appserver-ID und FTP-Ordner die App-ID. Die echte LIVE-Installation hat das Präfix `knuddelsDEV` bestätigt. Es darf nicht aus dem LIVE-FTP-Host als `knuddelsDE` abgeleitet werden. [App-ID-Dokumentation](https://developer.knuddels.de/docs/classes/AppInfo.html)

## 1. Fertiges Paket

`Paket/MischWerk-Knuddels-LIVE-0.1.106.zip` **lokal entpacken**. Nach späterer Freigabe den enthaltenen Ordner `MischWerk` nach `/ftp` hochladen. Alternativ direkt den bereits entpackten Ordner `UPLOAD/MischWerk` verwenden. Die ZIP-Datei selbst wird nicht auf den FTP geladen.

```text
/ftp/MischWerk/
  app.config
  main.js
  server/
    config.js
    app.js
    maintenance.js
    lifecycle.js
    core/ ...
    users/ ...
    state/ ...
    radio/ ...
    wishes/ ...
    transport/ ...
    ui/ ...
  www/
    index.html
    css/ ...
    js/start.js
    js/core/ ...
    js/radio/ ...
    js/wishes/ ...
    js/studio/ ...
    js/team/ ...
    js/transport/ ...
    js/ui/ ...
    img/mischwerk-logo.png
```

Der deutlich sichtbare Ordner `UPLOAD/MischWerk` enthält 84 Laufzeitdateien, davon 27 fachlich getrennte Servermodule. Alle Dateien einschließlich `server/` sind erforderlich; `main.js` allein enthält keine App-Fachlogik mehr. Vorschau, Tests, Referenz-Stubs, Node-Werkzeuge, Zugangsdaten und Dokumentation gehören nicht in dieses FTP-Verzeichnis. `Paket/manifest-live.json` verweist mit Prüfsummen auf `manifest-server.json` und `manifest-www.json`; zusammen dokumentieren sie sämtliche Paketdateien. `Paket/SHA256-LIVE.txt` enthält die ZIP-Prüfsumme.

Neu bauen: aus `PROJEKT/` den Befehl `node tools/build-install.cjs` ausführen. Der Build prüft die App und kopiert ausschließlich die freigegebenen Laufzeitdateien. [Offizielle Projektstruktur](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur)

## 2. FileZilla

Mit `30807196` auf `appupload.knuddels.de` verbinden. Explizites FTP über TLS verwenden; die Erreichbarkeit und Zertifikatsprüfung wurden ohne Passwort getestet. Rechts `/ftp` öffnen, links `UPLOAD`. Nur den lokalen Ordner `MischWerk` übertragen. Bestehende fremde App-Ordner bleiben unangetastet. Vor Überschreiben einer bereits vorhandenen MischWerk-Fassung zuerst deren Dateien sichern.

Warten, bis die Warteschlange leer ist und alle Dateien des Manifests erfolgreich übertragen sind, insbesondere der gesamte `server/`-Ordner. Der LIVE-Server kann anschließend noch Synchronisationszeit benötigen. [Offizielle FAQ](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ)

## 3. Im Channel installieren

In Knuddels als Otterchen den eigenen Channel MischWerk öffnen und `/apps` eingeben. Dort „App installieren“ wählen und MischWerk auswählen beziehungsweise **`30807196.MischWerk`** eintragen. Diese Kurz-ID wurde im tatsächlichen LIVE-Dialog erfolgreich installiert. Die Appverwaltung ergänzt `knuddelsDEV.` selbst. Falls Knuddels einen AppBot verlangt, einen verfügbaren Bot-Nick festlegen; der Nutzer hat **MischWerkBot** bestätigt. Die Oberfläche führt durch diesen Schritt; es wird kein neuer menschlicher Account benötigt. Anschließend die App starten. [Offizielle Installationsschritte](https://github.com/knuddelsgmbh/UserApps/wiki/Erste-Schritte)

Falls bereits installiert: beim ersten Wechsel auf 0.1.36 nach Freigabe und vollständigem Upload einmal über `/apps` „update/restart“ ausführen. Danach können Appmanager und Channelinhaber direkt im Channel `/update` verwenden. Zuerst immer den vollständigen Manifestupload und die Abschlussmeldung des FTP-Programms abwarten. `/update` übernimmt dann mit der offiziellen API die angekommenen Dateien und fordert nur bei mindestens einer gemeldeten neuen Datei den Neustart an. Ohne neue Dateien meldet MischWerk dies ausdrücklich und startet nicht neu. Die API kann einen noch laufenden Teilupload nicht als vollständig bestätigen. Bei einem Update meldet Knuddels eine geschätzte Wartezeit; die flüchtige Wunschqueue beginnt erst nach dem tatsächlichen Neustart leer. `autoUpdate = false` verhindert einen automatischen Neustart mitten im Dateiupload. Im App-Log muss die Startmeldung `MischWerk 0.1.106: Radioleiste mit Wunschbox-, Radio-Team- und Moderations-Popups gestartet` erscheinen. Die Leiste wird beim Start und Channelbeitritt angezeigt; `/mischwerk` öffnet sie erneut. Wunschbox, Radio-Team und Moderation öffnen getrennte Knuddels-Popups; Radio-Team ist ausschließlich für den Channelinhaber sichtbar. [Offizieller Workflow](https://github.com/knuddelsgmbh/UserApps/wiki/Dev-Server)

### Wenn „Keine neuen MischWerk-Dateien“ erscheint

Die Meldung bedeutet: Die Knuddels-API hat in diesem Abruf keine weiteren Dateien übernommen. Sie beweist nicht, dass das lokale Paket bereits vollständig auf dem richtigen FTP-Ziel liegt. Die Statuszentrale befindet sich unter **Radio-Team → Statuszentrale** und ist für den tatsächlichen Channelinhaber bestimmt.

1. Nach entsprechender Freigabe das Paket **0.1.106** vollständig nach `/ftp/MischWerk` übertragen und vorhandene Dateien ersetzen. `app.config`, `main.js`, `server/` und `www/` müssen direkt dort liegen; kein zweiter Unterordner `MischWerk/MischWerk`.
2. Den Abschluss aller Übertragungen abwarten, dann im Channel `/update` ausführen. Alternativ steht der ausdrückliche Update-/Neustartauftrag in `/apps` zur Verfügung. Im App-Log die tatsächlich geladene Version **0.1.106** prüfen.
3. Nach dem Neustart die bisherige Statuszentrale schließen und erneut öffnen. Seit Version 0.1.94 erneuert die App den Oberflächen-Cache beim Start und beim Updatebefehl.
4. Meldet die App keine neuen Dateien mehr, wird der Cache trotzdem erneuert. Dann das Fenster neu öffnen. Fehlt die Änderung weiterhin, Uploadziel und Übertragung aller Dateien prüfen. Eine höhere Versionsnummer allein überträgt keine Dateien.

Ohne neue Dateien wird kein Neustart erzwungen. Die laufende Wunschqueue bleibt bis zu einem tatsächlichen Neustart erhalten.

## 4. Was jetzt schon funktioniert

RadioKing ist mit dem bestätigten MischWerk-Standard-Hörlink `https://play.radioking.io/mischwerk` eingerichtet. Die Radio-ID `mischwerk` steht in `MischWerkConfig.radioking.radioId`; die öffentliche Anbieterantwort bestätigt MischWerk / 950821. Titel und Interpret kommen getrennt aus der öffentlichen RadioKing-Widget-API. Keine Passwörter oder API-Schlüssel nötig. Details in `RADIOKING-EINRICHTUNG.txt`.

Für 0.1.106 sind 118 Backend-/Vorschaufälle, fünf gezielte Browserfälle sowie die echten Rhino-Prüfungen bestanden. Vorhang, Logo und Werbung bei 320 und 1360 px visuell geprüft. Der vollständige vorherige Browserlauf unter 0.1.104 umfasste 105 erfolgreiche Fälle. Ladeoptimierung, lokale Ressourcenmengen und Funktionsprüfungen stehen im [Prüfbericht](../PROJEKT/docs/pruefung/PRUEFBERICHT.md). Frühere RadioKing-Nachweise für Wiedergabe und Cross-Origin-Titelabfrage bleiben separat dokumentiert. Wunschbox, Radio-Team und Moderation bleiben eigene Knuddels-Popups. Nur der Channelinhaber und von ihm ernannte Radiomoderatoren erhalten Studiozugriff; Channelmoderatoren und Appmanager nicht automatisch. Im Studio entfernt „Erledigt“ gespielte Wünsche, „Verwerfen“ zum Beispiel nicht verfügbare Titel. Leiste, Logo und Gestaltung bleiben erhalten; der Popup-Leitspruch lautet „Die Mischung macht’s.“. RadioKing ist der einzige aktive Radioanbieter.

Diese lokalen Nachweise ersetzen keine Abnahme im echten Knuddels-/K3-Client. Sie erfolgt erst nach einer erneuten ausdrücklichen Nutzerfreigabe für Upload und Neustart. Zuletzt wurde im echten App-Log ausdrücklich LIVE 0.1.33 beobachtet.

## 5. Geräte und Freigabe

Ziel sind K3 und die aktuelle Knuddels-Desktop-App mit JX-Browser. Der alte JavaFX-Browser wird über die dokumentierte Knuddels-Methode ausgeschlossen. iOS benötigt laut Knuddels eine separate gültige Apple Developer ID; `30807196` wird ausdrücklich nicht als Apple-ID eingetragen. [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html), [iOS-Hinweis](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ)

Ein aktiver Entwicklerzugang und Channelbesitz sind Voraussetzung. Der Einstieg läuft über `/apps developer`; etwaige Verifizierung und Entwickler-AGB erledigt der Kontoinhaber selbst. [Entwicklerportal](https://developer.knuddels.de/)

Die offiziellen Unterlagen empfehlen vor LIVE einen DEV-Test. Auf ausdrücklichen Nutzerwunsch wird hier LIVE vorbereitet. Die lokal bestandenen Prüfungen werden durch die echte Abnahme in `../PROJEKT/docs/betrieb/LIVE-ABNAHME.md` ergänzt; eine erfolgreiche lokale Prüfung wird nicht als bereits erfolgte LIVE-Installation ausgegeben.

Sendeplan: Über den Button oberhalb der Wunschbox die datierte Wochenübersicht öffnen. Alle können lesen; ausschließlich der Channelinhaber sieht „Sendung eintragen“ und „Bearbeiten“. Moderator, Datum, Von-/Bis-Zeit und Thema erfassen. Weitere Wochen über die Pfeile auswählen. Details: `../PROJEKT/docs/betrieb/SENDEPLAN.md`.
