# API- und Wiki-Abgleich der gesamten MischWerk-App

Aufbewahrter Fehlernachweis zur Korrektur in 0.1.35. Die nachfolgenden Zahlen und Paketangaben beschreiben diesen damaligen Prüfstand. Aktuelle Modulstruktur und Prüfergebnisse: [API-Nachweis](API-NACHWEIS.md), [Prüfbericht](../pruefung/PRUEFBERICHT.md).

Stand: 31.10.2026, lokaler Stand 0.1.35. Geprüft wurden sämtliche produktiven Backendmodule, Frontend-JavaScript, HTML-Loader und `app.config`. Kein FTP-Upload, Knuddels-Update oder Neustart.

## Quellen und Abgleich

Die vom Nutzer bereitgestellten Dateien auf dem Desktop sind bytegleich mit den unveränderten Projektreferenzen. Sie wurden als Dokumentation gelesen, niemals ausgeführt:

| Datei | SHA-256 |
| --- | --- |
| `knuddels-userapp-backend-api.js` | `EC2A1993A50B2CF14E2DCAAA20FE44C715730B836288570D4BEF4A1FAA69DCC0` |
| `knuddels-webapp-frontend-api.js` | `2022E8B5CE856B6E20EE697D62F225384EE772F5274CE86C77D3A9142BD47B87` |

