# MischWerk – Architektur 0.1.104

Startkorrektur 0.1.104: Alle Client.includeJS/includeCSS-Aufrufe geschehen während des HTML-Parsens. Die echte Knuddels-Implementierung verwendet document.write; nachträgliche Aufrufe können das Dokument leeren. start.js wartet für compose auf vollständige Modulregistrierung und DOMContentLoaded. Der frühere DOMContentLoaded-Aufruf der Dateieinbindung ist aufgehoben. Bei ausbleibender Initialisierung zeigt die HTML-Hülle nach 15 Sekunden einen Starthinweis. Parserbasierte und asynchrone Testeinbindungen decken beide Abläufe ab.

Die Laufzeit besteht aktuell aus 84 Dateien: Einstieg und Konfiguration, 27 Servermodulen und 55 Browserdateien einschließlich Original-PNG und eigener Werbe-MP3. Der Vorhang ergänzt seit 0.1.103 einen eigenen Zustandsdienst und zwei reine Radio-Komponenten. Keine Verkettung zu einem Sammelbundle und keine Minifizierung.

## Einstieg und Zusammensetzung

`main.js` enthält drei Zeilen einschließlich Kommentar. Es lädt genau `server/app.js` über `KnuddelsServer.execute` und setzt das von dessen Initialisierung gelieferte globale `App`. Registry und Modulplan liegen ausschließlich im Kompositionsmodul. Dieses lädt die festen Serverdateien einmal, erzeugt eine Laufzeitfassade, verbindet die Komponenten und ordnet ihre Funktionen den unveränderten Knuddels-Hooks und Chatbefehlen zu. Es verarbeitet keine Events selbst.

Die gepflegten Backenddateien unter `src/backend/` werden bytegleich nach `app/server/` kopiert. Der Build erzeugt ausschließlich den Einstieg zusätzlich. Die Laufzeit nutzt ES5 und den [dokumentierten execute-Loader](https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_execute), kein Node-/CommonJS-Modulsystem. Das [ergänzende Wiki](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur) bestätigt die Server-/www-Trennung und Rhino 1.9.1; seine abweichende `KnuddelsServer.require`-Schreibweise wird nicht übernommen.

Im Browser lädt die HTML-Hülle `js/start.js` während des HTML-Parsens. Die reine Weiterleitungsdatei entfällt seit 0.1.102; seit 0.1.104 wartet ausschließlich die Zusammensetzung auf DOMContentLoaded. Alle API-Ressourcenaufrufe bleiben in der Parserphase. Dieses Kompositionsmodul wählt seit 0.1.101 die benötigten Komponenten aus dem vorhandenen Fenstertyp. Nur deren Registrierungen müssen vollständig sein; andere Popupmodule blockieren den Radiostart nicht. Es erzeugt die Komponenten mit ausdrücklich benannten Abhängigkeiten und startet sie einmal. Optionale fremde Fensterdienste sind null und werden nur bei Anwesenheit verwendet. Die Reihenfolge eingehender Scriptantworten ist unerheblich. Eine erneute Einbindung des Einstiegsscripts initialisiert nichts doppelt. Alle 36 Komponenten bleiben insgesamt erreichbar.

