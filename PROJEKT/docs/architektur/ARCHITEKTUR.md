# MischWerk – Architektur 0.1.324 · Build 324

Stand 09.11.2026. Diese Übersicht beschreibt den aktuellen Aufbau; verbindliche Fach- und Entwicklungsregeln stehen ausschließlich in [AGENTS.md](../../AGENTS.md).

## Zusammensetzung und Start

`app/main.js` lädt `server/app.js` über `KnuddelsServer.execute` und übernimmt das globale `App`. 64 gepflegte ES5/Rhino-Module unter `src/backend/` werden bytegleich nach `app/server/` gebaut. Das Kompositionsmodul verdrahtet Komponenten und Hooks; Fachereignisse liegen in ihren zuständigen Modulen. `android/diagnostics` liefert dem anwesenden Channelinhaber eine rein lesende Server-/Domainprüfung. `android/settings` besitzt ausschließlich private Einrichtungssitzungen und den geschützten Speicheradapter. `android/operation` verbindet private reguläre Aktivierung und Ausschalten mit dem bestehenden Publisher. `android/incoming` übernimmt validierte Antwortwünsche idempotent in die gemeinsame Queue; `android/relay` besitzt Start/Stop ohne eingehenden HTTP-Endpunkt. Der vorhandene Sync-Schlüssel genügt. Signaturvertrag und einziger Heartbeat bleiben erhalten. `ui/content` erzeugt und versendet native Inhalte; `ui/sessions` verwaltet ihre Sitzungen und das Schließen.

`index.html` fordert CSS und `js/start.js` während des Parsens über `Client.includeCSS/includeJS` an. Das berücksichtigt die `document.write`-Implementierung des SDK. `ui/composition` verdrahtet die benötigten Komponenten einmalig. Vollständiges Markup, registrierte Module und geladenes CSS geben das Anfangslayout frei. Ein langsames Logo blockiert die Radioleiste nicht; fehlende Pflichtressourcen erzeugen einen sichtbaren Fehler. Der einmalige 15-Sekunden-Wächter erkennt einen still fehlgeschlagenen Start.

50 Frontendkomponenten und 20 Stylesheets sind in ansichtsabhängigen Ladeplänen registriert. Dazu kommen zwei getrennt inventarisierte Betreiberdateien `relay-settings.html` und `js/operator/relay-settings.js`. Die 85 Browser-/Mediendateien, zwei Betreiberdateien, 64 Backenddateien und zwei Einstieg-/Konfigurationsdateien ergeben 153 Dateien im App-Arbeitsbestand. Im UPLOAD entfallen 27 vollständig gebündelte Backenddateien, 16 Browser-JS-Einzeldateien und zwei CSS-Einzeldateien; das eigenständig geprüfte Auslieferungsinventar enthält damit 108 Dateien. Die 64 Backendmodule liegen dort in 37 Serverdateien. Benachbarte Module behalten ihre vollständigen Quelltexte und execute-Reihenfolge; der erste Modulpfad dient als Bündelpfad. Nur der ausgelieferte server/app.js-Ladeplan lässt enthaltene Einzelmodule aus. Konfiguration und Komposition bleiben separat, private Android-Module behalten ihre Manifestzuordnung. Die bestehenden Browser-Ladepläne, Medien und Ansichtszuordnungen bleiben erhalten. Private Betreiberdateien stehen im bestehenden Manifest der privaten Arbeitsflächen; sie werden nicht in öffentliche Ladepläne aufgenommen. [Frontendarchitektur](ARCHITEKTUR-FRONTEND.md).

