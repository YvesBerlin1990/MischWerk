# MischWerk – Architektur 0.1.402 · Build 402

Stand 14.11.2026. Diese Übersicht beschreibt den lokalen Aufbau von Build 402; verbindliche Fach- und Entwicklungsregeln stehen ausschließlich in [AGENTS.md](../../../AGENTS.md). Native Installation und gemeinsame Firebase-/Live-Studio-Abnahme bleiben separat offen.

Das vom Nutzer im Channel für alle Nutzer bestätigte Startverhalten von Build 401 bleibt vollständig erhalten: zuerst die Play-Methode aus dem eigenen wiederverwendeten about:blank-iframe, danach die bisherigen Wege im Zyklus 4 → 1 → 2 → 3. Dasselbe Audioelement, Mute-Wiederherstellung, canplay-Warteweg, Drei-Sekunden-Fortsetzungen, Startfrist, Backoff und Browserfreigabe bleiben erhalten. Entfernt sind ausschließlich Nutzer-Wiedergabediagnose, Erholungsberichte, Methoden-/Umgebungsproben, Medienverläufe, Resolve-Nachmessungen und deren Übertragung bzw. App-Log-Ausgabe. Reguläre Backendwarnungen und App-Start-/Stopprotokolle bleiben erhalten.

## Gemeinsame Wunschweiterleitung

Die bestehende Knuddels-Queue bleibt für native, Web- und Android-Wünsche maßgeblich. wishes/export-state leitet ausschließlich technische Sendemarker für den bestehenden Queuecommit ab: stabiler Namensraum und Wunsch-ID, Zustand, Position, Revision und Sendebedarf. Aktive Texte/Namen stehen nur an den Queueeinträgen; unbestätigte Endmarker werden ohne Text/Namen bis zur passenden Quittung aufbewahrt. Auch Nutzerlöschungen erzeugen ausdrücklich discarded. Die persistierte Projektionshöchstzeit verhindert nach Neustart die Wiederverwendung einer Statusversion. wishes/storage verwendet weiterhin denselben paginierten Adapter und atomaren Indexwechsel.

android/studio-wishes projiziert ausschließlich native Einträge nach studioWishUpdates und bestätigt passende Revisionen. android/publisher verwendet denselben signierten POST, denselben Heartbeat und insgesamt höchstens 100 native/externe Updates. Native Blöcke umfassen bis zehn Einträge; der verbleibende Platz gehört den bisherigen technischen wishUpdates. wishes/website bündelt die beiden bestehenden externen Queue-Einstiege. Der Firebase-Empfänger erhält displayName und optional origin web/android kompatibel; alte unbekannte Herkünfte bleiben unbekannt. wishMetadataVersion:1 signalisiert den erweiterten Empfänger. Native Nutzeridentitäten und Rechte bleiben unabhängig von externen Anzeigenamen. Bei gültiger Wiederzustellung werden nur fehlende Altmetadaten aus nachgewiesenen Angaben ergänzt; bestehende Namen, Herkunft, Wunschtext und Reihenfolge werden nicht überschrieben. In der privaten Liste steht die Herkunft in der bisherigen Absenderzeile. Die Firebase-Projektion ist für das geschützte Live Studio bestimmt; eine öffentliche Vollwunschliste entsteht nicht.

## Wunschfernregie ohne Umsortieren

Build 392 ergänzt die Fernregie im bestehenden signierten Statuskanal. `android/wish-control` leitet `studioWishControl` mit Version, echtem Moderator-Nick und Sitzungskennung ausschließlich aus einer aktiven, weiterhin berechtigten nativen Moderation ab; sonst wird null übertragen. Firebase ordnet diesen Nick geschützt und eindeutig einem DJ-Konto zu. Eine zweite Kontozuordnung in Knuddels entsteht nicht.

`android/wish-commands` verarbeitet höchstens einen `studioWishCommands`-Auftrag aus derselben frischen angenommenen HTTP-Antwort. accept, prepare, defer, playing, done und discard verwenden die bestehenden Queueaktionen. Vor dem Commit werden Moderationsbindung, Ablaufzeit, erwarteter Status, Position und tatsächlich versendeter Einzelwunschstand geprüft. `wishes/control-state` verbindet dafür lokale Mutationsrevisionen mit den versendeten Projektionszeiten; auch Empfangsbestätigung und Statusänderungen zurück zum vorherigen sichtbaren Zustand ändern die Revision. Die Eingangsreihenfolge und aufsteigenden Wunsch-IDs bleiben erhalten.

