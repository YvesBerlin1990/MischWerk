# MischWerk – passende Moderationshöhe 0.1.117

Stand: 02.11.2026. Auftrag: den überschüssigen Platz unter der Moderationskonsole im Nutzerscreenshot entfernen. Lokale Bereitstellung im verbindlichen Desktop-UPLOAD; keine Veröffentlichung, kein Knuddels-Update, Neustart oder ZIP.

## Ursache und Korrektur

Das Moderationsfenster startete fest mit 780 × 680 px. Die fertige Konsole benötigt im unveränderten Standardzustand lokal rund 593 px Höhe. Die bisherige Layoutlogik passte für Moderation nur die Reiter an und gab danach zurück, ohne die Fensterhöhe auf den Inhalt einzustellen. Deshalb blieb unter den beiden Karten eine etwa 87 px hohe freie Fläche.

Moderation startet jetzt mit 780 × 600 px. Nach vollständig geladenem CSS und Markup wird die natürliche Inhaltshöhe gemessen und noch vor mw-ready über das dokumentierte Client.HostFrame.setSize angefordert. Im geprüften Standardzustand ergibt sich 780 × 593 px. Die Breite bleibt erhalten; K3 verwendet dafür die aktuelle positive Breite, STAPP die dokumentierte Breite 0. Native Fensterdekoration kommt zu diesen Inhaltsmaßen hinzu. Andere Fonts und tatsächliche Inhalte können eine andere passende Höhe ergeben.

An-/Abmeldung, lange Texte, Themenrückmeldungen, Übergabe und Reiterwechsel dürfen die Höhe anschließend gezielt anpassen. Ein ResizeObserver berücksichtigt auch Inhaltsänderungen ohne separates Fenstersignal. Gleiche Ziele werden nicht erneut gesendet. Die vor dem ersten Hostaufruf festgehaltene Bildschirm-/1000-px-Grenze verhindert Rückkopplungen mit Clients, die nach einer Größenänderung die Framehöhe als Bildschirmhöhe melden.

Bei echtem Platzmangel oder ignorierten Hostgrößen bleiben Reiter, Arbeitsbereich, native Scroll-Erreichbarkeit, Fokus und Themenentwurf erhalten. Maßgeblich für die Zielhöhe ist die vollständige Konsole; eine nur wegen eines zu kleinen Hostrahmens eingeblendete Fallbackansicht wird nicht zum nächsten immer kleineren Ziel. Schmale Ansichten messen den tatsächlich ausgewählten Reiter.

## Prüfung

| Prüfung | Ergebnis |
| --- | --- |
| Vollständige Node-Prüfungen im Uploadbuild | 137/137 bestanden |
| Browserfälle einschließlich Sendeplan, Übergabe und Wunsch-Overlay | alle 138 Fälle erfolgreich geprüft; siehe Laufhinweis unten |
| Neue Moderationsfälle | Anfangshöhe, K3/STAPP, angewendete/animierte Hostgrößen, Inhaltswachstum/-schrumpfen und schmale Reiter bestanden |
| Backendbuild, Struktur, API, IDs, Komponenten und Syntax | bestanden |
| Rhino 1.7.7.2 und 1.9.1 | je 742 Prüfungen, 125 Wünsche und zwölf abgewiesene Links bestanden |
| Textlängen | alle 86 Laufzeittexte strikt unter 9500 Zeichen; Maximum 9201 |
| Bereitstellung | 88 Laufzeitdateien, 28 Backendmodule, 38 Frontendkomponenten und 16 Stylesheets; vier aktualisierte Manifeste |

