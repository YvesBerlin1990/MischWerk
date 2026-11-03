# MischWerk – Installation, Betrieb und STREAMPANEL

Lokaler Stand 0.1.146 mit einer Tageshistorie ausschließlich für berechtigte Radiomoderatoren und den Channelinhaber unter **Moderation → Heute gespielt** sowie öffentlichem SPCast-MP3-/Titelanschluss, Übertragungsstatus und Sendemodus; bestätigtes LIVE 0.1.132: Nach dem noch ausstehenden Update bestätigt der Nutzer wieder normale Darstellung in Knuddels. Die öffentliche HTML-/JS-/CSS-Auslieferung wurde am 03.11.2026 um 11:54 Uhr Europe/Berlin mit 62/62 passenden Dateihashes bestätigt. Details und Grenzen stehen in der [LIVE-Abnahme](LIVE-ABNAHME.md).

0.1.131 entfernt nach Nutzungsabgleich ausschließlich eine unbenutzte Formularregel.

0.1.130 bereinigt unbenutzte Fensterreste bei unveränderten Channel-Overlays, Wunschversand und Browser-prefetch.

0.1.129 ergänzt die korrigierte SDK-Übergabe um Schutz gegen doppelte/verspätete erfolgreiche Öffnungsaufträge, Wiederaufnahme früher verlorener Wechselvorbereitung und eindeutige Behandlung nachgelagerter Mitteilungsfehler. Im Zielclient nach separat autorisierter Veröffentlichung auch schnelle Klickfolgen, Wiederöffnen, Entwurfsübernahme und unverändertes Audio prüfen. Der aktuelle lokale Upload bleibt der feste Desktop-UPLOAD.

Historische native Beobachtung vom 03.11.2026: Windows-STAPP startet tatsächlich LIVE 0.1.127. Die lokale Korrektur 0.1.128 baut die vollständige Oberfläche und erste Maße vor der SDK-Ladeübergabe auf. Nach separat autorisierter Veröffentlichung den ersten sichtbaren Frame aller vier Overlays mit kaltem und warmem Cache prüfen; ältere Befunde sind keine native Abnahme von 0.1.128.

Lokaler Stand 0.1.146 mit öffentlichem STREAMPANEL-Anschluss und Tageshistorie. Am 02.11.2026 direkt in der bestehenden Windows-STAPP-Sitzung Otterchen/MischWerk geprüft: LIVE 0.1.123 mit bedienbarer Oberfläche und bestätigter Wunschübertragung. Umfang und offene Abnahmefälle stehen im [Prüfbericht](../pruefung/PRUEFBERICHT.md). Weiterhin kein Upload/Update/Neustart ohne erneute ausdrückliche Nutzeranweisung.

Vorhang 0.1.103 nach einem später autorisierten vollständigen Upload mit getrennten echten Nutzern prüfen: normaler Hörer zunächst verhüllt, Otterchen und Polaroid unverhüllt. Nur Otterchen als Channelinhaber sieht Vorhang öffnen/schließen; beide Richtungen aktualisieren alle Radioleisten und bleiben nach Neustart erhalten. Vorwertfehler dürfen keinen fremden Zustand überschreiben. Werbung startet/stoppt nur nach lokalem Hörer-Klick, lädt die eigene MP3 erst dann und verändert den Vorhang nicht. Audioende öffnet nichts; das globale Umschalten unterbricht keine laufende Wiedergabe. MP3, server/radio/curtain.js und alle Manifestdateien vollständig übertragen. Native Audiofreigabe in K3/STAPP bleibt Bestandteil der echten Abnahme.

Den ersten Channelbeitritt, erneuten Beitritt mit Cache und ersten Aufruf nach Appupdate separat echt prüfen. Dateien werden während des HTML-Parsens angefordert; die Zusammensetzung erfolgt nach vollständigem Markup am Bodyende, DOMContentLoaded dient als Rückfall. Die Radioleiste lädt ihren eigenen Plan einschließlich des erhaltenen Wunschcontrollers; die Wunschoberfläche öffnet als natives Channel-Overlay. Gemeinsame Channel-Overlays für Moderation, Radio-Team und Sendeplan sowie alle Rollen ohne Audioabbruch prüfen. Das Logo darf nachladen; seine Fläche bleibt reserviert. Lokale Browserprüfungen ersetzen keine Zeitmessung des echten Knuddels-Starts.

