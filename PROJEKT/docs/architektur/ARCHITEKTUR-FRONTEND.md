# MischWerk – Frontendarchitektur 0.1.146

provider besitzt zusätzlich den bereits abgefragten Sendemodus und die Prüfzeiten von Modus und Übertragung. Das interne broadcast-status-Signal übergibt eine Darstellungskopie an presentation; keine Knuddels-Nachricht oder weitere Anbieterabfrage. MischWerk übernimmt verlangt gestartet und strikt isLive=false, Live-Moderation gestartet und strikt isLive=true; beide Befunde müssen jünger als 90 Sekunden sein. Fehler, Stopp und Senderwechsel verwerfen die Modusbestätigung, ohne die bestehende Erhaltung des letzten Musiktitels bei Abruffehlern zu ändern. presentation verbindet dies mit dem bestätigten Studionamen. Ohne Modus bleibt eine vorhandene Anmeldung neutral als Moderation sichtbar; ohne bestätigte Anmeldung wird kein Name ausgegeben. Frühes Markup ist neutral, Größenanpassung verwendet weiterhin radio-layout und den bestehenden viewport. AutoDJ, LIVE und reine Studioanmeldung vergeben keine Rechte und starten kein Audio.

history/view ergänzt Heute gespielt innerhalb des Moderationsmenüs. history/data besitzt Quellenprüfung, Abruf und Berliner Tages-/Zeitumrechnung; history/controller verwaltet Auswahl, Autorisierung, Cache und Lebenszyklus. Die oberen Reiter Moderation/Heute gespielt verwenden dasselbe Dokument. Der bisherige Arbeitsbereich mit Sendesteuerung, Wunschpult, schmalen Arbeitsreitern und Themenentwurf bleibt im DOM. Auswahl im bestehenden privaten overlayState.studioHistory, nur für berechtigte Studiositzungen. Der öffentliche Kalender hat keine Historienreiter oder Controllerkopplung; seine Einzelansicht lädt keine Historienmodule. Der gemeinsame Overlayplan behält die bisherigen öffentlichen Bausteine für Bereichswechsel.

Snapshot und initiale Seitendaten enthalten historyUrl/historyIgnoredTitles nur bei bestehendem isModerator/canModerate. Hörer, Channelmoderatoren und Appmanager ohne Ernennung erhalten diese Felder nicht. Zusätzlich prüft der Client vor Auswahl und Abruf die bestätigte Berechtigung. Rechteverlust bricht ab, leert DOM und Seiten-/Titelcache und verwirft späte Antworten. Keine Wiederherstellung einer alten Historienauswahl nach erneutem Rechtserwerb. Die Radio-Senderkennung ignoriert ausschließlich die beiden Historienfelder, damit ihre Berechtigungsänderung keine Audioinitialisierung auslöst; tatsächliche Senderänderungen bleiben wirksam.

Die Rohquelle wird nur bei sichtbarem Historienreiter abgerufen: 15 Sekunden nach erfolgreichem Abschluss, 60 Sekunden nach Fehler, maximal ein Auftrag, Abbruch nach zehn Sekunden. Verbergen, Bereichs-/Stationswechsel und pagehide beenden Auftrag und Timer; Generationen verwerfen verspätete Antworten. Letzte gültige heutige Meldungen bleiben bei Abruffehler sichtbar. Europe/Berlin bestimmt Tag und Uhrzeit; eine Sommer-/Winterzeit-taugliche Mitternachtsfrist leert die Liste und lädt neu. Keine Persistenz und kein Einlesen privater Wunschhistorie. Gleicher Text zu anderer Uhrzeit bleibt erhalten, gleiche Meldung wird dedupliziert, leere/Unknown-/ungültige/future Werte entfallen. Titel werden ausschließlich als Text ausgegeben. Nur die ausdrücklich konfigurierten historyIgnoredTitles werden nach Vereinheitlichung von Großschreibung und Leerzeichen vollständig verglichen und ausgelassen; keine Teilwortsuche. Die aktuellen Namen sind Mischwerk dein Radio und Dein Mix auf Mischwerk. Ähnliche Musiktitel sowie die aktuelle Radio-Titelanzeige bleiben erhalten. Die allgemeine HTTPS-/Hostprüfung bleibt bestehen; Port 9000 ist ausschließlich für die exakt belegte eigene Historien-URL zulässig.

