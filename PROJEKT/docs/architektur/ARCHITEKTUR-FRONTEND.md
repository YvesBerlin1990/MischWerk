# MischWerk – Frontendarchitektur 0.1.239 · Build 239

Stand 06.11.2026: **49 Komponenten, 18 Stylesheets, 80 Browser-/Mediendateien**. Das gepflegte Frontend liegt unter `app/www/`. Ladepläne und vollständiges Inventar: `tools/lib/frontend-files.cjs`.

## Öffnung und Inhalt

Die Radioleiste bleibt ein eigenes Dokument mit einem Audioelement. Sendeplan, Wunschbox und die für ernannte Radiomoderatoren sowie den echten Inhaber Otterchen sichtbare Moderation öffnen ein getrenntes natives Overlay; Verwaltung ist über /MW Verwaltung erreichbar. Der Server prüft Zielinhalt, Fähigkeit, Identität und Rolle; `sendAppContent` ersetzt die bisherige Overlayansicht. Fachliche Eingaben und laufende Aktionen werden vorher bestätigt übernommen. Gleiche Anfrage-IDs öffnen keine zweite Instanz.

Der SDK-Ladeweg läuft während des HTML-Parsens. Markup und benötigte Komponenten werden einmalig zusammengesetzt; vollständiges CSS und Anfangslayout setzen `mw-ready`. Pflichtressourcenfehler werden sichtbar gemeldet. Langsame Logos blockieren den Start nicht. Keine private SDK-Readiness-Manipulation, alte gemeinsame Overlaynavigation oder versteckte Vorabfenster.

`ui/layout` passt Inhalte an den tatsächlichen Rahmen an. Native Größen besitzen ausschließlich die fachlich zuständigen Radio-, Wunsch- und Studio-Fenstermodule. Verwaltung und Sendeplan behalten ihre Anfangsmaße. Moderationsgruppen, Historientexte und Kalender bleiben über Seiten vollständig erreichbar; Bot-Texte haben eine gemeinsame Inhalts-Scrollfläche.

Schmale Radioansichten trennen Schallplatte, Musikangaben und Aktionen. Bei höchstens 420 px hoher Moderation scrollt der Wunschbereich mit vollständig erhaltenen Textseiten und Aktionen; die übrigen Radioflächen bleiben erhalten.

studio/pages hält pro Bereich eine logische DOM-Gruppe als Anker. Explizite Seitennavigation geht vor Fokusankern; Größenwechsel und Refresh erhalten Gruppe und Leseposition. Einzelne zu große Gruppen besitzen einen internen nativen Scrollweg. commands.send kann ein fachliches Bestätigungsprädikat erhalten; ausschließlich die bestätigte eigene Übergabe beendet so eine ausstehende Annahme ohne erfundene RPC-Antwort. Der ausschließlich für den Empfänger sichtbare flüchtige acceptedId-Beleg bestätigt dabei die genaue Anfrage auch nach einer späteren Themenänderung. Das Übergabemodul besitzt die Zustandsprüfung und liest nach erfolgreicher Quittung einmal über den bestehenden Refreshweg nach.

## Fachzustand und Schutz

Der Wunschversandcontroller bleibt in der Radioleiste. `wishes/drawer` und `wishes/relay` übertragen ausschließlich gepaarte Eingaben und Darstellung. Entwurfsabgleich ist gebündelt und identische Rückmeldungen werden dedupliziert. Vor Absenden, X/Escape oder Wechsel wird die letzte Eingabe übernommen. Die kurze Erfolgsquittung besitzt genau einen Darstellungstimer.

Die serverseitige Freigabe enthält automatisch den tatsächlichen Inhaber Otterchen und regulär ernannte Radiomoderatoren. Der Browser leitet keine Inhaberrechte aus dem Nick ab. Die Buttonsichtbarkeit für Moderation benötigt showModerationButton === true und canModerate === true aus demselben bestätigten Snapshot. Fehlende Angaben erzeugen keine Freigabe. Eintragung oder Entfernung kommen über den bestehenden Zustandsbroadcast; der Listenstand wird nicht aus privaten Mitgliedernamen im Browser abgeleitet.

Die Verwaltung hat keinen Button oder Click-Binding in der Appleiste. `/MW Verwaltung` verwendet serverseitig den bestehenden Overlayweg; nach Schließen ist Sendeplan das erreichbare Fokusziel.