`users/greetings` enthält den einheitlichen Begrüßungstext für alle Menschen, die flüchtige Beitritts-Deduplizierung und die sichere Profilfoto-Einbettung am Nachrichtenende. Der erste Satz wird mit KCode 16, Fettschrift und Appleisten-Gold #e6c77b hervorgehoben; nach einem Leerzeichen folgt der zweite Satz in normaler Channelschrift ohne festen Zeilenumbruch. User.getProfileLink verlinkt den maskierten Nick und das weiterhin am Ende stehende Foto mit dem authentifizierten Profil. Die Profilfunktion erhält für das Foto ausschließlich Text; ihr natives Ziel wird mit der authentifizierten Foto-Adresse in einem eigenen Bildtag verknüpft. Fehlerhafte Links fallen auf lesbaren Nick bzw. unverlinkten Bildtag zurück. Der frühere Katalog mit 30 Texten, seine Registrierung und die rollenabhängige Zufallsauswahl sind entfernt. `lifecycle` ruft die Komponente beim Start, Beitritt, Verlassen, Löschen und Shutdown auf. Es entstehen keine Browsermodule, Timer, Besucherhistorie oder Speicheradapter; Studioansagen bleiben in `radio/announcements`.

Der senderweite Lauftext liegt in `state.ticker` und besitzt eine eigene Revision. `radio/ticker` validiert und speichert über den bestehenden Persistenzadapter; `transport/events` prüft aktuelle Studiositzung und Ansichtsrevision. Der Browser trennt öffentliche Darstellung in `radio/ticker` und privaten Entwurf in `studio/ticker`. Die gemeinsame `radio-deck`-Fläche verbindet Radio und aktiven Lauftext; ihr Pseudoelement besitzt einen einfarbigen dunklen Grund und übernimmt den bestehenden Glow ausschließlich bei echter Wiedergabe. Die ursprüngliche Appleiste behält ihre eigene Deckfläche für die Logo-Einblendung, ihr Muster und ihren sichtbaren Rahmen. Bei eingeschalteter Laufzeile sind nur die unteren Innenecken gerade; die gemeinsame äußere Kontur behält ihre Rundungen. Die Laufzeile schließt im bisherigen unteren Außenabstand direkt an diesen Rahmen an; dessen ursprünglicher Glowraum liegt unter der einfarbigen Laufzeile. Die Gesamthöhe mit normaler Laufzeile beträgt wieder 220 px; der letzte 16-px-Fade bleibt erhalten. CSS übernimmt die Bewegung, `radio/viewport` die tatsächliche Höhe; es entstehen keine zusätzlichen Server-/Provider-/Audiotimer.

`schedule/commands` bereitet dieselben nativen Fachänderungen ohne vorgezogenen Schreibvorgang vor. `schedule/relay` verknüpft stabile Firebase-IDs mit den wochenbezogenen nativen IDs; dauerhaftes `relayBindings` bleibt im bestehenden Wochenobjekt, unabhängig von den letzten 64 Quittungen. Änderung, Zuordnung, Löschmarker und Ergebnis werden gemeinsam über `schedule/storage` geschrieben. Teamaufträge nutzen weiter `radio/team` und den allgemeinen Adapter; erfüllte Zustände speichern nur den Beleg ohne Teamrevision oder wiederholte Nebenwirkung. `android/projection` überträgt ausschließlich echte Revisionen; `android/failures` hält nur drei private Diagnosefelder im RAM. Keine zusätzliche Persistenz, Browserkomponente oder Timerquelle.

Der Lauftext lädt Rajdhani Medium (500) über sein vorhandenes Radio-Stylesheet aus dem eigenen Paket; WOFF2 und OFL sind zusätzlich im Medieninventar enthalten. Der Frontendcontroller ergänzt dekorative Randmarker, fasst alte manuelle Plusfolgen nur an den Rändern zusammen und beobachtet die tatsächliche Textbreite auch nach dem Schriftladen. Gespeicherter Text, Android-Projektion und die bisherige Persistenz bleiben dabei unverändert.

## Audio, Anbieter und Aktivitätsbestätigung