history.css ergänzt ausschließlich die Moderationsreiter und Titelliste. Die frühere Kalender-Kompensation für zusätzliche Reiter entfällt. Die Historie misst den verbleibenden Platz im tatsächlichen Rahmen und bildet passende Seiten ohne Scrollen; sehr lange Titel werden vollständig auf Folgeseiten fortgesetzt. Kleine Kalenderrahmen verwenden weiterhin vorhandene Kalenderseiten bzw. natives Dokumentscrollen; keine spätere HostFrame.setSize-Anforderung des Sendeplans oder Historienreiters.

radio/api interpretiert seit 0.1.135 die tatsächlich bestätigte SPCast-Statistik nach Stream-ID, Pfad und Stationsidentität. Der Statusleser behält seine zugeordnete Abfrage; die Hörerzahlfunktion ist seit 0.1.138 entfernt. Fehlende oder widersprüchliche Antworten bleiben unbekannt. Der öffentliche Modusdienst ergänzt getrennte Titelangaben; nur autodj/live ergeben intern einen Boolean, andere Modi bleiben unbekannt. Der bestehende Provider besitzt unverändert Generation, 30-Sekunden-Statustakt und Stopp/Rückkehr; der Player fragt bei waiting/stalled zusätzlich sofort ab. Bestätigter Stopp sperrt Play und entfernt die Audioquelle, Wiederanlauf startet nichts automatisch. Die Statuszentrale benennt den tatsächlichen Sendemodusdienst. Gestaltung, Navigation, Rollen und geschützter Wunschtransport bleiben erhalten.

Vorheriger Anschlussstand 0.1.134 übernahm ausschließlich öffentlichen Stream und Titelquelle bei damals bytegleichem Browsercode. Die nun ebenfalls bestätigten Statistik-/Modusquellen sind oben beschrieben. Tatsächliche HTTP-/Edge-Nachweise und native Abnahmegrenzen stehen im aktuellen Prüfbericht.

transport/commands bindet sämtliche vier Bereichstasten genau einmal. wishes/drawer besitzt ausschließlich Darstellung, Relay und die Bestätigung der letzten Eingabesequenz. Wunsch-X/Escape lösen anschließend overlay-dismiss aus; ui/overlays sendet denselben mw:overlay.dismiss-Auftrag wie bei Verwaltungsansichten. Direkte Client.close-Aufrufe und die eigene Fokusrückgabe entfallen im Wunschrelay. Die zentrale Fokusrückgabe berücksichtigt alle Bereiche, Vorhang und deaktivierte Einstiege. Der Vorschauadapter bildet alle Lebenszyklusmitteilungen auf genau preview-overlay und denselben Rahmen ab.

start.js lädt den vorhandenen Plan, ui/composition.js verbindet die Komponenten explizit und einmalig. Die gemeinsame Zusatzoberfläche lädt alle zugehörigen öffentlichen Vorlagen, Styles und Controller beim ersten Öffnen. Sie behält dieselbe AppContent-Sitzung und dasselbe Dokument über Wünsche, Moderation, Radio-Team und Sendeplan hinweg. Die Radioleiste mit Audio und ursprünglichem Wunschversandcontroller bleibt separat erhalten.

ui/navigation besitzt die eigene switchView(bereich, revision)-Funktion. mw:view kündigt einen Wechsel an, ein passender mw:state liefert die aktuellen berechtigten Daten. Die Ansicht wird erst mit angenommenem Zustand gewählt; fehlende Daten werden über mw:refresh nachgeholt. Zustands- und Bereichsrevisionen schützen gegen verspätete Pakete. Eine neue Oberfläche entsteht erst nach tatsächlichem Schließen.

44 Komponenten und 18 Stylesheets. Client.includeJS/includeCSS bindet sie weiterhin im Parser ein; die explizite Zusammensetzung erfolgt am Ende des vollständigen Bodys. DOMContentLoaded bleibt idempotenter Rückfall. mw-ready folgt auf vollständiges CSS und Anfangslayout. Die frühe HTML-Grundfarbe ist #242424; die native Ladeansicht ist serverseitig deaktiviert. Optionale statische Vorladung aus der Radioleiste bleibt erhalten und führt keine fremden Controller aus.

