# MischWerk – Frontendarchitektur 0.1.104

Verbindlicher Start seit 0.1.104: index.html ruft Client.includeJS für js/start.js direkt während des Parsens auf. start.js fordert seinen unveränderten Fensterplan ebenfalls während des Parsens an und wartet erst vor compose auf DOMContentLoaded und sämtliche Modulregistrierungen. Die Plattform verwendet document.write; ein Aufruf aus dem DOMContentLoaded-Handler konnte das Dokument löschen. Ein Starthinweis nach 15 Sekunden ohne mw-ready liegt mit eigenem kritischem Stil in der HTML-Hülle und verschwindet bei späterem erfolgreichem Start. Neue Regression: parserbasierte Ressourceninjektion für alle fünf Ansichten und fehlendes Modul mit anschließender Wiederherstellung.

Seit 0.1.103 ergänzt radio/curtain-markup die statische Verhüllung und das native, anfangs quellenlose Audioelement. radio/curtain besitzt die lokale Werbewiedergabe, Fokusverwaltung und Darstellung des serverbestätigten Vorhangzustands. Abhängigkeiten explizit: model, dom, commands, signals, player und radio-audio. Der globale Schalter sendet mw:setCurtain mit boolean closed und previousClosed; nur der Server vergibt canManage/exempt. Werbung läuft ausschließlich nach lokalem Klick. Die MP3 und diese beiden Komponenten gehören nur zum Radio, Popups laden sie nicht.

Die ehemalige Weiterleitungsdatei entfällt weiterhin. mw-ready und native Größenmessung warten auf geladenes CSS und das fertige Layout. Die Moderationsqueue quittiert ausschließlich nach mw-ready; finishInitialLayout sendet dafür das bestehende queue-visible-Signal.

Seit 0.1.101 besitzen CSS und der zentrale Modulplan eine Fensterzuordnung. Früh anhand der bestehenden pageData.view auswählen; nur die gewählten Vorlagen einsetzen und ihre Komponenten einmalig verbinden. Gemeinsame Komponenten verwenden ausdrücklich übergebene optionale Dienste nur, wenn sie vorhanden sind. Keine Initialisierung fremder Popupformulare in der Radioleiste, keine Radio-Audiokomponenten in Popups. Der Architekturcheck kontrolliert alle fünf Ladepläne und die Erreichbarkeit sämtlicher 36 Komponenten.

| Fenster | JavaScript-Dateien inkl. einem Einstieg | Stylesheets |
| --- | --- | --- |
| Radioleiste | 18 | 8 |
| Wunschbox | 10 | 4 |
| Moderation | 13 | 6 |
| Radio-Team einschließlich Statuszentrale | 14 | 6 |
| Sendeplan | 15 | 5 |

Vorher lud jedes Fenster 36 JavaScript-Dateien und 14 Stylesheets. Das Logo bleibt unverändert, erhält feste Layoutmaße und native verzögerte Bildladung. CSS, benötigte Module und das echte Anfangslayout bleiben Voraussetzung für mw-ready und Hostmessung; das Bild selbst blockiert window.load nicht. Die öffentliche Navigation wird im Transportstart gebunden. Studiothemenentwurf und Radiothemenanzeige haben ihre jeweiligen Besitzer. Kein neues Laufzeitmodul und keine neue Plattformmethode.

`www/index.html` enthält die gemeinsame Fensterhülle und Platzhalter. Der Radioaufbau gehört zu radio/markup.js. Statische Vorlagen für die vier Popups liegen bei ihren jeweiligen Fachkomponenten. Ein gemeinsamer DOM-Helfer setzt nur diese mitgelieferten Vorlagen ein; fremde Texte gelangen weiterhin ausschließlich über `textContent` in die Oberfläche.

