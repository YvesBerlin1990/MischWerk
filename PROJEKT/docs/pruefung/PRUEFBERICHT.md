# MischWerk – aktueller Prüfbericht 0.1.208 · Build 208

Stand: 04.11.2026, Europe/Berlin. Erneute Funktions- und Sichtprüfung der Bot-Texte mit gezielter Bedienkorrektur. Technische Abnahme und Bereitstellung im festen Desktop-UPLOAD ausschließlich lokal. Keine echte öffentliche Testnachricht, FTP-Aktion oder Knuddels-Update/Neustart.

Nachträglicher GitHub-Abschluss auf ausdrücklichen Nutzerauftrag: Quellstand 0.1.208 einschließlich der geprüften Änderungen seit 202, Dokumentation und aktuellen Bildern in origin/main versionieren. README auf sechs Bot-Texte, die aktuelle Bedienung, 249 Node-/244 Browserfälle, je 844 Rhino-Prüfungen und 111 Laufzeitdateien aktualisiert. Keine Laufzeitänderung oder neue Buildnummer für diesen Abschluss. Remote-Ausgangsstand/Fast-forward, lokale Dokumentationsverweise, Ausschlüsse, Backend-/Uploadgleichheit sowie identische Bytes im Git-Index geprüft. UPLOAD, private Konfigurationen und Entwicklungsabhängigkeiten bleiben vom Commit ausgeschlossen.

## Erneute Funktions- und Sichtprüfung 208

Den fertigen gebündelten Upload 207 im vorhandenen Emulator von Hand bedient und vermessen. Befund bei 560 × 630 px: Speichern/Aktualisieren standen bei y=678,625 bis 722,625 außerhalb des sichtbaren Rahmens. Ein gültiger 294-Zeichen-Text mit 16 Zeilen hatte bei 68 px innerer Höhe 378 px Inhalt; geerbtes overflow:hidden verhinderte inneres Mausradscrollen (scrollTop blieb 0).

Gezielt korrigiert: Textfelder erlauben vertikales Scrollen. Die vorhandene Aktionsgruppe bleibt bei normalen Rahmen am unteren Rand erreichbar; der bestehende Rückmeldeabsatz steht nun in dieser Gruppe, damit Fehler, Erfolg und Konflikt ebenfalls sichtbar bleiben. Scrollabstand hält Kopfzeile/Aktionen von fokussierten Feldern fern. Bei höchstens 480 px verfügbarer Höhe läuft die Aktionsgruppe natürlich im Dokument mit. Keine neue Karte, kein neuer Controller, kein Timer oder Hostgrößenaufruf.

Zwei neue native Gegenfälle K3/STAPP vor Korrektur rot, anschließend grün. Geprüft bei 560/390/320 px, 1×/2×-Pixeldichte, zwei und sechs Feldern, langen Texten, echter Mausrad- und Tastaturbedienung, sichtbaren Klicktreffern der Hauptaktionen, lesbarer Fehlerrückmeldung und begrenzter Hosthöhe. Vorhandene Konfliktfälle prüfen jetzt auch die direkt erreichbare Übernahmeaktion. Der Inhaltsbereich bleibt bei vielen Feldern natürlich scrollbar; universelle Scrollfreiheit wird nicht behauptet.

Zusätzliche praktische Abnahme am echten gebündelten UPLOAD 208: Zwei gespeicherte Nachrichten wurden nach kontrollierten 30-Minuten-Schritten in der richtigen Reihenfolge vom lokalen Testbot ausgegeben. Nach Ausschalten/Speichern und weiteren 50 Minuten keine weitere Ausgabe. Schließen und Wiederöffnen erhielten Reiterauswahl und ungespeicherten Text. Breite und schmale Ansicht einschließlich gespeicherter Bestätigung visuell kontrolliert; keine Konsolenfehler und keine externen Netzanforderungen. Alle Nachrichten ausschließlich im lokalen Testlabor.

175 bestehende App-/Backend-/API-/Website-Dateien vor Prüfung per SHA-256 erfasst. Nur team.css, die Position des bestehenden Feedbackabsatzes in channel-texts-markup und vier erforderliche Kennungsdateien geändert; 169 Dateien bytegleich. Sämtliche ausführbaren Fachcontroller und Backendfunktionen, Medien, Wunschwege, Sendeplan und Glow bleiben erhalten.

Abschluss am tatsächlichen gebündelten UPLOAD 208: **249 Node-Fälle, 244 Browserfälle und jeweils 844 Prüfungen in Rhino 1.7.7.2/1.9.1 grün**. Keine übersprungenen Browserfälle; vollständiger Lauf aller fünf Suiten rund 316 Sekunden. Architektur, Paket, Längen und Uploadgleichheit ebenfalls grün.

## Ergebnis und Bedienung