| Produktionsoberfläche | JavaScript-Dateien einschließlich Einstieg und Zusammensetzung | Stylesheets |
| --- | --- | --- |
| Radio mit weiter aktivem Wunschcontroller | 24 | 10 |
| Gemeinsames Overlay für alle vier Zusatzbereiche | 38 | 12 |

Die lokalen Einzelansichten behalten ihre begrenzten Diagnosepläne. Die Formularbereinigungen aus 0.1.130/131 bleiben erhalten; der aktuelle Historien-Layouteingriff bleibt auf history.css begrenzt; die Hörerzahlentfernung aus 0.1.138 bleibt erhalten.

Die Produktion öffnet eine native Wunsch-Overlayansicht. Der unveränderte Versandcontroller bleibt im Radio alleiniger Besitzer von submissionId, Quittung, Entwurf und Wiederholung. Sein Formular bleibt dort verborgen. Das Overlay zeigt dieselbe Vorlage als Oberfläche, erzeugt aber keinen zweiten Versandcontroller; wishes/drawer reicht Eingaben und Darstellungszustände über die serverseitig gepaarten Sitzungen weiter. Private Positionen liest jede Ansicht aus ihrem eigenen authentifizierten Snapshot. Audio bleibt ausschließlich im Radio.

| Datei unter www/js/ | Verantwortung / öffentliche Schnittstelle |
| --- | --- |
| core/dom.js | el, setText, element, time, mount |
| core/signals.js | Lokale Benachrichtigungen: on / emit |
| core/model.js | Bestätigten Zustand empfangen; current, connected, ausgewählte view, angenommene Bereichsrevision |
| radio/markup.js | Statischer Radioaufbau, eine Datenbindung je Bedienung |
| radio/curtain-markup.js | Statischer Vorhang und natives Werbe-Audio ohne anfängliche Quelle |
| radio/curtain.js | start; lokalen Werbeklick, Vorhang, privaten Schalter und Fokus verwalten |
| radio/viewport.js | start, resize; Framegeometrie nach geladenen Ressourcen, kompakter Fallback, direkt scrollbar erreichbare Metadaten und Fokus |
| ui/composition.js | Explizite Verdrahtung aller geladenen Komponenten und ihrer Abhängigkeiten |
| ui/navigation.js | start, switchView; Zielbereich mit passendem Zustand innerhalb derselben Sitzung wählen; versteckte private Entwürfe bei Rechteverlust leeren |
| ui/layout.js | Fensterhülle, Hinweis, Ansichtsauswahl, Größen und Reiter |
| ui/overlays.js | Gemeinsames authentifiziertes Schließen aller Bereiche, Eingabeübernahme, kurzzeitige Eingabesperre, Abbruch/Wiederfreigabe und zentrale Fokusrückgabe; Komponenten erfassen und restaurieren ausschließlich ihre eigenen Entwürfe über lokale Signale |
| transport/commands.js | start bindet alle vier Radio-Bereichstasten, send, result, nextId, pending, bindRefresh; zugeordnete Mutations- und Lesebestätigung |
| transport/lifecycle.js | Client-Hooks, Refresh-/Sichtbarkeitstimer, Seitenende, Anfangslayout |
| radio/api.js | Adressen prüfen, Status-/Titel-/Hörerantworten lesen und validieren |
| radio/presentation.js | Titel, Interpret, bestätigtes Thema, Metadatenanordnung und ON AIR darstellen |
| radio/provider.js | Senderwechsel, getrennte Titel-/Statustimer, je eine laufende Anfrage, Generation/Titelrevision und dispose |
| radio/player.js | start, stop, renderStatus; native Medienereignisse und Wiedergabeversuche |
| radio/volume.js | start, preparePlayback; Lautstärke, Mute und Begrenzung auf höchstens 10 % beim Öffnen/Start sowie optionale Speicherung |
| wishes/markup.js | Statischer Aufbau der Wunschbox |
| wishes/wishbox.js | start, receipt, availability, fitText; Formular und Wunschversand |
| wishes/drawer.js | start; Overlay-Eingaben/Darstellung mit dem weiter im Radio aktiven Wunschcontroller verbinden, Sequenzen, Eingabeübernahme vor gemeinsamem Schließen und Escape |
| wishes/positions.js | start; eigene offene Plätze, Seitenwahl und Lesefrist darstellen |
| studio/markup.js | Statischer Aufbau der Studiokonsole |
| studio/assistant-markup.js | Statische klappbare Assistentenvorlage |
| studio/assistant.js | Bestätigte Laufzeit/Sendezeiten, Hinweise, Themenentwurfsaktion und übernommene Notizen |
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
| schedule/window.js | Vorhandenen Sendeplanrahmen auswerten und Wochen darin paginieren; keine Hostgrößenaufrufe |
| schedule/controller.js | Kleine Lesepakete zusammensetzen; Antworten, Mutationen und Navigieren |
| ui/updates.js | Zustandsänderungen an Ansichten verteilen und Bedienbarkeit aktualisieren |



