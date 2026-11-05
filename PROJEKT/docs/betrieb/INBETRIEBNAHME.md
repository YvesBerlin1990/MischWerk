# MischWerk – Installation, Betrieb und STREAMPANEL

**App 0.1.223 · Build 223**, Stand 05.11.2026. Das lokale Paket umfasst 122 Laufzeitdateien und fünf Manifeste. GitHub enthält Quellen und Nachweise; der erzeugte UPLOAD ist ausgeschlossen. Die laufende native Sitzung verwendete beim letzten Test noch den alten Audiocode. GitHub-Veröffentlichung und Knuddels-Installation sind getrennt.

Radio bleibt eine Headerbar. Wunschbox, Moderation, Verwaltung und Sendeplan öffnen als getrennte Channel-Overlays; Menüwechsel ersetzen die Radioleiste nicht. [Aufbau](../architektur/ARCHITEKTUR.md) · [Verbindliche Projektregeln](../../AGENTS.md).

## Installation und Upload

Ausschließlich **C:/Users/Yves/Desktop/MischWerk/UPLOAD** verwenden. Darunter liegt der vollständige Appordner **MischWerk** mit app.config, main.js, server/ und www/. Die Projektwurzel enthält zusätzlich Quellen, Dokumentation und Git und gehört nicht auf den App-FTP. Keine ZIP erstellen oder entpacken.

| Angabe | Bestätigter Wert |
| --- | --- |
| Channel / Besitzer | MischWerk / Otterchen |
| Entwickler-ID / FTP-Benutzername | 30807196 |
| FTP-Host / Port | appupload.knuddels.de / 21 |
| Verbindung | FTP mit explizitem TLS |
| Zielverzeichnis | /ftp/MischWerk |
| Vollständige App-ID | knuddelsDEV.30807196.MischWerk |
| Eingabe im Installationsdialog | 30807196.MischWerk |
| Bestätigter AppBot | MischWerkBot |
| App öffnen | /mischwerk |

