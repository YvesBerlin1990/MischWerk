# MischWerk – Architektur 0.1.117

88 Laufzeitdateien: main.js und app.config, 28 Servermodule und 58 Browserdateien einschließlich Original-PNG und eigener Werbe-MP3. ES5/Rhino im Backend, explizite Browserkomponenten, keine Minifizierung oder Sammelbundles. Fachliche Regeln stehen ausschließlich in AGENTS.md.

## Zusammensetzung und Start

main.js lädt server/app.js mit dem dokumentierten KnuddelsServer.execute und übernimmt das globale App. Backendquellen unter src/backend/ werden bytegleich nach app/server/ und beim Paketbau nach UPLOAD/MischWerk/server/ übernommen. Das Kompositionsmodul lädt und verdrahtet Module, verarbeitet aber keine Fachereignisse.

index.html fordert Styles und js/start.js während des HTML-Parsens über Client.includeCSS/includeJS an. Das ist wegen der document.write-Implementierung der Plattform erforderlich. Erst die Zusammensetzung wartet auf DOMContentLoaded und vollständige Registrierungen des gewählten Plans. Keine mehrfachen Initialisierungen. Geladenes CSS und fertiges Anfangslayout geben mw-ready frei; langsame Logoantworten blockieren die Radioleiste nicht. Nach 15 Sekunden ohne vollständige Initialisierung erscheint der verständliche Starthinweis. 38 Komponenten und 16 Stylesheets; Pläne siehe [Frontend](ARCHITEKTUR-FRONTEND.md).

## Backendkomponenten

| Datei unter server/ | Verantwortung / öffentliche Funktionen |
| --- | --- |
| config.js | Öffentliche Sender-, Rollen- und Längenkonfiguration |
| core/runtime.js | Laufzeitkonstanten, now, copy, failure, jsonBytes |
| core/diagnostics.js | Datensparsame warn-Diagnose mit eigener Meldedrossel |
| core/validation.js | Textnormalisierung und unveränderte Rhino-kompatible Linkprüfung |
| users/identity.js | Primitive Userwerte, Anwesenheit und serverseitige Rollen |
| state/persistence.js | initialState, readState, persist und Bereinigung historischer Marker |
| state/initialization.js | load: beim ersten Laden Speicher lesen, danach Studio-Anmeldung prüfen |
| radio/station.js | Geprüfte öffentliche Senderadressen |
| radio/team.js | Ernennen, Entziehen und paginierte Radio-Team-Ansicht |
| radio/moderation.js | moderatorKey, invalidateModerator, moderatorIsActive, prune, changeModeration, transferModeration; ausdrückliche Abmeldung leert atomar das Thema |
| radio/announcements.js | initializeStudioAnnouncements, announceStudioStatus; öffentliche Bottexte und laufzeitinterner Vergleich der Moderator-ID |
| radio/handover.js | changeHandover, handoverSnapshot, pruneHandover, dropHandoverForUser; berechtigte Teilnehmer und flüchtige Anfrage |
| radio/show.js | Thema und Wunschboxstatus mit bestätigten Vorwerten ändern |
| radio/curtain.js | curtainState, changeCurtain; authentifizierte Ausnahmen, Otterchen als tatsächlicher Inhaber, globalen Vorhang über persist ändern |
| wishes/queue.js | Flüchtige Queue, Annahme, Deduplizierung, Empfang, Entfernen und private wishPositions aus authentifiziertem User |
| wishes/transport.js | Wunschprotokoll und sichtbaren Moderationsempfang prüfen |
| ui/snapshot.js | Berechtigte Ansichtsmodelle und Wunschdarstellung |
| ui/wish-surface.js | Native Wunschoberfläche an die authentifizierte Radio-Sitzung binden; nur UI-Relay, kein Einreihen |
| ui/sessions.js | Aktive Sitzung prüfen; Ansichten öffnen; getViews / removeUserViews |
| transport/views.js | send, refresh, broadcast und allgemeines result |
| transport/events.js | Authentifizierte Events prüfen und an Fachmodule verteilen |
| schedule/calendar.js | Validierte Kalenderdaten, deutsche Tagesgrenze, Wochen und Zeitintervalle |
| schedule/storage.js | Eigene Wochenpersistenz, Wochenindex und personenbezogene Bereinigung |
| schedule/programme.js | Besitzeraktionen, Revisions-/Zeitprüfung und öffentliche Lesepakete |
| schedule/transport.js | Sitzungsgeprüftes mw:schedule-Protokoll und Änderungsbenachrichtigung |
| maintenance.js | Appmanager-/update mit FTP-Dateiprüfung und eigener Auftragssperre |
| lifecycle.js | Appstart, Beitritt, Verlassen, Nutzerlöschung und Shutdown |
| app.js | Ausschließlich Komponenten laden, erzeugen und verdrahten |



