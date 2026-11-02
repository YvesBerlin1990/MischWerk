# MischWerk – Frontendarchitektur 0.1.117

38 explizit verdrahtete Komponenten und 16 Stylesheets. Parserbasierte Client.includeJS/includeCSS-Einbindung; compose nach DOMContentLoaded und vollständigen Modulregistrierungen. mw-ready nach geladenem CSS und Anfangslayout. Logo-Laden ist keine Freigabebedingung. Fehlendes Startmodul zeigt nach 15 Sekunden den vorhandenen Starthinweis.

| Ansicht | JavaScript-Dateien inklusive Einstieg | Stylesheets |
| --- | --- | --- |
| Radio einschließlich weiter aktivem Wunschcontroller | 22 | 10 |
| Wunsch-Overlay; gleiche Vorlage auch zur lokalen Diagnose | 12 | 5 |
| Moderation | 13 | 6 |
| Radio-Team einschließlich Statuszentrale | 14 | 6 |
| Sendeplan | 15 | 5 |

Die Produktion öffnet eine native Wunsch-Overlayansicht. Der unveränderte Versandcontroller bleibt im Radio alleiniger Besitzer von submissionId, Quittung, Entwurf und Wiederholung. Sein Formular bleibt dort verborgen. Das Overlay zeigt dieselbe Vorlage als Oberfläche, erzeugt aber keinen zweiten Versandcontroller; wishes/drawer reicht Eingaben und Darstellungszustände über die serverseitig gepaarten Sitzungen weiter. Private Positionen liest jede Ansicht aus ihrem eigenen authentifizierten Snapshot. Audio bleibt ausschließlich im Radio.

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
| transport/commands.js | start für drei native Radio-Popupaktionen, send, result, nextId, pending; zugeordnete Mutationsbestätigung |
| transport/lifecycle.js | Client-Hooks, Refresh-/Sichtbarkeitstimer, Seitenende, Anfangslayout |
| radio/api.js | Adressen prüfen, Status-/Titel-/Hörerantworten lesen und validieren |
| radio/presentation.js | Titel, Interpret, bestätigtes Thema, Metadatenanordnung und ON AIR darstellen |
| radio/provider.js | Senderwechsel, getrennte Titel-/Statustimer, je eine laufende Anfrage, Generation/Titelrevision und dispose |
| radio/listeners.js | Öffentliche Hörerzahl, eigener 20-/60-Sekundentakt, Einfachabfrage und Generation; selectStation, poll, dispose |
| radio/player.js | start, stop, renderStatus; native Medienereignisse und Wiedergabeversuche |
| radio/volume.js | start, preparePlayback; Lautstärke, Mute und Begrenzung auf höchstens 10 % beim Öffnen/Start sowie optionale Speicherung |
| wishes/markup.js | Statischer Aufbau der Wunschbox |
| wishes/wishbox.js | start, receipt, availability, fitText; Formular und Wunschversand |
| wishes/drawer.js | start; Overlay-Eingaben/Darstellung mit dem weiter im Radio aktiven Wunschcontroller verbinden, Sequenzen und Schließbestätigung, Fokus/Escape |
| wishes/positions.js | start; eigene offene Plätze, Seitenwahl und Lesefrist darstellen |
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



Die Abhängigkeiten verlaufen von DOM/Signalen/Modell über Transport und Fachkomponenten zur Koordination und zum Lebenszyklus. Player erhält die vorher erzeugte Lautstärkekomponente und den Provider. Provider kennt den Player nicht; Signale verbinden Zustandsänderungen. Die Architekturprüfung lehnt doppelte, zyklische, unverdrahtete Komponenten und Vorwärtsreferenzen ab.

radio/viewport misst ausschließlich die Radioleiste. wishes/drawer ist im Radio und im nativen Wunsch-Overlay geladen. Im Radio beobachtet es die vorhandenen Formularzustände und übergibt bestätigte Overlay-Eingaben an den unveränderten Formularhandler. Im Overlay zeigt es diese Zustände an und hält beim ausdrücklichen Schließen bis zur letzten Eingabeübernahme die Oberfläche offen. Das Overlay erzeugt keinen eigenen Wunschcontroller und keine neue submissionId. Der gemeinsame Aufbau erhält das erste CSS-/Textfeldlayout über initial-layout vor Sichtbarkeit. Private Plätze werden weiterhin aus dem eigenen serverseitigen Snapshot dargestellt.