| Datei unter www/js/ | Verantwortung / öffentliche Schnittstelle |
| --- | --- |
| core/dom.js | el, setText, element, time, mount |
| core/signals.js | Lokale Benachrichtigungen: on / emit |
| core/model.js | Bestätigten Zustand empfangen; current, connected, feste view |
| radio/markup.js | Statischer Radioaufbau, eine Datenbindung je Bedienung |
| radio/curtain-markup.js | Statischer Vorhang und natives Werbe-Audio ohne anfängliche Quelle |
| radio/curtain.js | start; lokalen Werbeklick, Vorhang, privaten Schalter und Fokus verwalten |
| radio/viewport.js | start, resize; Framegeometrie nach geladenen Ressourcen, kompakter Fallback, direkt scrollbar erreichbare Metadaten und Fokus |
| ui/layout.js | Fensterhülle, Hinweis, Ansichtsauswahl, Größen und Reiter |
| transport/commands.js | start für vier Radio-Popupaktionen, send, result, nextId, pending; zugeordnete Mutationsbestätigung |
| transport/lifecycle.js | Client-Hooks, Refresh-/Sichtbarkeitstimer, Seitenende, Anfangslayout |
| radio/api.js | Adressen prüfen, Status-/Titel-/Hörerantworten lesen und validieren |
| radio/presentation.js | Titel, Interpret, bestätigtes Thema, Metadatenanordnung und ON AIR darstellen |
| radio/provider.js | Senderwechsel, getrennte Titel-/Statustimer, je eine laufende Anfrage, Generation/Titelrevision und dispose |
| radio/listeners.js | Öffentliche Hörerzahl, eigener 20-/60-Sekundentakt, Einfachabfrage und Generation; selectStation, poll, dispose |
| radio/player.js | start, stop, renderStatus; native Medienereignisse und Wiedergabeversuche |
| radio/volume.js | start, preparePlayback; Lautstärke, Mute und Begrenzung auf höchstens 10 % beim Öffnen/Start sowie optionale Speicherung |
| wishes/markup.js | Statischer Aufbau der Wunschbox |
| wishes/wishbox.js | start, receipt, availability, fitText; Formular und Wunschversand |
| studio/markup.js | Statischer Aufbau der Studiokonsole |
| studio/handover-markup.js | Statische Vorlage des eigenen Übergabebereichs |
| studio/handover.js | Anfrage, Warten, Annahme mit lokalem Themenentwurf, Ablehnen/Abbrechen; eigener sichtbarer Bereich |
| studio/controls.js | Studiosteuerung, Thema und zugeordnete Themenbestätigung |
| studio/queue.js | Sichtbaren Wunsch darstellen, quittieren, erledigen/verwerfen |
| team/markup.js | Statischer Aufbau der Radio-Team-Verwaltung |
| team/management.js | Teamliste und Ernennungs-/Entfernungsaktionen |
| team/status-markup.js | Statische Statusvorlage |
| team/status-view.js | render; Appzustände, frische Anbieterbefunde, Quellen und Konflikte darstellen |
| team/status.js | start; Reiterauswahl, Abfragerunde, Timer, Sichtbarkeit und Sendergeneration |
| schedule/calendar.js | Kalenderdaten formatieren, gültiges Datum seiner Montag-Woche zuordnen und Wochen verschieben |
| schedule/markup.js | Statischer Aufbau von Wochenplan und Besitzerformular |
| schedule/view.js | Sieben datierte Tage, Sendungen und Empfangsfortsetzungen darstellen |
| schedule/editor.js | Besitzerentwurf mit fester Wochenrevision, bindWeek und ready; zukünftiges Neuanlagedatum über Wochen hinweg erhalten |
| schedule/pages.js | Natürliche Tageszeilen halten, sichtbare Seiten bilden und lokale Seitenauswahl bewahren |
| schedule/window.js | Inhaltshöhe messen, STAPP-Fenstergröße und begrenzten sichtbaren Platz koordinieren |
| schedule/controller.js | Kleine Lesepakete zusammensetzen; Antworten, Mutationen und Navigieren |
| ui/updates.js | Zustandsänderungen an Ansichten verteilen und Bedienbarkeit aktualisieren |

