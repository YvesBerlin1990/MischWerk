# Lautstärke und Grenzen der Anzeige

Stand 0.1.20, 29.10.2026. Die Prüfung der App ergibt: Der Regler schreibt ausschließlich den nativen `HTMLMediaElement.volume`-Wert von 0 bis 1. Bei 100 % wird keine zusätzliche Verstärkung durch einen AudioContext/GainNode eingesetzt. Es gibt keinen Pegelmesser oder Analysator. Dies ist **keine Messung des Streams in dBFS/LUFS und keine Messung des Schalldrucks in dB SPL am Ohr**. Aus Prozentwerten lässt sich kein verlässlicher Hörpegel berechnen.

Die WHO beschreibt das Risiko als abhängig von Lautstärke und Hördauer und empfiehlt generell, die Geräte-Lautstärke niedrig zu halten. Die Geräteempfehlung ist keine kalibrierte Grenze für einen beliebigen Browser-Player. Systemlautstärke, Verstärker, Kopfhörerempfindlichkeit und Tragedauer sind der UserApp unbekannt. Deshalb kann auch ein niedriger Reglerwert zu laut sein.

## Umsetzung

- Standard beim ersten Öffnen: 40 % statt zuvor 70 %.
- Gespeicherte Werte werden beim Öffnen auf höchstens 60 % begrenzt; frühere 100-%-Einstellungen starten nicht automatisch wieder mit 100 %.
- Rechts von 60 % bleibt eine gedämpft rote Hinweiszone sichtbar. Beim Hineinregeln werden ausgefüllte Zone, Griff, Prozentwert und Kontur rot. Ein zusätzliches Ausrufezeichen und zugängliche Hilfetexte vermeiden einen Hinweis ausschließlich durch Farbe.
- Die 60-%-Markierung ist eine bewusst gewählte Vorsichtsschwelle der App, **keine medizinische Sicherheitsgrenze**. Der goldene Bereich wird nicht als garantiert sicher bezeichnet.
- Manuell ist 0–100 % weiter frei bedienbar, auch mit Tastatur; keine Bestätigung oder zusätzliche Sperre. Hohe Werte gelten für die laufende Sitzung. Bewusstes Stumm-/Lautschalten stellt den zuletzt gewählten Wert innerhalb dieser Sitzung wieder her.
- Beim Speichern wird höchstens 60 % hinterlegt. Bei nicht verfügbarem Speicher bleiben Regler, Mute und der 40-%-Standard nutzbar. Audio startet weiterhin nur durch Play.

Der bestehende kurze Regler und das Layout bleiben erhalten. Keine zusätzlichen Fenster, Mikrofonabfrage oder Audioanalyse. Keine neue Knuddels-/K3-Methode oder Änderung am RadioKing-Stream.

Quellen: [WHATWG HTML: volume](https://html.spec.whatwg.org/multipage/media.html#dom-media-volume-dev), [WHO: Safe listening](https://www.who.int/news-room/questions-and-answers/item/deafness-and-hearing-loss-safe-listening). Beide am 29.10.2026 geprüft.