Die Abhängigkeiten verlaufen von DOM/Signalen/Modell über Transport und Fachkomponenten zur Koordination und zum Lebenszyklus. Player erhält die vorher erzeugte Lautstärkekomponente und den Provider. Provider kennt den Player nicht; Signale verbinden Zustandsänderungen. Die Architekturprüfung lehnt doppelte, zyklische, unverdrahtete Komponenten und Vorwärtsreferenzen ab.

radio/viewport misst ausschließlich die Radioleiste. wishes/drawer ist im Radio und im nativen Wunsch-Overlay geladen. Im Radio beobachtet es die vorhandenen Formularzustände und übergibt bestätigte Overlay-Eingaben an den unveränderten Formularhandler. Im Overlay zeigt es diese Zustände an und hält beim ausdrücklichen Schließen bis zur letzten Eingabeübernahme die Oberfläche offen. Das Overlay erzeugt keinen eigenen Wunschcontroller und keine neue submissionId. Der gemeinsame Aufbau erhält das erste CSS-/Textfeldlayout über initial-layout vor Sichtbarkeit. Private Plätze werden weiterhin aus dem eigenen serverseitigen Snapshot dargestellt.

ui/layout beobachtet Radio-Team-Inhaltsänderungen und Reiter-/Detailswechsel. enterView fordert nur beim tatsächlichen Bereichswechsel das passende Zielmaß im beibehaltenen Rahmen an. Der Sendeplan erhält danach weiterhin keine Hostgrößenänderungen. Drei Teammitglieder pro Seite; Status zeigt acht direkte Werte oder die vollständigen Erklärungen einzeln über Vor/Zurück. Der dokumentierte native Größenweg umfasst jetzt auch K3-Teamfenster. Bildschirmgrenze und echte Clientreaktion bleiben Grenzen der lokalen Mocks.

radio/api unterstützt ausschließlich öffentliche HTTPS-Audio-/JSON-Quellen mit erlaubten Hosts und ausdrücklicher Feldzuordnung. Keine RadioKing-Routen oder Zugangsdaten. Fehlende Konfiguration erzeugt keine Anbieteranfrage. Metadatenfehler stoppen kein Audio; Generationen schützen vor verspäteten Antworten. Teamstatus liest Anbieterwerte nur im ausgewählten sichtbaren Besitzerreiter. Statusdetails bleiben bei Aktualisierung und Seitenwechsel bedienbar.

Die Styles trennen Radio, Fenster, Wunschbox, Teamstatus, Studio und Sendeplan fachlich. Hörerzahl und ihr eigener Abruf sind vorerst entfernt. Wunschbereich verwendet die dunkle/goldene Materialsprache und plastische Buttons ohne neue Schatten. Details: [Architektur](ARCHITEKTUR.md), [API-Nachweis](../api/API-NACHWEIS.md), [Prüfbericht](../pruefung/PRUEFBERICHT.md).

Prüfkorrekturen seit 0.1.114: viewport unterscheidet die tatsächlich angenommene natürliche STAPP-Höhe vom zu kleinen festen Fallback; auch eine vollständige Ansicht unter 360 px bleibt nach Wunschbox-Schließen voll dargestellt. wishDrawer setzt den Fokus bei deaktivierter Wunschbox auf Sendeplan, bei fehlender Verbindung auf Mute; bei langen Titeln wird dieser Fokus innerhalb der Musikfläche sichtbar gemacht. Der Vorhangbutton bleibt bei 700–1099 px trotz zweizeiliger Beschriftung 44 px hoch. Der nur ergänzende unsichtbare Streamlink ist aus der normalen Tabfolge genommen. Audio, Formulartransport, Logo und Mittelteil bleiben bytegleich.

