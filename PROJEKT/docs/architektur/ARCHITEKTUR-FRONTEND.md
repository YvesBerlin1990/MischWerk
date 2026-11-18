# MischWerk – Frontendarchitektur 0.1.449 · Build 449

Die vier Ladepläne sind Radio, Wunschbox, Verwaltung und Sendeplan. `tools/lib/frontend-files.cjs` beschreibt die Reihenfolge und Ansichtszuordnung. `index.html` bindet ausschließlich über den dokumentierten Parserweg ein; `ui/composition.js` verbindet vorhandene Fabriken. Studio-Markup, Controller und Styles sind entfernt.

## Zustand und Fristen

`core/model` übernimmt nur passende Ansichten und nicht veraltete Zustände. Zentrale Sendungsfrische und eigene Wunschstatusfrische besitzen getrennte Restfristen von höchstens 45 Sekunden. Die Channelverbindung läuft unabhängig nach 65 Sekunden aus. Der vorhandene Sekundentakt aktualisiert Bedienung und Status; es gibt keinen zusätzlichen Polling- oder Ablauf-Timer. Ältere eigene Statusrevisionen verlängern die bekannte Frist nicht.

Die Freigabeliste besitzt eine eigene bestätigte Restfrist. Unbekannt oder abgelaufen zeigt eine unbekannte Anzahl; nur vollständig bestätigt leer zeigt null. Die private Quellenvorprüfung wird außerhalb von Entwürfen schreibgeschützt dargestellt. Angenommen, In Vorbereitung und Gespielt bilden die drei Wunschstufen; historisches `playing` bleibt Vorbereitung und ausschließlich ein frischer neuer Done-Beleg bestätigt Gespielt.

`radio/presentation` stellt bestätigtes Thema und DJ dar. Alle Rollen nutzen die bisherige Höreranordnung ohne Moderationsknopf. `/mw admin` öffnet die Verwaltung für den echten Inhaber Otterchen und den anwesenden Polaroid. Dort bearbeiten `team/management`, die vorhandenen Bot-Text- und Verbindungscontroller lokale Anzeige, Lauftext und Verbindung; zentrale Nickfreigaben sind lesend. `team/connection-diagnosis` zeigt ausschließlich feste Fehlerstufen, einen begrenzten HTTP-Code und gegebenenfalls die Kategorie eines gespeicherten Google-Altziels. Aktuelle Bestätigung und ein alter erfolgreicher Post bleiben getrennt. Secret-Eingaben werden nicht in Entwürfe übernommen.

## Wünsche und native Fenster

Der vorhandene Wunschcontroller lebt in der Radioleiste. Das native Wunschfenster spiegelt Eingaben mit 400-ms-Bündelung; Schließen/Wechsel sendet die letzte Änderung. Pending erhält Text und Übertragungskennung. Erst die individuelle zentrale Annahmequittung bestätigt Versand. Das Fenster zeigt ausschließlich eigenen nächsten Wunsch, Status und globale Position. Ein neutral unbestätigter Status behauptet keinen Platz. Terminale neue Texte werden im Backend entfernt.

`wishes/window` misst natürliche Inhaltshöhe, dedupliziert Größenaufträge und beendet Beobachtung beim Schließen. `ui/overlays` erhält Prepare/Ready, Fokus und Entwürfe. Verwaltung bleibt im festen Rahmen mit Inhalts-Scrollweg; Wunschbox und Tagesplan verwenden ihre vorhandenen Größenwege. Fehlende/verspätete Hostannahme wird über bestehende Scrollwege behandelt.

## Audio und Ressourcen

`radio/connection` besitzt dieselbe Audioinstanz, Hörwunsch, Medienereignisse und den begrenzten Wiederverbindungstimer. Quelle, Lautstärke und bewusst gestartete Wiedergabe bleiben bei Menüwechsel, Sendungsablauf und Metadatenfehler erhalten. Realm-Startvarianten, Startfrist und Fortschrittsüberwachung bleiben unverändert.

Frühes CSS, lokales Schriftladen, Bereitschaftsmarkierung und Watchdog bleiben erhalten. Langsame Logos blockieren den Start nicht; Pflichtressourcenfehler werden sichtbar. Lauftext, RGB-Glow, Originalmedien und neutrale Tooltips bleiben in ihren bestehenden Fachmodulen.

[Architektur](ARCHITEKTUR.md) · [Projektregeln](../../../AGENTS.md) · [Prüfbericht](../pruefung/PRUEFBERICHT.md)
