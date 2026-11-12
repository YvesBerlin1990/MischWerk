# MischWerk – Architektur 0.1.383 · Build 383

Stand 11.11.2026. Diese Übersicht beschreibt den aktuellen Aufbau; verbindliche Fach- und Entwicklungsregeln stehen ausschließlich in [AGENTS.md](../../AGENTS.md).

## Zusammensetzung und Start

Der Server-Ladeplan besitzt einen reinen Prüfzweig: Bei einer ausdrücklichen Dateiprobe liefert er ausschließlich seinen generierten Paketbedarf, ohne Module oder Hooks zu initialisieren. Im normalen Start lädt er wie bisher die Fachmodule; `core/composition` übernimmt die unverändert ausgelagerte Appverdrahtung. `tools/lib/update-plan.cjs` erzeugt den gruppierten Bedarf aus dem jeweiligen vollständigen Inventar. `build:backend` setzt den expliziten Datenmarker im gepflegten Ladeplantemplate ein, `prepare:upload` ersetzt ihn durch das tatsächliche kompakte Auslieferungsinventar. Sonstige Quellmodule bleiben bytegleiche Laufzeitkopien. Es gibt keine zweite manuell gepflegte Dateiliste und keine eigene Metadaten-Auslieferungsdatei.

`app/main.js` lädt `server/app.js` über `KnuddelsServer.execute` und übernimmt das globale `App`. 77 gepflegte ES5/Rhino-Module unter `src/backend/` werden nach `app/server/` gebaut; ausschließlich der Ladeplan erhält die generierte Dateiliste. Das Kompositionsmodul verdrahtet Komponenten und Hooks; Fachereignisse liegen in ihren zuständigen Modulen. `android/diagnostics` liefert dem anwesenden Channelinhaber eine rein lesende Server-/Domainprüfung. `android/settings` besitzt ausschließlich private Einrichtungssitzungen und den geschützten Speicheradapter. `android/operation` verbindet private reguläre Aktivierung und Ausschalten mit dem bestehenden Publisher. `android/incoming` übernimmt validierte Antwortwünsche idempotent in die gemeinsame Queue; `android/relay` besitzt Start/Stop ohne eingehenden HTTP-Endpunkt. Der vorhandene Sync-Schlüssel genügt. Signaturvertrag und einziger Heartbeat bleiben erhalten. `ui/content` erzeugt und versendet native Inhalte; `ui/sessions` verwaltet ihre Sitzungen und das Schließen.

`index.html` fordert CSS und `js/start.js` während des Parsens über `Client.includeCSS/includeJS` an. Das berücksichtigt die `document.write`-Implementierung des SDK. `ui/composition` verdrahtet die benötigten Komponenten einmalig. Vollständiges Markup, registrierte Module und geladenes CSS geben das Anfangslayout frei. Ein langsames Logo blockiert die Radioleiste nicht; fehlende Pflichtressourcen erzeugen einen sichtbaren Fehler. Der einmalige 15-Sekunden-Wächter erkennt einen still fehlgeschlagenen Start.

43 Frontendkomponenten und 18 Stylesheets sind in ansichtsabhängigen Ladeplänen registriert. Dazu kommt die getrennt inventarisierte Betreiber-HTML-Datei; ihr Einstellungscontroller wird ebenfalls in der Verwaltung verwendet. 75 Browser-/Mediendateien, eine Betreiberdatei, 74 Backenddateien sowie Einstieg und Konfiguration ergeben 152 Dateien im App-Arbeitsbestand. Das reproduzierbare Auslieferungsinventar bündelt vollständige benachbarte Module unter der Zeichengrenze; Quellen und Reihenfolge bleiben erhalten. [Frontendarchitektur](ARCHITEKTUR-FRONTEND.md).