`radio/connection` besitzt allein Audioquelle, nativen Play/Pause/Load-Zugriff, Hörwunsch, Medienereignisse und den einzelnen Beobachtungs-/Wiederverbindungstimer. `radio/player` bedient den Controller und stellt seinen Zustand dar. Kurze Lücken erhalten Quelle und Browserpuffer; ein bloßes `stalled` bedeutet keinen Audiostopp. Unerwartete Pause wird auf derselben Quelle fortgesetzt. Echte Fehler, Ende oder bestätigter Stillstand führen zu zeitlich gestaffelten neuen Versuchen, solange der Hörwunsch besteht.

Stop, Quellenwechsel, Werbung starten und Seitenende löschen den Hörwunsch. Verspätete Ereignisse/Promises dürfen ihn nicht wiederherstellen. Automatische Erholung erhält Lautstärke und Mute; nur ein bewusster neuer Play-Versuch verwendet die leise Startregel.

`radio/api` prüft die konfigurierte HTTPS-Audioadresse getrennt von den Datenquellen. `radio/provider` besitzt ausschließlich Metadaten, Status, Modus, Abfragegenerationen und Prüfzeiten. Titel und separater Sendemodus haben eigene Fünfsekundenzyklen; gelieferte Titel warten nicht auf AutoDJ/Live. Fehler pausieren nur die jeweilige Datenquelle. Alte Modusantworten werden bei Quellen-/Lebenszykluswechsel verworfen, ohne einen laufenden Abruf zu duplizieren. Datenfehler oder bestätigte Statuswerte steuern kein Audio. Der aktuelle Titel stammt aus der bestätigten Textdatei `/currentSong.txt` auf dem eigenen Streamserver. `radio/metadata` trennt deren kombinierte Songzeile am ersten exakten ` - `: Interpret davor, vollständiger Titel dahinter. Optionale Anbieterzusätze ab `|` entfallen. Der Direktabruf verwendet wegen `max-age=300` einen wechselnden `_mw`-Zeitparameter, auch über XHR; Fetch zusätzlich `no-store`/`omit`. Antworttyp und begrenzte Songzeile werden vor der Darstellung geprüft. Der Player zeigt den Titel oben und den Interpreten darunter. Ohne zwei nichtleere Teile bleibt die vollständige Zeile als Titel erhalten. Das weiterhin unterstützte Format `spcast-history` wählt den neuesten gültigen Unixzeitstempel; ältere Antworten überschreiben dabei keinen neueren Titel. Die private Tageshistorie behält ihre eigenen Filter und Rechte. Studioanmeldung und Anbieter-LIVE sind unabhängige Fakten, die `radio/presentation` gemeinsam darstellt.

`transport/lifecycle` nutzt den bestehenden Sekundentakt für den Wiedergabe-Heartbeat und die vorhandene monotone Uhr von `radio/connection`, über `radio/player.playbackNow` weitergereicht. Drei-Minuten-Termin, Fortschrittsalter und Antwortablauf bleiben damit unabhängig von Systemzeitkorrekturen. Während desselben Hörwunschs bleibt der Termin über Nachladephasen erhalten. `/confirm` setzt tatsächlichen Audiofortschritt auch bei readyState 2, eine passende frische `mw:refresh`-Antwort und danach weiteren Fortschritt voraus. Stop/Seitenende löschen den Zeitplan. Kein zweiter Audio- oder Heartbeatweg bleibt aktiv. [Native Beobachtung, offene Ursache und Tests](../pruefung/PRUEFBERICHT.md).

## Backendkomponenten