Die Abhängigkeiten verlaufen von DOM/Signalen/Modell über Transport und Fachkomponenten zur Ansichtskoordination und zum Lebenszyklus. Der Player erhält die vor ihm erzeugte Lautstärkekomponente und ruft vor jedem manuellen Start preparePlayback auf. Die Begrenzung und Anzeige bleiben in der Lautstärkekomponente. Der Player erhält den Provider, der Provider kennt den Player nicht und meldet Änderungen über Signale. Ebenso kennt der Befehlstransport keine Studiokomponente; Themen- und Ergebnisbenachrichtigungen halten Entwürfe und Quittungen getrennt. Das Kompositionsmodul übergibt jede Abhängigkeit ausdrücklich. Die Architekturprüfung lehnt Vorwärtsreferenzen, doppelte oder unverdrahtete Komponenten ab.

Dreizehn Stylesheets unter `www/css/` trennen Grundlagen, Radioleiste, Fenster, Studiokonsole, Teamliste, Hinweise, responsive Radio-/Fensterlayouts, Radiooberflächen und Metadatenanordnung. Die ursprüngliche Regelreihenfolge bleibt erhalten; es gibt keine beliebigen nummerierten Teildateien.

Seit 0.1.56 setzt radio.css die gemeinsame Schriftfamilie, Gewichtung und Zeilenhöhe der Musikdaten. radio-responsive.css ordnet Größen den vorhandenen Ansichten zu; metadata-layout.css behandelt fehlende Werte und das alleinstehende Thema. radio-surface.css besitzt ausschließlich die Oberfläche samt mobiler Ausdehnung. Keine zusätzliche Datei oder Schriftanfrage ist erforderlich.

Zustandsbesitz, Backend und gemeinsame Prüfungen: [Architektur](ARCHITEKTUR.md).

Die Sendeplan-Komponenten werden ausschließlich vom zentralen Startmodul verdrahtet. Der Controller erhält Kalender, Ansicht, Editor, Modell und Transport ausdrücklich. Das Wochenprotokoll lädt erst beim geöffneten Sendeplan Daten; der Radiozustand enthält keine Planlisten. Unveränderte Wochen werden nicht neu aufgebaut. `schedule/window` besitzt die Höhensteuerung ausschließlich dieses Popups. Nach `schedule-content` übernimmt `schedule/pages` die Originalzeilen einschließlich ihrer Aktionen; Fenster-/Formularänderungen lösen über `schedule-layout` eine neue Platzmessung aus. `schedule-reveal` zeigt nach dem Speichern den betroffenen Tag. Native Größenanpassung erfolgt ausschließlich außerhalb K3; lokale Seiten greifen erst an der verfügbaren Höhengrenze. Die Seitenkomponente kennt weder Transport noch Editor und begrenzt keine Termine. Details zu Rechten und Persistenz: [SENDEPLAN.md](../betrieb/SENDEPLAN.md).

`radio-actions.css` gestaltet ausschließlich den Moderationsstatus, Sendeplan-/Wunschboxbuttons und Verwaltungslinks der Radioleiste einschließlich ihrer schmalen Anordnung. Die allgemeinen Leisten-/Playerregeln bleiben in `radio.css` und `radio-responsive.css`; `schedule.css` ist ausschließlich für das Wochenplan-Popup zuständig.

Studio-Übergabe seit 0.1.49: eigene Vorlage und Komponente im zentralen Startmodul, eigener Stil handover.css. Snapshot- und Bedienbarkeitsereignisse aktualisieren den Bereich ohne Entwurfsverlust. Das Modell verwirft ältere Übergaberevisionen. Die Annahme nutzt den bestehenden zugeordneten Befehlstransport; nur bestätigter Erfolg setzt den allgemeinen Themenentwurf zurück. Rückkehr zum Studio beendet keine offene Anfrage.