Mutation und technischer `controlResults`-Beleg werden im selben paginierten Queuecommit gespeichert. Wiederholte Auftragskennungen führen nach einem Neustart keine zweite Mutation aus; Endbelege bleiben unabhängig vom 256er-Wunsch-Replaycache erhalten. `android/wish-control` stellt höchstens ein passendes `studioWishResults`-Ergebnis mit dem tatsächlichen aktuellen Wunschzustand für den nächsten regulären POST zusammen. Der eine Publisher-Timer folgt der tatsächlichen Moderation: aktiv 5 Sekunden, sonst 20 Sekunden. Fehler bremsen mit 10/20/40/60 Sekunden unter Beachtung des Grundtakts; native Ereignisanstöße bleiben erhalten. Weder Erfolgs- noch Fehlercallback starten einen Folge-POST. Der physische Port bleibt auch nach logischem Cancel bis zum echten Callback belegt. Signaturvertrag und Fristen bleiben bestehen. Die native Liste erhält keine Fernregieknöpfe. [API-Abgleich](../api/API-NACHWEIS.md#wunschfernregie-ohne-umsortieren--13112026) und [offene gemeinsame Abnahme](../betrieb/LIVE-ABNAHME.md#offene-wunschfernregie-ohne-umsortieren--build-392).

## Lesende Wunschliste

Die native Moderation zeigt Wünsche als eine flache scrollbare Liste mit vollständigem Text in #e6c77b, nativem Nick beziehungsweise externem Anzeigenamen mit Herkunft und Empfangsuhrzeit. Der vorhandene Snapshot bleibt klein; mw:queue.read liest den gesamten bestätigten Queue-Stand sequenziell über mw:queue.page in Paketen mit höchstens zehn Einträgen und unter 9500 UTF-16-Zeichen. Anfrage-ID, Studiositzung, Ansichtsrevision, Generation und Queuerevision werden geprüft. Der Client übernimmt erst den vollständigen Paketstand und erhält beim Aktualisieren seine Scrollposition. Ein flüchtiger sitzungsgebundener Lesebereich erlaubt Empfangsquittungen ausschließlich für ausgelieferte IDs; der Client quittiert nur tatsächlich im sichtbaren Listenausschnitt liegende Texte. Rechteverlust, Quellwechsel und Schließen leeren den privaten Browsercache. Es gibt keine zusätzliche Queuepersistenz oder Polltimer. Vorhandene Fachverträge für Regiestatus und Abschluss bleiben für die übrigen bestehenden Integrationen erhalten; die neue Liste besitzt keine Regieaktionen.

## Zusammensetzung und Start

Der Server-Ladeplan besitzt einen reinen Prüfzweig: Bei einer ausdrücklichen Dateiprobe liefert er ausschließlich seinen generierten Paketbedarf, ohne Module oder Hooks zu initialisieren. Im normalen Start lädt er wie bisher die Fachmodule; `core/composition` übernimmt die unverändert ausgelagerte Appverdrahtung. `tools/lib/update-plan.cjs` erzeugt den gruppierten Bedarf aus dem jeweiligen vollständigen Inventar. `build:backend` setzt den expliziten Datenmarker im gepflegten Ladeplantemplate ein, `prepare:upload` ersetzt ihn durch das tatsächliche kompakte Auslieferungsinventar. Sonstige Quellmodule bleiben bytegleiche Laufzeitkopien. Es gibt keine zweite manuell gepflegte Dateiliste und keine eigene Metadaten-Auslieferungsdatei.

`app/main.js` lädt `server/app.js` über `KnuddelsServer.execute` und übernimmt das globale `App`. 84 gepflegte ES5/Rhino-Module unter `src/backend/` werden nach `app/server/` gebaut; ausschließlich der Ladeplan erhält die generierte Dateiliste. `core/composition` verdrahtet Komponenten und Hooks; Fachereignisse liegen in ihren zuständigen Modulen. `android/diagnostics` liefert dem anwesenden Channelinhaber eine rein lesende Server-/Domainprüfung. `android/settings` besitzt ausschließlich private Einrichtungssitzungen und den geschützten Speicheradapter. `android/operation` verbindet private reguläre Aktivierung und Ausschalten mit dem bestehenden Publisher. `android/incoming` übernimmt validierte Antwortwünsche idempotent in die gemeinsame Queue; `android/relay` besitzt Start/Stop ohne eingehenden HTTP-Endpunkt. Der vorhandene Sync-Schlüssel genügt. Signaturvertrag und einziger Heartbeat bleiben erhalten. `ui/content` erzeugt und versendet native Inhalte; `ui/sessions` verwaltet ihre Sitzungen und das Schließen.

`index.html` fordert CSS und `js/start.js` während des Parsens über `Client.includeCSS/includeJS` an. Das berücksichtigt die `document.write`-Implementierung des SDK. `ui/composition` verdrahtet die benötigten Komponenten einmalig. Vollständiges Markup, registrierte Module und geladenes CSS geben das Anfangslayout frei. Ein langsames Logo blockiert die Radioleiste nicht; fehlende Pflichtressourcen erzeugen einen sichtbaren Fehler. Der einmalige 15-Sekunden-Wächter erkennt einen still fehlgeschlagenen Start.

46 Frontendkomponenten und 18 Stylesheets sind in ansichtsabhängigen Ladeplänen registriert. Dazu kommt die getrennt inventarisierte Betreiber-HTML-Datei; ihr Einstellungscontroller wird ebenfalls in der Verwaltung verwendet. Das aktuelle Inventar ergibt sich aus `tools/build/backend.cjs`, `tools/lib/frontend-files.cjs` und `tools/checks/lengths.cjs`:

| Bestand in Build 402 | Dateien | Davon Textdateien |
| --- | ---: | ---: |
| Backendlaufzeit unter `app/server/` | 84 | 84 |
| Browseroberfläche und Medien aus dem Frontendinventar | 85 | 72 |
| Getrennt inventarisierte Betreiberdatei `app/www/relay-settings.html` | 1 | 1 |
| Einstieg `app/main.js` und Konfiguration `app/app.config` | 2 | 2 |
| App-Arbeitsbestand insgesamt | **172** | **159** |
| Gebündeltes Uploadpaket insgesamt | **125** | **112** |

Das Uploadpaket enthält 52 Serverdateien; sein längster Text umfasst 9494 UTF-16-Zeichen. Das reproduzierbare Auslieferungsinventar bündelt vollständige benachbarte Module unter der Zeichengrenze; Quellen und Reihenfolge bleiben erhalten. Die fünf Manifeste belegen die tatsächlichen Paketbytes. [Frontendarchitektur](ARCHITEKTUR-FRONTEND.md).

`users/greetings` enthält den einheitlichen Begrüßungstext für alle Menschen, die flüchtige Beitritts-Deduplizierung und die sichere Profilfoto-Einbettung am Nachrichtenende. Der vollständige erste Satz einschließlich Nick wird mit nativem RobotoBold, KCode 16 und Appleisten-Gold #e6c77b hervorgehoben; §°r° setzt die Formatierung vor dem zweiten Satz zurück. Nach einem Leerzeichen folgt dieser in normaler Channelschrift ohne festen Zeilenumbruch. User.getProfileLink verlinkt den maskierten Nick und das weiterhin am Ende stehende Foto mit dem authentifizierten Profil. Die Profilfunktion erhält für das Foto ausschließlich Text; ihr natives Ziel wird mit der authentifizierten Foto-Adresse in einem eigenen Bildtag verknüpft. Fehlerhafte Links fallen auf lesbaren Nick bzw. unverlinkten Bildtag zurück. Der frühere Katalog mit 30 Texten, seine Registrierung und die rollenabhängige Zufallsauswahl sind entfernt. `lifecycle` ruft die Komponente beim Start, Beitritt, Verlassen, Löschen und Shutdown auf. Es entstehen keine Browsermodule, Timer, Besucherhistorie oder Speicheradapter; Studioansagen bleiben in `radio/announcements`. Dieselbe Beitrittssperre schützt zusätzlich die private Willkommensnachricht über User.sendPrivateMessage. Der Begrüßungsweg steht am Anfang von lifecycle.userJoined vor Nicklistenabgleich und Radioöffnung: zuerst private Grafik, direkt danach öffentliche Text-/Foto-Begrüßung. Beide Versandversuche bleiben unabhängig gegen Fehler abgesichert. Die vier eigenen PNGs unter img/welcome werden über getFullImagePath aufgelöst und als Banner sowie drei aktive Bildlinks für Lieblings-MyChannel, Website und Channelinfo ausgegeben. Website öffnet nach Nutzerklick https://radio-mischwerk.web.app/; der technische Bildpfad mitmachen.png bleibt erhalten. Der private Nachrichtentext enthält ausschließlich KCode-Bilder, Ausrichtung und Zeilenumbrüche. Die native Folge LEFT → °#r° → CENTER trennt die links ausgerichtete Absenderzeile vom Banner. Die Buttonzeile erhält nach dem nächsten °#r° ihr eigenes CENTER; der Abschluss setzt nach einem weiteren Umbruch auf LEFT zurück. Der zuvor verwendete JavaScript-LF ist entfernt. Channelthema und iOS-Hinweis stehen nur im Banner. Bei ungültiger Bildauflösung wird die private Nachricht ausgelassen; neue Timer, Handler oder Persistenz sind nicht nötig.

Der senderweite Lauftext liegt in state.ticker mit eigener Revision. radio/ticker validiert und speichert atomar, radio/ticker-command prüft den authentifizierten /lauftext-Aufruf und veröffentlicht ausschließlich bestätigte Werte. Der Befehl setzt und aktiviert Text; --aus/--an erhält ihn beim Aus-/Einschalten. --tempo langsam/normal/schnell beziehungsweise 32/48/72 ändert ausschließlich die Geschwindigkeit. Leerer Aufruf und --hilfe zeigen privat Status und verfügbare Optionen, ohne Mutation oder Fenster. Unveränderte Werte erzeugen weder weiteren Commit noch Broadcast. Der Browser zeigt die vorhandene Laufzeile mit automatisch ergänzten +++; die Moderation besitzt keinen Editor. Der alte sitzungsgeprüfte mw:setTicker-Fachvertrag bleibt für Kompatibilität erhalten.

`schedule/commands` bereitet dieselben nativen Fachänderungen ohne vorgezogenen Schreibvorgang vor. `schedule/relay` verknüpft stabile Firebase-IDs mit den wochenbezogenen nativen IDs; dauerhaftes `relayBindings` bleibt im bestehenden Wochenobjekt, unabhängig von den letzten 64 Quittungen. Änderung, Zuordnung, Löschmarker und Ergebnis werden gemeinsam über `schedule/storage` geschrieben. Teamaufträge nutzen weiter `radio/team` und den allgemeinen Adapter; erfüllte Zustände speichern nur den Beleg ohne Teamrevision oder wiederholte Nebenwirkung. `android/projection` überträgt ausschließlich echte Revisionen; `android/failures` hält nur drei private Diagnosefelder im RAM. Keine zusätzliche Persistenz, Browserkomponente oder Timerquelle.

Der Lauftext lädt Rajdhani Medium (500) über sein vorhandenes Radio-Stylesheet aus dem eigenen Paket; WOFF2 und OFL sind zusätzlich im Medieninventar enthalten. Der Frontendcontroller ergänzt dekorative Randmarker, fasst alte manuelle Plusfolgen nur an den Rändern zusammen und beobachtet die tatsächliche Textbreite auch nach dem Schriftladen. Gespeicherter Text, Android-Projektion und die bisherige Persistenz bleiben dabei unverändert.

## Audio, Anbieter und Aktivitätsbestätigung

`radio/connection` besitzt allein Audioquelle, nativen Play/Pause/Load-Zugriff, Hörwunsch, Medienereignisse und den einzelnen Beobachtungs-/Wiederverbindungstimer. `radio/player` bedient den Controller und stellt seinen Zustand dar. Kurze Lücken erhalten Quelle und Browserpuffer; ein bloßes `stalled` bedeutet keinen Audiostopp. Unerwartete Pause wird auf derselben Quelle fortgesetzt. Echte Fehler, Ende oder bestätigter Stillstand führen zu zeitlich gestaffelten neuen Versuchen, solange der Hörwunsch besteht.

Stop, Quellenwechsel und Seitenende löschen den Hörwunsch. Verspätete Ereignisse/Promises dürfen ihn nicht wiederherstellen. Automatische Erholung erhält Lautstärke und Mute; nur ein bewusster neuer Play-Versuch verwendet die leise Startregel.

`radio/api` prüft Audioadresse und öffentliche Datenquellen. `radio/requests` bündelt je URL einen Auftrag mit Cachebehandlung, Timeout und Fetch-/XHR-Abbruch. `radio/provider` besitzt Metadaten, Status, Modus, Timer und Generationen. Titel starten sofort parallel zum Status und folgen alle zwei Sekunden nach Abschluss; Modus folgt alle fünf, Status alle 30 Sekunden, bei bestätigter Sendepause alle zwei Sekunden bis zur Rückkehr. Titelfehler verwenden 2/4/8/16/30 Sekunden Rücknahme. Vor einem neuen Lebenszyklus alte Aufträge tatsächlich abbrechen und Timer löschen, verspätete Abschlüsse verwerfen. Die einzige Titelquelle ist der vom Anbieter verlinkte Anschluss `https://mischwerk.sp.radio.fm/currentsong?sid=1`. Seine einzelne Songzeile wird trotz `text/html` als Datenstring geprüft; HTML-Markup bleibt ungültig. Eindeutiger `_mw`-Parameter und Fetch `no-store`/`omit` vermeiden Cachewiederverwendung, ebenso im XHR-Weg. Status behält seine exakte bestätigte URL ohne Zusatzparameter. Die verzögert aktualisierte currentSong.txt-Anbindung ist aus der Runtime entfernt. `radio/metadata` trennt am ersten exakten ` - `, entfernt Zusätze ab `|` und erhält unvollständige Angaben als Originaltitel. Darstellung über textContent, Titel oben und Interpret darunter. Audio gehört allein `radio/connection`; Datenfehler und bestätigte Statuswerte steuern es nicht. Anbieterhistorie und zusätzliche Probeanfragen bleiben entfernt.

`transport/lifecycle` nutzt den bestehenden Sekundentakt für den Wiedergabe-Heartbeat und die vorhandene monotone Uhr von `radio/connection`, über `radio/player.playbackNow` weitergereicht. Drei-Minuten-Termin, Fortschrittsalter und Antwortablauf bleiben damit unabhängig von Systemzeitkorrekturen. Während desselben Hörwunschs bleibt der Termin über Nachladephasen erhalten. `/confirm` setzt tatsächlichen Audiofortschritt auch bei readyState 2, eine passende frische `mw:refresh`-Antwort und danach weiteren Fortschritt voraus. Stop/Seitenende löschen den Zeitplan. Kein zweiter Audio- oder Heartbeatweg bleibt aktiv. [Native Beobachtung, offene Ursache und Tests](../pruefung/PRUEFBERICHT.md).

## Backendkomponenten

`users/nicklist` leitet Team und Mikrofon aus den bestehenden Rechten und dem bestätigten Moderationszustand ab. Hörerstatus liegt ausschließlich in der aktuellen Radiositzung; `transport/events` nimmt eigene sequenzgesicherte Meldungen und optionale Erneuerungen im Radiorefresh entgegen. Ein gemeinsamer Timeout verbindet Fristablauf, Rechteprüfung und Fehlerwiederholung. `users/nicklist-storage` verwaltet höchstens zwei mögliche eigene Pfade in der UserPersistence, merkt vor add dauerhaft vor und erhält fehlgeschlagene Bereinigungen. `core/changes` verbindet bestätigte Zustandscommits und Radioende mit dem Sollabgleich. `lifecycle` bindet Start, Beitritt, Verlassen, Löschung und beide Shutdown-Hooks an. Es entsteht kein zweiter Team- oder Moderationszustand.

| Datei unter server/ | Verantwortung / öffentliche Funktionen |
| --- | --- |
| config.js | Öffentliche Sender-, Rollen- und Längenkonfiguration |
| core/runtime.js | Laufzeitkonstanten, now, copy, failure, jsonBytes |
| core/diagnostics.js | Datensparsame warn-Diagnose mit eigener Meldedrossel |
| core/changes.js | Interne Änderungssignale; Beobachterfehler verändern keine native Fachaktion |
| core/relay-results.js | Begrenzte technische Ergebnisbelege in vorhandenen Wochen- und Teamdaten |
| core/composition.js | Appverdrahtung und Knuddels-Hooks; nur normaler Start, nicht die Dateiprobe |
| core/validation.js | Textnormalisierung und unveränderte Rhino-kompatible Linkprüfung |
| users/identity.js | Primitive Userwerte, Anwesenheit und serverseitige Rollen |
| radio/ticker-command.js | Authentifizierter /lauftext-Befehl mit vorhandener Persistenz und Veröffentlichung |
| radio/ticker.js | Senderweiter Lauftext, Validierung, eigene Revision und begrenzte Wiederholungsmarker |
| users/greetings.js | Öffentliche Beitrittsbegrüßung, Foto und flüchtige Anwesenheitsmarker |
| users/nicklist.js | Abgeleitete Iconmatrix, aktuelle Radiositzung, Fristen und ein gemeinsamer Timeout |
| users/nicklist-storage.js | Eigene Bildauflösung, dauerhafte Vorabmarker, differenzielle API-Aufrufe und Bereinigung |
| state/persistence.js | initialState, readState, persist und Bereinigung historischer Marker |
| state/initialization.js | load: beim ersten Laden Speicher lesen, danach Studio-Anmeldung prüfen |
| radio/station.js | Geprüfte öffentliche Senderadressen |
| ui/commands.js | Rollenabhängige /mw-Hilfe und Verteilung an bestehende Fachaktionen |
| ui/administration.js | /mw admin prüfen und an den zentralen Overlayweg übergeben |
| radio/team.js | Ernennen, Entziehen und paginierte Radio-Team-Ansicht |
| radio/moderation.js | moderatorKey, invalidateModerator, moderatorIsActive, prune, changeModeration, transferModeration; ausdrückliche Abmeldung leert atomar das Thema |
| core/pin-bcrypt.js | Nur Website: fortsetzbarer bcrypt-10-Kern mit höchstens 64 Runden und ungefähr 100 ms je Schritt; unabhängiger Referenzvektor |
| core/pin-constants-1.js | Erster Teil der unveränderten bcrypt-Konstanten für die Website-PIN |
| core/pin-constants-2.js | Zweiter Teil der unveränderten bcrypt-Konstanten für die Website-PIN |
| radio/pin-work.js | Nur Website: eine flüchtige Hashberechnung über kurze Timerereignisse, Sitzung-/Rechte-/Datensatzprüfung und Gesamtabbruch; kein Commit |
| radio/pin.js | Website-PIN, Format/Bestätigung, kontogebundener Salt/Hash und dauerhafte Fehlversuchssperre; Einrichtung unabhängig vom Sendungsbeginn |
| radio/announcements.js | initializeStudioAnnouncements, announceStudioStatus; öffentliche Bottexte und laufzeitinterner Vergleich der Moderator-ID |
| radio/handover.js | changeHandover, handoverSnapshot, pruneHandover, dropHandoverForUser; berechtigte Teilnehmer und flüchtige Anfrage |
| radio/show.js | Thema und Wunschboxstatus mit bestätigten Vorwerten ändern |
| wishes/storage.js | Dauerhafte Seitensnapshots, Indexcommit, Validierung und Bereinigung |
| wishes/export-state.js | Native Sendemarker, stabile Wunschkennung und dauerhafter Projektionshochstand im Queuecommit |
| wishes/control-state.js | Einzelwunschrevisionen, versendete Snapshotbezüge und atomare Fernregiebelege |
| wishes/queue.js | Dauerhafte Queue, Annahme, Deduplizierung, Empfang, Entfernen und private wishPositions aus authentifiziertem User |
| wishes/transport.js | Wunschprotokoll und sichtbaren Moderationsempfang prüfen |
| wishes/website.js | Gemeinsame externe Wunschannahme, Metadaten und Wiederholung für Website und Android in derselben Queue |
| website/access.js | Einmalcode, authentifizierte Kopplung, Rollen-/Präsenzprüfung, Ablauf und Wiederholungsschutz |
| website/public.js | Öffentliche Radiodaten und Kalenderprojektion ohne interne Identitäten |
| website/commands.js | Bestätigte Webaufträge an bestehende Fachaktionen verteilen |
| website/transport.js | HTTP-Callback, begrenzte Antworten und Raten, bewusste Besitzerfreigabe |
| android/connection.js | Private Verbindungskonfiguration, Laufzeit-/Domainfreigabe und nativen postURL-Adapter kapseln |
| android/signing.js | ES5-HMAC-SHA256 für den bestehenden Vier-String-Signaturvertrag |
| android/failures.js | Letzte technische Fehlerstufe, HTTP-Code und UTC-Zeit ausschließlich im RAM |
| android/diagnostics.js | Private lesende Server-, Domain- und Laufzeitdiagnose für den echten Inhaber |
| android/settings-access.js | Aktuelle Inhabersitzung, Fristen und Wiederholungsbelege der Verbindungseinstellungen |
| android/settings.js | Getrennter privater Speicheradapter und bestätigtes Speichern der Verbindungseinstellungen |
| android/receipts.js | Begrenzte Annahme-/Endstatusmarker und ausstehende Statusübertragungen, ohne Texte/Namen |
| android/publisher.js | Firebase-Vertragsprojektion, Heartbeat, Antwortprüfung und Lebensdauer des injizierten HTTPS-Ports |
| android/incoming.js | Antwortwünsche validieren, anhand derselben Queue/Endmarker deduplizieren und technisch quittieren |
| android/studio-wishes.js | Native Queueeinträge als studioWishUpdates projizieren und passende Revisionen quittieren |
| android/wish-control.js | Echte native Moderationsbindung und aktuelle zustandsgebundene Fernregieergebnisse projizieren |
| android/wish-commands.js | Frische Fernregieaufträge prüfen und über bestehende Queueaktionen atomar ausführen |
| android/projection.js | Tatsächliche Wochen- und Teamrevisionen ohne Kalender- oder Teamlisten übertragen |
| android/commands.js | Angenommene Sendeplan-/Teamaufträge an dieselben Fachaktionen verteilen |
| android/verification.js | Ausdrückliche interne Status-/Auth-Einzelprüfung ohne Änderung der Betriebsfreigabe |
| android/relay.js | Regulären Publisher ohne WebHook oder zusätzlichen Schlüssel starten/stoppen |
| android/operation.js | Ausdrückliche private Aktivierung und Ausschalten mit bestätigter Speicherung |
| channel-texts/storage.js | Persistente Bot-Einstellungen und Revisionsmodell |
| channel-texts/format.js | Geprüfte Knuddels-Bildtags und gelernte Kürzel; übriger Text bleibt maskiert |
| channel-texts/smileys.js | Authentifizierter nativer Privatimport eigener Smiley-Grafiken in den vorhandenen Bot-Speicher |
| channel-texts/settings.js | Gemeinsame bestätigte Fachänderung für native und Websiteverwaltung |
| channel-texts/scheduler.js | Ein vorhandener Timer für öffentliche Bot-Ausgabe und Rotationszeiger |
| channel-texts/transport.js | Native Sitzungskontrolle vor gemeinsamen Bot-Einstellungen |
| ui/snapshot.js | Berechtigte Ansichtsmodelle und Wunschdarstellung |
| ui/wish-surface.js | Ausschließlich gepaarte Eingaben und Darstellung weiterreichen; kein Öffnen, Schließen oder Einreihen |
| ui/loading.js | Optionale native Ladefarben und leere Overlayabdeckung |
| ui/session-state.js | Aktuelle Sessionmitgliedschaft und Öffnungszeit prüfen |
| ui/content.js | Einziger nativer Erzeugungs- und Versandweg; passende Headerbar-Anfangshöhe |
| ui/sessions.js | Aktive Sitzung prüfen; openView / closeView und private prepareView; einziger nativer Lebenszyklus, authentifizierte Header-/Overlayzuordnung und Lebensdauer |
| ui/overlays.js | openOverlay / handleOverlayEvent / expireOverlays; bestätigter Wechsel, flüchtige private Entwürfe, Token und Wiederfreigabe |
| transport/views.js | send, refresh, broadcast und allgemeines result |
| transport/events.js | Authentifizierte Events prüfen und an Fachmodule verteilen |
| schedule/calendar.js | Validierte Kalenderdaten, deutsche Tagesgrenze, Wochen und Zeitintervalle |
| schedule/storage.js | Eigene Wochenpersistenz, Wochenindex und personenbezogene Bereinigung |
| schedule/programme.js | Fünf-Minuten-Filter und öffentliche Lesepakete |
| schedule/commands.js | Gemeinsame Inhaber-/Relay-Fachaktionen, Revisions-/Zeitprüfung und Schutz vor Wiederanlage nach Löschung |
| schedule/relay.js | Dauerhafte Firebase-ID-Zuordnung, Löschmarker und Auftragsbeleg im bestehenden Wochencommit |
| schedule/overview.js | Rollende 14-Tage-Vorschau aus bestehenden Wochen, deduplizierte Fortsetzungen und gemeinsame Paketgrenzen |
| schedule/public-data.js | Öffentliche Homepage-Wochenantwort und ihre Anzeigefelder validieren |
| schedule/public.js | Gemeinsame öffentliche Wochenabrufe, Timeout und drei flüchtige Cachewochen |
| schedule/day.js | Homepageintervalle in Berliner Tagesansichten projizieren und begrenzt paketieren |
| schedule/broadcasts.js | Dauerhaften Studiowechselauftrag vorbereiten und idempotent über den Wochenadapter abgleichen |
| schedule/transport.js | Sitzungsgeprüftes mw:schedule-Datenprotokoll ohne native Overlaybenachrichtigungen |
| maintenance.js | Appmanager-/update mit FTP-Dateiprüfung und eigener Auftragssperre |
| lifecycle.js | Appstart, Beitritt, Verlassen, Nutzerlöschung und Shutdown |
| app.js | Backend-Ladeplan mit reinem Dateiprüfzweig und generiertem Paketbedarf |




## Zustand und Datenfluss

`wishes/storage` speichert die offene Queue getrennt als vollständige Seiten unter mischwerk.wishes.v3; erst der zuletzt geschriebene Index veröffentlicht den neuen Stand. Die einzelnen JSON-Objekte bleiben unter der API-Grenze, ohne feste Wunschanzahl. Fehler vor dem Commit lassen RAM und bisherige Speicherung bestehen. Veraltete Seiten werden gezielt entfernt; ein beschädigter bestätigter Stand wird nicht leer überschrieben. Wunschtexte und Namen stehen nur an offenen Einträgen. Der Replaycache enthält höchstens 256 abgeschlossene technische Kennungen; native Exportmarker sowie controlVersions/controlResults liegen ohne Text-/Namenskopien im selben paginierten Commit. Unbestätigte native Endmarker und Fernregie-Endbelege hängen nicht an der Replaygrenze. Eine Wunschhistorie entsteht nicht.

`state/persistence` besitzt den allgemeinen dauerhaften Zustand und Commit. Sendeplanwochen und Bot-Einstellungen besitzen getrennte Speicheradapter. `radio/moderation` verwaltet die Studioanmeldung ohne Zeitlimit; wiederholtes eigenes Anmelden ändert keine aktive Sitzung; `radio/handover` besitzt die flüchtige bestätigte Übergabe und private Notizen.

`wishes/queue` führt die über wishes/storage dauerhaft gesicherten offenen Wünsche. Authentifizierte Hörer erhalten ihre eigenen offenen Wünsche; nur berechtigte Moderation sieht fremde Wünsche und Absender. Manuelle Stufen und Entfernen ändern keinen Audiostream. Ein tatsächlicher App-Neustart stellt den letzten bestätigten Queuezustand wieder her.

Der Wunschversandcontroller `wishes/wishbox` lebt in der Radioleiste. Das native Wunschfenster reicht Eingaben und Darstellung zwischen authentifizierten gepaarten Sitzungen weiter. Entwurfsabgleich ist gebündelt; Schlusszeichen werden vor Absenden/Schließen übernommen. `ui/overlays` sichert Wechsel mit Token, Frist und Revision. Rechteverlust löscht private Entwürfe; alte geschlossene Sitzungen dürfen keine neuen schließen oder überschreiben.

## Android-Vorbereitung

`android/projection` ergänzt ausschließlich tatsächliche scheduleRevisions für vorige, aktuelle und nächste Berliner ISO-Woche sowie moderatorRevision über denselben Publisher. Unbekannte Stände werden ausgelassen. Kalender- und Teamlisten werden nicht als scheduleUpdates/teamUpdates übertragen; Firebase führt die öffentlichen Inhalte. `android/commands` übernimmt ausschließlich vom Publisher freigegebene reguläre Relay-Antworten und verwendet dieselben Fachaktionen wie die native Verwaltung. Firebase prüft Konto, App Check und Berechtigung vor der Auslieferung; die Aufträge enthalten keine Rollen- oder Nutzeridentitätsfelder. Knuddels prüft weiterhin Revisionen und Fachdaten. `core/relay-results` begrenzt technische Ergebnisbelege innerhalb bestehender Wochen-/Teamdaten. Fachänderung und Annahmebeleg besitzen denselben Commit. Die nächsten regulären POSTs übertragen `scheduleResults` und `moderatorResults`; es gibt keine zusätzliche Speicherung oder Antwort-/Sendeschleife. Der geklärte Vertrag steht in der [Rückantwort](../api/HOMEPAGE-SENDEPLAN-RUECKANTWORT.md).

Die Android-Vorbereitung verwendet dieselbe dauerhafte Wunschqueue. Herkunft und vorhandenes Absenderfeld tragen Android; keine Knuddels-Identität wird erzeugt. Der getrennte technische Markerbestand ist keine Queue: Er enthält keine Wunschtexte, Namen oder Reihenfolgeentscheidung. Die Queue ist nach dauerhaftem Commit maßgeblich. Technische Android-Marker werden beim Neustart mit den wiederhergestellten Wünschen, Positionen und jüngsten Abschlussmarkern abgeglichen; offene Wünsche werden nicht verworfen. Die Laufzeit behält höchstens 256 Marker, Endzustände sieben Tage. Schalter-/Studiowechsel und Queueänderungen informieren Beobachter über core/changes, ohne zyklische Fachabhängigkeit.

android/connection erzeugt den nativen HTTPS-Port nur nach privater Freigabe und bestätigter Domainberechtigung. android/signing bildet HMAC-SHA256 über die unveränderte UTF-8-Payload mit ts und alphanumerischer Nonce. postURL erhält nur die vier Strings payload, ts, nonce, sig; weder eigene Header noch den Schlüssel. Publisher und Prüfbefehl teilen eine monotone Projektionszeitquelle. Jeder Heartbeat erstellt eine neue Projektion; alte hängende Pakete werden nach Ablauf nicht neu versendet. Der physische Port bleibt bis zum echten Callback belegt. Private Android-Backendmodule stehen mit den Betreiberdateien im vorhandenen Manifest der privaten Arbeitsflächen; dies ändert keinen nativen Ladeweg.

`android/verification` führt nur auf ausdrücklichen Inhaberaufruf einen einzelnen signierten POST aus: http-pruefen sendet den echten aktuellen Senderstatus, auth-pruefen ausschließlich {}. Keine Wünsche oder automatische Folgeprüfung. Beide teilen Port, 10-Sekunden-Timeout, 30-Sekunden-Abstand und Cleanup. Der Statustest prüft den vollständigen HTTP-/JSON-/Ziel-/Serverzeitvertrag; die Auth-Probe liest ausschließlich den Statuscode und erwartet 400 vor Datenbankschreiben. Freigabeflags und Konfiguration bleiben unverändert. Schlüssel, Signaturen und Bodies erscheinen nicht im Bericht.

## Native Ansichten

`ui/administration` akzeptiert ausschließlich den Unterbefehl admin; der frühere Unterbefehl verwaltung ist entfernt. Der über `App.chatCommands.mw` verdrahtete Chat-Einstieg nutzt dieselben Rechte- und Overlaywege. `users/identity.canAdminister` prüft tatsächliches Inhaberrecht, Anwesenheit und den authentifizierten Nick Otterchen. Der Befehl verwendet `ui/overlays`; `ui/sessions` prüft vor der verzögerten Öffnung erneut. Der Moderationsbutton benötigt die serverseitigen booleschen Freigaben `showModerationButton` und `canModerate` aus demselben bestätigten Zustand. Der echte Inhaber Otterchen erhält beide automatisch; andere Nutzer benötigen ihren gespeicherten Radio-Team-Eintrag.

`ui/content` ist alleiniger Ort für HTMLFile, AppContent und Versand; `ui/sessions` ordnet Sitzungen zu und schließt sie. Radio ist eine Headerbar; Wunschbox, Moderation, Verwaltung und Sendeplan sind getrennte native Overlays. `sendAppContent` übernimmt die native Ersetzung. Wiederholte Aufträge mit gleicher Anfrage-ID werden dedupliziert. Die bestehende Headerbar bleibt bei Menüwechseln erhalten.

| Ansicht | Anfangsmaß | Inhaltsanpassung |
| --- | --- | --- |
| Radio | 176 px ohne / 220 px mit normaler Lauftextzeile | `radio/viewport` passt ausschließlich die benötigte Höhe an; kompakter und scrollbar erreichbarer Fallback bei Clientgrenzen |
| Sendeplan | 640 × 320 px | Natürliche Inhaltshöhe bis 600 px, danach Listen-Scrollfläche; Tagesnavigation bleibt fest |
| Wunschbox | 480 × 340 px | `wishes/window` passt die benötigte Inhaltshöhe an |
| Moderation | 640 × 580 px | `studio/window` misst die Wunschliste ohne Eingriff in den Scrollzustand: natürliche Höhe 320–580 px, danach genau eine Listen-Scrollfläche. Sendung und Übergabe behalten Bediengruppen/Textseiten über Vor/Zurück; stabile Themengeometrie |
| Verwaltung | 500 × 560 px | Fester flacher Rahmen, Radio-Team-Pagination und einzelne Bot-Text-Auswahl; Inhalt scrollt nur bei Überlauf |

`schedule/public-data` validiert die öffentliche Wochenantwort einschließlich revision, previousRevision und boundaryRevision. `schedule/public` erweitert den vorhandenen gemeinsamen GET-/Lesecache: ausschließlich vorige/aktuelle/nächste Berliner Kalenderwoche, ein laufender Abruf je Woche, 10-Sekunden-Timeout und 60 Sekunden bis zur nächsten externen Prüfung. Inhalt und Revisionsbezüge bestimmen die Signatur; Revision 0 allein genügt nicht. Bekannte Änderungen invalidieren betroffene und angrenzende Wochen. Der bestehende öffentliche Endpunkt besitzt keinen schlanken Revisionsabruf oder ETag; externe Frische erfordert deshalb begrenzte volle Wochenantworten. Der aktive Wunschregietakt fragt keinen Sendeplan ab. `schedule/day` begrenzt die Auswahl auf Montag der Vorwoche bis Sonntag der Folgewoche und projiziert ausschließlich gelieferte Intervalle in den gewählten Berliner Tag. Außenanfragen werden vor einem GET abgewiesen; Randtage besitzen nur die zulässige Nachbarrichtung. `mw:schedule.day` prüft Sitzung, Datum, Seitenfolge und Signatur; bei bekanntem unverändertem Stand bestätigt es nur Metadaten ohne entries. Der bestehende 20-Sekunden-Lifecycle aktualisiert ausschließlich offene Ansichten. Ein begrenzter vollständiger Cachetag kann bereits im Anfangspaket einer frischen nativen Ansicht stehen. Schließen entfernt wartende eigene Zustellungen, beide Shutdown-Hooks verwerfen den gemeinsamen Cache. Kein Browser-HTTP, Import, Persistenzcommit oder Rückfall auf native Wochen; Schreibverträge bleiben getrennt erhalten.

Native Overlays erhalten eine aktive leere Ladeabdeckung in #0f1114. Früher HTML-Untergrund passt dazu. Die SDK-Readiness bleibt unverändert; ein verbleibender nativer Erstöffnungsblitz ist nicht als vollständig behoben abgenommen.

## Website und Auslieferung

Die Website besitzt einen eigenen Node-Server. Der standardmäßig ausgeschaltete App-WebHook verwendet dieselben Fachaktionen, Rollen und Revisionen. Einmalcode und Bestätigung im Channel koppeln die Identität; private Tokens bleiben auf dem Websiteserver. Es entsteht keine zweite Plan-/Wunschdatenbank. [Anbindung](../../website/docs/ANBINDUNG.md).

Fünf Manifeste unter `deployment/manifests/` belegen Server, Browsercode, Studio und Medien einschließlich Schriftlizenzen. `prepare-upload` bündelt vollständige Quellmodule ausschließlich zur Auslieferung, ohne Minifizierung, und entfernt alte enthaltene Einzelkopien samt dadurch leeren Ordnern. Node prüft vollständige Modultexte und Reihenfolge; beide echten Rhino-Engines führen zusätzlich das fertige Desktoppaket aus. `check:upload` prüft Inventar, Zeichenlängen, Bytezahlen und SHA-256. Alle Texte und Manifeste bleiben unter 9500 Zeichen. Der feste Desktop-UPLOAD ist lokal; GitHub-Push, FTP-Übertragung und Knuddels-Update sind getrennte Schritte.

[API-Nachweis](../api/API-NACHWEIS.md) · [Betrieb](../betrieb/INBETRIEBNAHME.md) · [Prüfbericht](../pruefung/PRUEFBERICHT.md).

Native Anmeldung und Übernahme verwenden direkt die tatsächliche aktive Knuddels-Sitzung. Das persistierte interne Kennzeichen moderator.authentication = knuddels wird ausschließlich serverseitig nach dieser Prüfung gesetzt; die Website verwendet unverändert ihren PIN-Nachweis. Native PIN-Eingaben und radio/pin-access sind entfernt, gemeinsame Website-PIN-Daten bleiben erhalten.
