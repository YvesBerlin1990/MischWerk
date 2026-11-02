# MischWerk – API-Nachweis 0.1.117

Geprüft am 02.11.2026 gegen unveränderte lokale Referenzstubs und aktuelle offizielle Unterlagen. Referenzdateien sind Dokumentation und werden nie als Appcode ausgeführt. Lokale Mocks bestätigen Protokolle und Layout, keine echte native Knuddels-Ausführung.

## Plattform und Wunsch-Overlay

| Bereich | Dokumentierter Weg |
| --- | --- |
| Radio | AppContent.headerbarContent; bisherige Radiohöhe, keine Erweiterung durch die Wunschbox |
| Wunschoberfläche | AppContent.overlayContent(htmlFile,560,360), responsive; oben rechts im Channel |
| Moderation/Team/Sendeplan | AppContent.popupContent, unabhängig von Radio und Wunsch-Overlay |
| Schließen | Client.close für das aktuelle HTML-UI; AppContent.addCloseListener meldet dem zugehörigen Radio den Abschluss |
| Kommunikation | Client.sendEvent/addEventListener, App.onEventReceived und AppContentSession.sendEvent |
| Identität | Authentifizierte User-/Session-Objekte, serverseitige Zuordnung von Overlay und Radio |
| Laden | Client.includeJS/includeCSS während des Parsens; fertiges Anfangslayout vor mw-ready |
| Backend | KnuddelsServer.execute, globales App, ES5/Rhino; 28 Module |