Seit 0.1.54 besitzt radio/provider getrennte Pollingzeiten: Titel fünf Sekunden nach erfolgreichem Abschluss, Senderstatus 30 Sekunden. Langsame Statusantworten blockieren die Titelfolge nicht. Jede Sendergeneration besitzt höchstens eine laufende Anfrage pro Typ. radio/api liefert bevorzugt frische Titel ohne Browsercache; bei Fehlern wird automatisch erst nach 30 Sekunden erneut versucht.

Seit 0.1.55 besitzt schedule/controller die ausdrücklich angeforderte Zielwoche unabhängig von zuletzt gelesenen Daten. Datumswechsel eines neuen Entwurfs laden diese Woche; alte Antwort-IDs werden verworfen. schedule/editor behält Eingaben und bindet die passende neue Zielwoche erst nach vollständigem Empfang an deren Revision. Speichern bleibt bis dahin gesperrt. Beim Refresh derselben Woche bleibt die feste Entwurfsrevision erhalten. Bestehende Einträge werden weiterhin innerhalb ihrer ursprünglichen Woche bearbeitet.


Seit 0.1.59 entscheidet ui/layout anhand der vollständigen Konsolenhöhe über Reiter in festen K3-Fenstern; natürliche STAPP-Größen bleiben getrennt. wishes/wishbox hält Versandrückmeldungen im Sichtfeld. schedule/controller bestimmt den bestätigten Eintrag, schedule/window koordiniert dessen Anzeige und schedule/pages wählt dessen tatsächliche Seite. Kein neues Eventformat, keine zusätzlichen Komponenten und keine Fachlogik im Einstieg.





Seit 0.1.63 registriert start.js 30 Komponenten. radio/markup setzt den Radioaufbau über den vorhandenen DOM-Helfer ein; viewport besitzt ausschließlich die Frame-/Darstellungsentscheidung und den nativen Metadatenzugang ohne Menüzustand. presentation liefert vollständige Songtexte und ausdrücklich benannte Moderationszustände. radio-responsive.css ordnet breite, kompakte und mobile Ansichten an; metadata-layout.css besitzt den direkten scrollbar erreichbaren Volltextzugang. Erst nach vollständig geladenen Ressourcen wird gegebenenfalls ein Nicht-K3-Hostaufruf ausgeführt. Ignorierte Hostgrößen lassen den 160-px-Fallback bestehen. Keine neue Plattformmethode und kein neuer Serverzustand; Audio-, Anbieter- und Lautstärkemodule bleiben bytegleich.

Seit 0.1.66 beschränkt radio.css die Radiofläche auf maximal 1360 Pixel und gruppiert Musik, Sendungsstatus und Lautstärke zusammen. radio-surface.css zeichnet die drei rein dekorativen Rasterflächen. Markup enthält dafür ausschließlich aria-hidden Flächen ohne Ereignisbindung; Bedienung, Player und Schnittstellen bleiben unverändert.

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

Seit 0.1.84 vermeidet core/dom unveränderte Text-/Tooltip-Zuweisungen; Live-Regionen verlieren ihre Textknoten nicht mehr durch den sekündlichen Bedienbarkeitscheck. team/management baut identische Mitgliederlisten nicht erneut auf und erhält dadurch den Tastaturfokus. Lesendes Aktualisieren in Radio-Team und Sendeplan bleibt bei Verbindungsverlust erreichbar; Mutationen bleiben gesperrt. schedule/view zeichnet für ein Ende um exakt 00:00 keinen zweiten Termin mit Dauer null. Keine neue Komponente oder Plattformmethode und keine Gestaltung geändert.

