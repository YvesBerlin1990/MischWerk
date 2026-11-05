# Lautstärke und Grenzen der Anzeige

Aktueller Stand 0.1.223 / Build 223. Darstellung: Das Warnsymbol bleibt auch bei 100 % rund und gleich groß. Das 64 px breite Prozentfeld erhält im hohen Bereich etwas weniger Innenabstand; Schriftgröße, Regler und Warnschwelle bleiben erhalten. K3-/STAPP-Modelle bei 320/700/2290 px und Pixeldichte 1/2 mit 61/99/100 % lokal geprüft.

Grundlagenprüfung 0.1.62, 01.11.2026. Die Prüfung der App ergibt: Der Regler schreibt ausschließlich den nativen `HTMLMediaElement.volume`-Wert von 0 bis 1. Bei 100 % wird keine zusätzliche Verstärkung durch einen AudioContext/GainNode eingesetzt. Es gibt keinen Pegelmesser oder Analysator. Dies ist **keine Messung des Streams in dBFS/LUFS und keine Messung des Schalldrucks in dB SPL am Ohr**. Aus Prozentwerten lässt sich kein verlässlicher Hörpegel berechnen.

Die WHO beschreibt das Risiko als abhängig von Lautstärke und Hördauer und empfiehlt generell, die Geräte-Lautstärke niedrig zu halten. Die Geräteempfehlung ist keine kalibrierte Grenze für einen beliebigen Browser-Player. Systemlautstärke, Verstärker, Kopfhörerempfindlichkeit und Tragedauer sind der UserApp unbekannt. Deshalb kann auch ein niedriger Reglerwert zu laut sein.

## Umsetzung

- Standard beim ersten Öffnen: 10 %.
- Gespeicherte Werte werden beim Öffnen auf höchstens 10 % begrenzt; auch frühere höhere Einstellungen beginnen leise. Niedrigere Werte und Stummschaltung bleiben erhalten.
- Vor jedem neuen Play-Klick wird der aktuelle und zuletzt hörbare Wert auf höchstens 10 % begrenzt, noch vor dem nativen audio.play-Aufruf. Nachladen und automatische Wiederverbindung während desselben Hörwunschs erhalten Lautstärke und Stummschaltung.
- Rechts von 60 % bleibt eine gedämpft rote Hinweiszone sichtbar. Beim Hineinregeln werden ausgefüllte Zone, Griff und Prozentwert rot. Ein zusätzliches Ausrufezeichen und zugängliche Hilfetexte vermeiden einen Hinweis ausschließlich durch Farbe.
- Die 60-%-Markierung ist eine bewusst gewählte Vorsichtsschwelle der App, **keine medizinische Sicherheitsgrenze**. Der goldene Bereich wird nicht als garantiert sicher bezeichnet.
- Manuell ist 0–100 % weiter frei bedienbar, auch mit Tastatur; keine Bestätigung oder zusätzliche Sperre. Hohe Werte gelten für die laufende Wiedergabe. Bewusstes Stumm-/Lautschalten stellt den zuletzt gewählten Wert innerhalb dieser Wiedergabe wieder her. Nach einem erneuten Wiedergabestart sind auch beim anschließenden Lautschalten höchstens 10 % voreingestellt.
- Beim Speichern wird höchstens 10 % hinterlegt. Bei nicht verfügbarem Speicher bleiben Regler, Mute und der 10-%-Standard nutzbar. Audio startet weiterhin nur durch Play.

Die aktuelle Lautstärketaste verwendet eine 32-px-Symbolfläche innerhalb ihres vollständig erreichbaren 44-px-Ziels. Stumm ergänzt ein korallfarbenes Kreuz. Der Regler besitzt 44 px Bedienhöhe, eine sichtbare Bahn mit 4 px und einen Griff mit 18 px. Das Prozentfeld bleibt 64 px breit. Tastaturfokus ist erkennbar; Hover/Druck verschieben nichts. Keine Mikrofonabfrage oder Audioanalyse.

Quellen: [WHATWG HTML: volume](https://html.spec.whatwg.org/multipage/media.html#dom-media-volume-dev), [WHO: Safe listening](https://www.who.int/news-room/questions-and-answers/item/deafness-and-hearing-loss-safe-listening). Beide am 29.10.2026 geprüft.