ui/layout beobachtet Radio-Team-Inhaltsänderungen und Reiter-/Detailswechsel. Drei Teammitglieder pro Seite; Status zeigt neun direkte Karten oder die vollständigen Erklärungen einzeln über Vor/Zurück. Der dokumentierte native Größenweg umfasst jetzt auch K3-Teamfenster. Bildschirmgrenze und echte Clientreaktion bleiben Grenzen der lokalen Mocks.

radio/api unterstützt ausschließlich öffentliche HTTPS-Audio-/JSON-Quellen mit erlaubten Hosts und ausdrücklicher Feldzuordnung. Keine RadioKing-Routen oder Zugangsdaten. Fehlende Konfiguration erzeugt keine Anbieteranfrage. Metadatenfehler stoppen kein Audio; Generationen schützen vor verspäteten Antworten. Teamstatus liest Anbieterwerte nur im ausgewählten sichtbaren Besitzerreiter. Statusdetails bleiben bei Aktualisierung und Seitenwechsel bedienbar.

Die Styles trennen Radio, Fenster, Wunschbox, Teamstatus, Studio und Sendeplan fachlich. Hörerzahl weiß ohne Rahmen/Hintergrundfeld. Wunschbereich verwendet die dunkle/goldene Materialsprache und plastische Buttons ohne neue Schatten. Details: [Architektur](ARCHITEKTUR.md), [API-Nachweis](../api/API-NACHWEIS.md), [Prüfbericht](../pruefung/PRUEFBERICHT.md).

Prüfkorrekturen seit 0.1.114: viewport unterscheidet die tatsächlich angenommene natürliche STAPP-Höhe vom zu kleinen festen Fallback; auch eine vollständige Ansicht unter 360 px bleibt nach Wunschbox-Schließen voll dargestellt. wishDrawer setzt den Fokus bei deaktivierter Wunschbox auf Sendeplan, bei fehlender Verbindung auf Mute; bei langen Titeln wird dieser Fokus innerhalb der Musikfläche sichtbar gemacht. Der Vorhangbutton bleibt bei 700–1099 px trotz zweizeiliger Beschriftung 44 px hoch. Der nur ergänzende unsichtbare Streamlink ist aus der normalen Tabfolge genommen. Audio, Formulartransport, Logo und Mittelteil bleiben bytegleich.

Öffnung der Verwaltungsfenster seit 0.1.115: lifecycle misst Radio und Dialoge vor mw-ready. ui/layout berechnet Studio-Reiter und Teamhöhe ohne window.load-/Logo-Abhängigkeit. Die Höhengrenzen in ui/layout und schedule/window bleiben nach dem ersten Hostaufruf stabil; Hostantworten dürfen keinen erneuten Rahmenabzug auslösen. Unveränderte Verbindungskontrollen lösen keine Dialogmessung aus. schedule/window berücksichtigt anfänglich bereits vorhandene vollständige Wochendaten, wartet andernfalls auf die bestehende Inhaltsmeldung und baut beim späteren Logo-load keinen identischen Plan erneut auf. Gleiche Zielgrößen werden nicht erneut gesendet; echte Inhalte, Reiter und Fensterbreiten bleiben anpassbar.

Seit 0.1.117 passt ui/layout auch Moderation an natürliche Inhaltshöhe an. Anfangsmaß 780 × 600, danach vollständig gemessener Inhalt mit stabiler Bildschirmgrenze. Ein zu kleiner tatsächlicher Rahmen nutzt weiterhin Reiter; bei möglicher nativer Vergrößerung bleibt die vollständige Konsole das Größenmaß. Nur eine tatsächlich begrenzte Konsole wird anhand ihres gewählten Reiters gemessen. Dadurch erzeugt eine Hostantwort keine immer kleinere Zielhöhe. ResizeObserver berücksichtigt echte Inhaltsänderungen; Themenentwurf und Fokus bleiben erhalten.