Zusätzlich wurden die aktuelle [API-Dokumentation](https://developer.knuddels.de/docs/) (angezeigte Version 20260311-092723) und das [offizielle Entwickler-Wiki](https://github.com/knuddelsgmbh/UserApps/wiki) geprüft. Lokal gelesener Wiki-Commit: `131dd6fd88c1cbd1b8f9df9db94c88eecec7abd2`.

## Ergebnis je Bereich

| Bereich | Prüfung und Ergebnis |
| --- | --- |
| Struktur und Laufzeit | Globales `App`, `main.js`, Properties-`app.config`, Frontend unter `www/`. Gepflegte Module werden lokal gebündelt. Das aktuelle [Wiki](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur) nennt Rhino 1.9.1 im ES6-Modus; ES5 bleibt die konservative Projektvorgabe. |
| Hooks | `onAppStart`, `onPrepareShutdown`, `onUserJoined`, `onUserLeft`, `onUserDeleted`, `onEventReceived`, `chatCommands` entsprechen der [App-API](https://developer.knuddels.de/docs/classes/App.html) und dem [Lifecycle-Wiki](https://github.com/knuddelsgmbh/UserApps/wiki/App-Lifecycle). Nicht benötigte Callbackparameter dürfen entfallen. Persistente Fachänderungen werden sofort gespeichert, daher ist kein zusätzliches Shutdown-Speichern nötig. |
| Identität und Rechte | `User.getUserId/getNick/isOnlineInChannel/isChannelOwner/equals` sind dokumentiert. Rollen stammen serverseitig vom authentifizierten Nutzer, niemals aus Clientdaten. [User-API](https://developer.knuddels.de/docs/classes/User.html), [Wiki](https://github.com/knuddelsgmbh/UserApps/wiki/Benutzer-und-Nachrichten). |
| Radio-Team | `KnuddelsServer.getUserAccess().exists/getUserId/getNick` sind dokumentiert. Nur der tatsächliche Channelinhaber ernennt Radiomoderatoren; dauerhaft gespeichert werden numerische Knuddels-IDs. Channel-CM, AppManager oder Entwickler erhalten dadurch kein automatisches Studiorecht. [UserAccess](https://developer.knuddels.de/docs/classes/UserAccess.html). |
| Sendeberechtigung | Die MischWerk-Rolle erlaubt Studio, Thema und Wunschbearbeitung. Sie vergibt keinen RadioKing-Encoderzugang. ON AIR bezeichnet eine bestätigte Studio-Anmeldung, nicht eine gemessene Radiosendung. |
| AppContent und Sessions | `HTMLFile`, `headerbarContent`, `popupContent`, `setResponsive`, `setAllowJFXBrowser`, `canSendAppContent`, `sendAppContent`, `addCloseListener`, `getSessions`, `getUser/getAppContent/remove` sind dokumentiert. `sendAppContent` liefert Session oder null; die App prüft seinen Wahrheitswert. [API](https://developer.knuddels.de/docs/classes/AppContent.html), [Wiki](https://github.com/knuddelsgmbh/UserApps/wiki/HTML-UI). |
| Eventweg | `Client.sendEvent` → `App.onEventReceived(user,type,data,session)` → `AppContentSession.sendEvent` → `Client.addEventListener`, Payload über `event.data`. Session und Rolle werden serverseitig geprüft. Einträge werden einzeln paginiert, Eventdaten bleiben unter 10.000 Zeichen. [Wiki](https://github.com/knuddelsgmbh/UserApps/wiki/Client-Server-Kommunikation). |
| Loader und Fenster | Client.includeJS/includeCSS beim Parsen; HostFrame-Titel und Popupgrößen entsprechen der Referenz. Wunschbox seit 0.1.116 über AppContent.overlayContent/Client.close, ohne Headervergrößerung oder Popup-Resizable. K3-Team nutzt positive Breite, STAPP-Popups dürfen Breite 0 beibehalten. Anfangslayout vor Sichtbarkeit, stabile Popupgrenze. Siehe aktuellen [API-Nachweis](API-NACHWEIS.md). |
| Persistenz | `KnuddelsServer.getPersistence().getObject/setObject` ist der dokumentierte Weg. Thema, Wunschboxstatus und Rollen bleiben gespeichert. Der Wunschweg ruft keine Persistenz auf. Die Serialisierungsgrenze des Projekts liegt konservativ unter dem dokumentierten Limit. [Persistence](https://developer.knuddels.de/docs/classes/Persistence.html), [Wiki](https://github.com/knuddelsgmbh/UserApps/wiki/Datenspeicherung). |
| Eingaben und Diagnose | Serverseitige Text-, Längen-, Link- und Rechteprüfung. Fremdtexte werden im Frontend über `textContent` ausgegeben. `Logger.warn/info` entsprechen der API. Unerwartete Wunschfehler nennen jetzt Phase, bekannten Fehlertyp und gegebenenfalls numerische Quellzeile; keine Fehlermeldung, Stacks, Nicks oder Wunschtexte werden geloggt. [Best Practices](https://github.com/knuddelsgmbh/UserApps/wiki/Best-Practices). |
| RadioKing | HTTP und Audio laufen im HTMLUI-Browser über Standard-Web-APIs, nicht über eine erfundene Knuddels-Schnittstelle. Kein Backend-HTTP-Zugriff, keine Anbieter-Zugangsdaten im Frontend, keine automatische Playliststeuerung. Bestehende RadioKing-Nachweise wurden für diese Korrektur nicht neu erhoben. |
| iOS und reale Clients | `appleDeveloperId` ist bewusst nicht konfiguriert, da keine echte Apple Developer ID vorliegt. Die dadurch fehlende iOS-Freigabe bleibt eine bekannte Konfigurationsgrenze. Lokale Browser- und Rhino-Tests ersetzen keine echte Knuddels-/K3-Abnahme. |

## Bestätigter Fehler und Korrektur

Der normale Titel `Aha - Take on me (Testwunsch)` erreicht das Backend, scheitert aber in der bisherigen Funktion `runtime.containsWishLink`. Die Domain-Zeichenklasse enthält den Unicode-Bereich `\u00c0-\u024f` mit dem Schalter `i`. Rhino wirft beim Auswerten mit `.test(...)` einen `SyntaxError: invalid range in character class`. Deshalb meldet der umfassende Catch lediglich `WISH_APPEND`, obwohl noch gar kein Queue-Eintrag versucht wurde.

Das wurde mit dem unveränderten 0.1.34-Code sowohl in Rhino 1.7.7.2 als auch in der vom Wiki genannten Version 1.9.1 reproduziert. Node/V8 akzeptiert denselben Ausdruck. Ein reiner Syntaxcheck erkennt den Fehler nicht zuverlässig, weil er erst bei der Auswertung der Zeichenklasse auftritt. Die früheren Vermutungen über User-Wrapper, Arraymethoden und fehlende Initialisierung sind damit nicht als Ursache belegt; der offizielle Lifecycle initialisiert vor der Eventverarbeitung.

Die Korrektur schreibt ausschließlich eine Prüfkopie des Wunschtexts klein und wertet die Linkmuster ohne `i` aus. Der Originaltext bleibt erhalten. Frontend und Backend verwenden dieselbe Regel. Links einschließlich Großschreibung, Umlauten, Prozentkodierung und unsichtbaren Trennzeichen werden weiterhin abgefangen.

## Verifikation und Grenzen

- 56 Backend-/HTTP-Tests und 51 Browsertests bestanden, insgesamt 107.
- Zusätzlich tatsächliche Rhino-Läufe mit 1.7.7.2 (Sprachmodus 180), 1.7.14 (180) und 1.9.1 (ES6/200) bestanden: je 664 Assertions, 125 Wünsche, zwölf abgewiesene Linkvarianten, direkte Quittung vor Broadcast, echter Absendernick, keine Hörerqueue, keine Wunschpersistenz und keine Warnung.
- Der neue Paketbau verlangt den Test in Rhino 1.7.7.2 und 1.9.1. `node tools/checks/rhino.cjs --download` stellt ausschließlich die geprüften Rhino-JARs im Temp-Cache bereit. Für 1.9.1 ist Java 11+ erforderlich; `MISCHWERK_JAVA` kann auf die Test-JRE zeigen. Es gelangen keine Java- oder Testdateien in die sechs Uploaddateien.
- API-Signaturen und das Wiki bestätigen die verwendeten Wege. Die tatsächliche Version der laufenden Knuddels-Installation lässt sich aus einer einzelnen `WISH_APPEND`-Zeile nicht ablesen. Erst nach einem separat autorisierten Update kann der korrigierte Wunschweg im echten Channel abschließend abgenommen werden.

Korrektur 0.1.116: Wunschbox verwendet dokumentiertes AppContent.overlayContent und Client.close. Der UI-Relay verbindet ausschließlich eigene Radio-/Overlay-Sitzungen; der eigentliche Wunschtransport und der private Wunschcontroller bleiben bytegleich. Siehe aktuellen [API-Nachweis](API-NACHWEIS.md).
