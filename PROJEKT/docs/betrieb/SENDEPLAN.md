# MischWerk – Sendeplan

Stand **0.1.372 / Build 372**, 11.11.2026. Der rein lesende Tagesplan öffnet für alle verbundenen Hörer als natives Fenster mit 640 × 320 px Anfangsgröße und natürlicher Inhaltshöhe bis 600 px. Thema, Moderation und Uhrzeit folgen der öffentlichen Homepage. Davor, Jetzt im Programm und Danach beziehen sich auf die geplante Berliner Zeit. Die Anzeige bestätigt keinen echten Encoderstatus.

## Daten direkt von der Homepage

Der Knuddels-Server liest `https://radio-mischwerk.web.app/api/public-schedule?week=<Montag>` über die dokumentierte native GET-Schnittstelle. Das funktioniert unabhängig vom Verbindungsschalter und Sync-Schlüssel. Homepage und App nutzen damit dieselbe öffentliche Wochenantwort. Die bestehende Status-/Wunschverbindung bleibt für ihre bisherigen Aufgaben erhalten.

Die Liste zeigt Live-Einträge und die vom Endpunkt gelieferten generierten AutoDJ-Zeilen. Deren Titel und Moderationsnamen bleiben unverändert. Ein leeres Thema erscheint wie auf der Homepage als **Live-Sendung**, ein leerer Moderationsname als **Moderation**. Ganztägige Einträge zeigen **Ganztägig**, Tagesende **00:00**. Open End verwendet das aufgelöste numerische `until` in Berliner Kalenderminuten; fehlt es, endet die Anzeige wie auf der Homepage am Ende des Starttags. Es werden keine lokalen Ersatzsendungen oder Lücken ergänzt. Tatsächlich leere Antworten melden „Für diesen Tag sind keine Sendungen vorhanden.“.

Pfeile wechseln innerhalb der vorigen, aktuellen und nächsten Berliner Woche. Die Datumsmitte führt zu Heute. Über Mitternacht laufende Intervalle werden am Tag abgeschnitten; überlappende Intervalle werden wie im Homepage-Renderer nach Anfang/Ende geordnet und an der bereits belegten Zeit begrenzt.

## Aktualisierung und Fehler

Die geöffnete Ansicht verwendet den bestehenden 20-Sekunden-Lifecycle. Alle Hörer teilen einen laufenden GET je Woche und einen flüchtigen Cache von 15 Sekunden. Zehn Sekunden ohne gültige Antwort ergeben einen sichtbaren Fehler. HTTP-Fehler, Weiterleitungen zu anderen Zielen, ungültiges oder übergroßes JSON bestätigen keinen leeren Tag. Der bekannte Plan bleibt bei einem fehlgeschlagenen Refresh sichtbar; **Erneut laden** startet einen neuen Versuch. Geschlossene Sitzungen, Shutdown sowie verspätete oder doppelte Antworten werden verworfen. Es gibt keinen zusätzlichen Hintergrundpolltimer.

Seiten eines umfangreichen Tages werden vollständig empfangen und erst danach gemeinsam angezeigt. Die Inhaltskennung erkennt Änderungen auch dann, wenn die öffentliche Revision 0 bleibt. Datum, Leseposition, Fokus, Radio und Studioentwürfe behalten ihre vorhandenen Wege. Die natürliche Höhe passt sich langen Texten, leeren Tagen und Fehlern an; bei 600 px oder begrenzten Clients scrollt die Liste.

## Bestehende Datenverträge

Der öffentliche GET importiert und speichert keine Planungen. Native Wochen unter `mischwerk.schedule.v1.<Montag>`, Index, Revisionen, Relayzuordnungen, Studioaufzeichnungen und deren Schreibrechte bleiben erhalten. Sendeplan-/Teamaufträge und Quittungen verwenden weiterhin den signierten Statusweg. Fehler in dessen fachlicher Übernahme blockieren die öffentliche Anzeige nicht mehr. Das Overlay enthält keinen Editor und weist Schreibversuche mit einem Homepagehinweis ab.

## Abnahme nach Installation

Build 372 vollständig aus dem festen Desktop-UPLOAD installieren. Heute muss bei unverändertem Homepagebestand **MischWerk Radio Show / MischWerk am Pult / Ganztägig** erscheinen. Am **07.11.2026** müssen **Live-Sendung / Otterchen / 12:00–14:00** und **Live-Sendung / Polaroid / 14:00–15:00** samt den beiden vom JSON gelieferten AutoDJ-Zeiträumen erscheinen. Eine beabsichtigte Homepageänderung im geöffneten Plan nach ungefähr einem regulären Refresh vergleichen. Der Betreiber hat Build 372 inzwischen installiert. Empfang und Anzeige dieser beiden Tage sind am 11.11.2026 in der echten Knuddels-App bestätigt, einschließlich erneuerter heutiger Anzeige um 17:31:48 UTC; siehe Prüfbericht. Eine neue redaktionelle Teständerung wurde dabei nicht ausgelöst.

[640-px-Ansicht](../pruefung/oberflaeche/sendeplan/sendeplan-tag-640.png) · [320-px-Ansicht](../pruefung/oberflaeche/sendeplan/sendeplan-tag-320.png) · [Leerer Tag](../pruefung/oberflaeche/sendeplan/sendeplan-autodj.png) · [Prüfbericht](../pruefung/PRUEFBERICHT.md) · [Homepage-Rückantwort](../api/HOMEPAGE-SENDEPLAN-RUECKANTWORT.md).
