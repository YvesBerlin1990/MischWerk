# MischWerk – Installation, Betrieb und STREAMPANEL

Lokaler Stand 0.1.117 mit vorbereitetem STREAMPANEL-Anschluss. Zuletzt im echten App-Log beobachtet: LIVE 0.1.103 mit leerer Radiooberfläche. Weiterhin kein Upload/Update/Neustart ohne erneute ausdrückliche Nutzeranweisung.

Vorhang 0.1.103 nach einem später autorisierten vollständigen Upload mit getrennten echten Nutzern prüfen: normaler Hörer zunächst verhüllt, Otterchen und Polaroid unverhüllt. Nur Otterchen als Channelinhaber sieht Vorhang öffnen/schließen; beide Richtungen aktualisieren alle Radioleisten und bleiben nach Neustart erhalten. Vorwertfehler dürfen keinen fremden Zustand überschreiben. Werbung startet/stoppt nur nach lokalem Hörer-Klick, lädt die eigene MP3 erst dann und verändert den Vorhang nicht. Audioende öffnet nichts; das globale Umschalten unterbricht keine laufende Wiedergabe. MP3, server/radio/curtain.js und alle Manifestdateien vollständig übertragen. Native Audiofreigabe in K3/STAPP bleibt Bestandteil der echten Abnahme.

Den ersten Channelbeitritt, erneuten Beitritt mit Cache und ersten Aufruf nach Appupdate separat echt prüfen. Dateien werden während des HTML-Parsens angefordert; erst die Zusammensetzung wartet auf DOMContentLoaded. Die Radioleiste lädt ihren eigenen Plan einschließlich des erhaltenen Wunschcontrollers; die Wunschoberfläche öffnet als natives Channel-Overlay. Unabhängige Fenster für Moderation, Radio-Team und Sendeplan sowie alle Rollen ohne Audioabbruch prüfen. Das Logo darf nachladen; seine Fläche bleibt reserviert. Lokale Browserprüfungen ersetzen keine Zeitmessung des echten Knuddels-Starts.

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

Aus PROJEKT/ mit **node tools/build/prepare-upload.cjs** die Bereitstellung prüfen und den verbindlichen Desktop-Upload aktualisieren. **node tools/checks/upload.cjs** gleicht alle 88 Laufzeitdateien einschließlich 28 Servermodulen, Größen, SHA-256 und Textgrenzen mit den vier Manifesten ab. Der Build erzeugt keine zweite Uploadkopie und veröffentlicht nichts. main.js allein enthält keine App-Fachlogik. Tests, Referenzstubs, Dokumentation und Zugangsdaten gehören nicht ins FTP-Ziel.

Nach einem gesonderten Uploadauftrag:

1. In FileZilla mit den obigen Angaben verbinden. Rechts /ftp, links C:/Users/Yves/Desktop/MischWerk/UPLOAD öffnen. Den lokalen Ordner MischWerk nach /ftp übertragen. Direkt unter /ftp/MischWerk müssen main.js, app.config, server/ und www/ liegen; kein zusätzliches MischWerk/MischWerk. Fremde Appordner erhalten. Vor einem Produktivupdate bestehende Dateien und AppPersistence sichern.
2. Das Ende aller Manifestübertragungen abwarten, einschließlich www/audio/werbung.mp3 und sämtlicher server/-Module. Eine leere FileZilla-Warteschlange und erfolgreiche Übertragungen prüfen; anschließend kann noch Plattform-Synchronisationszeit nötig sein.
3. Bei Erstinstallation als Otterchen im eigenen Channel /apps öffnen, App installieren und 30807196.MischWerk eintragen. Knuddels ergänzt das bestätigte Präfix. Falls nötig den bestätigten AppBot einrichten; anschließend die App starten. Bei bestehender Installation den unten beschriebenen /update-Weg verwenden. Beim erstmaligen Wechsel von einem Stand vor 0.1.36 einmal über /apps aktualisieren.
4. Die tatsächlich gestartete Version im App-Log bestätigen: lokal ist 0.1.117 vorbereitet. Die Startmeldung nennt die Radioleiste mit Wunsch-Overlay sowie Radio-Team- und Moderations-Popups. Radioleiste bei Bedarf mit /mischwerk erneut öffnen; bestehende Statusfenster nach Updates schließen und neu öffnen.