Die Verwaltung hat zwei Bereiche: **Radio-Team** und **Bot-Texte**. Die vorhandene Mitgliederverwaltung bleibt erhalten; die entfernte Statuszentrale bleibt entfernt. Bot-Texte beginnen ausgeschaltet mit zwei leeren Feldern. Bis zu sechs Felder zu je 300 Zeichen lassen sich hinzufügen/entfernen. Auswahl ausschließlich **20, 30, 40 oder 50 Minuten**. Gefüllte Texte laufen der Reihe nach und beginnen anschließend wieder vorne; leere Felder werden übersprungen.

Zum Einschalten Texte eingeben, Abstand wählen, **Automatisch senden** aktivieren und **Speichern**. Erste Ausgabe nach dem gewählten Abstand. Ausschalten und Speichern beendet die automatische Ausgabe. Gespeicherte Änderungen beginnen einen vollen Abstand. Einstellungen und Rotationszeiger bleiben über App-Neustarts erhalten. Ein zukünftiger Termin bleibt bestehen; überfällige Termine werden erst nach einem vollen Abstand fortgesetzt. Keine nachgeholte Nachrichtenserie.

Mehrere längere Texte nutzen den natürlichen nativen Scrollbereich. Die Verwaltungs-Kopfzeile einschließlich mittigem Titel und X bleibt dabei sichtbar. Keine neue Hostgrößensteuerung und keine Änderung am **560 × 630 px**-Anfangsrahmen. Eingaben 16 px, Aktionen mindestens 44 px; 560 und 320 px breit ohne horizontalen Überlauf geprüft. Reiter mit Pfeiltasten/Home/End bedienbar. Radio, Menüdesign und andere Overlaygeometrien bleiben erhalten.

Aktuelle native Bilder aus dem tatsächlichen gebündelten Upload:

- [Verwaltung und Bot-Texte bei 560 px](oberflaeche/verwaltung-bottexte-560.png)
- [Verwaltung und Bot-Texte bei 320 px](oberflaeche/verwaltung-bottexte-320.png)

## Speicherung, Rechte und Fehler

Nur der tatsächliche Channelinhaber darf Einstellungen sehen und speichern. Serverseitig erforderlich: authentifizierte aktive eigene Sitzung, aktuelle native Verwaltung, passende Ansichtsrevision und erwartete Einstellungsrevision. Hörer, Appmanager und Channelmoderatoren werden abgewiesen. Alte/geschlossene/fremde Sitzungen und wiederholte veraltete Schreibpakete ändern nichts.

Eigener versionierter AppPersistence-Schlüssel **mischwerk.channelTexts.v1**. Allgemeiner Appzustand und Wunschdaten bleiben getrennt. Gespeicherte Texte werden ausschließlich als eigenes kleines **mw:channelTexts.state** an die Verwaltung geliefert; andere Ansichten erhalten sie nicht. Private Verwaltungsentwürfe bleiben im vorhandenen overlayState-Weg. Maximaler gültiger Entwurf mit sechs vollständig quotierten 300-Zeichen-Texten bleibt unter 4100 JSON-Zeichen. Zusätzlich mit gefüllter Wunschregie, 80-Zeichen-Thema und langem Team-Entwurf geprüft: Die zuvor duplizierte Regie überschritt die HTMLFile-Grenze und verhinderte das Öffnen (rot). Ausschließlich in der Verwaltung entfallen jetzt die dort ungenutzten queue/queueWindow-Daten samt Regiezählern; der vollständige Maximalfall bleibt unter 8500 Zeichen und öffnet korrekt (grün). Andere Ansichten einschließlich Studio-Regie und private Wunschposition bleiben erhalten.

Aktualisieren und Ansichtswechsel erhalten ungespeicherte Eingaben. Eine neuere Serverrevision überschreibt sie nicht und sperrt widersprüchliches Speichern; **Gespeicherte Texte laden** übernimmt den bestätigten Stand ausdrücklich. Rechteverlust leert Felder und Rückmeldungen. Speicherfehler erhalten die Eingabe und den bisherigen bestätigten Versandplan. Eine verlorene Speicherquittung meldet den unsicheren Stand, erhält die gemeinsame Hinweisbox und erlaubt Aktualisieren/erneute Bearbeitung.

Genau ein serverseitiger Timeout; doppelte Starts, alte Rückrufe, Ausschalten und beide Shutdown-Hooks sind abgesichert. Vor dem öffentlichen Sendeversuch werden Rotationszeiger und nächster Termin gespeichert. Bei Speicherfehler keine Ausgabe und frühestens nach vollem Abstand ein neuer Versuch; bei unsicherem Sendefehler keine sofortige Wiederholung. Zustellung ist dadurch nicht garantiert: Eine möglicherweise bereits gesendete Nachricht wird zugunsten des Schutzes vor Doppelversand nicht nachgeholt. Ausgabe als escaped Klartext über den Standardbot, keine Befehlsausführung aus Texten.

## API-Nachweis

Aktuelle offizielle Knuddels-Klassenreferenz, Persistence, BotUser.sendPublicMessage, String.escapeKCode sowie Start/Shutdown geprüft. Das offizielle Wiki zeigt KnuddelsServer-Timermethoden, die in der Klassenreferenz und im unveränderten lokalen Stub fehlen. Verwendet werden die aus dem offiziellen Changelog bekannten globalen Hosttimer. Quellen, Widerspruch und Grenze der lokalen Hostsimulation stehen im [API-Nachweis](../api/API-NACHWEIS.md). Die API-Referenzdateien wurden bytegleich erhalten; kein Referenzstub wird ausgeführt.