Öffnung der Verwaltungsfenster seit 0.1.115: lifecycle misst Radio und Dialoge vor mw-ready. ui/layout berechnet Studio-Reiter und Teamhöhe ohne window.load-/Logo-Abhängigkeit. Die Höhengrenzen in ui/layout und schedule/window bleiben nach dem ersten Hostaufruf stabil; Hostantworten dürfen keinen erneuten Rahmenabzug auslösen. Unveränderte Verbindungskontrollen lösen keine Dialogmessung aus. schedule/window berücksichtigt anfänglich bereits vorhandene vollständige Wochendaten, wartet andernfalls auf die bestehende Inhaltsmeldung und baut beim späteren Logo-load keinen identischen Plan erneut auf. Gleiche Zielgrößen werden nicht erneut gesendet; echte Inhalte, Reiter und Fensterbreiten bleiben anpassbar.

Seit 0.1.117 passt ui/layout auch Moderation an natürliche Inhaltshöhe an. Anfangsmaß 780 × 600, danach vollständig gemessener Inhalt mit stabiler Bildschirmgrenze. Ein zu kleiner tatsächlicher Rahmen nutzt weiterhin Reiter; bei möglicher nativer Vergrößerung bleibt die vollständige Konsole das Größenmaß. Nur eine tatsächlich begrenzte Konsole wird anhand ihres gewählten Reiters gemessen. Dadurch erzeugt eine Hostantwort keine immer kleinere Zielhöhe. ResizeObserver berücksichtigt echte Inhaltsänderungen; Themenentwurf und Fokus bleiben erhalten.

0.1.118: lifecycle startet die ausdrücklich komponierte Komponentenliste in unveränderter Reihenfolge vor den Client-Hooks. start.js bleibt Zusammensetzung und unter der Zeichengrenze. Der Assistent nutzt den vorhandenen controls-Sekundentakt, Serverzeitanker und bestätigte Planstempel; keine zusätzliche Abfrage oder Audiofunktion. topic-draft gehört als Eingabeabsicht zur bestehenden Studiosteuerung, nicht als direktes Speichern zum Assistenten. Neue Hinweise nach Übernahme öffnen einmal den Assistenten; eigenes späteres Zuklappen bleibt erhalten. Queue-Stufen und eigene Statuszeilen sind normale Texte. Alte Queuepakete dürfen Stufen und Seiten nicht zurücksetzen. Während nativer Vergrößerung verhindert eine begrenzte Antwortfrist falsche zwischenzeitliche Reiter; danach bleiben bei ignorierten Grenzen alle Inhalte erreichbar.

0.1.119: team/markup besitzt die gemeinsame team-workspace. team.css reserviert den Maximalbedarf beider Ansichten über dieselbe Gridzelle; nur die direkten inaktiven Reiter erhalten display:block und visibility:hidden trotz hidden-Attribut, verschachtelte verborgene Inhalte bleiben unverändert ausgeblendet. Inaktiver Inhalt ist für Fokus, Zeiger und Sichtbarkeit gesperrt. status.js bindet status-details-open ausschließlich an den tatsächlich geöffneten Detailszustand. Die bisherigen ausgewählten Statuskopf-/Abstandsregeln entfallen; Radio-Team verwendet in beiden Reitern denselben Kopf. Kein zusätzlicher Hostaufruf beim bloßen Umschalten, kein zusätzlicher Datenabruf für Layoutmessung.

Reiterwechsel 0.1.119: Bestätigte Appwerte werden auch für den unsichtbaren Statusbereich dargestellt und mitgemessen. Bereits gelesene Anbieterwerte behalten beim Umschalten ihren ursprünglichen Prüfzeitpunkt; die bestehende 90-Sekunden-Gültigkeit und Fehlerkennzeichnung gelten unverändert. Ein tatsächlicher Senderwechsel oder Rechteverlust leert den Cache; neue erfolgreiche oder fehlgeschlagene Anbieterbefunde aktualisieren ihn regulär. Laufende Abfragen/Timer werden beim Verlassen weiterhin über Generation und selected beendet; Layoutdarstellung startet keine Anbieterabfrage.