## Zustand und Datenfluss

state/persistence besitzt den allgemeinen dauerhaften Zustand und Commit; Sendeplanwochen haben einen eigenen Speicheradapter. radio/moderation besitzt ON AIR und private Sperrmarker, radio/handover die flüchtige bestätigte Übergabe. radio/curtain besitzt den globalen Vorhang; Werbewiedergabe bleibt ausschließlich lokal. wishes/queue besitzt die flüchtige Queue und private aktuelle Positionen, wishes/transport die bestehende Wunschübertragung. ui/sessions besitzt authentifizierte Ansichten; Identität und Rechte kommen immer vom Server.

wishes/wishbox und backend wishes/transport bleiben gegenüber 0.1.112 bytegleich. submissionId, direkte mw:wish.receipt-Quittung, Wiederholungsschutz und Entwurfserhalt sind unverändert. Die Wunschoberfläche verwendet ein natives Channel-Overlay. UI-Eingaben werden nach serverseitiger Paarprüfung an das bestehende Radioformular gegeben; dessen unveränderter Controller sendet weiterhin mw:wish.submit und empfängt mw:wish.receipt. Entwurf und ausstehende Quittung bleiben beim Overlay-Schließen im Radio. Studio, Radio-Team und Sendeplan bleiben unabhängige native Popups.

Private Wunschpositionen stammen aus derselben Moderationsqueue, drei eigene Einträge pro Seite. Generation und Queue-Revision verwerfen alte Antworten. Erledigt/Verwerfen entfernt den ausgewählten Wunsch und lässt Folgeplätze nachrücken; es ist keine automatische Erkennung tatsächlich gespielter Titel. Nur die Moderation sieht fremde Wünsche/Nicks. Ein wirklicher App-Neustart leert die Queue.

## Fenster und Anbieter

ui/layout passt Moderation und Radio-Team vor Sichtbarkeit an natürliche Inhaltshöhe und Bildschirm-/1000-px-Grenze an. lifecycle gibt das Anfangslayout nach geladenem CSS/Markup frei; ein späteres Logo hält es nicht auf. ui/layout und schedule/window halten ihre Höhengrenze vor dem ersten Hostaufruf fest, damit eine als Bildschirmhöhe gemeldete Framehöhe keine Schrumpfschleife auslöst. Nur geänderte Ziele erzeugen Hostaufrufe; unveränderte Verbindungskontrollen erzeugen keine erneute Dialogmessung. Drei Mitglieder pro Seite und einzeln durchblätterbare Statusdetails vermeiden lange Scrollstapel. Reiter, Bestätigung, Inhalte und Breitenwechsel werden weiter berücksichtigt. Moderation startet mit 780 × 600 und erhält vor Sichtbarkeit die gemessene Inhaltshöhe. Die Messung berücksichtigt die vollständige Konsole; ein kleiner oder ignorierter Hostrahmen darf über seine Fallbackansicht keine neue Schrumpfschleife auslösen. Reiter, Fokus und Entwürfe bleiben erhalten. radio/viewport misst ausschließlich die Radioleiste; Öffnen und Schließen der Wunschbox verändern deren Höhe nicht. Die 560 × 360 große Overlayfläche scrollt bei langem Inhalt innerhalb ihrer eigenen Grenzen. Bei ignorierten Hostgrößen bleiben die übrigen Dialoginhalte scrollbar erreichbar.

radio/station validiert ausschließlich explizit konfigurierte öffentliche HTTPS-Adressen und erlaubte Datenhosts. radio/api liest zugeordnete JSON-Felder; keine vom früheren Anbieter abgeleiteten Routen. STREAMPANEL/SPCast ist vorbereitet, aktuelle Produktanschlüsse sind leer. Fehlende Daten erzeugen unbekannt, keine erfundene Null/Sendepause. Ein gültiger Direktstream funktioniert unabhängig von optionalen JSON-Quellen. Status-, Titel- und Höreranfragen bleiben mit eigenen Timern und Generationen getrennt. LIVE/AutoDJ benötigt bestätigten Online-Status und ein boolesches Titelstatusfeld; App-Studioanmeldung ist davon unabhängig.

[API-Nachweis](../api/API-NACHWEIS.md) · [STREAMPANEL-Einrichtung](../betrieb/INBETRIEBNAHME.md#streampanel-einrichten) · [Prüfbericht](../pruefung/PRUEFBERICHT.md). Echte Knuddels-/K3-/STAPP-Abnahme und tatsächlicher Produktanschluss bleiben gesondert offen; kein Upload oder Neustart ausgeführt.
