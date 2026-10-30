# MischWerk auf Knuddels LIVE installieren

Stand: 30.10.2026 · lokale Paketversion 0.1.29 · Ziel wurde vom Nutzer ausdrücklich als LIVE bestätigt.

Aktuell nur lokal vorbereitet: Uploadordner, ZIP und Manifest enthalten alle neuesten Änderungen. Kein Upload und kein Server-Neustart erfolgt; LIVE bleibt 0.1.13. Die folgenden Übertragungs- und Neustartschritte gelten erst nach einer erneuten ausdrücklichen Freigabe des Nutzers.

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

`Paket/MischWerk-Knuddels-LIVE-0.1.29.zip` **lokal entpacken**. Nach späterer Freigabe den enthaltenen Ordner `MischWerk` nach `/ftp` hochladen. Alternativ direkt den bereits entpackten Ordner `UPLOAD/MischWerk` verwenden. Die ZIP-Datei selbst wird nicht auf den FTP geladen.

```text
/ftp/MischWerk/
  app.config
  main.js
  www/
    index.html
    css/style.css
    js/app.js
    img/mischwerk-logo.png
```

Der deutlich sichtbare Ordner `UPLOAD/MischWerk` enthält genau sechs Laufzeitdateien. Vorschau, Tests, Referenz-Stubs, Node-Werkzeuge, Zugangsdaten und Dokumentation gehören nicht in dieses FTP-Verzeichnis. `Paket/manifest-live.json` und `Paket/SHA256-LIVE.txt` dokumentieren die Paketdateien und die Prüfsumme.

Neu bauen: im MischWerk-Hauptordner `Installationspaket-erstellen.cmd` doppelklicken oder aus `PROJEKT/` den Befehl `node tools/build-install.cjs` ausführen. Der Build prüft die App und kopiert ausschließlich die freigegebenen Laufzeitdateien. [Offizielle Projektstruktur](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur)

## 2. FileZilla

Mit `30807196` auf `appupload.knuddels.de` verbinden. Explizites FTP über TLS verwenden; die Erreichbarkeit und Zertifikatsprüfung wurden ohne Passwort getestet. Rechts `/ftp` öffnen, links `UPLOAD`. Nur den lokalen Ordner `MischWerk` übertragen. Bestehende fremde App-Ordner bleiben unangetastet. Vor Überschreiben einer bereits vorhandenen MischWerk-Fassung zuerst deren Dateien sichern.

Warten, bis die Warteschlange leer ist und alle sechs Dateien erfolgreich übertragen sind. Der LIVE-Server kann anschließend noch Synchronisationszeit benötigen. [Offizielle FAQ](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ)

## 3. Im Channel installieren

In Knuddels als Otterchen den eigenen Channel MischWerk öffnen und `/apps` eingeben. Dort „App installieren“ wählen und MischWerk auswählen beziehungsweise **`30807196.MischWerk`** eintragen. Diese Kurz-ID wurde im tatsächlichen LIVE-Dialog erfolgreich installiert. Die Appverwaltung ergänzt `knuddelsDEV.` selbst. Falls Knuddels einen AppBot verlangt, einen verfügbaren Bot-Nick festlegen; der Nutzer hat **MischWerkBot** bestätigt. Die Oberfläche führt durch diesen Schritt; es wird kein neuer menschlicher Account benötigt. Anschließend die App starten. [Offizielle Installationsschritte](https://github.com/knuddelsgmbh/UserApps/wiki/Erste-Schritte)

Falls bereits installiert: nach Freigabe und vollständigem Upload über `/apps` „update/restart“ ausführen. `autoUpdate = false` verhindert einen Neustart mitten im Dateiupload. Im App-Log muss die Startmeldung `MischWerk 0.1.29: Radioleiste mit Wunschbox-, Radio-Team- und Moderations-Popups gestartet` erscheinen. Die Leiste wird beim Start und Channelbeitritt angezeigt; `/mischwerk` öffnet sie erneut. Wunschbox, Radio-Team und Moderation öffnen getrennte Knuddels-Popups; Radio-Team ist ausschließlich für den Channelinhaber sichtbar. [Offizieller Workflow](https://github.com/knuddelsgmbh/UserApps/wiki/Dev-Server)

## 4. Was jetzt schon funktioniert

RadioKing ist mit dem bestätigten MischWerk-Standard-Hörlink `https://play.radioking.io/mischwerk` eingerichtet. Die Radio-ID `mischwerk` steht in `MischWerkConfig.radioking.radioId`; die öffentliche Anbieterantwort bestätigt MischWerk / 950821. Titel und Interpret kommen getrennt aus der öffentlichen RadioKing-Widget-API. Keine Passwörter oder API-Schlüssel nötig. Details in `RADIOKING-EINRICHTUNG.txt`.

Echte Wiedergabe und Cross-Origin-Titelabfrage wurden geprüft; aktuell sind 104 lokale automatisierte Fälle bestanden. Wunschbox, Radio-Team und Moderation bleiben eigene Knuddels-Popups. Nur der Channelinhaber und von ihm ernannte Radiomoderatoren erhalten Studiozugriff; Channelmoderatoren nicht automatisch. Leiste, Logo und Gestaltung bleiben erhalten; der Popup-Leitspruch lautet „Die Mischung macht’s.“. Kein Encoderzugang und keine Smartlink-/M3U-Datei als Audioquelle. RadioKing ist der einzige aktive Radioanbieter.

Diese lokalen Nachweise ersetzen keine RadioKing-Abnahme im echten Knuddels-/K3-Client. Sie erfolgt erst nach einer erneuten ausdrücklichen Nutzerfreigabe für Upload und Neustart. LIVE bleibt nach zuletzt bestätigtem Stand 0.1.13.

## 5. Geräte und Freigabe

Ziel sind K3 und die aktuelle Knuddels-Desktop-App mit JX-Browser. Der alte JavaFX-Browser wird über die dokumentierte Knuddels-Methode ausgeschlossen. iOS benötigt laut Knuddels eine separate gültige Apple Developer ID; `30807196` wird ausdrücklich nicht als Apple-ID eingetragen. [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html), [iOS-Hinweis](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ)

Ein aktiver Entwicklerzugang und Channelbesitz sind Voraussetzung. Der Einstieg läuft über `/apps developer`; etwaige Verifizierung und Entwickler-AGB erledigt der Kontoinhaber selbst. [Entwicklerportal](https://developer.knuddels.de/)

Die offiziellen Unterlagen empfehlen vor LIVE einen DEV-Test. Auf ausdrücklichen Nutzerwunsch wird hier LIVE vorbereitet. Die lokal bestandenen Prüfungen werden durch die echte Abnahme in `../PROJEKT/docs/LIVE-ABNAHME.md` ergänzt; eine erfolgreiche lokale Prüfung wird nicht als bereits erfolgte LIVE-Installation ausgegeben.