`users/greetings` enthält den einheitlichen Begrüßungstext für alle Menschen, die flüchtige Beitritts-Deduplizierung und die sichere Profilfoto-Einbettung am Nachrichtenende. Der erste Satz wird mit KCode 16, Fettschrift und Appleisten-Gold #e6c77b hervorgehoben; nach einem Leerzeichen folgt der zweite Satz in normaler Channelschrift ohne festen Zeilenumbruch. User.getProfileLink verlinkt den maskierten Nick und das weiterhin am Ende stehende Foto mit dem authentifizierten Profil. Die Profilfunktion erhält für das Foto ausschließlich Text; ihr natives Ziel wird mit der authentifizierten Foto-Adresse in einem eigenen Bildtag verknüpft. Fehlerhafte Links fallen auf lesbaren Nick bzw. unverlinkten Bildtag zurück. Der frühere Katalog mit 30 Texten, seine Registrierung und die rollenabhängige Zufallsauswahl sind entfernt. `lifecycle` ruft die Komponente beim Start, Beitritt, Verlassen, Löschen und Shutdown auf. Es entstehen keine Browsermodule, Timer, Besucherhistorie oder Speicheradapter; Studioansagen bleiben in `radio/announcements`. Dieselbe Beitrittssperre schützt zusätzlich die private Willkommensnachricht über User.sendPrivateMessage. Der Begrüßungsweg steht am Anfang von lifecycle.userJoined vor Nicklistenabgleich und Radioöffnung: zuerst private Grafik, direkt danach öffentliche Text-/Foto-Begrüßung. Beide Versandversuche bleiben unabhängig gegen Fehler abgesichert. Die vier eigenen PNGs unter img/welcome werden über getFullImagePath aufgelöst und als Banner, zwei aktive Bildlinks und inaktive Mach-mit-Fläche ausgegeben. Der private Nachrichtentext enthält ausschließlich KCode-Bilder, Ausrichtung und Zeilenumbrüche. Die native Folge LEFT → °#r° → CENTER trennt die links ausgerichtete Absenderzeile vom Banner. Die Buttonzeile erhält nach dem nächsten °#r° ihr eigenes CENTER; der Abschluss setzt nach einem weiteren Umbruch auf LEFT zurück. Der zuvor verwendete JavaScript-LF ist entfernt. Channelthema und iOS-Hinweis stehen nur im Banner. Bei ungültiger Bildauflösung wird die private Nachricht ausgelassen; neue Timer, Handler oder Persistenz sind nicht nötig.

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
| radio/pin-work.js | Nur Website: eine flüchtige Hashberechnung über kurze Timerereignisse, Sitzung-/Rechte-/Datensatzprüfung und Gesamtabbruch; kein Commit |
| radio/pin.js | Website-PIN, Format/Bestätigung, kontogebundener Salt/Hash und dauerhafte Fehlversuchssperre; Einrichtung unabhängig vom Sendungsbeginn |
| radio/announcements.js | initializeStudioAnnouncements, announceStudioStatus; öffentliche Bottexte und laufzeitinterner Vergleich der Moderator-ID |
| radio/handover.js | changeHandover, handoverSnapshot, pruneHandover, dropHandoverForUser; berechtigte Teilnehmer und flüchtige Anfrage |
| radio/show.js | Thema und Wunschboxstatus mit bestätigten Vorwerten ändern |
| wishes/storage.js | Dauerhafte Seitensnapshots, Indexcommit, Validierung und Bereinigung |
| wishes/queue.js | Dauerhafte Queue, Annahme, Deduplizierung, Empfang, Entfernen und private wishPositions aus authentifiziertem User |
| wishes/transport.js | Wunschprotokoll und sichtbaren Moderationsempfang prüfen |
| wishes/website.js | Anonyme Websiteherkunft, Inhalt und Wiederholung in derselben dauerhaften Queue |
| website/access.js | Einmalcode, authentifizierte Kopplung, Rollen-/Präsenzprüfung, Ablauf und Wiederholungsschutz |
| website/public.js | Öffentliche Radiodaten und Kalenderprojektion ohne interne Identitäten |
| website/commands.js | Bestätigte Webaufträge an bestehende Fachaktionen verteilen |
| website/transport.js | HTTP-Callback, begrenzte Antworten und Raten, bewusste Besitzerfreigabe |
| android/connection.js | Private Verbindungskonfiguration, Laufzeit-/Domainfreigabe und nativen postURL-Adapter kapseln |
| android/receipts.js | Begrenzte Annahme-/Endstatusmarker und ausstehende Statusübertragungen, ohne Texte/Namen |
| android/publisher.js | Firebase-Vertragsprojektion, Heartbeat, Antwortprüfung und Lebensdauer des injizierten HTTPS-Ports |
| android/incoming.js | Antwortwünsche validieren, anhand derselben Queue/Endmarker deduplizieren und technisch quittieren |
| android/relay.js | Regulären Publisher ohne WebHook oder zusätzlichen Schlüssel starten/stoppen |
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
| schedule/overview.js | Rollende 14-Tage-Vorschau aus bestehenden Wochen, deduplizierte Fortsetzungen und gemeinsame Paketgrenzen |
| schedule/broadcasts.js | Dauerhaften Studiowechselauftrag vorbereiten und idempotent über den Wochenadapter abgleichen |
| schedule/transport.js | Sitzungsgeprüftes mw:schedule-Datenprotokoll ohne native Overlaybenachrichtigungen |
| maintenance.js | Appmanager-/update mit FTP-Dateiprüfung und eigener Auftragssperre |
| lifecycle.js | Appstart, Beitritt, Verlassen, Nutzerlöschung und Shutdown |
| app.js | Ausschließlich Komponenten laden, erzeugen und verdrahten |