Seit 0.1.85 behalten Moderation und Radio-Team ihre nativen Popupmaße. ui/layout passt ausschließlich den Inhalt mit vorhandenen Reitern und Scrollen ein, auch außerhalb K3. Keine Inhaltsmessung vor document.readyState=complete und keine nachträglichen Größenaufrufe für Verwaltungsfenster. Wunschbox, Sendeplan und Headerbar behalten ihre jeweiligen Größenpfade. Die Vorschau verwendet dieselben Anfangsmaße wie das Backend.

Seit 0.1.86 registriert start.js 31 Komponenten. Die neue Hörerkomponente erhält Modell, DOM, API und Signale ausdrücklich. updates/lifecycle verwenden ihre öffentliche Schnittstelle; kein Rückverweis auf Player, Provider oder Rechte. Die Zählung wird nur in der sichtbaren Radioleiste direkt beim eigenen öffentlichen RadioKing-Sender gelesen. Fehler löschen die vermeintlich aktuelle Zahl zugunsten „nicht verfügbar“. Die API verwendet bevorzugt natives Fetch ohne Browsercache und Zugangsdaten sowie den bestehenden XHR-Fallback. Die öffentliche Freigabe im RadioKing-Manager ist Voraussetzung.

Seit 0.1.87 ist die Hörerzahl auf Nutzerwunsch in radio-actions.css mit 18 px, Gewicht 700 und Gold #FFCE61 auf einer dunklen Fläche mit feiner Goldkontur hervorgehoben. Lange Zahlen und Fehlertext dürfen natürlich umbrechen. Ausschließlich Darstellung; Abfragetakt, Datenbindung und Funktionen unverändert.

Seit 0.1.88 steht die Hörerzahl mittig unter Play/Pause statt neben der Live-Moderation. Der sichtbare Wiedergabestatus samt Punkt entfällt. Sein bestehender Text bleibt im Screenreaderbereich; Audio- und Statuslogik unverändert. Die Höreranzeige besitzt getrennte Beschriftungs-/Wertknoten, zugänglichen Volltext und bei schmalen Ansichten ein Hörersymbol. Ein Strich kennzeichnet fehlende Daten; sehr lange Zahlen sind im Volltext zugänglich. Der überholte Präsenzwrapper und die nicht mehr verwendeten live-badge-Styles wurden entfernt.

Statuszentrale 0.1.89: Im Radio-Team-Popup bleibt die Teamverwaltung Standard; der zweite Reiter öffnet die Statusübersicht. team/status-markup besitzt die statische Vorlage, team/status-view stellt bestätigte Appzustände und frische Anbieterbefunde dar, team/status besitzt Auswahl, Einzelrunde, Timer und Generation. Nur sichtbar, ausgewählt, mit bestätigter Besitzerrolle und App-Verbindung lesen. Sender und Hörer parallel; Titel nach Senderantwort, außer bei stopped. Takt 30 s nach Abschluss, 60 s bei Abruffehlern; Rückkehr sofort. Antworten nach Sender-/Reiter-/Rechtewechsel und Seitenende verwerfen. Alle bestehenden Header-/Audiokomponenten bleiben getrennt. LIVE/AutoDJ ist eine Auswertung des strikt booleschen is_live der aktuellen RadioKing-Titelmeldung bei frischem started-Senderstatus, keine Prüfung der Encoderverbindung. Studio-ON-AIR und Anbieterbefund bleiben getrennt; Abweichungen sichtbar. Providerwerte nach 90 s als veraltet behandeln; bei verlorener App-Verbindung keine aktuellen Appwerte behaupten. Jetzt prüfen kann den vorhandenen mw:refresh-Weg auslösen. Keine neue Backendaktion oder Persistenz.

