# MischWerk – Website-Anbindung 0.2.1 / App 0.1.269

Stand 05.11.2026. Website und Appadapter sind lokal umgesetzt und geprüft. Noch keine echte Registrierung, Übertragung, Veröffentlichung oder native Knuddels-Abnahme ausgeführt. Die bisherigen App-Menüs bleiben erhalten.

Die öffentliche Homepage ist aufgeteilt: Start/Radio, Sendeplan, Team, Mitmachen und Wunschbox haben eigene Adressen und einzeln sichtbare Inhalte. Desktopreiter und ein Hamburger-Menü bis 850 px führen durch die Bereiche. Die Startseite zeigt nur Einstieg und Radio. Direktaufruf, Neuladen und Browser-Zurück/Vor funktionieren; laufendes Radio und ungesendete Eingaben bleiben beim öffentlichen Bereichswechsel erhalten. Der geschützte Arbeitsbereich hat eigene Reiter für Moderation, Sendeplan und Verwaltung.

## Aufbau und Verantwortungen

Browser → eigener Website-Server → dokumentierter App-WebHook → bestehende Appfachaktionen und Speicheradapter. Der Knuddels-Appserver bleibt maßgeblich für Rollen, Sendestatus, Thema, Wünsche, Übergaben, Wochenplan und Bot-Texte. Keine zweite Plan- oder Wunschdatenbank auf der Homepage. Die Website hält nur flüchtige Anmeldesitzungen und einen kurzlebigen öffentlichen Radiocache.

Backendmodule: src/backend/website/access.js (Kopplung und Identität), public.js (öffentliche Projektion), commands.js (Fachaktionen), transport.js (HTTP und Besitzerfreigabe). Anonyme Websitewünsche bleiben als einfacher Herkunftstyp in derselben flüchtigen Queue. channel-texts/settings.js ist die gemeinsame Fachaktion für native und Webverwaltung; die native Sitzungskontrolle bleibt im nativen Transport. Die vorher pausierten Adapterkopien unter website/integration sind entfernt.

