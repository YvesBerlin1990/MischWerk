# Website – Prüfung 0.2.13

Prüfrunde vom 17.11.2026 für Website 0.2.13 im damaligen App-Checkout 0.1.448 / Build 448. Die App-Kennung datiert den Nachweis. Der aktuelle Appstand und die Projektregeln stehen in [AGENTS.md](../../../AGENTS.md).

Der zusätzliche Node-Arbeitsbereich und seine Anmelde-, PIN-, Sendungs-, Übergabe-, Regie-, Team- und Kalenderbearbeitung sind entfernt. `/arbeitsbereich` und `/api/workspace/*` antworten mit 410; die früheren Workspace-HTML-/JS-/CSS-Dateien werden mit 404 abgewiesen. Es wird kein Workspace-Dienst instanziiert. Der frühere native Wunsch-POST ist ebenfalls 410. Öffentliche Lesewege für Radio und Sendeplan bleiben erhalten.

`pnpm --dir PROJEKT/website test`: 16/16 Node- und Browserfälle bestanden. Die Prüfungen verwenden den regulären lokalen Server und kontrollieren entfernte Routen, fehlende statische Dateien, ausbleibende Fachmutationen, öffentliche Seiten, Navigation, Player, Inhalte, Formulare und den bestehenden Mailadapter. Geteilte UTF-8-Eingaben und begrenzte HTTP-Nutzlasten bleiben abgedeckt. Mail wird ausschließlich durch eine Transportattrappe geprüft; es wurde keine SMTP-Nachricht versendet.

Die reguläre redaktionelle Homepage unter www.radio-mischwerk.de und ihr bestehender Firebase-Betrieb liegen außerhalb dieses Abschlusses und wurden nicht verändert. Der lokale Node-Player und seine öffentlichen Inhalte sind kein Nachweis einer produktiven Firebase-Verbindung. Die entfernte Node-Regie wird durch keinen neuen offenen Proxy oder Anmeldeweg ersetzt.

Nachweis der damaligen Prüfrunde: `MischWerk-448-Website-Freigabe.log` im System-Tempverzeichnis, erneut 16/16 Fälle vor dem GitHub-Abschluss. Der [App-Prüfbericht](../../docs/pruefung/PRUEFBERICHT.md) dokumentiert den gemeinsamen nativen Emulator-/Firebase-Test. Native Knuddels-Anzeige, echte Audioausgabe und produktiver Homepagebetrieb bleiben gesondert abzunehmen.