Seit 0.1.94 erneuert der Updatebefehl nach erfolgreichem Dateiabruf auch bei leerer Dateiliste den dokumentierten Oberflächen-Cache. Beim Appstart erfolgt dies vor dem Öffnen der Ansichten. Fehlende neue Dateien lösen weiterhin keinen Neustart aus. Laufende Version im App-Log prüfen und Radio-Team → Statuszentrale schließen und neu öffnen. Vollständiges Paket und korrektes FTP-Ziel bleiben Voraussetzung.

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

Aus PROJEKT/ mit **node tools/build/prepare-upload.cjs** die Bereitstellung prüfen und den verbindlichen Desktop-Upload aktualisieren. **node tools/checks/upload.cjs** gleicht alle 101 Laufzeitdateien einschließlich 31 Servermodulen, Größen, SHA-256 und Textgrenzen mit den fünf Manifesten ab. Der Build erzeugt keine zweite Uploadkopie und veröffentlicht nichts. main.js allein enthält keine App-Fachlogik. Tests, Referenzstubs, Dokumentation und Zugangsdaten gehören nicht ins FTP-Ziel.

Nach einem gesonderten Uploadauftrag:

1. In FileZilla mit den obigen Angaben verbinden. Rechts /ftp, links C:/Users/Yves/Desktop/MischWerk/UPLOAD öffnen. Den lokalen Ordner MischWerk nach /ftp übertragen. Direkt unter /ftp/MischWerk müssen main.js, app.config, server/ und www/ liegen; kein zusätzliches MischWerk/MischWerk. Fremde Appordner erhalten. Vor einem Produktivupdate bestehende Dateien und AppPersistence sichern.
2. Das Ende aller Manifestübertragungen abwarten, einschließlich www/audio/werbung.mp3 und sämtlicher server/-Module. Eine leere FileZilla-Warteschlange und erfolgreiche Übertragungen prüfen; anschließend kann noch Plattform-Synchronisationszeit nötig sein.
3. Bei Erstinstallation als Otterchen im eigenen Channel /apps öffnen, App installieren und 30807196.MischWerk eintragen. Knuddels ergänzt das bestätigte Präfix. Falls nötig den bestätigten AppBot einrichten; anschließend die App starten. Bei bestehender Installation den unten beschriebenen /update-Weg verwenden. Beim erstmaligen Wechsel von einem Stand vor 0.1.36 einmal über /apps aktualisieren.
4. Die tatsächlich gestartete Version im App-Log bestätigen: lokal ist 0.1.146 vorbereitet. Die Startmeldung nennt die Radioleiste mit vier Channel-Overlays. Radioleiste bei Bedarf mit /mischwerk erneut öffnen; bestehende Statusfenster nach Updates schließen und neu öffnen.

Für eine ausdrücklich angeforderte Auslieferungsabnahme anschließend aus PROJEKT/ **pnpm run check:delivery --base-url https://apps8.knuddels.biz/apps/de2635007/** ausführen. Die hier am 03.11.2026 beobachtete öffentliche Basisadresse bei einem Appwechsel erneut prüfen. Das Werkzeug lädt ausschließlich öffentliche HTML-/JS-/CSS-Dateien lesend und vergleicht deren tatsächliche SHA-256 mit den lokalen Appbytes. Fehlende Dateien oder alte Fassungen liefern Exitcode 1; vollständig passende Dateien Exitcode 0. Keine Benutzer-/Sitzungsdaten oder Zugangsdaten angeben. Betriebsvorgaben bleiben zentral in AGENTS.md.

Die offizielle API übernimmt mit /update keine noch laufende Übertragung als vollständig. Meldet sie keine neuen Dateien, werden keine weiteren Dateien übernommen und kein Neustart erzwungen; dies beweist keinen vollständigen Upload. Dann Zielpfad, alle Dateien, tatsächliche Logversion und erneutes Öffnen nach Cacheerneuerung prüfen. Eine höhere lokale Versionsnummer überträgt keine Dateien.

Aktiver Entwicklerzugang und Channelbesitz sind Voraussetzung; Verifizierung und Entwickler-AGB erledigt der Kontoinhaber über /apps developer. Zielclients sind K3 und die aktuelle Knuddels-Desktop-App; JFX ist ausgeschlossen. iOS benötigt laut Plattform eine separate gültige Apple Developer ID, keine Knuddels-Entwicklernummer. Die offiziellen Unterlagen empfehlen DEV vor LIVE; hier ist auf Nutzerauftrag LIVE vorbereitet, eine reale Abnahme bleibt separat.

