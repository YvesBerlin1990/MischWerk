# MischWerk – aktuelle Websiteprüfung 0.2.0

Stand 05.11.2026, Appanschluss passend zu 0.1.223 / Build 223. Öffentliche Homepage im aktuellen Vinyl-Design überarbeitet; geschützter Arbeitsbereich und dokumentierter Appadapter lokal umgesetzt. Keine echte Mail, Channelaktion, Übertragung, Veröffentlichung oder Hostingänderung ausgeführt.

Die öffentliche Homepage ist aufgeteilt: Start/Radio, Sendeplan, Team, Mitmachen und Wunschbox haben eigene Adressen und einzeln sichtbare Inhalte. Desktopreiter und ein Hamburger-Menü bis 850 px führen durch die Bereiche. Die Startseite zeigt nur Einstieg und Radio. Direktaufruf, Neuladen, Sprunglink, Escape und Browser-Zurück/Vor funktionieren; laufendes Radio und ungesendete Eingaben bleiben beim öffentlichen Bereichswechsel erhalten. Der geschützte Arbeitsbereich hat eigene Reiter für Moderation, Sendeplan und Verwaltung.

## Ergebnis und Gestaltung

Dunkler Grund #0f1114, goldene Radiotasten und silberne Menüaktionen, lokale Outfit-/Fraunces-Schriften und Original-Logo. Der öffentliche Player verwendet unveränderte Appcontroller für Audio, Provider, Mute, Lautstärke und Glow. Websiteanordnung korrigiert: Play im Mittelpunkt der Vinylrillen, Titel getrennt daneben, mobile Lautstärke und Thema darunter. Der sichtbare Fehlstand wurde korrigiert und als Positionsprüfung für 1440/1024/768/390/320 px abgesichert. Der Kopf des Arbeitsbereichs bricht bei 320 px am Wortbestandteil um; die schmale Wochensteuerung reserviert eigene Spalten für Pfeile und Bereich sowie eine eigene Zeile für Diese Woche.

Der Produktiveinstieg tools/server/server.cjs verwendet keine simulierten Nutzer oder Test-App. Der alte Diagnoseserver bleibt testgebunden. Öffentlicher Kalender verwendet die gemeinsame reine App-Kalenderdarstellung einschließlich AutoDJ-Lücken, Ganztags/Open End und Nachtfortsetzungen. Die veraltete Statuszentralen-Prüfung ist auf die vorhandenen Bot-Texte umgestellt; öffentliche Testnamen sind wieder neutral.

Arbeitsbereich: Datum/Uhrzeit und Open End mit bestätigter Endzeit, Thema, Wunschbox, einzelner sichtbarer Wunsch samt Empfang und Status, private Übergabe, Heute gespielt, Teamverwaltung, sechs Bot-Texte mit 20/30/40/50 Minuten und Wochenplan mit tatsächlichen Revisionen. Eingaben bleiben bei Fehler, Antwortverlust und Bereichswechsel erhalten. Keine zweite Datenbank oder Clientrolle.

## Funktions- und Sicherheitsnachweise

- **22/22 eigenständige Websitefälle grün**: sechs bestehende Nodefälle, sechs HTTP-/Sitzungsfälle, fünf bestehende Browserfälle und fünf vollständige Browserabläufe gegen Produktivserver und echten Appcallback im lokalen API-Modell. Vollständiger Abschlusslauf am 05.11.2026 mit Appkomponenten aus Build 223: rund 13,9 Sekunden.
- Zusätzlich **elf App-Backendfälle** für standardmäßig abgeschalteten Anschluss, Besitzerfreigabe, Einmalcode, gefälschte Rollen, Ablauf/Logout/Verlassen/Rechteentzug, doppelte Aufträge, Persistenzfehler, feste Endzeit/Open End, private Wunschregie, Besitzerverwaltung, gemeinsame Bot-/Planrevisionen und öffentliche Datenprojektion.
- HttpOnly-/SameSite-/Secure-Cookies, Kennungsrotation, Origin/CSRF einschließlich ungültiger Zeichen, keine privaten Appzugriffstoken in Browserantworten, keine erreichbaren .env-/Server-/Testrollenpfade. Rechteverlust leert private DOM-Inhalte und Historiencache. Bestätigte Websiteaktionen erscheinen im nativen Appzustand und umgekehrt.
- Browser prüft America/Los_Angeles als abweichende Zeitzone, Desktop/320 px, mindestens 44-px-Aktionen, vollständige Überschriften ohne Überschneidung, Entwurf über Bereichswechsel, verlorene Erfolgsantwort mit Wiederholung, Bot-Speicherung, AutoDJ/Ganztags, private Wunschquittung, chronologische Historienseiten und Rechteentzug.
- Apppaket mit **283 Nodefällen** und **je 906 Prüfungen** in beiden echten Rhino-Engines grün. Rhino führt auch WebHookregistrierung, Kopplung, Fachaktionen, Wiederholung, Open End und Abmeldung als ES5 aus.

[Desktop](website-startseite.jpg), [Smartphone](website-mobil.jpg) und [Arbeitsbereich](arbeitsbereich.jpg) am 05.11.2026 für den GitHub-Abgleich aus dem aktuellen Produktivserver mit ausdrücklich lokalen Testdaten neu aufgenommen. Schmale Arbeitsbereichsbilder wurden nur temporär zur Sichtprüfung verwendet. Kein echter Live-Sendeplan und keine Veröffentlichung daraus ableiten.

## Grenzen und nächster Abnahmeschritt

STREAMPANEL / DataDachs ist geplant. Dessen öffentlich gelesene Tarifseite nennt Node.js 6–12; der Websiteserver benötigt eine unterstützte Node-LTS-Version ab 22. Konkrete Hostinglaufzeit, Domain, TLS-Proxy, Serverumgebung und native Beta-WebHook-Verfügbarkeit sind noch offen. Bisherige App-Menüs bleiben erhalten. Bewerbungsversand bleibt ausgeschaltet. Einrichtung und Abnahme: [ANBINDUNG.md](ANBINDUNG.md). Der Appgesamtbericht liegt unter [PROJEKT/docs/pruefung](../../docs/pruefung/PRUEFBERICHT.md).