Im Gesamtbrowserlauf bestanden 137 von 138 Fällen. Ein bestehender Test erwartete für schmale Moderation weiterhin grundsätzlich keine Größenaufrufe. Diese durch den aktuellen Auftrag überholte Festhöhenannahme wurde auf gültige, begrenzte Moderationsmaße umgestellt; derselbe vollständige schmale Erreichbarkeitsfall bestand anschließend im gezielten Wiederholungslauf. Seit dem Gesamtbrowserlauf wurde kein Produktcode mehr verändert. Drei neue Tests prüfen ausdrücklich die gewünschte Höhenanpassung. Der anfängliche neue dynamische Test wurde außerdem vor dem Gesamtbrowserlauf von einem nicht vorhandenen Testselektor auf die tatsächliche Entwurfsbedienung korrigiert.

Geprüft wurden verzögerte Stylesheets und Logos, Größenabschluss vor Sichtbarkeit, unveränderte Zustände und Hostrückmeldungen ohne Folgeschleife, lange Moderatornamen und Wünsche, An-/Abmeldung, gespeicherter Eingabeentwurf mit erhaltenem Fokus, 320-px-Reiter, kleine Bildschirmgrenzen und ignorierte Hostgrößen. Bestehende Fehler-, Übergabe-, Versand-, private Positions-, Audio- und Overlay-Roundtrips bleiben erfolgreich.

Aktuelle visuelle Prüfung: [Moderation bei 780 × 593 px](oberflaeche/moderation-780.png). Alle Bedienelemente sind sichtbar; unten verbleibt nur der reguläre Innenabstand. Die fünf vorhandenen Radio-/Wunschbilder bleiben als Nachweis unveränderter Gestaltung erhalten: [breite Appleiste](oberflaeche/appleiste-2290.png), [320 px](oberflaeche/appleiste-320.png), [700 px](oberflaeche/appleiste-700.png), [breite Wunschfläche](oberflaeche/wunschbox-2290.png) und [schmale Wunschfläche](oberflaeche/wunschbox-320.png).

## Erhaltene Funktionen und Gestaltung

Gegen den Ausgangsstand 0.1.116 per SHA-256 unverändert: sämtliche Stylesheets und Markupkomponenten, Original-Logo, Werbe-MP3, Player, Wunsch-Overlaycontroller und die geschützten Dateien app/www/js/wishes/wishbox.js, src/backend/wishes/transport.js samt Laufzeitkopie. Änderungen am Produkt beschränken sich auf Versionsangaben, native Moderationsanfangshöhe und Inhaltsanpassung in ui/layout. Die lokale Vorschau verwendet dieselbe neue Anfangshöhe. Kein neuer Schatten, keine Button-/Farbänderung, keine Veränderung von Wunschübertragung oder Radiofunktion.

## Plattform und tatsächliche Abnahme