| Datei unter server/ | Verantwortung / öffentliche Funktionen |
| --- | --- |
| config.js | Öffentliche Sender-, Rollen- und Längenkonfiguration |
| core/runtime.js | Laufzeitkonstanten, now, copy, failure, jsonBytes |
| core/diagnostics.js | Datensparsame warn-Diagnose mit eigener Meldedrossel |
| core/changes.js | Interne Änderungssignale; Beobachterfehler verändern keine native Fachaktion |
| core/validation.js | Textnormalisierung und unveränderte Rhino-kompatible Linkprüfung |
| users/identity.js | Primitive Userwerte, Anwesenheit und serverseitige Rollen |
| radio/ticker.js | Senderweiter Lauftext, Validierung, eigene Revision und begrenzte Wiederholungsmarker |
| users/greetings.js | Öffentliche Beitrittsbegrüßung, Foto und flüchtige Anwesenheitsmarker |
| state/persistence.js | initialState, readState, persist und Bereinigung historischer Marker |
| state/initialization.js | load: beim ersten Laden Speicher lesen, danach Studio-Anmeldung prüfen |
| radio/station.js | Geprüfte öffentliche Senderadressen |
| ui/administration.js | /MW Verwaltung prüfen und an den zentralen Overlayweg übergeben |
| radio/team.js | Ernennen, Entziehen und paginierte Radio-Team-Ansicht |
| radio/moderation.js | moderatorKey, invalidateModerator, moderatorIsActive, prune, changeModeration, transferModeration; ausdrückliche Abmeldung leert atomar das Thema |
| radio/announcements.js | initializeStudioAnnouncements, announceStudioStatus; öffentliche Bottexte und laufzeitinterner Vergleich der Moderator-ID |
| radio/handover.js | changeHandover, handoverSnapshot, pruneHandover, dropHandoverForUser; berechtigte Teilnehmer und flüchtige Anfrage |
| radio/show.js | Thema und Wunschboxstatus mit bestätigten Vorwerten ändern |
| radio/curtain.js | curtainState, changeCurtain; authentifizierte Ausnahmen, Otterchen als tatsächlicher Inhaber, globalen Vorhang über persist ändern |
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
| transport/events.js | Authentifizierte Events prüfen und an Fachmodule verteilen; Vorhang-Chatbefehl privat beantworten und bestätigten Fachzustand verteilen |
| schedule/calendar.js | Validierte Kalenderdaten, deutsche Tagesgrenze, Wochen und Zeitintervalle |
| schedule/storage.js | Eigene Wochenpersistenz, Wochenindex und personenbezogene Bereinigung |
| schedule/programme.js | Fünf-Minuten-Filter und öffentliche Lesepakete |
| schedule/commands.js | Gemeinsame Inhaber-/Relay-Fachaktionen, Revisions-/Zeitprüfung und Schutz vor Wiederanlage nach Löschung |
| schedule/overview.js | Rollende 14-Tage-Vorschau aus bestehenden Wochen, deduplizierte Fortsetzungen und gemeinsame Paketgrenzen |
| schedule/broadcasts.js | Dauerhaften Studiowechselauftrag vorbereiten und idempotent über den Wochenadapter abgleichen |
| schedule/transport.js | Sitzungsgeprüftes mw:schedule-Protokoll und Änderungsbenachrichtigung |
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

`ui/administration` registriert den über `App.chatCommands.mw` verdrahteten Chat-Einstieg. `users/identity.canAdminister` prüft tatsächliches Inhaberrecht, Anwesenheit und den authentifizierten Nick Otterchen. Der Befehl verwendet `ui/overlays`; `ui/sessions` prüft vor der verzögerten Öffnung erneut. Der runde Moderationsbutton benötigt die serverseitigen booleschen Freigaben `showModerationButton` und `canModerate` aus demselben bestätigten Zustand. Der echte Inhaber Otterchen erhält beide automatisch; andere Nutzer benötigen ihren gespeicherten Radio-Team-Eintrag.

`ui/content` ist alleiniger Ort für HTMLFile, AppContent und Versand; `ui/sessions` ordnet Sitzungen zu und schließt sie. Radio ist eine Headerbar; Wunschbox, Moderation, Verwaltung und Sendeplan sind getrennte native Overlays. `sendAppContent` übernimmt die native Ersetzung. Wiederholte Aufträge mit gleicher Anfrage-ID werden dedupliziert. Die bestehende Headerbar bleibt bei Menüwechseln erhalten.

