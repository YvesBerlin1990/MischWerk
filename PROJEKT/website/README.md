# Radio-Website – PAUSIERT

Status: Auf Nutzerauftrag vom 03.11.2026 auf Eis gelegt. Dieser eigenständige Entwurf ist keine Knuddels-App und gehört nicht zum App-Build oder UPLOAD.

Hier liegen ausschließlich Websiteoberfläche, Website-Server, private lokale .env, eigene Paketabhängigkeiten, Tests und zugehörige Nachweise. Die Appquellen und deren Testlabor liegen außerhalb dieses Bereichs. Das frühere tools/preview ist nun ausschließlich App-Testvorschau.

Der normale Website-Start ist gesperrt: pnpm --dir website run preview meldet den pausierten Zustand und öffnet keinen Server. Nur der eigene Regressionstest setzt MISCHWERK_WEBSITE_TEST=1 und öffnet dafür einen kurzlebigen localhost-Port. Mailversand und echte Appbrücke bleiben dabei abgeschaltet. Kein Hintergrundprozess läuft für die Website.

Die Adapter unter integration/ sind nur Vorbereitung. Sie sind aus src/backend, app/server, Appstart, Chatbefehlen und Desktop-UPLOAD entfernt. Die eigenen Vertragstests hängen sie ausdrücklich in ein isoliertes Appmodell ein; die aktive App lädt sie niemals. Für ein späteres Wiederaufnehmen wären Einbindung, Konfiguration und Freigaben neu zu prüfen.

Der bisher besprochene private Bewerbungseingang ist eine Idee und wurde nicht implementiert. Bewerbungsversand bleibt deaktiviert. Fotos von Yves und Alex stehen noch aus.

## Eigene Ablage

- tools/preview/: Website und lokaler Entwurfsserver.
- integration/: Abgekapselte vorbereitete Appadapter.
- tests/: Eigene Websiteprüfungen, außerhalb der App-Prüfkette.
- docs/: Bisherige Nachweise und zwei Websitebilder.
- .env: Private lokale Websitekonfiguration, durch die übergeordnete Git-Regel ausgeschlossen.

Die Website verwendet den Appplayer, Originalmedien sowie gemeinsame Testfixtures ausschließlich lesend aus dem übergeordneten Projekt. Ihre nodemailer- und Playwright-Abhängigkeiten werden separat verwaltet. pnpm --dir website test prüft nur diesen abgelegten Stand, ohne ihn wieder aufzunehmen oder zu veröffentlichen.
