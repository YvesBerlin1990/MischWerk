# MischWerk – Homepage und Arbeitsbereich

Lokaler Stand **Website 0.2.5**, mit Knuddels-App **0.1.322 / Build 322** lokal geprüft. Stand: **09.11.2026**. Die Homepage verwendet das Vinyl-Design mit goldenen Radiotasten, lokalen Outfit-/Fraunces-Schriften und unveränderten Originalmedien. Bekannte offene Websitebefunde stehen im [Prüfbericht](docs/PRUEFUNG.md).

Der öffentliche Teil enthält Radio, Sendeplan, Teamvorstellungen und Musikwünsche. Der eigene Arbeitsbereich unter **/arbeitsbereich** bietet Anmelden und Abmelden ohne Zeitlimit, Thema, Wunschregie, privater Übergabe und Tageshistorie, außerdem Besitzerverwaltung, Bot-Texte und Sendeplanung. Die bestehenden App-Menüs bleiben bis zur erfolgreichen echten Verbindungsabnahme erhalten.


Die öffentliche Homepage ist aufgeteilt: Start/Radio, Sendeplan, Team, Mitmachen und Wunschbox haben eigene Adressen und einzeln sichtbare Inhalte. Desktopreiter und ein Hamburger-Menü bis 850 px führen durch die Bereiche. Die Startseite zeigt nur Einstieg und Radio. Direktaufruf, Neuladen und Browser-Zurück/Vor funktionieren; laufendes Radio und ungesendete Eingaben bleiben beim öffentlichen Bereichswechsel erhalten. Der geschützte Arbeitsbereich hat eigene Reiter für Moderation, Sendeplan und Verwaltung.

## Lokal starten

Benötigt: **Node.js 22 oder neuer**, pnpm 11.25.0. Aus dem MischWerk-Hauptordner:

```powershell
pnpm --dir PROJEKT/website install --frozen-lockfile
pnpm --dir PROJEKT/website run preview
```

Standardadresse: **http://127.0.0.1:8766**. Beenden mit Strg+C. Der Website-Server unter server/ verwendet keine Testrollen oder Appsimulation. Er liest gemeinsame Appmedien, Player-, Kalender- und Historienkomponenten aus dem Projekt; die Laufzeitstruktur deshalb zusammengehörig erhalten. Die Website gehört nicht in den Knuddels-UPLOAD.

## Dateiablage

| Ordner | Inhalt |
| --- | --- |
| public/ | HTML für Homepage und Arbeitsbereich |
| public/css/ | Website-Stylesheets |
| public/js/site/ | Öffentliche Navigation, Inhalte, Kalenderdarstellung und Playeradapter |
| public/js/workspace/ | Geschützter Arbeitsbereich mit Studio, Team, Sendeplan und Historie |
| server/ | Regulärer HTTP-Server, Sitzungen, API, Appanschluss und vorbereiteter Mailadapter |
| tools/preview/ | Vier ausschließlich lokale Diagnose-/Testdateien |
| tests/ und docs/ | Eigene Prüfungen und Website-Nachweise |

Der Server liefert weiterhin ausschließlich ausdrücklich zugeordnete Ressourcen aus. Öffentliche Adressen bleiben beim Umordnen gleich; Servermodule und private Konfiguration sind keine Browserressourcen.

Ohne eingerichteten Appanschluss bleibt der öffentliche Radioplayer unabhängig nutzbar. Sendeplan, Wünsche und Anmeldung melden die fehlende Verbindung. Es werden keine Beispielsendungen oder Verwaltungsrechte vorgetäuscht. Radio startet nur nach Play. Bewerbungsversand bleibt ausgeschaltet.

## Appanschluss und Anmeldung

Die Einrichtung und ihre Grenzen stehen in [ANBINDUNG.md](docs/ANBINDUNG.md). Der Anschluss ist im Appcode standardmäßig aus. Nach eigener vollständiger Aktualisierung der App kann ausschließlich der tatsächliche anwesende Channelinhaber **/mischwerk-web aktivieren** verwenden. Die privat zurückgegebene WebHook-Adresse gehört ausschließlich in MISCHWERK_APP_WEBHOOK der privaten Websiteumgebung. MISCHWERK_PUBLIC_ORIGIN muss im Hosting dem exakten HTTPS-Ursprung entsprechen.

Im Arbeitsbereich „Anmeldung beginnen“ wählen und den dort angezeigten einmaligen Befehl selbst im Channel ausführen. Der Code gilt drei Minuten. Die App übernimmt ausschließlich die dabei authentifizierte Channelidentität. Anwesenheit und Rechte werden bei jedem Zugriff geprüft. Logout, Channel-Verlassen, Rechteentzug, App-Neustart sowie Fristen beenden den Zugang. Kein Knuddels-Passwort wird auf der Homepage abgefragt.

## Geplantes Hosting: STREAMPANEL / DataDachs

Das geplante Hosting benötigt eine **unterstützte Node-LTS-Version ab 22**. Die konkrete Laufzeit des gewählten Tarifs ist noch nicht bestätigt. Vor Veröffentlichung Node-Anwendungsstart, Domain, HTTPS-Proxy und private Umgebungsvariablen beim tatsächlichen Hosting prüfen. [Einrichtung und offene Abnahme](docs/ANBINDUNG.md).

## Prüfen

```powershell
pnpm --dir PROJEKT/website test
```

Die Website besitzt eigene Node-/Browserprüfungen mit lokalen HTTP- und Knuddels-Modellen. Der alte Diagnoseserver unter tools/preview/server.cjs bleibt ausschließlich durch MISCHWERK_WEBSITE_TEST=1 für diese getrennten Tests erreichbar; er ist kein Produktiveinstieg. Keine echte Mail oder Channelnachricht in Tests.

[Aktueller Prüfbericht](docs/PRUEFUNG.md) · [Desktop](docs/website-startseite.jpg) · [Smartphone](docs/website-mobil.jpg) · [Arbeitsbereich](docs/arbeitsbereich.jpg). Die Aufnahmen vom 09.11.2026 zeigen den lokalen Websiteserver mit Beispieldaten und Appkomponenten aus Build 322.