Benötigte CSS-Dateien werden je Fenster einzeln und in der ursprünglichen Kaskadenreihenfolge mit `Client.includeCSS` geladen; benötigte JavaScript-Dateien mit `Client.includeJS`. Beide Helfer sind für aktuelle Dateiversionen [offiziell dokumentiert](https://developer.knuddels.de/docs/classes/Client.html#method_includeJS). Grundfarben und anfängliche Unsichtbarkeit bleiben direkt im HTML-Kopf, die frühe STAPP-Größe ebenfalls. Erst geladene Styles und das abgeschlossene Anfangslayout geben den Inhalt frei. Das Original-Logo lädt nativ verzögert mit reservierten Maßen und blockiert den Browser-Ladeabschluss nicht. Fensterpläne und Mengen: [Frontendarchitektur](ARCHITEKTUR-FRONTEND.md).

## Backendkomponenten

Jedes Fachmodul registriert eine klar benannte `attach...`-Funktion. Das Kompositionsmodul übergibt Laufzeitfassade und benötigte Konfiguration; die Module stellen darüber ihre öffentlichen Funktionen bereit. Kein Fachmodul lädt ein anderes. Der Funktions-Abhängigkeitsgraph ist azyklisch und wird automatisch geprüft.

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
| wishes/queue.js | Flüchtige Queue, Annahme, Deduplizierung, Empfang und Entfernen |
| wishes/transport.js | Wunschprotokoll und sichtbaren Moderationsempfang prüfen |
| ui/snapshot.js | Berechtigte Ansichtsmodelle und Wunschdarstellung |
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

Die Erstlade-Koordination ist bewusst von der Persistenz getrennt. Der Speicheradapter kennt keine Moderationskomponente mehr; die Moderation kann weiterhin unabhängig Änderungen über `persist` schreiben. Dadurch entsteht zwischen Speicherung und Moderation kein gegenseitiger Modulbezug.

## Frontend

Die 36 Oberflächenkomponenten, ihre Schnittstellen und Abhängigkeitsrichtung sind in [ARCHITEKTUR-FRONTEND.md](ARCHITEKTUR-FRONTEND.md) beschrieben. HTML-Vorlagen und CSS sind nach denselben Ansichten und Änderungsgründen getrennt.

## Zustandsbesitz

| Zustand | Besitzer |
| --- | --- |
| Dauerhafter Datensatz und Commit | state/persistence; Fachmodule erstellen Kopien ihrer Änderungen, Lifecycle koordiniert Löschbereinigung |
| Globaler Vorhang / lokale Werbewiedergabe | radio/curtain im Backend über persist / private Closure der gleichnamigen Frontendkomponente, kein Fernstart |
| Studio-Sperrmarker / ON AIR | radio/moderation; Sperrmarker privat, Änderungen nur über invalidateModerator |
| Flüchtige Wünsche, nächste ID, Wiederholungsmarker | private Closure in wishes/queue; niemals AppPersistence |
| AppContent-Sitzungsliste | private Closure in ui/sessions; getViews liefert eine Listenkopie, transport/views aktualisiert die Cursor der Ansichtsobjekte |
| Shutdown / angenommener Updateauftrag | lifecycle / private Closure in maintenance |
| Zuletzt veröffentlichte Moderation / Initialisierungsmarker für Botmeldungen | private Closure in radio/announcements; nur primitive ID und Nick, keine Persistenz |
| Offene Studio-Übergabe und laufzeitinterne Revision | private Closure in radio/handover; keine Persistenz, öffentliche Beteiligte nur für Absender/Ziel |
| Diagnose-Drossel | private Closure in core/diagnostics |
| Wochenpläne / Besitzerentwurf / gelesene Wochenpakete | schedule/storage / schedule/editor / schedule/controller |
| Letzter bestätigter Frontendzustand und Empfangszeit | core/model |
| Allgemeine Mutation, Anfrage-ID und Frist | transport/commands |
| Wunschentwurf, Übertragungs-ID und Bestätigungsfrist | wishes/wishbox |
| Themenentwurf und zugeordnete Bestätigung | studio/controls |
| Sichtbarer Queue-Schlüssel und Empfangsversuche | studio/queue |
| Providerstatus, Metadaten, Poll-Timer und Generation | radio/provider |
| Wiedergabephase, Versuch und Medienfrist | radio/player |
| Letzte hörbare Lautstärke | radio/volume |
| Allgemeine Fenstermaße, Layoutfreigabe und Hinweistimer | ui/layout |
| Sendeplanfensterhöhe / lokale Seiten und Zeilenanker | schedule/window / schedule/pages |

## Prüfen und paketieren

`tools/check.cjs` erzwingt aktuelle Laufzeitkopien, API-Signaturen, vollständige UI-IDs, Syntax, Architektur und die Zeichengrenze. `tools/check-file-lengths.cjs` zählt den unveränderten UTF-8-Inhalt einschließlich Zeilenumbrüchen; zusätzlich gilt die strengere UTF-16-Länge. Jede ausgelieferte Textdatei muss weniger als 9.500 Zeichen besitzen. Keine Formatverkürzung oder Build-Minifizierung ersetzt fachliche Trennung.

`tools/build-install.cjs` prüft Quelle und fertigen Upload, kopiert nur die freigegebenen Laufzeitdateien und erstellt das lokale ZIP. `manifest-live.json` enthält Metadaten und geprüfte Verweise auf `manifest-server.json` und `manifest-www.json`. Diese beiden fachlich getrennten Listen enthalten jeweils Pfad, Bytezahl und SHA-256 aller Server- beziehungsweise Browserdateien. Auch alle Manifeste und die ZIP-Prüfsumme unterliegen der Zeichengrenze.

114 Backend-/Vorschaufälle, 97 Browserfälle und echte Rhino-Roundtrips prüfen die Abläufe. Das frühere Vergleichswerkzeug für Referenz-ZIPs wurde zusammen mit entbehrlichen Altdateien entfernt; aktuelle Funktions-, Architektur- und Paketprüfungen bleiben erhalten. Der aktuelle Nachweis steht in [PRUEFBERICHT.md](../pruefung/PRUEFBERICHT.md). Echte Knuddels-/K3-Abnahme sowie ein tatsächlicher Upload/Neustart bleiben separat und wurden nicht ausgelöst.

Öffentliche Studiomeldungen seit 0.1.48: `state/initialization` setzt nach Lesen und Prüfung des bestehenden Moderationszustands eine stille Ausgangsbasis. `transport/views` synchronisiert vor Broadcast und Refresh den aktiven Status über `radio/announcements`. Das Modul liest die bestehende Moderationsprüfung, besitzt nur seinen eigenen Vergleichszustand und schreibt weder Moderation noch Persistenz. Botfehler werden lokal abgefangen. Die Abhängigkeitsrichtung bleibt von Veröffentlichung/Initialisierung über Ankündigung zur Moderation und Persistenz; kein Rückverweis aus Speicherung oder Moderation.

Bestätigte Übergabe 0.1.49: Das Handovermodul hält Anfrage und Revision und prüft die Teilnehmer. Es ruft für die Annahme transferModeration auf, das Moderator und Thema gemeinsam über persist speichert. Die Nachrichtendarstellung bleibt bei radio/announcements. Snapshot/Veröffentlichung und Lifecycle invalidieren über die öffentlichen Handoverfunktionen veraltete Anfragen. Keine Rückabhängigkeit aus Moderation oder Persistenz zur Übergabe. Die UI hält nur ihren Themenentwurf; bestätigter Anfragestatus kommt aus dem Modell.

Seit 0.1.67 sind Mehr/Zurück, ihre Ereignisbindungen und der Detailzustand vollständig entfernt. Markup trennt zwei öffentliche Aktionen von der rollenabhängigen Verwaltungszeile. updates blendet Moderation anhand canModerate und Radio-Team anhand canManageRadioModerators ein; beide Werte stammen unverändert aus dem Backend. Der ausdrücklich bestätigte Inhaberzugang bleibt enthalten. Metadaten werden einmal dargestellt und direkt nativ gescrollt; keine duplizierten Detailfelder. Player/Anbieter/Lautstärke und Backendrechte unverändert.

Seit 0.1.68 sind die dekorativen äußeren Flächen aus Markup und Styles entfernt. Nur die mittlere Musikfläche bleibt als Karte bestehen. Sendeplan und Wunschbox verwenden dieselbe Goldfarbe, beide privaten Verwaltungsaktionen Rot. Sichtbarkeit, Serverrechte und sämtliche Ereignisbindungen bleiben unverändert.

Seit 0.1.69 zeichnet radio-surface.css eine schmale Goldbeleuchtung mit 1-Pixel-Kern und begrenztem weichem Lichtschein. Der vorhandene Zustand body.playing steuert sie unverändert; kein neuer Timer und keine Änderung am Player. Ohne Wiedergabe ist die Pseudofläche vollständig unsichtbar. Die mittlere Karte besitzt keine permanente Goldkante.

Seit 0.1.70 verwendet radio-surface.css für den schmalen Wiedergaberahmen Weiß (#F5F5F5) und weiße Lichtschichten. Schaltung über body.playing, Geometrie, Rollen und öffentliche goldene/private rote Buttons bleiben unverändert.

Seit 0.1.71 begrenzt metadata-layout.css die Metadatenfläche im Desktopraster mit align-self:stretch auf die vorhandene Höhe. Damit bleibt overflow-y:auto bei langen Musik-/Sendungsangaben wirksam; der äußere 160-Pixel-Rahmen bewegt sich nicht mit. Keine Schnittstellen-, Rollen- oder Audiologikänderung. Der Browsertest umfasst 32 Breiten-/Skalierungs-/Rollenkombinationen mit kurzen und langen Angaben sowie nativer Radbedienung.

Seit 0.1.72 entfernt radio.css die globale Maximalbreite der Radioleiste; width:100% und margin:0 nutzen den vorhandenen Frame vollständig. metadata-layout.css zentriert seit 0.1.78 bei jeder Framebreite die gemeinsam angeordneten Musik-/Sendungs-/Lautstärkeangaben innerhalb der flexiblen Mitte. Seit 0.1.81 leuchtet ausschließlich die bestehende Kontur der inneren Musikkarte; die frühere äußere Leisten-Pseudofläche ist entfernt. Keine Änderung der Wiedergabe- oder Plattformlogik.

Seit 0.1.73 zeichnet radio-surface.css den Musikkartenhintergrund über geschichtete CSS-Verläufe und zwei statische, an der Karte beschnittene Pseudoflächen. Die Metadaten liegen in der höheren Zeichenebene; keine Layout-/Ereignis-/Moduländerung und keine neuen Dateien.

Seit 0.1.74 besitzt radio.css die Gewichtung, Farbe und Buchstabenabstände der Themenanzeige. radio-responsive.css und metadata-layout.css passen ausschließlich den Abstand für die vorhandenen Ansichten an. Keine neue Schrift, Datei oder Schnittstelle.

Seit 0.1.75 gestaltet radio-actions.css die aktive Moderationsbeschriftung und den hervorgehobenen Nick. radio-responsive.css lässt beide Inhalte bei knapper Breite natürlich umbrechen. Die bestehende Zustandsdarstellung in radio/presentation.js bleibt unverändert.

Seit 0.1.76 stimmt radio.css Gewichtung, Farbtöne und Buchstabenabstände von Titel und Interpret auf Thema und Moderation ab. Größen, Datenbindung, Schreibweise und Umbruch bleiben erhalten. Keine neue Schrift, Datei oder Schnittstelle.

Seit 0.1.77 gestaltet radio.css Reglerbahn, Griff, Lautstärkebeschriftung und Prozentanzeige; radio-surface.css besitzt die passende Mute-Oberfläche und rote Darstellung hoher Werte. Native Range-Eingabe und volume.js bleiben unverändert; kein neues Modul und keine Schnittstelle.

Seit 0.1.78 zentriert metadata-layout.css die tatsächliche Musik-/Sendungs-/Lautstärkegruppe unabhängig von der Framebreite. radio-responsive.css erhält dieselbe dekorative Karte in den schmalen Rastern. radio-surface.css passt die Kreisgrößen an die Kartenbreite an, statt nach 1600 px Position und Intensität umzuschalten. Keine Änderung an Plattformaufrufen, Datenbindung oder Audiologik.

Seit 0.1.79 besitzt dialogs.css die ausdrücklich auf wishes/schedule begrenzte Hintergrund- und Formulargestaltung; schedule.css die Wochenwahl und Tages-/Sendungskarten. Native Größenmessung, Transport, Formulardaten und Berechtigungen bleiben unverändert. Keine neue Laufzeitdatei.

Seit 0.1.80 besitzt radio-surface.css die plastischen Play-/Pause-/Sendepause-Oberflächen, radio-actions.css die gleich gestalteten goldenen Navigationsbuttons. radio.css enthält keinen überschreibenden flachen Hover mehr. Geometrie, Symbole, Datenbindung und Audiologik unverändert.

Seit 0.1.81 wechselt radio-surface.css direkt Randfarbe und Schatten der inneren radio-program-face über body.playing. Die äußere radio-bar besitzt keine Leucht-Pseudofläche mehr. Geometrie, Pseudoelemente der Dekoration und Playerzustand bleiben erhalten.

Seit 0.1.82 gestaltet radio-actions.css auch die roten studio-link-Buttons für Moderation und Radio-Team mit Verlauf, Struktur, Innenkante und Sockelschatten. Kompakte und ausgeschriebene Ansichten teilen dieselbe Gestaltung. Rollen, Attribute, Geometrie und Eingabeverarbeitung unverändert.

Seit 0.1.83 setzt ui/updates.js am Aktionscontainer die Darstellungsklasse public-only aus der bereits bestätigten Sichtbarkeit der privaten Zeile. radio-actions.css und radio-responsive.css besitzen das vertikale Hörerraster und den begrenzten mobilen Fallback. Keine neue Fähigkeit und keine Plattformmethode.

Seit 0.1.84 nutzt die Wunschqueue ihre vorhandene Übertragungs-ID-Tabelle vor einem Listenzugriff; neue IDs erfordern keine vollständige Queue-Suche mehr. Die Radio-Team-Komponente erhält unveränderte DOM-Zeilen und den Tastaturfokus. Gemeinsame Textausgabe schreibt nur tatsächlich geänderte Texte. Der Entzug einer Moderatorenrolle ändert die Anmeldung ausschließlich mit erfolgreichem Persistenz-Commit. Sendeplan-Benachrichtigungen isolieren einzelne defekte Fenster nach dem Commit; Termine bis 00:00 erzeugen keine leere Fortsetzung. Radio-Team und Sendeplan lassen lesendes Aktualisieren auch bei veraltetem Verbindungsstatus zu.

Die gemeinsame Laufzeitprüfung in check-file-lengths prüft seit 0.1.84 auch den vollständigen Dateibestand und verweigert Symlinks. Paketbau und unabhängige Paketprüfung verwenden dieselbe Inventarprüfung; doppelte Verzeichnisdurchläufe im Paketbau entfallen. Modulanzahl, Anwendungsfunktionen, Speicher- und Ereignisformate bleiben erhalten.

Seit 0.1.85 bleiben Moderation und Radio-Team beim nativen Popupmaß 780 × 680 bzw. 560 × 560. ui/layout sendet für diese beiden Ansichten keine nachträglichen HostFrame-Größenaufrufe. Die vorhandenen Studio-/Wünsche-Reiter greifen bei knapper Höhe auch im STAPP-Pfad; übrige Überhöhe bleibt nativ scrollbar. Messungen beginnen erst bei document.readyState=complete. Wunschbox und Sendeplan behalten ihre natürliche Höhenanpassung. Die lokale Vorschau öffnet dieselben Anfangsmaße wie das Backend.

Seit 0.1.86 besitzt radio/listeners ausschließlich den öffentlichen RadioKing-Zähler, dessen Darstellung, Timer, laufende Anfrage und Sendergeneration. radio/api prüft den abgeleiteten /listener-Endpunkt und listener_count. updates wählt die bestätigte Senderkonfiguration; lifecycle stößt Sichtbarkeits-/Seitenrückkehr und Dispose an. Keine Serverpersistenz, Authentifizierung oder Kopplung an Play erforderlich. Erfolgsabstand 20 Sekunden nach Antwort, Fehlerabstand 60 Sekunden; Hintergrund und Popups bleiben ohne Abfragen. Die Anzeige steht bei den Moderationsinformationen für alle Rollen. Fehlende Daten erzeugen keine künstliche Null.

Seit 0.1.87 ist die Hörerzahl auf Nutzerwunsch in radio-actions.css mit 18 px, Gewicht 700 und Gold #FFCE61 auf einer dunklen Fläche mit feiner Goldkontur hervorgehoben. Lange Zahlen und Fehlertext dürfen natürlich umbrechen. Ausschließlich Darstellung; Abfragetakt, Datenbindung und Funktionen unverändert.

Seit 0.1.88 steht die Hörerzahl mittig unter Play/Pause statt neben der Live-Moderation. Der sichtbare Wiedergabestatus samt Punkt entfällt. Sein bestehender Text bleibt im Screenreaderbereich; Audio- und Statuslogik unverändert. Die Höreranzeige besitzt getrennte Beschriftungs-/Wertknoten, zugänglichen Volltext und bei schmalen Ansichten ein Hörersymbol. Ein Strich kennzeichnet fehlende Daten; sehr lange Zahlen sind im Volltext zugänglich. Der überholte Präsenzwrapper und die nicht mehr verwendeten live-badge-Styles wurden entfernt.

Statuszentrale 0.1.89: Im Radio-Team-Popup bleibt die Teamverwaltung Standard; der zweite Reiter öffnet die Statusübersicht. team/status-markup besitzt die statische Vorlage, team/status-view stellt bestätigte Appzustände und frische Anbieterbefunde dar, team/status besitzt Auswahl, Einzelrunde, Timer und Generation. Nur sichtbar, ausgewählt, mit bestätigter Besitzerrolle und App-Verbindung lesen. Sender und Hörer parallel; Titel nach Senderantwort, außer bei stopped. Takt 30 s nach Abschluss, 60 s bei Abruffehlern; Rückkehr sofort. Antworten nach Sender-/Reiter-/Rechtewechsel und Seitenende verwerfen. Alle bestehenden Header-/Audiokomponenten bleiben getrennt. LIVE/AutoDJ ist eine Auswertung des strikt booleschen is_live der aktuellen RadioKing-Titelmeldung bei frischem started-Senderstatus, keine Prüfung der Encoderverbindung. Studio-ON-AIR und Anbieterbefund bleiben getrennt; Abweichungen sichtbar. Providerwerte nach 90 s als veraltet behandeln; bei verlorener App-Verbindung keine aktuellen Appwerte behaupten. Jetzt prüfen kann den vorhandenen mw:refresh-Weg auslösen. Keine neue Backendaktion oder Persistenz.

Seit 0.1.90 auf ausdrücklichen Nutzerwunsch kompakte Statuszentrale ohne Funktionsentfall: neun Statuswerte weiterhin direkt sichtbar, drei Spalten ab 481 px und zwei Spalten bis 480 px. Kürzere Abstände und nur im gewählten Statusreiter ein kompakter gemeinsamer Dialogkopf; Radio-Team-Verwaltung sonst unverändert. Vollständige Erklärungen, Titel/Interpret, Thema, Prüfzeiten, Intervall-/Quellenhinweise und externer Anbieterlink im nativen Bereich „Details & Prüfzeiten“. Aufklappen per Maus, Touch oder Tastatur; geöffneten Zustand und Fokus bei Zustandsupdates erhalten. Konfliktwarnungen unabhängig vom Detailsbereich sofort sichtbar halten. Keine Kürzung langer Moderatornamen oder sonstiger Originaldaten; nötigenfalls vertikal scrollen. Alle neun Werte und die mindestens 44 px großen Bedienelemente im normalen Zustand bei 320/390/480/481/560/780 × 560 px ohne Überlauf geprüft. Keine Skalierung, kein Zoom, keine Schrift unter 12 px; Werte mindestens 16 px, Hörerzahl 20 px. Polling, Quellenvalidierung, Rollen, Fehler-/Verbindungslogik, Radioaudio, Backend und native Fenstermaße unverändert. Die Klasse status-central-open ist ausschließlich ein Darstellungszustand.

Seit 0.1.91 auf ausdrücklichen Nutzerwunsch Statuspunkte direkt vor den Statuswerten statt farbiger Kartenränder: 9 px rund, bestätigte nutzbare/aktive Zustände grün #9CCDA2, Fehler und bestätigter Senderstopp rot #FF6B5F, unbekannte oder inaktive Zustände neutral #99958A. Die bisherigen ok-/gold-/error-/neutral-Darstellungszustände bleiben fachlich unverändert; die bisherigen goldenen aktiven Werte erhalten ebenfalls einen grünen Punkt. Alle Kartenränder gleichmäßig neutral 1 px #595959. Statuswerttexte in Creme, Warntexte weiterhin hervorgehoben. Punkte rein dekorativ per CSS, Zustandsbedeutung weiter im Klartext; keine Animation, keine neuen DOM-Datenfelder, Abfragen oder Funktionen. Kompakte Geometrie, Details, Rechte und Aktualisierung erhalten.

Seit 0.1.92 auf ausdrücklichen Nutzerwunsch in der Statuszentrale die sichtbare Beschriftung „Warteschlange“ sowohl auf der Übersichtskarte als auch unter Details & Prüfzeiten durch „Offene Musikwünsche“ ersetzen. Ausschließlich Textänderung; status-queue-IDs, Anzahl, Datenquelle, Statuspunkt, Aktualisierung und Berechtigungen erhalten. Die längere Beschriftung passt weiterhin bei 320 und 560 px ohne zusätzliche Dialoghöhe.

Seit 0.1.93 nach Nutzerprüfung des Statuskopfs die technische 30-/60-Sekunden-Zeile aus der Hauptübersicht in Details & Prüfzeiten verschieben. status-refresh-note-ID und Statusfunktion erhalten. Intervallhinweis verständlich und ohne Doppelung ausgeben: nach Abschluss 30 Sekunden, bei Abruffehlern 60 Sekunden; bei fehlender Konfiguration bzw. App-Verbindung Einrichtung/pausierte Prüfung erklären. Abruf läuft sichtbar im bestehenden Button als „Prüfe …“, sonst „Jetzt prüfen“; Mindestbreite verhindert Springen der Bedienung. Statuszentrale-Titel, manuelle Prüfung, AutoDJ/LIVE und sichtbare Quellenbeschriftung „RadioKing · Titelstatus“ beibehalten, da Sendemodus weiter nur aus Titelmeldung abgeleitet wird. Kein neuer Abfragetakt, keine neue Datenquelle, keine Rechte-/Audio-/Timeränderung. Hauptansicht knapp 25 px niedriger, weiterhin alle neun Statuswerte direkt sichtbar.