## Zustand und Datenfluss

`wishes/storage` speichert die offene Queue getrennt als vollständige Seiten unter mischwerk.wishes.v3; erst der zuletzt geschriebene Index veröffentlicht den neuen Stand. Die einzelnen JSON-Objekte bleiben unter der API-Grenze, ohne feste Wunschanzahl. Fehler vor dem Commit lassen RAM und bisherige Speicherung bestehen. Veraltete Seiten werden gezielt entfernt; ein beschädigter bestätigter Stand wird nicht leer überschrieben. Nur offene Texte und höchstens 256 abgeschlossene technische Kennungen bleiben gespeichert, keine Wunschhistorie.

`state/persistence` besitzt den allgemeinen dauerhaften Zustand und Commit. Sendeplanwochen und Bot-Einstellungen besitzen getrennte Speicheradapter. `radio/moderation` verwaltet die Studioanmeldung ohne Zeitlimit; wiederholtes eigenes Anmelden ändert keine aktive Sitzung; `radio/handover` besitzt die flüchtige bestätigte Übergabe und private Notizen.

`wishes/queue` führt die über wishes/storage dauerhaft gesicherten offenen Wünsche. Authentifizierte Hörer erhalten ihre eigenen offenen Wünsche; nur berechtigte Moderation sieht fremde Wünsche und Absender. Manuelle Stufen und Entfernen ändern keinen Audiostream. Ein tatsächlicher App-Neustart stellt den letzten bestätigten Queuezustand wieder her.

Der Wunschversandcontroller `wishes/wishbox` lebt in der Radioleiste. Das native Wunschfenster reicht Eingaben und Darstellung zwischen authentifizierten gepaarten Sitzungen weiter. Entwurfsabgleich ist gebündelt; Schlusszeichen werden vor Absenden/Schließen übernommen. `ui/overlays` sichert Wechsel mit Token, Frist und Revision. Rechteverlust löscht private Entwürfe; alte geschlossene Sitzungen dürfen keine neuen schließen oder überschreiben.

## Android-Vorbereitung

`android/projection` ergänzt öffentliche Wochen-Seiten und echte Team-Nicks über denselben Publisher. Die flüchtige Seitenfortsetzung wird erst nach einer angenommenen Antwort weitergeschaltet; geänderte Projektionen beginnen erneut bei Seite 0. `android/commands` übernimmt ausschließlich vom Publisher freigegebene reguläre Relay-Antworten und verwendet dieselben Fachaktionen wie die native Verwaltung. Firebase prüft Konto, App Check und Berechtigung vor der Auslieferung; die Aufträge enthalten keine Rollen- oder Nutzeridentitätsfelder. Knuddels prüft weiterhin Revisionen und Fachdaten. `core/relay-results` begrenzt technische Ergebnisbelege innerhalb bestehender Wochen-/Teamdaten. Fachänderung und Annahmebeleg besitzen denselben Commit. Die nächsten regulären POSTs übertragen `scheduleResults` und `moderatorResults`; es gibt keine zusätzliche Speicherung oder Antwort-/Sendeschleife. Der geklärte Vertrag steht in der [Rückantwort](../api/HOMEPAGE-SENDEPLAN-RUECKANTWORT.md).