[Projektstruktur](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur) · [Erste Schritte](https://github.com/knuddelsgmbh/UserApps/wiki/Erste-Schritte) · [FAQ](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ) · [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html) · [Entwicklerportal](https://developer.knuddels.de/).

## Appmanager-Befehl ab 0.1.36

Nach einmaligem vollständigem Einspielen und Aktualisieren auf 0.1.36 können Appmanager sowie Channelinhaber im Channel `/update` eingeben. Bei späteren Versionen zuerst alle Dateien des neuen Manifests einschließlich `server/` vollständig hochladen und den Abschluss des FTP-Programms abwarten, dann `/update` verwenden. Der Befehl übernimmt mit `updateAppFiles()` die auf dem Knuddels-FTP angekommenen Änderungen. Nur wenn die API mindestens eine neue Datei meldet, wird das vollständige Update mit Neustart angefordert; andernfalls bestätigt MischWerk, dass keine neuen Dateien gefunden wurden, und läuft ohne Neustart weiter. Die Prüfung erkennt keinen noch unvollständigen Upload, deshalb bleibt die vollständige Manifestübertragung zwingend. Die gemeldeten Sekunden sind eine Schätzung; bei Serverlast kann das Update später erfolgen. Ein bereits angeforderter Auftrag wird nicht wiederholt angelegt. Die laufende Wunschqueue bleibt bis zum tatsächlichen Neustart nutzbar und beginnt danach leer. Persistente Einstellungen und Radio-Team bleiben erhalten.

„Erledigt“ entfernt im Moderationsmenü einen gespielten Wunsch; „Verwerfen“ entfernt beispielsweise einen nicht verfügbaren Titel. Es wird jeweils nur die ausgewählte Wunsch-ID entfernt. Appmanager benötigen für diese Moderationsaktionen zusätzlich die Radiomoderatorrolle oder den Channelinhaberstatus.

Diese Anleitung bündelt Installation, laufenden Betrieb und die [STREAMPANEL-Einrichtung](#streampanel-einrichten). Backendquellen liegen unter src/backend/, erzeugte Laufzeitkopien unter app/server/. Verbindlicher Upload bleibt C:/Users/Yves/Desktop/MischWerk/UPLOAD mit dem Appordner MischWerk/. Fünf Dateimanifeste unter deployment/manifests; keine ZIP-Dateien.

## Echte Abnahme

- Otterchen als tatsächlicher Channelbesitzer: Studio sichtbar, An-/Abmeldung möglich.
- Normaler Hörer: kein Studio; auch selbst gesendete Moderations-Events werden abgewiesen.
- Channel-CM: kein automatischer Studiozugriff. Als Channelinhaber das Radio-Team-Overlay öffnen, einen existierenden Nick ernennen, Studiozugriff prüfen, wieder entfernen und den sofortigen Rechteentzug testen. Ernennung nach Neustart auf Persistenz prüfen.
- Zuerst einen YouTube-/sonstigen Link ablehnen lassen (Entwurf erhalten, kein Wunsch). Dann einen Wunsch als Interpret + Titel im einzigen Textfeld schicken: Der Hörer muss deutlich „Dein Musikwunsch wurde an die Moderation gesendet.“ sehen. In der Wunschbox ausschließlich eigene offene Texte und ihren Platz prüfen; mit zwei Hörern sicherstellen, dass fremde Texte/Nicks verborgen bleiben. In der Moderation Gespielt und Verwerfen prüfen: nachfolgende eigene Plätze rücken nach. Radioleiste nennt den nächsten eigenen Platz, auch bei deaktiviertem Formular. Erneutes Öffnen, mehrere eigene Seiten, Verbindungsabbruch und App-Neustart (Queue leer) prüfen. Die vollständige Queue darf ausschließlich im Moderationsfenster erscheinen; dort richtigen Hörer-Nick und vollständigen Text prüfen und als Moderator bearbeiten. Andere Hörer dürfen weder fremde Queueeinträge noch private Wunschhistorie sehen. Die Sender-Titelhistorie unter Heute gespielt ist seit 0.1.139 ebenfalls ausschließlich über das berechtigte Moderationsmenü erreichbar.
- Wunschannahme in der Moderation deaktivieren: Form und Backend müssen Wünsche ablehnen. Wieder öffnen und erneut prüfen.
- Im Studio Thema wie „80er und 90er“ speichern: in der Radioleiste anderer Hörer prüfen; Thema nach Neustart erhalten. Erfolgreich ausdrücklich abmelden: Thema muss ohne getrenntes Speichern bei allen Ansichten verschwinden, die Wunschqueue bleibt erhalten. Abgewiesene/fehlgeschlagene Abmeldung sowie automatisches Ende durch Verlassen, Ablauf oder Rechteverlust behalten das Thema. Feld leeren und speichern entfernt es weiterhin. Normalen Hörern keine Themenänderung erlauben; bei Fehler Entwurf erhalten.
- App neu starten: Wunschbox-Status und Thema bleiben erhalten; die flüchtige Wunschqueue beginnt leer.
- Echten Stream mit Klick starten, Lautstärke prüfen, stoppen und nach Netzwerkunterbrechung erneut starten.
- STREAMPANEL-Senderstatus prüfen: `started` gibt Play frei, `stopped` zeigt „Sendepause“ und sperrt Play, ein unbekannter oder nicht erreichbarer Status erlaubt einen manuellen Hörversuch. Ein Wiederanlauf darf niemals automatisch Audio starten.
- Radiowiedergabe ohne Pegelanzeige prüfen: keine Balken oder Ruhe-/Ersatzmeldung, kein leerer reservierter Bereich. Titel/Interpret, kurze Lautstärke, Stummschaltung und tatsächlichen Wiedergabestatus testen. Overlay-/Ansichtswechsel dürfen laufenden Ton nicht unterbrechen; Seitenende stoppt die Wiedergabe.
- Titelwechsel mit dem echten Sender vergleichen; Stream und Metadaten können zeitversetzt sein.
- K3 auf Desktop und Mobilgerät: kleine Ansicht, Tastatur, Scrollen, Channelwechsel, Hintergrundbetrieb und Schließen prüfen.

Die Wunschbox öffnet als natives Overlay oben rechts im Channel. Die Radioleiste erhält dafür keine zusätzliche Höhe. Entwurf, ausstehende Bestätigung, private Positionen und Wiedergabe bleiben im bestehenden Radio erhalten. Radio-Team passt seine Höhe an den Inhalt an; drei Mitglieder pro Seite und einzeln durchblätterbare Details. Die Hörerzahl ist vorerst vollständig entfernt. Der öffentliche STREAMPANEL-Produktanschluss ist eingerichtet; tatsächliche Anbieter- und native Abnahmen sind im aktuellen Prüfbericht getrennt ausgewiesen.

Seit 0.1.115 stehen Anfangslayout und nötige Studio-Reiter vor Sichtbarkeit fest. Team und STAPP-Sendeplan behalten ihre anfänglich bestimmte Bildschirmgrenze, damit Hostgrößenrückmeldungen keine Schrumpfschleife auslösen. Der erste notwendige Größenwechsel und Änderungen an Inhalten bleiben möglich; ein nachladendes Logo löst keinen weiteren Wechsel aus. Öffnung in K3/STAPP nach vollständigem Upload separat gemäß LIVE-ABNAHME.md prüfen.

## Betrieb und Daten

Es gibt weder eine persönliche noch eine feste Gesamtanzahl-Begrenzung, keine Zwei-Wünsche-Grenze und keine Wartezeit. Während die App läuft, werden Wünsche serverseitig einzeln paginiert; ein App-Neustart leert diese Queue bewusst.

Wünsche werden nicht gespeichert. Die laufende Queue hält nur den authentifizierten Nutzer, dessen Nick, Wunschtext, Zeitpunkt und technische Übertragungs-ID im Arbeitsspeicher der App. Der Hörer erhält die direkte Versandbestätigung und ausschließlich seine eigenen offenen Wunschtexte mit Positionen. Die vollständige Queue, fremde Nicks und Bearbeitung erscheinen ausschließlich für berechtigte Moderatoren im Moderationsfenster. Die Liste ernannter Radiomoderatoren speichert weiterhin ausschließlich numerische Knuddels-User-IDs in AppPersistence; sichtbare Nicks werden serverseitig aufgelöst. Die App verwendet keine Analyse- oder Trackingbibliotheken. Beim konfigurierten Sender gehen Stations-/Metadatenanfragen und beim Abspielen der Streamabruf an STREAMPANEL.

Seit 0.1.34 besitzt die Wunschbox einen auf Rhino-Grundoperationen reduzierten Laufzeitweg aus reinen JavaScript-Werten. Das Frontend sendet `mw:wish.submit` mit `submissionId` und Text; das Backend reiht ID, Nick, Text und Zeitpunkt ohne AppPersistence- oder Java-Objekt ein und quittiert unmittelbar über `mw:wish.receipt`. Eine wiederholte `submissionId` erzeugt während der gesamten laufenden App-Sitzung keinen zweiten Wunsch. Nachgelagerte UI-Aktualisierungen können die Annahme nicht mehr in einen Fehler umwandeln. Backend und Frontend deshalb bei einem später freigegebenen Update gemeinsam vollständig hochladen und die App anschließend kontrolliert neu starten.

Eine Studio-Anmeldung läuft nach 6 Stunden aus. Sie weist aus, wer sich in dieser App angemeldet hat; sie erkennt keinen Encoder oder echten Sendebeginn bei STREAMPANEL. Ein Moderatorwechsel in STREAMPANEL muss auch im App-Studio übernommen werden.

Vor einem Produktivupdate AppPersistence sichern. `autoUpdate = false` ermöglicht einen kontrollierten Neustart nach vollständigem Upload. Die ausführlichen API- und K3-Regeln stehen dauerhaft in `AGENTS.md`.

## Sendung an den nächsten Moderator übergeben

Die aktive Moderation verwendet im Moderationsmenü den Button „Sendung übergeben“ direkt unter Anmeldung/Abmeldung in der Mikrofon-Karte, wählt einen anwesenden Radiomoderator aus und fragt die Übergabe an. Bis zur Annahme bleibt sie ON AIR. Der Nachfolger erhält einen privaten Hinweis und öffnet „Übergabe ansehen“. Dort kann er sein neues Sendungsthema bis 80 Zeichen eintragen und mit „Jetzt übernehmen“ bestätigen; leer lassen entfernt das bisherige Thema. Erst dann wechselt die App den angezeigten Moderator und sendet die gemeinsame öffentliche Botmeldung. Die Wunschliste und der Wunschboxschalter bleiben erhalten.

„Ablehnen“ und „Übergabe abbrechen“ ändern die bisherige Anmeldung nicht. „Zurück zum Studio“ lässt eine offene Anfrage bestehen. Bei Verlassen des Channels, Rechteverlust, Ablauf oder geänderter Moderationssitzung verfällt sie. Nach einem App-Neustart gibt es keine offene Übergabe mehr. Bei Speicherfehler kann der Nachfolger mit erhaltenem Themenentwurf erneut bestätigen. Der Channelinhaber kann weiterhin eine Moderation ausdrücklich beenden; die direkte Übernahme einer fremden laufenden Sendung ist gesperrt. Den Encoderwechsel führen die Moderatoren in ihrer Radiosoftware durch und bestätigen passend dazu in MischWerk.

## STREAMPANEL einrichten

### Aktueller Zustand

Seit 0.1.134 ist die vom Nutzer gezeigte öffentliche Höreradresse https://mischwerk.sp.radio.fm/stream eingetragen. Der Abruf bestätigt MP3 mit 320 kbit/s und eine funktionierende HTTPS-Weiterleitung nach mischwerk.spcast.eu. Die Titelquelle stammt aus dem eigenen öffentlichen HTML5-Player und verwendet getrennte currentSong-/currentArtist-Felder. Aktuell meldet sie keinen Titel und als Interpret Unknown. HTTP-/CORS- und stumme Edge-Decoderprüfung bestanden; echter Titelwechsel und native Knuddels-Wiedergabe sind noch abzunehmen.

Seit 0.1.135 ist außerdem https://mischwerk.sp.radio.fm/statistics?json=1 für die Übertragungsprüfung eingerichtet: Stream-ID 1, Pfad /stream und Stationsidentität bestimmen den Eintrag. Der eigene Playerdienst https://mischwerk.sp.radio.fm/scripts/whoIsLive.php bestätigt bei exakt autodj/live den Sendemodus; andere Modi bleiben unbekannt. Tatsächlich im HTTP-/Edge-CORS-Test gelesen: started, 0 Hörer, AutoDJ. Knuddels-Moderation, Sendeplan und Wunschübertragung bleiben davon unabhängig.

Ein bestätigter Sendestopp sperrt Play und entfernt die laufende Audioquelle. Statusprüfung alle 30 Sekunden nach Antwort und zusätzlich sofort bei waiting/stalled bzw. Medienfehler; HTTP-Antwort und Quellenverzögerung kommen zum Prüftakt hinzu. Bei Wiederanlauf wird Play freigegeben, kein Ton automatisch gestartet. Ein bloßer Datenabruf-/Netzwerkfehler bestätigt keinen Stopp und unterbricht laufendes Audio nicht. Bei Rückkehr aus dem Hintergrund sofort neu prüfen.

### Was die offizielle Recherche bestätigt

STREAMPANEL setzt SPCast ein. SPCast verwendet eine eigene Engine und HLS; kompatible Shoutcast-/Icecast-Eingänge sind kein Beleg für deren Status-APIs. Die offizielle HTML5-Player-Anleitung zeigt auch einen öffentlichen direkten HTTPS-Audiostream für ein natives Audioelement. Dieser ist für MischWerk inzwischen tatsächlich geprüft. Platzhalter aus Anbieterbeispielen sind keine MischWerk-Adressen.
https://www.streampanel.net/webradio-hosting/
https://www.spcast.eu/en/what-is-spcast/
https://www.spcast.eu/html5-player/
https://www.spcast.eu/faq/allgemein/einrichtungstutorial/

Eigene Playerdaten und das tatsächlich eingebundene Anbieterskript bestätigen Titel- und Modusquelle. Die Statistikroute wird im offiziellen SPCast-Update 0.9.9.094 ausdrücklich veröffentlicht und ist am eigenen MischWerk-Host samt Schema und CORS geprüft. Die PushAPI für radio.de/TuneIn bleibt ein ausgehender Meldedienst und wird nicht als Statistik-Lesequelle verwendet.
https://community.streampanel.net/d/320-spcast-version-099094
https://www.spcast.eu/produktbilder/
https://www.spcast.eu/radio-metadata-api-integration/

### Bestätigte und noch offene öffentliche Angaben

1. Bestätigt: https://mischwerk.sp.radio.fm/stream, audio/mpeg, 320 kbit/s. Der im Screenshot veraltete /stream256-Anschluss und der Encodermount /stream_live werden nicht verwendet.
2. Bestätigt: https://mischwerk.sp.radio.fm/ und dessen tatsächlich eingebundenes Anbieterskript. Keine fremde Playerimplementierung übernommen; das vorhandene native Audioelement bleibt erhalten.
3. Titel/Interpret bestätigt: https://scripts.streampanel.net/spcast/player/default/api.php?url=mischwerk.spcast.eu&userid=8884&historic=true mit currentSong/currentArtist. Die Kennung ist öffentlich im Player enthalten. Getrennte Titel-/Interpretenfelder bleiben erhalten; kein Aufteilen an Bindestrichen. Die Quelle liefert aktuell keinen Titel; tatsächlichen Titelwechsel noch prüfen.
4. Statistik und Sendemodus sind oben bestätigt und konfiguriert. Unbekannte Modi oder unbestätigte Daten bleiben unbekannt; die Knuddels-Studioanmeldung wird unabhängig angezeigt. Den echten Sender für lokale Tests nicht stoppen; Stopp-/Rückkehrnachweise sind bisher simuliert.

Encoder-Host, Port, Benutzer, Passwort und Mountpoint gehören ausschließlich in die Sendesoftware. Diese Angaben werden NICHT für die App benötigt. Zugangsdaten nicht in Screenshots/Playerlinks übernehmen. Unterstützung: https://www.streampanel.net/kontakt/
Offizielle Störungsübersicht: https://status.streampanel.net/

### Konfiguration

In src/backend/config.js unter MischWerkConfig.streampanel:

- streamUrl: bestätigte öffentliche HTTPS-Audioadresse
- allowedHosts: zusätzliche exakte öffentliche Hostnamen der JSON-Daten; Streamhost wird automatisch zugelassen
- metadata: url, titleField, artistField, liveField sowie ergänzend modeUrl
- status: url, valueField, onlineValue, offlineValue; identityField und identityValue zur Antwortzuordnung. Für das bestätigte SPCast-Format zusätzlich format=spcast-statistics, streamId und streamPath

Feldpfade dürfen verschachtelte Objekte mit Punkten benennen. Arraypfade und Skriptausdrücke sind bewusst nicht vorgesehen. Statuswerte werden ohne automatische Typumwandlung verglichen.

Dies ist eine interne Zuordnung tatsächlich bestätigter öffentlicher Produktdaten. Es werden weder Endpunkte aus Radio-ID/Hostname abgeleitet noch fremde Demosender eingetragen. Fehlende optionale Felder bleiben leer. Die direkte Audioadresse funktioniert unabhängig von fehlenden JSON-Quellen. Unverfügbare Daten bleiben unbekannt. Ein künftig bestätigter Offline-Status stoppt Audio; ein bloßer Abfragefehler nicht.

### Abnahme nach Erhalt

- Echte öffentliche Werte eintragen, Backend bauen, volle Prüfungen und Paketbau ausführen.
- node tools/checks/streampanel.cjs prüft lesend Audio/zugeordnete JSON-Quellen. Ohne Konfiguration meldet es ausstehend bei null Netzabrufen. Node-HTTP-Nachweise beweisen weder Browser-CORS noch Audio-Decodierung in K3.
- Im Browser und danach im autorisierten Knuddels-/K3-/STAPP-Test: bewussten Play-Klick, Codec, HTTPS, Weiterleitungen, CORS, Titelwechsel, echte Null, Stopp, Wiederanlauf ohne Autostart, Hintergrund/Rückkehr und Fehler ohne Audioabbruch prüfen.
- Bei ausschließlich HLS/MSE: tatsächlichen offiziellen Playerweg und Zielclient-Unterstützung gesondert integrieren und prüfen. Die direkte HTML-Audio-Vorbereitung allein ist dafür kein Kompatibilitätsnachweis.
- Die Moderatoren konfigurieren ihre Sendesoftware separat im neuen Anbieter; MischWerk steuert keinen Encoder oder AutoDJ.
- Erst nach eigenem Auftrag vollständig hochladen und Knuddels aktualisieren. Ein echter App-Neustart leert die flüchtige Wunschqueue; ein bloßes Öffnen/Schließen des Wunsch-Overlays erhält Sitzung, Entwurf und Wiedergabe.

Die vollständige reale Funktionsabnahme steht in [LIVE-ABNAHME.md](LIVE-ABNAHME.md), Sendeplan und Lautstärke in [SENDEPLAN.md](SENDEPLAN.md) und [LAUTSTAERKE.md](LAUTSTAERKE.md). Schnittstellen und Herkunft der öffentlichen Daten: [API-NACHWEIS.md](../api/API-NACHWEIS.md).

Seit 0.1.116 verwendet die Wunschbox AppContent.overlayContent. Native Platzierung und Clientunterstützung separat prüfen. Ausdrückliches Schließen übernimmt zuerst die letzte Eingabe im Radio; bleibt die Verbindung aus, bleibt diese Eingabe mit Hinweis sichtbar. Die lokale Channel-Vorschau unter /channel.html modelliert getrennte Header-/Overlayframes.

Moderation startet mit 780 × 600 und misst vor Sichtbarkeit die tatsächliche Inhaltshöhe. Seit 0.1.118 sind es mit zugeklapptem Assistenten lokal rund 662 px; Anmeldung, Wunschtext, Themenfeedback und Übergabe dürfen das Fenster passend ändern. Stabile Höhengrenzen verhindern Größenkaskaden; kleinere oder ignorierte Hostrahmen behalten Reiter und Scrollbarkeit.

## Tageshistorie verwenden

Als Channelinhaber oder ernannter Radiomoderator **Moderation → Heute gespielt** wählen. Normale Hörer, Channelmoderatoren und Appmanager ohne eigene Ernennung erhalten keine Historie; der öffentliche Sendeplan zeigt nur den Kalender. Angezeigt werden verfügbare Titelmeldungen des aktuellen Tages in deutscher Ortszeit, neueste zuerst, höchstens sechs pro Seite passend zur verfügbaren Overlayfläche. Ohne Scrollen über Zurück/Weiter lesen; sehr lange Titel werden vollständig auf Fortsetzungsseiten verteilt. Aktualisieren lädt ausdrücklich neu; bei sichtbarem Reiter erfolgt außerdem alle 15 Sekunden nach Abschluss ein Abruf. Bei Störung bleiben bereits geladene heutige Titel stehen, an Mitternacht beginnt die Liste neu. Sendesteuerung, Wunschpult und ungespeichertes Sendungsthema bleiben beim Reiterwechsel erhalten; Kalenderentwürfe bleiben beim Bereichswechsel erhalten. Beim Entzug der Moderationsrechte werden geladene Historientitel gelöscht und Abrufe beendet. Bereichswechsel und erneutes Öffnen verwenden weiterhin die vorhandene gemeinsame Oberfläche.

Die öffentliche Quelle ist eingerichtet; in den gezeigten Streampanel-Darstellungsfeldern muss nichts ausgefüllt werden. Die Nachprüfung am 03.11.2026 um 13:55 Uhr bestätigt echte Liednamen und Titelwechsel. Die beiden bekannten Senderjingles Mischwerk dein Radio und Dein Mix auf Mischwerk werden seit 0.1.137 aus der Historie ausgefiltert; ähnlich benannte Musiktitel bleiben erhalten. Wenn ausschließlich leere/Unknown-Meldungen vorliegen, bleibt die Liste korrekt leer. Die Uhrzeit gehört zur Titelmeldung des Senders und kann vom hörbaren Start abweichen. Umfang und Aufbewahrung des Anbietercaches sind nicht zugesichert; die Liste ist kein vollständiges Tagesarchiv. Sie enthält keine privaten Musikwünsche.

## Moderation verwenden

Das Moderationsmenü enthält seit 0.1.118 drei Ergänzungen:

- **Wunschregie:** Vorbereiten markiert einen Wunsch, ohne seinen Platz zu ändern. Für den vorbereiteten Wunsch auf Platz 1 lässt sich Läuft gerade markieren, sobald der Song tatsächlich läuft. Gespielt oder Verwerfen entfernt ihn und lässt die Folgeplätze nachrücken. Der Hörer sieht ausschließlich den Status seiner eigenen offenen Wünsche. Die Markierung startet keine Musik.
- **Sendungsassistent:** Unter der Sendesteuerung aufklappen. Laufzeit, passendes Zeitfenster und nächste Moderation werden aus Anmeldung und Sendeplan angezeigt. Zehn und fünf Minuten vor dem geplanten Ende erscheint ein Hinweis, bei Überziehung bleibt er bis zum Ende/Wechsel der tatsächlichen Moderation sichtbar. Ohne passenden Plan gibt es keine erfundene Restzeit. Das geplante Thema lässt sich als Entwurf übernehmen und anschließend ausdrücklich speichern; einen eigenen offenen Entwurf zuvor speichern oder verwerfen. Sendeplanänderungen bleiben dem Channelinhaber vorbehalten.
- **Übergabenotizen:** Vor der Anfrage optional bis zu 500 Zeichen angeben. Absender und ausgewählte nächste Moderation sehen den Hinweis. Nach erfolgreicher Annahme öffnet er sich beim Empfänger im Sendungsassistenten und bleibt während der übernommenen Sendung verfügbar. Fehler erhalten die Eingaben. Hinweise sind flüchtig und enden mit der Sendung, Nutzerlöschung oder Appneustart.

Der Assistent liest die aktuelle und folgende Kalenderwoche sowie nötige Fortsetzungen. Zeitangaben folgen deutscher Ortszeit. Bei fehlender Verbindung oder nicht lesbarem Plan wird dies angezeigt; weder Abmeldung noch Übergabe oder Audiowiedergabe werden automatisch ausgeführt. Die neue fünfte Manifestdatei manifest-studio.json ist ein lokaler Dateinachweis und gehört wie die übrigen Manifeste nicht auf den App-FTP.

Radio-Team seit 0.1.119: Beide Reiter teilen dieselbe benötigte Fensterhöhe und denselben Kopf. Beim Wechsel bleibt der Rahmen ruhig; geöffnete Statusdetails, Nickentwurf und eine noch nicht bestätigte Zugriffsentziehung bleiben erhalten. Inhaltliche Änderungen und Breitenwechsel passen die gemeinsame Höhe weiterhin an. Bei echten Clientgrenzen sind Inhalte nativ erreichbar.

Seit 0.1.124 stehen Platznummer und vollständiger eigener Wunsch oberhalb der Eingabe. Mehrere eigene Wünsche einzeln über Vor/Zurück ansehen. Nach bestätigtem Versand öffnet Weiteren Wunsch eingeben das Formular erneut; die Platzinformation bleibt erhalten. Der Overlayrahmen folgt der benötigten Höhe ohne inneren Scrollbereich. Echte Clientgrenzen und extrem lange gleichzeitige Entwürfe bleiben nativ erreichbar.

Seit 0.1.140 sehen normale Hörer ab 1400 px Framebreite rechts das freigegebene Radio-Logo. Bei vorhandenen Verwaltungsrechten stehen dort weiterhin die bisherigen Aktionen. Schmale Ansichten behalten ihren Platz für die Bedienung; das zusätzliche Logo entfällt dort.