[AppContent](https://developer.knuddels.de/docs/classes/AppContent.html#method_overlayContent), [Client.close](https://developer.knuddels.de/docs/classes/Client.html#method_close), [HostFrame](https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_setSize), [HTML-UI-Wiki](https://github.com/knuddelsgmbh/UserApps/wiki/HTML-UI), am 02.11.2026 erneut geprüft. Overlaymaße laut API 20–1000 px; exakte native Position legt der Client fest. Es gibt keinen dokumentierten Weg, ein Element aus dem Header-Frame über den Channel zeichnen zu lassen. Die vorherige bewusste Headervergrößerung war die Ursache der beanstandeten Leerfläche; die frühere Ablehnung des dokumentierten Overlays ist damit korrigiert. Keine private K3-Bridge und kein Eingriff in den Host-DOM.

Der ursprüngliche Wunschcontroller bleibt im Radio-Frame aktiv, einschließlich Entwurf, lastWish, pending und submissionId. Backend wishes/transport und Frontend wishes/wishbox bleiben bytegleich. Das Overlay besitzt ausschließlich die Oberfläche. Private mw:wishes.edit/submit-Ereignisse werden nach Session-/User-/Öffnungs-/Sequenzprüfung an genau das zugehörige Radio weitergereicht. Dort läuft der bestehende Formularhandler; nur dieser sendet unverändert mw:wish.submit. Die direkte mw:wish.receipt-Quittung kommt weiterhin im Radio an. Das Overlay erhält den daraus entstandenen Darstellungszustand, auch nach Schließen/Wiederöffnen. Keine neue Wunschannahme im UI-Relay, kein Wunschpersistenzweg oder zweite submissionId.

Client.close beendet nur das Overlay; Entwurf und ausstehende Bestätigung bleiben im Radio. Ausdrückliches Schließen wartet auf die Übernahme des letzten UI-Texts; bei ausbleibender Antwort bleibt die Eingabe mit verständlichem Hinweis sichtbar. Ein Radioende schließt zugehörige Overlays. Verwaltungs-Popups gehören zu einer eigenen Gruppe. Clientfähigkeiten vor dem Senden prüfen, JFX ausgeschlossen. Ohne Overlay-Unterstützung verständliche Fehlermeldung und bestehendes Radio erhalten.

Die Größenkorrekturen aus 0.1.115 für Team und Sendeplan bleiben bestehen: Bildschirmgrenze vor dem ersten Hostaufruf festlegen; identische Ziele nicht wiederholt senden. Headerbarbreite wird ignoriert; Popupbreite 0 als unverändert ausschließlich in STAPP, K3-Team mit positiver Breite. Native Position, Rahmenmaße und tatsächliche Größenannahme müssen im echten Client abgenommen werden.

## STREAMPANEL/SPCast

Die offiziellen Quellen beschreiben SPCast als eigene Engine mit HLS und Shoutcast-/Icecast-Protokollkompatibilität. Die HTML5-Anleitung zeigt außerdem direkten öffentlichen HTTPS-Streamzugriff im Audioelement. Daraus folgt keine bestätigte JSON-Statusroute für das ausstehende MischWerk-Produkt. [STREAMPANEL](https://www.streampanel.net/webradio-hosting/), [SPCast](https://www.spcast.eu/en/what-is-spcast/), [HTML5-Player](https://www.spcast.eu/html5-player/), [Einrichtung](https://www.spcast.eu/faq/allgemein/einrichtungstutorial/).

Tools/Programmdetails liefert produktbezogene Player-/Statusangaben; tatsächliche URLs, Antwortschema, öffentliche Statistikfreigabe, CORS und Codec sind nach Zugang zu bestätigen. Die PushAPI-Dokumentation betrifft Meldungen an Verzeichnisse und wird nicht als Statistik-Lese-API verwendet. [Produktansichten](https://www.spcast.eu/produktbilder/), [Metadatenintegration](https://www.spcast.eu/radio-metadata-api-integration/). Offizielle Störungsübersicht [status.streampanel.net](https://status.streampanel.net/) laut [Kontaktseite](https://www.streampanel.net/kontakt/).

MischWerkConfig.streampanel enthält öffentliche streamUrl, zusätzliche allowedHosts und optionale metadata/status/listeners mit expliziten Feldpfaden. Keine erfundenen Endpunkte, keine Encoder-/Manager-Zugangsdaten. Private Hosts, Credentials und typische Token-Queryparameter werden zurückgewiesen. Statuswerte streng vergleichen, optionale Antwortidentität prüfen, LIVE nur bei Boolean und Hörerzahl nur als endliche nichtnegative Ganzzahl. Feldzugriff ausschließlich über eigene Eigenschaften, ohne eval oder Prototypzugriff. Titel/Interpret getrennt als textContent übernehmen.

Ohne Konfiguration: Play gesperrt, null Provider-Netzabrufe, unbekannte Anbieterwerte. Mit Direktstream und ohne JSON: manueller Hörversuch möglich, Zusatzdaten unbekannt. Konfigurierter bestätigter Stopp beendet Audio, Abruffehler nicht. Browserabfragen ohne Credentials, bevorzugt Fetch mit no-store und 10-s-Abbruch, XHR als Rückfall. Keine Backend-HTTP-/ExternalServerAccess-Annahme.

Der lesende Prüfer tools/checks/streampanel.cjs verwendet dieselbe Feldlogik, lädt beim Audiozugriff nur eine begrenzte Anfangsantwort und meldet fehlende Quellen ausdrücklich ausstehend. Er ersetzt keine Browser-CORS-/Decoder- oder K3-Abnahme. Eigener tatsächlicher Produktanschluss derzeit nicht prüfbar. Bei ausschließlich HLS/MSE ist nach Freischaltung eine gesonderte offizielle Playerintegration/Clientprüfung erforderlich.

[Einrichtung und noch benötigte öffentliche Angaben](../betrieb/INBETRIEBNAHME.md#streampanel-einrichten) · [aktueller Prüfbericht](../pruefung/PRUEFBERICHT.md) · [Rhino-/Wiki-Nachweis](API-WIKI-ABGLEICH.md). Datierte frühere Anbieterberichte bleiben historische Dokumente, ohne aktive Routen oder Konfiguration in der App.

Lokale Browserprüfungen modellieren getrennte Header-/Channel-/Overlayflächen und prüfen den unveränderten Channelbeginn beim Öffnen. Sie ersetzen keine echte Knuddels-Abnahme.

Moderation seit 0.1.117: AppContent.popupContent initial 780 × 600. Client.HostFrame.setSize passt die fertige Inhaltshöhe auch in K3 an, dort mit positiver aktueller Breite; STAPP mit Breite 0 unverändert. Nur veränderte Ziele senden und vor dem ersten Aufruf die Höhengrenze festhalten. Signaturen am 02.11.2026 erneut anhand offizieller AppContent-/HostFrame-Dokumentation und unveränderter Stubs geprüft. Kein neuer Plattformaufruf.

## Lokales Emulator-Testlabor · 02.11.2026

tools/emulator modelliert ausschließlich die für MischWerk benötigte Plattform. Channelinhaber und AppManager werden getrennt geprüft; der Besitzer zählt gemäß API automatisch als AppManager. Ein Nutzername allein erzeugt keine Berechtigung. Sitzungsereignisse und Schließen sind an den tatsächlichen Besitzer der lokalen Verbindung gebunden. Quellen: [User](https://developer.knuddels.de/docs/classes/User.html), [App.onEventReceived](https://developer.knuddels.de/docs/classes/App.html#method_onEventReceived), [AppContentSession](https://developer.knuddels.de/docs/classes/AppContentSession.html).

Headerbar, Overlay und Popup besitzen getrennte Frames. HostFrame.getAppViewMode liefert HEADERBAR, OVERLAY oder POPUP. Headerbreite wird bei setSize ignoriert, Headerhöhe auf 20–500 px begrenzt; Popuprahmen und Inhalt ändern ihre Größe gemeinsam. Verzögerte, schrittweise oder ignorierte Größenantworten sind ausdrücklich lokale Fehlerprofile. Quellen: [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html), [Client.HostFrame](https://developer.knuddels.de/docs/classes/Client.HostFrame.html). Signaturen gegen die unverändert erhaltenen lokalen Referenzen abgeglichen.

Der Parsermodus bindet JS/CSS während des HTML-Parsens mit document.write ein und versieht Ressourcen mit einer stabilen lokalen Cachegeneration. Nachträgliche Einbindung meldet einen API-Verstoß und schlägt fehl. Ein zweiter asynchroner Lademodus dient ausschließlich zusätzlichem Stress. Cacheinvalidierung und ein neues Ressourcenfehlerprofil erhalten eine neue Generation; die [offiziellen Hinweise zum Cache-Buster](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ) bleiben maßgeblich.

Anbieterfälle verwenden ausschließlich emulator.mischwerk.invalid als eindeutig synthetische Adresse im Arbeitsspeicher. Der lokale Plattformadapter leitet Fetch, XHR und native Audioquellen vor der Netzanforderung auf den eigenen Loopbackserver um. Die echten URL-/Schema-Prüfungen der App laufen weiterhin unverändert. Zusätzlich sperrt die Frame-CSP fremde Verbindungen. Dies belegt lokale Fehlerbehandlung und HTML-Audiowiedergabe, keine tatsächliche STREAMPANEL-Kompatibilität.

Die frühere Textsuche nach vermeintlich fehlenden Rhino-Funktionen wird nicht weiterverwendet. Der separate Knopf und pnpm run test:emulator rufen tools/checks/rhino.cjs auf: vorhandene Backendfälle in echten Rhino-Engines, getrennt von der Node-VM und ihren simulierten Plattformobjekten. Aktuelle Engineangabe: [offizielle Knuddels-FAQ](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ). Eine vollständige native Knuddels-Ausführung wird damit nicht behauptet.