0.1.120: commands.bindRefresh verbindet ausschließlich die beiden manuellen Aktualisieren-Symbole mit einer zugeordneten Lesung. core/model reicht refreshRequestId nach akzeptiertem Snapshot über das vorhandene snapshot-Signal weiter. commands besitzt Lade-/Fehlerzustand, 15-Sekunden-Frist, Doppelklicksperre und Seitenende-Bereinigung; pending schließt diese kurze Lesung ein. Die vorhandenen eyebrow-Elemente dienen als Live-Rückmeldung, ohne zusätzliche Zeilen oder Fensterhöhe. Automatische Lesungen bleiben unverändert still.

0.1.122: schedule/window koordiniert nur noch Darstellung und Pagination anhand der tatsächlichen inneren Framegröße. Es besitzt keine Bridge-Abhängigkeit, keine Hosthöhenanforderung und keine Bildschirmhöhen-Schätzung. ui/sessions öffnet unmittelbar 820 × 660; die Vorschau verwendet dieselben Anfangsmaße. Kalenderdaten dürfen nachgeladen werden, ohne das Fenster zu ändern. Ein kleinerer Clientrahmen wird lokal paginiert und bei einzelnen überlangen Inhalten nativ gescrollt.

0.1.123: studio/handover.close merkt vor dem Verbergen, ob der Fokus im Übergabebereich liegt, und führt ihn danach zum sichtbaren aktivierten Einstieg zurück. Außerhalb liegender Fokus, etwa auf einem bewusst gewählten Reiter, bleibt erhalten. Kein neuer Controllerzustand, DOM-Aufbau oder Serveraufruf.

0.1.124: ui/layout misst das native Wunsch-Overlay am wishes-panel und beobachtet echte Inhaltsgrößen. wishes/drawer ordnet die private Wunschkarte vor dem Formular an; nach Erfolg ersetzt eine lokale neue Eingabeaktion das leere Formular. Rückmeldung bleibt außerhalb des ausgeblendeten Formulars sichtbar. Entwürfe, Pending und Fehler halten die Eingabe offen, Fokus wird auf sichtbare Ziele geführt. Protected wishes/wishbox und Backend wishes/transport bleiben bytegleich. Private Lesepagination zeigt einen eigenen Wunsch pro Seite; keine neue Versandfunktion.

Die Positionsdarstellung merkt sich vor dem Verbergen der letzten Wunschkarte, ob darin der Fokus liegt. Im kompakten Overlay führt sie ihn zur erreichbaren Eingabeaktion; wishes/drawer merkt deren Fokus vor dem Verbergen und gibt ihn an die wieder sichtbare Eingabe beziehungsweise Schließen weiter. Die Zuständigkeit für Formulardarstellung bleibt im Drawer, ohne Eingriff in den Versandcontroller.

Bei Wechseln bleibt der Formularzustand im DOM. ui/overlays überträgt zusätzlich den jeweils aktiven Entwurf mit Fokus und Scrollposition an den eigenen flüchtigen Radiocache. Bei Rückkehr wird ein bereits besuchtes Formular nicht mit älterem Cache überschrieben. Schließen und neue Sitzung restaurieren nur noch berechtigte Entwürfe. Die Komponenten erfassen ausschließlich ihren eigenen aktiven Bereich. Versteckte Sendeplan-/Statusbereiche starten keine Daten-/Anbieterabrufe; Empfangsquittungen bleiben an sichtbare Moderationswünsche gebunden. Beide Aktualisieren-Buttons besitzen eine eigene Rückmeldebindung.

Seit 0.1.140 ergänzt radio/markup das dekorative Radio-Logo. ui/updates stellt seine Sichtbarkeit aus denselben bestätigten Fähigkeiten wie die bestehenden Verwaltungsaktionen ein. radio-actions.css nutzt ab 1400 px die freie rechte 160-px-Spalte mit einem proportionalen 140-px-Bild. In schmalen Ansichten kein Zusatzplatz. Das PNG wird ausschließlich für die Radioansicht inventarisiert, lädt lazy/async und blockiert weder mw-ready noch Hostmessung.

0.1.144 entfernt ausschließlich per CSS die äußere Leistenkontur und Rundung. Ab 1400 px hat radio-bar keine horizontalen Innenabstände mehr; das vorhandene Raster verteilt die gewonnene Breite. Das Hintergrundeinlegefeld reicht horizontal bis zum Frame. Rechts liegt der vorhandene Fokus-Outline innerhalb der Verwaltungsbuttons. Keine Controller-, Markup- oder HostFrame-Änderung.