Die offizielle API übernimmt mit /update keine noch laufende Übertragung als vollständig. Meldet sie keine neuen Dateien, werden keine weiteren Dateien übernommen und kein Neustart erzwungen; dies beweist keinen vollständigen Upload. Dann Zielpfad, alle Dateien, tatsächliche Logversion und erneutes Öffnen nach Cacheerneuerung prüfen. Eine höhere lokale Versionsnummer überträgt keine Dateien.

Aktiver Entwicklerzugang und Channelbesitz sind Voraussetzung; Verifizierung und Entwickler-AGB erledigt der Kontoinhaber über /apps developer. Zielclients sind K3 und die aktuelle Knuddels-Desktop-App; JFX ist ausgeschlossen. iOS benötigt laut Plattform eine separate gültige Apple Developer ID, keine Knuddels-Entwicklernummer. Die offiziellen Unterlagen empfehlen DEV vor LIVE; hier ist auf Nutzerauftrag LIVE vorbereitet, eine reale Abnahme bleibt separat.

[Projektstruktur](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur) · [Erste Schritte](https://github.com/knuddelsgmbh/UserApps/wiki/Erste-Schritte) · [FAQ](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ) · [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html) · [Entwicklerportal](https://developer.knuddels.de/).

## Appmanager-Befehl ab 0.1.36

Nach einmaligem vollständigem Einspielen und Aktualisieren auf 0.1.36 können Appmanager sowie Channelinhaber im Channel `/update` eingeben. Bei späteren Versionen zuerst alle Dateien des neuen Manifests einschließlich `server/` vollständig hochladen und den Abschluss des FTP-Programms abwarten, dann `/update` verwenden. Der Befehl übernimmt mit `updateAppFiles()` die auf dem Knuddels-FTP angekommenen Änderungen. Nur wenn die API mindestens eine neue Datei meldet, wird das vollständige Update mit Neustart angefordert; andernfalls bestätigt MischWerk, dass keine neuen Dateien gefunden wurden, und läuft ohne Neustart weiter. Die Prüfung erkennt keinen noch unvollständigen Upload, deshalb bleibt die vollständige Manifestübertragung zwingend. Die gemeldeten Sekunden sind eine Schätzung; bei Serverlast kann das Update später erfolgen. Ein bereits angeforderter Auftrag wird nicht wiederholt angelegt. Die laufende Wunschqueue bleibt bis zum tatsächlichen Neustart nutzbar und beginnt danach leer. Persistente Einstellungen und Radio-Team bleiben erhalten.

„Erledigt“ entfernt im Moderationsmenü einen gespielten Wunsch; „Verwerfen“ entfernt beispielsweise einen nicht verfügbaren Titel. Es wird jeweils nur die ausgewählte Wunsch-ID entfernt. Appmanager benötigen für diese Moderationsaktionen zusätzlich die Radiomoderatorrolle oder den Channelinhaberstatus.

Diese Anleitung bündelt Installation, laufenden Betrieb und die [STREAMPANEL-Einrichtung](#streampanel-einrichten). Backendquellen liegen unter src/backend/, erzeugte Laufzeitkopien unter app/server/. Verbindlicher Upload bleibt C:/Users/Yves/Desktop/MischWerk/UPLOAD mit dem Appordner MischWerk/. Vier Dateimanifeste unter deployment/manifests; keine ZIP-Dateien.

## Echte Abnahme

- Otterchen als tatsächlicher Channelbesitzer: Studio sichtbar, An-/Abmeldung möglich.
- Normaler Hörer: kein Studio; auch selbst gesendete Moderations-Events werden abgewiesen.
- Channel-CM: kein automatischer Studiozugriff. Als Channelinhaber das getrennte Radio-Team-Popup öffnen, einen existierenden Nick ernennen, Studiozugriff prüfen, wieder entfernen und den sofortigen Rechteentzug testen. Ernennung nach Neustart auf Persistenz prüfen.
- Zuerst einen YouTube-/sonstigen Link ablehnen lassen (Entwurf erhalten, kein Wunsch). Dann einen Wunsch als Interpret + Titel im einzigen Textfeld schicken: Der Hörer muss deutlich „Dein Musikwunsch wurde an die Moderation gesendet.“ sehen. In der Wunschbox ausschließlich eigene offene Texte und ihren Platz prüfen; mit zwei Hörern sicherstellen, dass fremde Texte/Nicks verborgen bleiben. In der Moderation Erledigt und Verwerfen prüfen: nachfolgende eigene Plätze rücken nach. Radioleiste nennt den nächsten eigenen Platz, auch bei deaktiviertem Formular. Erneutes Öffnen, mehrere eigene Seiten, Verbindungsabbruch und App-Neustart (Queue leer) prüfen. Die vollständige Queue darf ausschließlich im Moderationsfenster erscheinen; dort richtigen Hörer-Nick und vollständigen Text prüfen und als Moderator bearbeiten. Andere Hörer dürfen weder Queue noch Historie sehen.
- Wunschannahme in der Moderation deaktivieren: Form und Backend müssen Wünsche ablehnen. Wieder öffnen und erneut prüfen.
- Im Studio Thema wie „80er und 90er“ speichern: in der Radioleiste anderer Hörer prüfen; Thema nach Neustart erhalten. Erfolgreich ausdrücklich abmelden: Thema muss ohne getrenntes Speichern bei allen Ansichten verschwinden, die Wunschqueue bleibt erhalten. Abgewiesene/fehlgeschlagene Abmeldung sowie automatisches Ende durch Verlassen, Ablauf oder Rechteverlust behalten das Thema. Feld leeren und speichern entfernt es weiterhin. Normalen Hörern keine Themenänderung erlauben; bei Fehler Entwurf erhalten.
- App neu starten: Wunschbox-Status und Thema bleiben erhalten; die flüchtige Wunschqueue beginnt leer.
- Echten Stream mit Klick starten, Lautstärke prüfen, stoppen und nach Netzwerkunterbrechung erneut starten.
- STREAMPANEL-Senderstatus prüfen: `started` gibt Play frei, `stopped` zeigt „Sendepause“ und sperrt Play, ein unbekannter oder nicht erreichbarer Status erlaubt einen manuellen Hörversuch. Ein Wiederanlauf darf niemals automatisch Audio starten.
- Radiowiedergabe ohne Pegelanzeige prüfen: keine Balken oder Ruhe-/Ersatzmeldung, kein leerer reservierter Bereich. Titel/Interpret, kurze Lautstärke, Stummschaltung und tatsächlichen Wiedergabestatus testen. Popup-/Ansichtswechsel dürfen laufenden Ton nicht unterbrechen; Seitenende stoppt die Wiedergabe.
- Titelwechsel mit dem echten Sender vergleichen; Stream und Metadaten können zeitversetzt sein.
- K3 auf Desktop und Mobilgerät: kleine Ansicht, Tastatur, Scrollen, Channelwechsel, Hintergrundbetrieb und Schließen prüfen.

Die Wunschbox öffnet als natives Overlay oben rechts im Channel. Die Radioleiste erhält dafür keine zusätzliche Höhe. Entwurf, ausstehende Bestätigung, private Positionen und Wiedergabe bleiben im bestehenden Radio erhalten. Radio-Team passt seine Höhe an den Inhalt an; drei Mitglieder pro Seite und einzeln durchblätterbare Details. Die weiße Hörerzahl hat keinen Rahmen. Der aktuelle STREAMPANEL-Produktanschluss fehlt noch, daher keine echte Audioquelle im Paket.

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

RadioKing ist aus App, Konfiguration, aktiven Anbieterprüfern und Upload entfernt. Es gibt keinen Rückfall auf alte oder fremde Sender. Ohne echte öffentliche Höreradresse ist Play deaktiviert; Titel, Hörerzahl und Sendebetrieb bleiben unbekannt. Knuddels-Moderation, Sendeplan und Wunschübertragung sind davon unabhängig.

### Was die offizielle Recherche bestätigt

STREAMPANEL setzt SPCast ein. SPCast verwendet eine eigene Engine und HLS; kompatible Shoutcast-/Icecast-Eingänge sind kein Beleg für deren Status-APIs. Die offizielle HTML5-Player-Anleitung zeigt auch einen öffentlichen direkten HTTPS-Audiostream für ein natives Audioelement. Ob dieses Angebot beim eigenen gebuchten Produkt verfügbar ist, wird nach Freischaltung geprüft. Platzhalter aus Anbieterbeispielen sind keine MischWerk-Adressen.
https://www.streampanel.net/webradio-hosting/
https://www.spcast.eu/en/what-is-spcast/
https://www.spcast.eu/html5-player/
https://www.spcast.eu/faq/allgemein/einrichtungstutorial/

Im Kundenbereich unter Tools / HTML5-Player und Programmdetails die eigenen öffentlichen Playerdaten ermitteln. Die offizielle Produktübersicht zeigt Metadaten und Hörerangaben. Sie bestätigt derzeit keinen allgemein verwendbaren öffentlichen JSON-Pfad samt Schema und CORS. Die dokumentierte PushAPI für radio.de/TuneIn ist ein ausgehender Meldedienst und kein Beleg für eine lesbare Statistik-API.
https://www.spcast.eu/produktbilder/
https://www.spcast.eu/radio-metadata-api-integration/

### Nach Freischaltung benötigte öffentliche Angaben

1. Vollständige öffentliche HTTPS-Höreradresse, tatsächliches Audioformat und Content-Type; nach Möglichkeit direkter MP3-/AAC-Stream für HTML-Audio. Eine Verwaltungsseite, M3U-Playlist oder Encoderadresse ist keine direkte Audioquelle.
2. Eigener erzeugter HTML5-Playercode bzw. öffentlich dokumentierte Playerdaten, damit Direktstream oder ausschließlich HLS/MSE unterschieden werden können.
3. Öffentliche JSON-Quellen für Titel/Interpret, Hörerzahl und Online/Offline-Status, sofern das Produkt diese anbietet. Je Quelle ein tatsächliches Antwortbeispiel, Feldnamen, Online-/Offline-Werte und bestätigte browserseitige CORS-Freigabe. Getrennte Titel-/Interpretenfelder bevorzugen. Ein zusammengesetzter Text wird nicht an Bindestrichen geraten.
4. Falls vorgesehen: strikt boolesches LIVE-/AutoDJ-Feld und dessen dokumentierte Bedeutung. Fehlt es, bleibt der Modus unbekannt; die Knuddels-Studioanmeldung wird unabhängig angezeigt.

Encoder-Host, Port, Benutzer, Passwort und Mountpoint gehören ausschließlich in die Sendesoftware. Diese Angaben werden NICHT für die App benötigt. Zugangsdaten nicht in Screenshots/Playerlinks übernehmen. Unterstützung: https://www.streampanel.net/kontakt/
Offizielle Störungsübersicht: https://status.streampanel.net/

### Vorbereitete Konfiguration

In src/backend/config.js unter MischWerkConfig.streampanel:

- streamUrl: bestätigte öffentliche HTTPS-Audioadresse
- allowedHosts: zusätzliche exakte öffentliche Hostnamen der JSON-Daten; Streamhost wird automatisch zugelassen
- metadata: url, titleField, artistField, liveField
- status: url, valueField, onlineValue, offlineValue; optional identityField und identityValue zur Antwortzuordnung
- listeners: url, valueField

Feldpfade dürfen verschachtelte Objekte mit Punkten benennen. Arraypfade und Skriptausdrücke sind bewusst nicht vorgesehen. Statuswerte werden ohne automatische Typumwandlung verglichen. Hörerzahl muss eine nichtnegative Ganzzahl sein, echte Null ist gültig.

Dies ist eine vorbereitete interne Zuordnung und KEINE behauptete SPCast-API. Es werden weder Endpunkte aus Radio-ID/Hostname abgeleitet noch fremde Demosender eingetragen. Alle Felder bleiben bis zur Bestätigung leer. Eine gültige direkte Audioadresse kann unabhängig von fehlenden JSON-Quellen verwendet werden. Unverfügbare Daten bleiben unbekannt. Ein bestätigter Offline-Status stoppt Audio; ein bloßer Abfragefehler nicht.

### Abnahme nach Erhalt

- Echte öffentliche Werte eintragen, Backend bauen, volle Prüfungen und Paketbau ausführen.
- node tools/checks/streampanel.cjs prüft lesend Audio/zugeordnete JSON-Quellen. Ohne Konfiguration meldet es ausstehend bei null Netzabrufen. Node-HTTP-Nachweise beweisen weder Browser-CORS noch Audio-Decodierung in K3.
- Im Browser und danach im autorisierten Knuddels-/K3-/STAPP-Test: bewussten Play-Klick, Codec, HTTPS, Weiterleitungen, CORS, Titelwechsel, echte Null, Stopp, Wiederanlauf ohne Autostart, Hintergrund/Rückkehr und Fehler ohne Audioabbruch prüfen.
- Bei ausschließlich HLS/MSE: tatsächlichen offiziellen Playerweg und Zielclient-Unterstützung gesondert integrieren und prüfen. Die direkte HTML-Audio-Vorbereitung allein ist dafür kein Kompatibilitätsnachweis.
- Die Moderatoren konfigurieren ihre Sendesoftware separat im neuen Anbieter; MischWerk steuert keinen Encoder oder AutoDJ.
- Erst nach eigenem Auftrag vollständig hochladen und Knuddels aktualisieren. Ein echter App-Neustart leert die flüchtige Wunschqueue; ein bloßes Öffnen/Schließen des Wunsch-Overlays erhält Sitzung, Entwurf und Wiedergabe.

Die vollständige reale Funktionsabnahme steht in [LIVE-ABNAHME.md](LIVE-ABNAHME.md), Sendeplan und Lautstärke in [SENDEPLAN.md](SENDEPLAN.md) und [LAUTSTAERKE.md](LAUTSTAERKE.md). Schnittstellen und Herkunft der öffentlichen Daten: [API-NACHWEIS.md](../api/API-NACHWEIS.md).

Seit 0.1.116 verwendet die Wunschbox AppContent.overlayContent. Native Platzierung und Clientunterstützung separat prüfen. Ausdrückliches Schließen übernimmt zuerst die letzte Eingabe im Radio; bleibt die Verbindung aus, bleibt diese Eingabe mit Hinweis sichtbar. Die lokale Channel-Vorschau unter /channel.html modelliert getrennte Header-/Overlayframes.

Seit 0.1.117 startet die Moderation näher an ihrer benötigten Größe (780 × 600) und misst vor Sichtbarkeit die tatsächliche Inhaltshöhe. Im lokalen Standardzustand sind es 593 px; Anmeldung, Wunschtext, Themenfeedback und Übergabe dürfen das Fenster passend ändern. Stabile Höhengrenzen verhindern Größenkaskaden; kleinere oder ignorierte Hostrahmen behalten Reiter und Scrollbarkeit.