Verwendete Knuddels-Signaturen: [getWebHookAccess/registerWebHook](https://developer.knuddels.de/docs/classes/WebHookAccess.html), [WebHookRequest](https://developer.knuddels.de/docs/classes/WebHookRequest.html) mit getMethod/getQueryString/getBody/getRemoteAddress und [WebHookResponse.send](https://developer.knuddels.de/docs/classes/WebHookResponse.html). Offizielle Referenz 20260311-092723, WebHooks Beta und verfügbar ab AppServer 20260213-125115. Die Verfügbarkeit auf dem echten Zielserver ist separat zu bestätigen. Fehlende Registrierung beeinträchtigt den bestehenden Radio-Appstart nicht.

## Freigabe und Konfiguration

1. Den vollständigen Appstand 0.1.223 / Build 223 einschließlich aller 122 Laufzeitdateien selbst übertragen und den tatsächlichen Start prüfen. Websitecode gehört nicht in diesen Knuddels-UPLOAD.
2. Als tatsächlicher Channelinhaber im Channel /mischwerk-web aktivieren ausführen. Nur dessen private Antwort liefert die registrierte HTTPS-Adresse; ohne Parameter kann der Besitzer den aktuellen Anschluss erneut abrufen.
3. Die Adresse ausschließlich in MISCHWERK_APP_WEBHOOK der privaten Website-.env oder Serverumgebung übernehmen. Kein Browserfeld und kein öffentliches Proxyziel. Weiterleitungen, Zugangsdatenanteile, Query/Fragment und andere Ports als 443 sind am Ziel ausgeschlossen.
4. MISCHWERK_PUBLIC_ORIGIN auf den exakten öffentlichen HTTPS-Ursprung ohne Schluss-Slash setzen. Node.js mindestens 22, vollständige Projektressourcen und Anwendungsstart über server/server.cjs bereitstellen. Hinter einem Hostingproxy dessen Portvorgabe PORT verwenden beziehungsweise den lokalen MISCHWERK_PREVIEW_PORT entfernen. Private Konfiguration und Backenddateien außerhalb eines zusätzlich direkt ausgelieferten Dokumentverzeichnisses halten.
5. Native Kopplung, Rechte, Änderungen in beide Richtungen, parallele Bearbeitung, Verbindungsunterbrechung und Abmeldung abnehmen. Erst danach die Bedienung verbindlich auf die Homepage verlegen.

/mischwerk-web deaktivieren beendet alle verknüpften Appzugänge und deregistriert den Anschluss. Auch ein App-Neustart leert die flüchtigen Websitezugänge. Der persistente Freigabeschalter verändert keine Radio-/Wunsch-/Sendeplandaten.

## Identität und Sitzungen

Der Website-Server erzeugt mit [Node crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) ein 256-Bit-Appzugriffstoken und einen 128-Bit-Einmalcode. login.begin registriert nur eine ausstehende Kopplung; behauptete Rollen/IDs werden nicht übernommen. Der Browser erhält nur den Code. Erst /mischwerk-web CODE durch einen authentifizierten anwesenden Besitzer oder ernannten Radiomoderator bindet die zugehörige Appkennung an dessen tatsächliche User-ID. Code einmalig und drei Minuten gültig.

Appzugriffstoken bleiben im Website-Server. Browser erhalten eine unabhängige zufällige HttpOnly-/SameSite=Strict-Sitzung unter /api/workspace, im HTTPS-Betrieb zusätzlich Secure; nach Bestätigung wird die Kennung rotiert. Schreibanfragen prüfen exakten Origin, JSON-Inhalt und ein eigenes 256-Bit-CSRF-Token. Keine Rollen aus Clientparametern und keine Knuddels-User-/Sessionattrappen. Appzugriffe prüfen Anwesenheit und aktuelle Rollen; Rechteentzug/Verlassen invalidieren alte Tokens dauerhaft. Verlust des Besitzerrechts beendet auch eine sonst verbleibende Moderationssitzung. Fristen: höchstens acht Stunden, zusätzlich 30 Minuten ohne Zugriff. Neustarts leeren Anmeldungen. Keine Konten-/Passwortpersistenz und keine privaten Browser-LocalStorage-Entwürfe.

## Befehle, Konsistenz und Aktualität

HTTP-POST enthält operation=login.begin/login.status/logout/state/action. Appzugriffstoken nur im serverseitigen POST-Body, niemals Browserantwort oder Query. state liefert den berechtigten Bereich studio/team/schedule. Team und Bot-Texte nur für Besitzer. action erlaubt die expliziten Fachaktionen für eigene Studioanmeldung/Abmeldung ohne Zeitlimit, Thema/Wunschbox, Wunschregie, Übergabe, Radio-Team, Bot-Texte und Sendeplan. Updates, Vorhang und native Fenster sind kein Webkommando.

Mutationen verwenden dieselben Fachrevisionen und Vorwerte. Pro Anmeldung höchstens 32 erfolgreiche Anfragekennungen merken; gleicher Auftrag wird nach Antwortverlust bestätigt, ohne nochmals zu mutieren. Dieselbe Kennung mit anderem Inhalt wird abgewiesen. Fehler erhalten Entwürfe; keine optimistische Erfolgsmeldung oder automatische Konfliktauflösung. Wunschempfang nur für den geöffneten Eintrag im sichtbaren Wunschreiter. Private Notizen bleiben beim beteiligten Nutzer. App-Pakete unter 9500 Zeichen; private große Wochenpläne auf dem Websiteserver aus revisionsgleichen kleinen Seiten zusammensetzen.

Nach bestätigter Mutation wird der bestehende Appbroadcast einmal verwendet. Lesungen erzeugen keinen Broadcast; tatsächlicher Moderationsablauf verwendet den bisherigen Prune-/Meldungsweg genau einmal. Website-Abgleich nach Abschluss alle fünf Sekunden, nur sichtbar und außerhalb laufender Aktionen; Einmalcode-Abgleich alle drei Sekunden. Öffentlicher Radiocache bündelt gleiche Serverabfragen zehn Sekunden, öffentlicher Wochenplan prüft sichtbar jede Minute. Tageshistorie verwendet dieselbe Appvalidierung, 15 Sekunden nach Erfolg / 60 Sekunden nach Fehler, Berliner Tagesgrenze und vollständige Titel. Damit ist die Übernahme nahezu unmittelbar, keine garantierte Echtzeitverbindung.

Öffentliche GET-Projektionen enthalten Wochenplan, Wunschboxfreigabe und öffentliche Sendungsangaben. Inhaber als Yves, sonst neutrale Moderation; kein privater Nick, User-ID, Sitzungsschlüssel, Queueinhalt, Bot-Text oder Übergabehinweis. Ausgehende Appserver-HTTP-Aufrufe und knuddelsAccess.txt werden für diese Implementierung nicht benötigt.

## Hosting und offene native Abnahme

Geplant: STREAMPANEL / DataDachs. [Produktseite](https://www.streampanel.net/), [offizielle Tarife](https://www.datadachs.eu/webhosting/). Öffentlich stehen dort Node.js 6–12; daher ist die benötigte unterstützte Node-LTS-Version ab 22 im gewählten Tarif noch offen. Domain, HTTPS-Proxy, private Umgebungsvariablen und Anwendungsstart ebenfalls noch nicht eingerichtet. Die lokale Prüfung belegt weder dieses Hosting noch die native WebHook-Verfügbarkeit. Keine Veröffentlichung oder Entfernung der App-Menüs aus dem lokalen Nachweis ableiten.