Die Android-Vorbereitung verwendet dieselbe dauerhafte Wunschqueue. Herkunft und vorhandenes Absenderfeld tragen Android; keine Knuddels-Identität wird erzeugt. Der getrennte technische Markerbestand ist keine Queue: Er enthält keine Wunschtexte, Namen oder Reihenfolgeentscheidung. Die Queue ist nach dauerhaftem Commit maßgeblich. Technische Android-Marker werden beim Neustart mit den wiederhergestellten Wünschen, Positionen und jüngsten Abschlussmarkern abgeglichen; offene Wünsche werden nicht verworfen. Die Laufzeit behält höchstens 256 Marker, Endzustände sieben Tage. Schalter-/Studiowechsel und Queueänderungen informieren Beobachter über core/changes, ohne zyklische Fachabhängigkeit.

android/connection erzeugt den nativen HTTPS-Port nur nach privater Freigabe und bestätigter Domainberechtigung. android/signing bildet HMAC-SHA256 über die unveränderte UTF-8-Payload mit ts und alphanumerischer Nonce. postURL erhält nur die vier Strings payload, ts, nonce, sig; weder eigene Header noch den Schlüssel. Publisher und Prüfbefehl teilen eine monotone Projektionszeitquelle. Jeder Heartbeat erstellt eine neue Projektion; alte hängende Pakete werden nach Ablauf nicht neu versendet. Der physische Port bleibt bis zum echten Callback belegt. Private Android-Backendmodule stehen mit den Betreiberdateien im vorhandenen Manifest der privaten Arbeitsflächen; dies ändert keinen nativen Ladeweg.

`android/verification` führt nur auf ausdrücklichen Inhaberaufruf einen einzelnen signierten POST aus: http-pruefen sendet den echten aktuellen Senderstatus, auth-pruefen ausschließlich {}. Keine Wünsche oder automatische Folgeprüfung. Beide teilen Port, 10-Sekunden-Timeout, 30-Sekunden-Abstand und Cleanup. Der Statustest prüft den vollständigen HTTP-/JSON-/Ziel-/Serverzeitvertrag; die Auth-Probe liest ausschließlich den Statuscode und erwartet 400 vor Datenbankschreiben. Freigabeflags und Konfiguration bleiben unverändert. Schlüssel, Signaturen und Bodies erscheinen nicht im Bericht.

## Native Ansichten

`ui/administration` akzeptiert ausschließlich den Unterbefehl admin; der frühere Unterbefehl verwaltung ist entfernt. Der über `App.chatCommands.mw` verdrahtete Chat-Einstieg nutzt dieselben Rechte- und Overlaywege. `users/identity.canAdminister` prüft tatsächliches Inhaberrecht, Anwesenheit und den authentifizierten Nick Otterchen. Der Befehl verwendet `ui/overlays`; `ui/sessions` prüft vor der verzögerten Öffnung erneut. Der runde Moderationsbutton benötigt die serverseitigen booleschen Freigaben `showModerationButton` und `canModerate` aus demselben bestätigten Zustand. Der echte Inhaber Otterchen erhält beide automatisch; andere Nutzer benötigen ihren gespeicherten Radio-Team-Eintrag.

`ui/content` ist alleiniger Ort für HTMLFile, AppContent und Versand; `ui/sessions` ordnet Sitzungen zu und schließt sie. Radio ist eine Headerbar; Wunschbox, Moderation, Verwaltung und Sendeplan sind getrennte native Overlays. `sendAppContent` übernimmt die native Ersetzung. Wiederholte Aufträge mit gleicher Anfrage-ID werden dedupliziert. Die bestehende Headerbar bleibt bei Menüwechseln erhalten.