## Prüfungen

- **249 Node-Fälle grün**, darunter 13 neue Fachtests für alle vier Intervalle, Rotation/leere Felder, Anfangszustand, Rechte/Privatheit, Neustart, überfällige Termine, doppelte Starts, veraltete Rückrufe, Ausschalten, Shutdown, Revisionen, Paketgrenzen, Klartext und Speicher-/Sendefehler.
- **Rhino 1.7.7.2 und 1.9.1: jeweils 844 Prüfungen grün**, einschließlich echter ES5-Ausführung von Speicherung, Versandplan und allen vier Intervallen. Hosttimer und Bot sind kontrollierte lokale Testadapter; kein echter Channelversand.
- **244/244 Browserfälle grün**, keine übersprungenen Fälle, vollständiger Abschlusslauf aller fünf bestehenden Suiten am tatsächlichen gebündelten UPLOAD 208. Enthalten sind die sieben bestehenden nativen Bot-Gegenfälle aus 207 und zwei zusätzliche Sicht-/Bediengegenfälle für K3/STAPP: Speichern/Rotation/Ausschalten, Fehler und schmale Breiten, erhaltene Entwürfe/Audio, Rechteverlust, konkurrierende Revisionen sowie verlorene Speicherquittung mit erhaltener globaler Hinweisbox. Vorhandene Statuszentrale-Abwesenheitsprüfungen prüfen jetzt zusätzlich die neuen Bot-Reiter positiv. Die durch den neuen Bereich sichtbar gewordene Kopfverschiebung wurde korrigiert; die bestehenden Geometrie-/Fokusprüfungen sind erneut grün.
- Architektur, explizite Frontendverdrahtung, API-Signaturen, eindeutige DOM-IDs, Syntax, Trennung der Referenz-/Demodateien und Uploadgleichheit geprüft. Keine neue öffentliche Anbieterabfrage, Radio-Nachrichtenschleife oder Client-Versanduhr.

Frühere Funktionskorrekturen bleiben in der vollständigen Regression enthalten: native K3-/STAPP-Öffnungen und Ansichtswechsel, Start-/Event-/Sitzungsgegenfälle, Rollen/Entwürfe/Fokus, Wunschannahme und private Position, Studio/Übergabe, Historienchronologie, Wochen-/Datums-/Revisionsfälle sowie der scrollfreie Sendungseintrag bei 820/560/390/320 px. Der RGB-Halo bleibt beim tatsächlichen Playerstatus mit 48-Sekunden-Farbinterpolation, 40-px-Auslauf, 200-px-Anfangshöhe und reduced-motion-Prüfung erhalten.

## Auslieferung und Erhalt

**111 Laufzeitdateien**, darunter **105 Texte**, **34 Backendmodule**, **75 Browserdateien**, **46 Frontendkomponenten**, **17 Stylesheets**, dazu **fünf Manifeste**. Größte ausgelieferte Textdatei/Bündel **9476 Zeichen**, alle strikt unter 9500; keine Minifizierung. Die privaten Verwaltungsdateien sind im bestehenden manifest-studio nachgewiesen, damit auch die lesbaren Dateimanifeste unter der Grenze bleiben.

Versions-/Buildkennung in package.json, Backendkonfiguration, main.js, app.config und Manifesten stimmen auf **0.1.208 / 208** überein. Quell-/Backendgleichheit und gebündelte Dateibytes/SHA-256 werden reproduzierbar geprüft. Der vollständige manuell hochladbare Stand liegt unter **C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk**. Kein Archiv und kein zweiter Uploadordner.

Vor Änderungsbeginn 167 bestehende Laufzeit-/Backend-/API-/Website-Dateien per SHA-256 erfasst. Geändert wurden ausschließlich die erforderlichen Verwaltungs-/Verdrahtungs-/Timer-/Versionsdateien. Alle Originalmedien, API-Referenzen und pausierten Websitequellen sowie Audio/Heartbeat, radio-surface.css, radio/viewport, schedule.css, alle Wunschmodule bleiben bytegleich zum vollständig geprüften Build 206. ui/sessions erhält ausschließlich den optionalen Ansichtstyp am vorhandenen Snapshot-Aufruf; sämtliche native Größen, Sitzungs-, Öffnungs- und Schließlogik bleibt unverändert. Frühere Korrekturen wurden nicht zurückgesetzt.

Die lokale Prüfung ersetzt keine echte Knuddels-Abnahme. Die Funktion ist standardmäßig ausgeschaltet; eine echte Ausgabe erfolgt erst nach manuellem Upload und Aktivierung durch den Channelinhaber. Weitere Hinweise zur tatsächlichen Abnahme stehen in [LIVE-ABNAHME](../betrieb/LIVE-ABNAHME.md).