[AppContent.popupContent](https://developer.knuddels.de/docs/classes/AppContent.html#method_popupContent) und [Client.HostFrame.setSize](https://developer.knuddels.de/docs/classes/Client.HostFrame.html#method_setSize) am 02.11.2026 gegen aktuelle offizielle Dokumentation sowie unveränderte lokale Referenzstubs geprüft. Popup-Anfangsmaße liegen im dokumentierten Bereich 50–1000 px. Breite 0 zum Beibehalten gilt für STAPP; K3 erhält einen positiven Wert. Kein neuer oder undokumentierter Plattformaufruf. Ergänzend [API-Nachweis](../api/API-NACHWEIS.md) und [echte Abnahme](../betrieb/LIVE-ABNAHME.md).

Lokale Browserläufe wenden Hostgrößen tatsächlich an und simulieren schrittweise Antworten. Sie ersetzen die Kontrolle im echten K3/STAPP nicht. Dort sind native Dekoration, tatsächlich erlaubte Fenstergröße, Öffnung und Reaktion auf Inhaltswechsel separat abzunehmen. Es wurde kein echter Knuddels-Client ferngesteuert. STREAMPANEL-Zugang und öffentliche Anschlüsse bleiben ausstehend; dafür wurde keine Anbieterabfrage ausgelöst.

## Lokale Ausgabe und Abgleich

Verbindliche Ausgabe: C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk, Version 0.1.117. Quelle, Desktop-Laufzeitdateien, alle 88 Uploaddateien und vier Manifeste sind abschließend bytegleich geprüft. Geänderte Dokumente, Tests und die neue Moderationsansicht sind ebenfalls ins Desktopprojekt übernommen. Keine zweite UPLOAD-Kopie und keine ZIP.

Beim Abgleich wurden parallel neu entstehende lokale Emulatorwerkzeuge sowie zusätzliche Desktop-Paket-/Lockfileangaben erkannt. Sie gehören zu einer unabhängigen Bearbeitung und bleiben erhalten. Die gemeinsame package.json erhält ausschließlich die aktuelle Versionsangabe; andere neue Angaben werden nicht zurückgesetzt. Git, installierte Abhängigkeiten, Medien und bereits zuvor unterschiedliche Zeilenenden der zwei API-Referenzen bleiben erhalten.

Abschluss: Desktop-Uploadprüfung und Backendgleichstand bestanden. Alle 88 Laufzeitdateien sowie vier Manifeste stimmen zwischen Arbeitsquelle, Desktopquelle und verbindlichem UPLOAD überein. 21 geänderte Projekt-/Dokumentationsdateien sind mit dem Desktop bytegleich, package.json ist ohne Verlust der unabhängigen Ergänzung auf 0.1.117 zusammengeführt. Alle Dokumentationsziele existieren; git diff --check ohne Befund. Gegen 0.1.116 wurden ausschließlich fünf Laufzeitdateien geändert; alle übrigen 83 einschließlich sämtlicher Gestaltungs-, Audio- und Wunschdateien sind bytegleich. Keine verbleibende lokale Testabweichung.

## Ergänzung: strenges Emulator-Testlabor

Stand 02.11.2026, geprüft mit App 0.1.117. Auf ausdrücklichen Nutzerauftrag entstand unter tools/emulator eine modulare lokale Testumgebung. Ausgangspunkt war die Untersuchung des Browserstartpakets 1.0.3 vom Desktop. Dessen unvollständige Besitzerrolle, ungebundene Sitzungsaktionen, veraltete Nutzerliste, fehlerhafte Popuphöhen und Absturz bei der WebSocket-Nachricht null werden durch klar getrennte, für MischWerk geprüfte Plattformmodelle ersetzt. Nicht modellierte APIs werden als Fehler sichtbar; eine vollständige allgemeine Knuddels- oder Mobilbetriebssystememulation wird nicht behauptet.

Das Testlabor liest den echten Appcode. Backend und Browserressourcen eines Laufs bleiben zusammen mit einem SHA-256-Quellhash im Arbeitsspeicher unverändert. Externe Quelländerungen werden gemeldet und erst beim ausdrücklichen lokalen Appneustart übernommen. Persistenz liegt getrennt unter dem System-Tempordner/MischWerk-Emulator; App und UPLOAD werden vom Werkzeug nicht beschrieben. Die während dieses Auftrags unabhängig übernommene Produktänderung auf 0.1.117 wurde erhalten.

| Neue/erneut ausgeführte Prüfung | Ergebnis |
| --- | --- |
| Emulator: echte Appabläufe, Rollen, Queue, Speicherung, Zeit, Nutzerlöschung | bestanden |
| Emulator: WebSocket, fremde Sitzungen, ungültige Pakete, HTTP/Dateigrenzen, Audio-Range | bestanden |
| Emulator-Nodefälle insgesamt | 19/19 |
| Neue Emulator-Browserfälle mit Edge | 12/12 |
| Vollständige Node-Suite einschließlich Emulator | 156/156 |
| Rhino 1.7.7.2 und 1.9.1 | je 742 Prüfungen, 125 Wünsche, zwölf abgewiesene Links |
| Projekt-/Architektur-/API-/Syntax-/Längenprüfung | bestanden |
| Bestehender Desktop-Upload | 88 Dateien, Version 0.1.117, unverändert vollständig geprüft |
| Emulator-JavaScript und PowerShell-Startdatei | Syntax geprüft |

Die Browserfälle verbinden zwei tatsächliche Browserfenster mit demselben echten Appbackend: native getrennte Header-/Overlay-/Popupframes, Entwurf beim Schließen, Wunschversand, private Position, sichtbarer Absender in der Moderation und Nachrücken nach Erledigt. Eine verlorene Quittung erzeugt nach dem echten 15-Sekunden-Timeout eine Wiederholung mit derselben submissionId und genau einem Queueeintrag. Dazu gezielte Dopplung, 320/2290 px, richtige Modus-/Cachewerte, schrittweise Hostantworten, fehlende Overlayfähigkeit, Async-Stress mit verzögerten Dateien und Rollenwechsel. Der separate Laufzeittest prüft 100 Wünsche ohne Mengenverlust. AppContent-Defaults, Größenbereiche und die drei Close-Listener-Argumente werden ebenfalls ausdrücklich geprüft.

Ein absichtlich fehlendes Pflichtmodul führt zum sichtbaren echten Starthinweis und zu keinem falschen Bereitschaftsstatus. Server-Hooks mit Endlosschleife werden zeitlich begrenzt. Unter Speicherfehlern werden Themenänderungen nicht bestätigt, die bewusst flüchtige Wunschqueue bleibt nutzbar. Sieben Stunden Zeitsprung beenden die Studio-Anmeldung. Appneustart erhält gespeicherte Einstellungen und verwirft alte Sitzungen, verzögerte Pakete sowie die Wunschqueue. Nutzerlöschung bereinigt Team und eigene Wünsche.

Die synthetischen Anbieterfälle Online, bestätigter Stopp, HTTP 503 und ungültiges JSON wurden im Browser ohne fremde Netzverbindung geprüft. Native HTML-Audiowiedergabe startet erst beim Playklick mit höchstens 10 Prozent; die Browserprüfung war akustisch stummgeschaltet. Zeitüberschreitung ist zusätzlich als interaktives Elf-Sekunden-Profil verfügbar. Die echte Anbieteranbindung bleibt ausstehend.

Bedienbare Diagnose umfasst Ressourcen-/Ereignisverzögerung, gezielte Filter für verlorene und doppelte Pakete, Speicherfehler, Rollenänderung, Nutzerlöschung, Verbindungsabbruch, Quellenwechsel, lokale Neustarts und Rücksetzen ausschließlich eigener Testdaten. Layoutbefunde und Ereignisse aller verbundenen Testfenster fließen in den exportierbaren JSON-Bericht ein. Native K3/STAPP/iOS-Ausführung, reale Hostdekoration und tatsächlicher Anbieterzugang bleiben separat abzunehmen. [Bedienung](../../README.md#app-im-testlabor-prüfen) und [API-/Abnahmegrenzen](../api/API-NACHWEIS.md#lokales-emulator-testlabor--02112026).

## Erneute Gesamtprüfung vor dem GitHub-Abgleich

Am 02.11.2026 wurde der Desktop-Projektstand 0.1.117 vor dem ausdrücklich beauftragten GitHub-Push erneut vollständig lokal geprüft: **156/156 Node-Tests und 150/150 Browserfälle bestanden**, einschließlich aller Emulatorfälle. Der Browser-Gesamtlauf benötigt damit keine gezielte Wiederholung mehr. Projekt-/Architektur-/API-/Syntax-/Längenprüfung und Integritätsprüfung des bestehenden Desktop-UPLOAD mit 88 Dateien bestanden ebenfalls. Beide Rhino-Engines waren im unmittelbar vorausgehenden Emulatorprüflauf erfolgreich. Die zwölf lokalen README-Links einschließlich Abschnittszielen sind vorhanden; Git-Diff-Prüfung ohne Befund. Die GitHub-README beschreibt jetzt den integrierten Emulator, den Start aus dem Hauptordner, die Testbefehle und die Projektmedien. Appversion, Laufzeitdateien und Upload wurden für diesen GitHub-Auftrag nicht verändert.