Eigene Studio-/Verwaltungs-/Kalenderentwürfe liegen im flüchtigen Cache der Radio-Sitzung. Rechteverlust löscht private Entwürfe. Geschlossene Sitzungen dürfen keine neuen Seiten schließen oder Daten zurückschreiben. Historie lädt ausschließlich in der berechtigten Moderation; Rechteverlust beendet Abrufe und leert private Anzeige/Caches.

`radio/connection` ist alleiniger Audiocontroller. Metadaten-/Statusabfragen sind entkoppelt. Die Heartbeat-Fälligkeit bleibt bei kurzen Engpässen erhalten; jede Aktivitätsbestätigung benötigt echten Fortschritt und eine zugeordnete frische Channelantwort. [Ablauf und Grenzen](ARCHITEKTUR.md#audio-anbieter-und-aktivitätsbestätigung).

## Gestaltung

Die 18 Stylesheets liegen innerhalb von app/www/css/ in den Fachordnern shared, radio, studio, schedule, team, wishes und history. shared enthält Foundation, gemeinsame Dialoge und Rückmeldungen; radio enthält auch Metadatenlayout und Vorhang. Die bisherige Ladefolge und Ansichtszuordnung im HTML bleiben erhalten. Relative Schrift-/Bildpfade beziehen sich auf die neue Ordnertiefe; Auslieferungsbündel verwenden dieselbe Tiefe und weiterhin vollständige Module.

Schwarze Vinylflächen, lokale Outfit-/Fraunces-Schriften, goldene Radiotasten und neutrale Menüaktionen. Goldlicht und RGB-Halo folgen ausschließlich tatsächlicher Wiedergabe. Texte, Buttons und Geometrie werden nicht gemeinsam skaliert. Original-Logos bleiben proportional. Schmale Rahmen behalten erreichbare Bedienflächen und vollständige Daten über die vorhandenen Lesebereiche. [Design und aktuelle Bilder](DESIGN.md).

## Zuständigkeiten

| Komponente | Verantwortung |
| --- | --- |
| core/model | Bestätigter Zustand und Verbindung; fester Seitentyp |
| start und ui/composition | Seitenspezifischer Ladeplan und einmalige Verdrahtung |
| ui/layout | Inhaltsreiter, Hinweise und Darstellung im vorhandenen Rahmen |
| ui/overlays | Bestätigte Eingabeübernahme, privater Entwurf, Schließen und erreichbarer Rückfokus |
| transport/commands | Benutzeraktionen, Anfrage-IDs und zugeordnete Rückmeldungen |
| transport/lifecycle | Parser-/SDK-Start, Refresh, geprüfter Wiedergabe-Heartbeat, Sichtbarkeit und Seitenende |
| wishes/feedback | Kurzer Darstellungstimer für erfolgreiche Quittungen; native Wunschfläche übernimmt nur den gespiegelten Zustand |
| wishes/window | Native Inhaltshöhe nach bestätigtem Wunsch; einmal je benötigter Geometrie, ohne Wiederholungstimer |
| wishes/drawer | Wunschdarstellung, gebündelter Entwurf und bestätigter Abschluss vor Schließen/Wechsel |
| wishes/relay | Radioseitige gepaarte Eingabeübernahme und zusammengefasste geänderte Darstellung |
| wishes/wishbox | Unveränderter Wunschversand, Entwurf und Quittung in der Radioleiste |
| studio/workspace, studio/pages, studio/reader | Reiterauswahl, ganze Bediengruppen und vollständige Textabschnitte |
| studio, team, schedule, history | Fachlich getrennte Steuerung, Darstellung und Daten der jeweiligen nativen Seite |
| radio/viewport | Ausschließlich Größenlogik der Radioleiste |

| radio/connection | Ausschließlicher Audioquellenbesitz, Hörwunsch, Medienereignisse und Erholung |
| radio/player | Bedienung und Darstellung des Verbindungszustands |
| radio/api, radio/provider | Validierte öffentliche Quellen, Metadaten-/Status-/Modusabfragen |
| radio/volume | Native Lautstärke, Mute, Speicherung und leiser manueller Start |
| studio/session, studio/window | Endzeit/Open End und natürliche Moderationshöhe |
| team/layout | Gemeinsame Scrollfläche und wachsende Bot-Textfelder |

Architekturprüfung und Paketbau kontrollieren Verdrahtung, Ladepläne und das Fehlen alter Verbindungs-/Navigationswege. [Prüfbericht](../pruefung/PRUEFBERICHT.md).