Passwörter ausschließlich im FTP-Programm eingeben. Die Entwickler-ID ersetzt kein Passwort. app.config verwendet den Entwicklernamen Otterchen; das bestätigte knuddelsDEV-Präfix der App-ID darf nicht aus dem LIVE-FTP-Host anders abgeleitet werden. [App-ID-Dokumentation](https://developer.knuddels.de/docs/classes/AppInfo.html).

Aus PROJEKT/ mit **node tools/build/prepare-upload.cjs** die Bereitstellung prüfen und den verbindlichen Desktop-Upload aktualisieren. **node tools/checks/upload.cjs** gleicht alle 122 Laufzeitdateien einschließlich 40 Servermodulen, Größen, SHA-256 und Textgrenzen mit den fünf Manifesten ab. Der Build erzeugt keine zweite Uploadkopie und veröffentlicht nichts. main.js allein enthält keine App-Fachlogik. Tests, Referenzstubs, Dokumentation und Zugangsdaten gehören nicht ins FTP-Ziel.

Nach einem gesonderten Uploadauftrag:

1. In FileZilla mit den obigen Angaben verbinden. Rechts /ftp, links C:/Users/Yves/Desktop/MischWerk/UPLOAD öffnen. Den lokalen Ordner MischWerk nach /ftp übertragen. Direkt unter /ftp/MischWerk müssen main.js, app.config, server/ und www/ liegen; kein zusätzliches MischWerk/MischWerk. Fremde Appordner erhalten. Vor einem Produktivupdate bestehende Dateien und AppPersistence sichern.
2. Das Ende aller Manifestübertragungen abwarten, einschließlich www/audio/werbung.mp3 und sämtlicher server/-Module. Eine leere FileZilla-Warteschlange und erfolgreiche Übertragungen prüfen; anschließend kann noch Plattform-Synchronisationszeit nötig sein.
3. Bei Erstinstallation als Otterchen im eigenen Channel /apps öffnen, App installieren und 30807196.MischWerk eintragen. Knuddels ergänzt das bestätigte Präfix. Falls nötig den bestätigten AppBot einrichten; anschließend die App starten. Bei bestehender Installation den unten beschriebenen /update-Weg verwenden. Beim erstmaligen Wechsel von einem Stand vor 0.1.36 einmal über /apps aktualisieren.
4. Die tatsächlich gestartete Version im App-Log bestätigen: lokal ist 0.1.223 (Build 223) mit aktiver leerer dunkler Overlayabdeckung vorbereitet. Die Startmeldung enthält Version und Buildnummer sowie die Radioleiste mit vier Channel-Overlays. Radioleiste bei Bedarf mit /mischwerk erneut öffnen; bestehende Appansichten nach Updates schließen und neu öffnen.

Für eine ausdrücklich angeforderte Auslieferungsabnahme anschließend aus PROJEKT/ **pnpm run check:delivery --base-url https://apps8.knuddels.biz/apps/de2635007/** ausführen. Die hier am 03.11.2026 beobachtete öffentliche Basisadresse bei einem Appwechsel erneut prüfen. Das Werkzeug lädt ausschließlich öffentliche HTML-/JS-/CSS-Dateien lesend und vergleicht deren tatsächliche SHA-256 mit den reproduzierbaren gebündelten Auslieferungsbytes. Fehlende Dateien oder alte Fassungen liefern Exitcode 1; vollständig passende Dateien Exitcode 0. Keine Benutzer-/Sitzungsdaten oder Zugangsdaten angeben. Betriebsvorgaben bleiben zentral in AGENTS.md.

Die offizielle API übernimmt mit /update keine noch laufende Übertragung als vollständig. Meldet sie keine neuen Dateien, werden keine weiteren Dateien übernommen und kein Neustart erzwungen; dies beweist keinen vollständigen Upload. Dann Zielpfad, alle Dateien, tatsächliche Logversion und erneutes Öffnen nach Cacheerneuerung prüfen. Eine höhere lokale Versionsnummer überträgt keine Dateien.

Aktiver Entwicklerzugang und Channelbesitz sind Voraussetzung; Verifizierung und Entwickler-AGB erledigt der Kontoinhaber über /apps developer. Zielclients sind K3 und die aktuelle Knuddels-Desktop-App; JFX ist ausgeschlossen. iOS benötigt laut Plattform eine separate gültige Apple Developer ID, keine Knuddels-Entwicklernummer. Die offiziellen Unterlagen empfehlen DEV vor LIVE; hier ist auf Nutzerauftrag LIVE vorbereitet, eine reale Abnahme bleibt separat.

[Projektstruktur](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur) · [Erste Schritte](https://github.com/knuddelsgmbh/UserApps/wiki/Erste-Schritte) · [FAQ](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ) · [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html) · [Entwicklerportal](https://developer.knuddels.de/).

## Appmanager-Befehl ab 0.1.36

Nach einmaligem vollständigem Einspielen und Aktualisieren auf 0.1.36 können Appmanager sowie Channelinhaber im Channel `/update` eingeben. Bei späteren Versionen zuerst alle Dateien des neuen Manifests einschließlich `server/` vollständig hochladen und den Abschluss des FTP-Programms abwarten, dann `/update` verwenden. Der Befehl übernimmt mit `updateAppFiles()` die auf dem Knuddels-FTP angekommenen Änderungen. Nur wenn die API mindestens eine neue Datei meldet, wird das vollständige Update mit Neustart angefordert; andernfalls bestätigt MischWerk, dass keine neuen Dateien gefunden wurden, und läuft ohne Neustart weiter. Die Prüfung erkennt keinen noch unvollständigen Upload, deshalb bleibt die vollständige Manifestübertragung zwingend. Die gemeldeten Sekunden sind eine Schätzung; bei Serverlast kann das Update später erfolgen. Ein bereits angeforderter Auftrag wird nicht wiederholt angelegt. Die laufende Wunschqueue bleibt bis zum tatsächlichen Neustart nutzbar und beginnt danach leer. Persistente Einstellungen und Radio-Team bleiben erhalten.

„Gespielt“ entfernt im Moderationsmenü einen gespielten Wunsch; „Verwerfen“ entfernt beispielsweise einen nicht verfügbaren Titel. Es wird jeweils nur die ausgewählte Wunsch-ID entfernt. Appmanager benötigen für diese Moderationsaktionen zusätzlich die Radiomoderatorrolle oder den Channelinhaberstatus.

Diese Anleitung bündelt Installation, laufenden Betrieb und die [STREAMPANEL-Einrichtung](#streampanel-einrichten). Backendquellen liegen unter src/backend/, erzeugte Laufzeitkopien unter app/server/. Verbindlicher Upload bleibt C:/Users/Yves/Desktop/MischWerk/UPLOAD mit dem Appordner MischWerk/. Fünf Dateimanifeste unter deployment/manifests; keine ZIP-Dateien.



## Echte Abnahme

Nach vollständiger Übernahme Version, tatsächlich geladene Dateien und native Bedienung gemäß [LIVE-ABNAHME.md](LIVE-ABNAHME.md) prüfen. Lokale Tests belegen keine installierte Knuddels-Version. Der kontrollierte Inaktivitätstest des alten Clients und die Korrektur 223 stehen im [Prüfbericht](../pruefung/PRUEFBERICHT.md).

## Radio verwenden

Play startet den direkten HTTPS-Stream im nativen Audioelement. Ein neuer manueller Start beginnt mit höchstens 10 % Lautstärke; niedrigere Werte und Stumm bleiben erhalten. Während des Hörens ist die Lautstärke frei einstellbar. Stop trennt die Quelle und beendet weitere Versuche.

Kurze Nachladephasen behalten Quelle und vorhandenen Puffer. Nach einem echten Audioabbruch verbindet die App automatisch neu, solange der Hörer weiter hören möchte. Lautstärke und Mute bleiben dabei erhalten. Browserfreigabefehler verlangen einen bewussten Klick. Ein geschlossenes Knuddels-Dokument kann seinen Ton nicht selbst erhalten.

Titel-, Status- und Modusabfragen dienen ausschließlich der Anzeige. Auch ein gemeldeter Senderstopp schaltet Audio nicht ab und sperrt keinen manuellen Hörversuch. Der echte Audiotransport bestimmt den Wiedergabezustand. Der vorhandene Heartbeat sendet `/confirm` nur bei geprüftem Audiofortschritt und passender frischer Channelantwort. Kurze Engpässe verschieben seinen Termin nicht mehr endlos.

## Betrieb und Daten

Musikwünsche liegen ausschließlich in einer flüchtigen Queue; ein App-Neustart leert sie. Keine persönliche oder feste Gesamtanzahl-Begrenzung und keine Wartezeit. Ein Text bis 300 Zeichen, keine Links; der authentifizierte Nick stammt vom Server.

Nach Annahme erscheint die direkte Quittung. Eigener Song, Platz und Bearbeitungsstatus stehen privat in der Appleiste. Die Wunschbox bietet anschließend Weiteren Wunsch eingeben. Nur berechtigte Moderatoren sehen die vollständige Queue und fremde Absender. Wiederholte Übertragungskennungen erzeugen während derselben App-Sitzung keinen zweiten Wunsch.

Thema, Wunschboxfreigabe, Radio-Team, datierte Wochenpläne und Bot-Einstellungen bleiben gespeichert. Private Übergaben und Entwürfe sind flüchtig. Die App enthält keine Analyse-/Trackingbibliotheken. Audio- und Metadatenabrufe gehen an die konfigurierten öffentlichen Anbieteradressen.

## Moderation verwenden

- **Deine Sendung:** Anmeldung, Endzeit, Thema, Wunschboxfreigabe und Übergabe.
- **Musikwünsche:** vollständiger Text, Absender, Empfang und manuelle Bearbeitungsstufen. Gespielt oder Verwerfen entfernt den ausgewählten Wunsch; das steuert keinen Encoder.
- **Heute gespielt:** verfügbare Titelmeldungen des Tages mit vollständigen Textseiten.

Neue Anmeldung: zunächst sechs Stunden. Die eigene aktive Moderation wählt über **Endzeit ändern** ein zukünftiges Datum mit Uhrzeit in deutscher Zeit oder **Open End**. Nur bestätigte Werte gelten; Entwürfe bleiben bei Fehlern und Menüwechseln erhalten. Verlassen oder Rechteverlust beendet auch Open End. Ausdrückliche Abmeldung leert das gespeicherte Thema, automatisches Ende erhält es. Ohne Thema zeigt die Appleiste MischWerk Radio Show als reinen Standardtext.

Die Moderation startet mit 780 × 730 px und passt ihre Höhe an vollständige Bediengruppen an. Bei Clientgrenzen bleiben Gruppen-/Textseiten erreichbar. Themenbearbeitung erhält eine stabile Geometrie. Studioanmeldung und tatsächliche Anbieterübertragung sind unabhängige Zustände.

## Sendung an den nächsten Moderator übergeben

Die aktive Moderation wählt **Sendung übergeben**, einen anwesenden Radiomoderator beziehungsweise Channelinhaber und optional eine private Notiz bis 500 Zeichen. Bis zur Annahme bleibt sie aktiv. Der Nachfolger öffnet **Übergabe ansehen**, kann ein neues Thema eintragen und bestätigt mit **Jetzt übernehmen**. Erst dann wechseln Appstatus und öffentliche Botmeldung. Leeres Thema entfernt das bisherige Thema.

Ablehnen/Abbrechen ändern die Anmeldung nicht. Verlassen, Rechteverlust, Ablauf oder geänderte Moderationssitzung machen die Anfrage ungültig. Fehler erhalten den Entwurf; Wunschqueue und Wunschboxfreigabe bleiben erhalten. Encoderwechsel erledigen die Moderatoren selbst in ihrer Sendesoftware.

## Verwaltung und Bot-Texte

Nur der tatsächliche Channelinhaber darf Radiomoderatoren ernennen oder entfernen. Channelmoderatoren/Appmanager erhalten dadurch kein Studiorecht. Die Verwaltung öffnet mit 560 × 630 px.

Unter **Bot-Texte** stehen bis zu sechs Texte mit je 300 Zeichen zur Verfügung. Automatisch senden ist zunächst aus; Abstände: 20, 30, 40 oder 50 Minuten. Gefüllte Texte laufen der Reihe nach, leere Felder werden übersprungen. Speichern beginnt einen vollen Abstand; verpasste Termine werden nicht nachgeholt. Eine Inhaltsfläche scrollt, Kopf/Reiter/Aktionen bleiben erreichbar.

## Tageshistorie verwenden

**Moderation → Heute gespielt** ist nur für Channelinhaber und ernannte Radiomoderatoren verfügbar. Titelmeldungen gelten für heute in Europe/Berlin. Beim Öffnen erscheinen die neuesten Titel auf der letzten Seite; Zurück führt zu älteren, Weiter zu neueren Titeln. Lange Texte sind vollständig auf Fortsetzungsseiten lesbar.

Im sichtbaren Reiter wird nach Erfolg alle 15 Sekunden, nach Fehlern nach 60 Sekunden erneut gelesen. Geladene heutige Titel bleiben bei Fehlern erhalten; an Berliner Mitternacht beginnt die Liste neu. Rechteverlust beendet Abrufe und leert den Cache. Bekannte Senderjingles werden per vollständigem Titelvergleich ausgefiltert. Senderzeit und hörbarer Beginn können abweichen; kein vollständiges Tagesarchiv und keine privaten Musikwünsche.

## STREAMPANEL einrichten

Aktiver Anbieter ist STREAMPANEL/SPCast. Bestätigte öffentliche Höreradresse: **https://mischwerk.sp.radio.fm/stream**. Sie leitet beim Aufbau per HTTPS auf den eigenen SPCast-Stream weiter. Beim datierten Kontrolllauf am 05.11.2026 wurde MP3 mit 320 kbit/s empfangen; diese Momentaufnahme ist keine dauerhafte Verfügbarkeitsgarantie.

Konfiguration: `src/backend/config.js`, `MischWerkConfig.streampanel`.

| Feld | Bedeutung |
| --- | --- |
| `streamUrl` | Öffentliche HTTPS-Höreradresse |
| `allowedHosts` | Exakt erlaubte öffentliche Datenhosts |
| `metadata` | Getrennte Titel-/Interpretenfelder und ergänzende Modusquelle |
| `status` | SPCast-Statistik mit Stream-, Pfad- und Stationszuordnung |
| `historyUrl`, `historyIgnoredTitles` | Öffentliche Titelhistorie und vollständige Jinglefilter |

Statistik: `/statistics?json=1` am eigenen Hörerhost, Stream-ID 1 und `/stream`. Modus: `/scripts/whoIsLive.php`, ausschließlich `autodj`/`live`; andere Werte bleiben unbekannt. Titel/Interpret kommen aus dem tatsächlich eingebundenen öffentlichen SPCast-Playerdienst. Einmal fehlende Titel sind kein dauerhafter Istzustand. [Quellen und Schnittstellennachweise](../api/API-NACHWEIS.md).

Status, Modus und Metadaten steuern kein Audio. Keine zusätzlichen Statusabrufe bei Medienereignissen. Sichtbare Titel-/Modusabfragen regulär alle fünf Sekunden nach Abschluss, Status alle 30 Sekunden; Fehler und Sichtbarkeitswechsel werden getrennt behandelt. Eine Studioanmeldung bestätigt keinen Anbieter-LIVE-Modus.

Encoder-Host, Passwort, Benutzer und Mountpoint gehören nur in die Sendesoftware. Die App benötigt keine Anbieterzugangsdaten. `node tools/checks/streampanel.cjs` prüft die eigenen öffentlichen Quellen ausdrücklich lesend; kein automatischer Bestandteil des Radiohörens.

## Website

Die [Homepage](../../website/README.md) liegt außerhalb des Knuddels-UPLOAD. Appanschluss standardmäßig aus, bewusste Besitzerfreigabe nötig. Der Arbeitsbereich verwendet bestehende Rollen/Fachaktionen. Mailversand bleibt aus. Hosting, HTTPS und echte Kopplung separat abnehmen: [Anbindung](../../website/docs/ANBINDUNG.md).

[Sendeplan](SENDEPLAN.md) · [Lautstärke](LAUTSTAERKE.md) · [Native Abnahme](LIVE-ABNAHME.md).