| Ansicht | Anfangsmaß | Inhaltsanpassung |
| --- | --- | --- |
| Radio | 176 px ohne / 220 px mit normaler Lauftextzeile | `radio/viewport` passt ausschließlich die benötigte Höhe an; kompakter und scrollbar erreichbarer Fallback bei Clientgrenzen |
| Wunschbox | 480 × 340 px | `wishes/window` passt die benötigte Inhaltshöhe an |
| Moderation | 640 × 580 px | `studio/window`, Gruppen-/Textseiten; stabile Geometrie während Themenbearbeitung |
| Verwaltung | 500 × 560 px | Fester Rahmen, Radio-Team-Pagination und ein Inhalts-Scrollbereich für Bot-Texte |
| Sendeplan | 720 × 600 px | Fester Rahmen, Kalenderpagination und natürlich erreichbare Inhalte |

Im Sendeplan besitzt `schedule/view` Darstellung und DOM-Verfügbarkeit, der bestehende Controller Protokoll- und Berechtigungszustand. `schedule/pages` hält den gelesenen Eintrag mit zugehörigem Datum über eine neue Seitenaufteilung hinweg. Eine geschrumpfte Paketfolge beginnt von vorn; Rechteverlust verwirft private Daten und die Verwaltungswoche zugunsten der öffentlichen Vorschau.

Die Höreransicht priorisiert Sendungstitel, Uhrzeit und nachgeordneten Namen. `schedule/pages` verwaltet die Seiten und deren Anker; der Zeitraum wird ausschließlich im Kopf ausgegeben. „Musikmix von MischWerk“ und „Ende offen“ sind ausschließlich lesefreundliche Beschriftungen; gespeicherte Sendearten, Intervalle, Studioabgleich und Rechte bleiben unverändert.

Gefüllte Tage verwenden einen gemeinsamen Datumskopf über ausgerichteten Musik- und Sendungszeilen. Private Aktionen folgen unter den Sendungsdetails. Zeitbeschriftungen einschließlich gerundeter Musikgrenzen liegen im bestehenden `schedule/calendar`; `schedule/view` erzeugt deren DOM-Spalten. Die mobilen Regeln stapeln dieselben Inhalte ohne zusätzliche Steuerelemente.

Native Overlays erhalten eine aktive leere Ladeabdeckung in #0f1114. Früher HTML-Untergrund passt dazu. Die SDK-Readiness bleibt unverändert; ein verbleibender nativer Erstöffnungsblitz ist nicht als vollständig behoben abgenommen.

## Website und Auslieferung

Die Website besitzt einen eigenen Node-Server. Der standardmäßig ausgeschaltete App-WebHook verwendet dieselben Fachaktionen, Rollen und Revisionen. Einmalcode und Bestätigung im Channel koppeln die Identität; private Tokens bleiben auf dem Websiteserver. Es entsteht keine zweite Plan-/Wunschdatenbank. [Anbindung](../../website/docs/ANBINDUNG.md).

Fünf Manifeste unter `deployment/manifests/` belegen Server, Browsercode, Studio und Medien einschließlich Schriftlizenzen. `prepare-upload` bündelt vollständige Quellmodule ausschließlich zur Auslieferung, ohne Minifizierung, und entfernt alte enthaltene Einzelkopien samt dadurch leeren Ordnern. Node prüft vollständige Modultexte und Reihenfolge; beide echten Rhino-Engines führen zusätzlich das fertige Desktoppaket aus. `check:upload` prüft Inventar, Zeichenlängen, Bytezahlen und SHA-256. Alle Texte und Manifeste bleiben unter 9500 Zeichen. Der feste Desktop-UPLOAD ist lokal; GitHub-Push, FTP-Übertragung und Knuddels-Update sind getrennte Schritte.

[API-Nachweis](../api/API-NACHWEIS.md) · [Betrieb](../betrieb/INBETRIEBNAHME.md) · [Prüfbericht](../pruefung/PRUEFBERICHT.md).