Seit 0.1.90 auf ausdrücklichen Nutzerwunsch kompakte Statuszentrale ohne Funktionsentfall: neun Statuswerte weiterhin direkt sichtbar, drei Spalten ab 481 px und zwei Spalten bis 480 px. Kürzere Abstände und nur im gewählten Statusreiter ein kompakter gemeinsamer Dialogkopf; Radio-Team-Verwaltung sonst unverändert. Vollständige Erklärungen, Titel/Interpret, Thema, Prüfzeiten, Intervall-/Quellenhinweise und externer Anbieterlink im nativen Bereich „Details & Prüfzeiten“. Aufklappen per Maus, Touch oder Tastatur; geöffneten Zustand und Fokus bei Zustandsupdates erhalten. Konfliktwarnungen unabhängig vom Detailsbereich sofort sichtbar halten. Keine Kürzung langer Moderatornamen oder sonstiger Originaldaten; nötigenfalls vertikal scrollen. Alle neun Werte und die mindestens 44 px großen Bedienelemente im normalen Zustand bei 320/390/480/481/560/780 × 560 px ohne Überlauf geprüft. Keine Skalierung, kein Zoom, keine Schrift unter 12 px; Werte mindestens 16 px, Hörerzahl 20 px. Polling, Quellenvalidierung, Rollen, Fehler-/Verbindungslogik, Radioaudio, Backend und native Fenstermaße unverändert. Die Klasse status-central-open ist ausschließlich ein Darstellungszustand.

Seit 0.1.91 auf ausdrücklichen Nutzerwunsch Statuspunkte direkt vor den Statuswerten statt farbiger Kartenränder: 9 px rund, bestätigte nutzbare/aktive Zustände grün #9CCDA2, Fehler und bestätigter Senderstopp rot #FF6B5F, unbekannte oder inaktive Zustände neutral #99958A. Die bisherigen ok-/gold-/error-/neutral-Darstellungszustände bleiben fachlich unverändert; die bisherigen goldenen aktiven Werte erhalten ebenfalls einen grünen Punkt. Alle Kartenränder gleichmäßig neutral 1 px #595959. Statuswerttexte in Creme, Warntexte weiterhin hervorgehoben. Punkte rein dekorativ per CSS, Zustandsbedeutung weiter im Klartext; keine Animation, keine neuen DOM-Datenfelder, Abfragen oder Funktionen. Kompakte Geometrie, Details, Rechte und Aktualisierung erhalten.

Seit 0.1.92 auf ausdrücklichen Nutzerwunsch in der Statuszentrale die sichtbare Beschriftung „Warteschlange“ sowohl auf der Übersichtskarte als auch unter Details & Prüfzeiten durch „Offene Musikwünsche“ ersetzen. Ausschließlich Textänderung; status-queue-IDs, Anzahl, Datenquelle, Statuspunkt, Aktualisierung und Berechtigungen erhalten. Die längere Beschriftung passt weiterhin bei 320 und 560 px ohne zusätzliche Dialoghöhe.

Seit 0.1.93 nach Nutzerprüfung des Statuskopfs die technische 30-/60-Sekunden-Zeile aus der Hauptübersicht in Details & Prüfzeiten verschieben. status-refresh-note-ID und Statusfunktion erhalten. Intervallhinweis verständlich und ohne Doppelung ausgeben: nach Abschluss 30 Sekunden, bei Abruffehlern 60 Sekunden; bei fehlender Konfiguration bzw. App-Verbindung Einrichtung/pausierte Prüfung erklären. Abruf läuft sichtbar im bestehenden Button als „Prüfe …“, sonst „Jetzt prüfen“; Mindestbreite verhindert Springen der Bedienung. Statuszentrale-Titel, manuelle Prüfung, AutoDJ/LIVE und sichtbare Quellenbeschriftung „RadioKing · Titelstatus“ beibehalten, da Sendemodus weiter nur aus Titelmeldung abgeleitet wird. Kein neuer Abfragetakt, keine neue Datenquelle, keine Rechte-/Audio-/Timeränderung. Hauptansicht knapp 25 px niedriger, weiterhin alle neun Statuswerte direkt sichtbar.