| Ansicht | Anfangsmaß | Inhaltsanpassung |
| --- | --- | --- |
| Radio | 176 px ohne / 220 px mit normaler Lauftextzeile | `radio/viewport` passt ausschließlich die benötigte Höhe an; kompakter und scrollbar erreichbarer Fallback bei Clientgrenzen |
| Sendeplan | 640 × 320 px | Natürliche Inhaltshöhe bis 600 px, danach Listen-Scrollfläche; Tagesnavigation bleibt fest |
| Wunschbox | 480 × 340 px | `wishes/window` passt die benötigte Inhaltshöhe an |
| Moderation | 640 × 580 px | `studio/window` hält den Rahmen scrollfrei; ganze Bediengruppen und Textseiten über Vor/Zurück, stabile Themengeometrie |
| Verwaltung | 500 × 560 px | Fester flacher Rahmen, Radio-Team-Pagination und einzelne Bot-Text-Auswahl; Inhalt scrollt nur bei Überlauf |

`schedule/public-data` validiert die öffentliche Wochenantwort; `schedule/public` liest sie über natives ExternalServerAccess.getURL von der festen Homepageadresse. Ein laufender Auftrag je Woche bündelt wartende Ansichten, ein 10-Sekunden-Timeout verwirft späte Ergebnisse. Höchstens drei flüchtige Cachewochen gelten 15 Sekunden; beide Shutdown-Hooks bereinigen sie. `schedule/day` projiziert ausschließlich diese JSON-Intervalle in den gewählten Berliner Tag, einschließlich generierter Zeilen, Ganztags- und vom Endpunkt aufgelöster Open-End-Zeiten. Der bestehende 20-Sekunden-Lifecycle aktualisiert nur offene Tagesansichten. `mw:schedule.day` prüft die Sitzung vor Abruf und asynchroner Zustellung, begrenzt Datum/Pakete und hält Seiten über eine inhaltsabhängige Snapshotkennung zusammen. Kein direkter Browserabruf, Schlüssel, Import, Persistenzcommit oder Rückfall auf den nativen Wochenbestand. Native Wochen-/Studio- und signierte Relay-Schreibverträge bleiben getrennt erhalten. Das Overlay weist Schreibaufträge mit Homepagehinweis ab.

Native Overlays erhalten eine aktive leere Ladeabdeckung in #0f1114. Früher HTML-Untergrund passt dazu. Die SDK-Readiness bleibt unverändert; ein verbleibender nativer Erstöffnungsblitz ist nicht als vollständig behoben abgenommen.

## Website und Auslieferung

Die Website besitzt einen eigenen Node-Server. Der standardmäßig ausgeschaltete App-WebHook verwendet dieselben Fachaktionen, Rollen und Revisionen. Einmalcode und Bestätigung im Channel koppeln die Identität; private Tokens bleiben auf dem Websiteserver. Es entsteht keine zweite Plan-/Wunschdatenbank. [Anbindung](../../website/docs/ANBINDUNG.md).

Fünf Manifeste unter `deployment/manifests/` belegen Server, Browsercode, Studio und Medien einschließlich Schriftlizenzen. `prepare-upload` bündelt vollständige Quellmodule ausschließlich zur Auslieferung, ohne Minifizierung, und entfernt alte enthaltene Einzelkopien samt dadurch leeren Ordnern. Node prüft vollständige Modultexte und Reihenfolge; beide echten Rhino-Engines führen zusätzlich das fertige Desktoppaket aus. `check:upload` prüft Inventar, Zeichenlängen, Bytezahlen und SHA-256. Alle Texte und Manifeste bleiben unter 9500 Zeichen. Der feste Desktop-UPLOAD ist lokal; GitHub-Push, FTP-Übertragung und Knuddels-Update sind getrennte Schritte.

[API-Nachweis](../api/API-NACHWEIS.md) · [Betrieb](../betrieb/INBETRIEBNAHME.md) · [Prüfbericht](../pruefung/PRUEFBERICHT.md).

Native Anmeldung und Übernahme verwenden direkt die tatsächliche aktive Knuddels-Sitzung. Das persistierte interne Kennzeichen moderator.authentication = knuddels wird ausschließlich serverseitig nach dieser Prüfung gesetzt; die Website verwendet unverändert ihren PIN-Nachweis. Native PIN-Eingaben und radio/pin-access sind entfernt, gemeinsame Website-PIN-Daten bleiben erhalten.
