# MischWerk – Design 0.1.330 · Build 330

Aktuelle Gestaltung am 09.11.2026. Die Bilder zeigen lokal gerenderten Appcode mit Beispieldaten. Verbindliche Projektvorgaben stehen in [AGENTS.md](../../AGENTS.md).

## Appleiste

Die Radio-Außenfläche bleibt reines Schwarz #000000, die Deckfläche #141414 mit ihren vorhandenen Vinylrillen und Goldakzenten. Die bestätigte Aufteilung „Musik im Fokus“ zentriert die Texte innerhalb der drei Bereiche und gibt der Musik die größte Fläche. Ab 1200 px steht der vorhandene Lautstärkeknoten als schmaler senkrechter Regler rechts neben Thema und Moderation. Beide nutzen die volle Informationshöhe; die Musikfläche bleibt gleich groß. Original-Logo, Playtaste, Aktionen, Glow und Bedienabläufe bilden weiter denselben Rahmen. Der bestehende Lauftext bleibt direkt unter der Appleiste; eine zusätzliche Bedienzeile entfällt.

### Gemeinsame Hierarchie

| Bereich | Hauptinformation | Ergänzung |
| --- | --- | --- |
| Jetzt läuft | Outfit, 26 px, Gewicht 600 | Interpret 17 px, Gewicht 400, 8 px Abstand |
| Thema | Outfit, 20 px, Gewicht 500 | Moderation 15 px, Lautstärke rechts daneben |
| Dein Wunsch | Platz 16 px, Gewicht 500 | Wunschtext 14 px, Gewicht 400; Status 12 px |

Der aktuelle Musiktitel steht oben größer und fett, der Interpret darunter. In natürlichen schmalen Ansichten beträgt die Titelgröße 24 px; feste kompakte Rahmen nutzen 20/23 px und einen Interpreten mit 15/20 px sowie 5 px Abstand. Texte werden unabhängig von ihrer Länge nicht automatisch verkleinert. Die kombinierte direkte SPCast-Songzeile wird weiterhin am ersten ` - ` aufgeteilt: „a-ha - Take on Me“ erscheint als „Take on Me“ über „a-ha“. Weitere Bindestriche im Namen oder Titel bleiben erhalten. Ohne vollständige Trennung bleibt die gesamte Zeile als Titel sichtbar.

Die goldene Beschriftung „Thema:“ verwendet 12 px; die übrigen kleinen goldenen Beschriftungen bleiben bei 11 px. In festen kompakten Rahmen verwendet das Thema 18/22 px und die Moderation 14/18 px, ohne Verkleinerung nach Textlänge. Fraunces gehört weiterhin zu den Menüüberschriften; Rajdhani Medium bleibt dem bewegten Lauftext vorbehalten. Breite Ansichten verteilen die Informationsfläche ungefähr 55/25/20 auf Musik, Thema mit Regler und Wunsch. Ohne eigenen Wunsch entfällt dessen Spalte vollständig und die Musik wächst auf ungefähr 70 Prozent; notwendige Mindestbreiten für Regler und Wunschplatz haben Vorrang. Natürliche schmale Ansichten stapeln die Gruppen. Die vorhandene Informationsscrollfläche erhält in festen K3-/begrenzten STAPP-Rahmen alle Angaben und Bedienungen, ohne neue Fenstersteuerung oder Platz unter dem Lauftext.

### Zurückhaltende Lautstärke

Ab 1200 px sitzt der Regler senkrecht rechts im Themenbereich. Die Gruppe ist 52 px breit und 112 px hoch, in der 124-px-Informationsfläche vertikal zentriert. Oben und unten bleiben jeweils 6 px Abstand zur sichtbaren Leistenkante: Prozentanzeige oben, 44 × 52 px große Reglerfläche mittig und die bestehende 44-px-Stummtaste unten. Die Spur bleibt 4 px, der Griff 14 px und die sichtbare Lautsprecherscheibe 28 px groß. Lauter liegt oben, leiser unten. Thema und Moderation nutzen daneben die volle Höhe und sind innerhalb ihrer Textfläche mittig. Unter 1200 px bleibt die bisherige waagerechte Gruppe unter dem Thema, damit schmale Texte genug Breite erhalten. Das Prozentfeld zeigt auch 100 % samt Warnhinweis vollständig. Rote Zone über 60 %, Tastatur, Mute und Audioweg bleiben erhalten. Die gemeinsame DOM-Struktur bleibt gleich; die Homepage hält durch ihre eigenen Styles weiterhin die waagerechte Anordnung. Die senkrechte Richtung verwendet den [dokumentierten CSS-Weg für Range-Eingaben](https://developer.chrome.com/blog/vertical-form-controls) mit writing-mode und direction; die tatsächliche Knuddels-Darstellung bleibt separat abzunehmen.

### Kompaktere Aktionen

Die warmgoldenen Materialtasten bleiben erkennbar. Breit messen Sendeplan, Wunschbox und Moderation jeweils 156 × 64 px mit 24-px-Symbol und 14-px-Schrift statt zuvor 190 × 80 px. Gleichmäßige 10-px-Abstände und die angepassten Rasterspalten gewinnen zusammen 112 px für die Anzeigen. Zwischen 1200 und 1499 px stehen 24-px-Symbole über 13-px-Text auf 94 × 76 px. Natürliche schmale Ansichten und begrenzte Header behalten ihre vorhandenen Umbruchwege; im festen Header bleiben alle Tasten mindestens 44 px hoch. Beschriftungen, Sperren und Fokuswege bleiben vollständig.

Der Sendeplan bleibt für alle Rollen einschließlich Inhaber deaktiviert mit „In Kürze“.

Alle drei Aktionstasten besitzen dieselbe mittig angeordnete Textfläche: Hauptbeschriftung oben und 16 px reservierte Hinweisfläche darunter. Die Hauptzeilen stehen dadurch auch ohne sichtbaren Hinweis untereinander auf derselben Höhe. Kompakte feste Rahmen verwenden 12–13 px für die Hauptbeschriftung; Zusatzzeilen bleiben 13/16 px. Die Wunschbox reserviert ihre Hinweisfläche dauerhaft mit 16 px Höhe und 5 em Breite bei 13-px-Schrift. Bei Freigabe bleibt sie unsichtbar, bei Sperre zeigt sie weiterhin „Deaktiviert“. Das hält Hauptbeschriftung und Symbol an derselben Position; die unsichtbare längere Standardbeschriftung erweitert die Taste nicht. Die bisherigen SVG-Symbole bleiben vollständig erhalten. Button, Tooltip, zugängliche Beschriftung sowie Lade- und Fenstertitel heißen einheitlich „Moderation“.

[Sendeplan](../pruefung/oberflaeche/radio/button-sendeplan.png) · [Moderation](../pruefung/oberflaeche/radio/button-moderation.png).

Die Playtaste ist 80 px groß, in schmalen oder begrenzten Rahmen 72 px. Play-/Pause-Symbol wachsen auf 32 beziehungsweise 28 px. Rundes Goldmaterial und Zentrierung in der Vinyl-Einfassung bleiben erhalten; deren dunkler Sitz wächst passend mit. Der aktive warme Goldschein an Taste und Symbol leuchtet kräftiger. Die Beleuchtung der übrigen Appleiste folgt weiterhin nur echter Wiedergabe und läuft über 42 Sekunden mit dem bisherigen weichen Rand aus. Die vorhandenen nativen Höhen bleiben Grundlage; daraus entsteht keine neue Fenstersteuerung.

[Aktive Playtaste in der normalen 1280 × 160-px-Appleiste für Hörer](../pruefung/oberflaeche/radio/playbutton-aktiv-1280.png).

![Harmonisierte Appleiste mit drei Informationsgruppen](../pruefung/oberflaeche/radio/radio-harmonie-breit.png)

[Mittlere Breite](../pruefung/oberflaeche/radio/radio-harmonie-mittel.png) · [Natürliche schmale Ansicht](../pruefung/oberflaeche/radio/radio-harmonie-schmal.png) · [Kompakter nativer Header](../pruefung/oberflaeche/radio/vinyl-glow-mobil.png) · [Aktionen im Detail](../pruefung/oberflaeche/radio/radio-buttons.png).

Die Appleiste behält ihre ursprüngliche Größe, die #141414-Deckfläche als Mischhintergrund des Original-Logos, ihr Muster und ihren sichtbaren Rahmen. Am Übergang zur eingeschalteten Laufleiste laufen die seitlichen Kanten gerade weiter; nur der gemeinsame Außenrahmen ist oben und unten abgerundet. So entstehen keine innenliegenden Viertelkreise oder Eckkeile. Der eingeschaltete Lauftext beginnt direkt an diesem Rahmen. Er nutzt ausschließlich den bisherigen unteren Außenabstand von 18 bzw. 8 px; kein zusätzlicher Zwischenstreifen und keine Verschiebung der Tasten oder Texte. Die Laufzeile ist vollständig einfarbig #141414 ohne Muster; ihre deckende Grundfläche hält auch den oberen Überlappungsbereich ruhig. Der bestehende RGB-Glow umfasst beide und läuft unter der Laufleiste weich aus; zwischen ihnen liegt kein Lichtsaum. Ohne Lauftext gilt die bisherige Appleistenkontur. Der Lauftext ist passend zur 44-px-Leiste 20 px groß, bis einschließlich 700 px Breite 18 px, mit Zeilenhöhe 1,3 und vertikaler Zentrierung. Der optionale Lauftext sitzt als 44-px-Zeile unmittelbar unter der Appleiste: dieselbe Deckgrundfarbe #141414 wie die Appleiste, neutrale Trennlinie #3a3a3a, heller Text #f5f5f2, Kennzeichnung „Information“ in 16 px (bis 700 px Breite 14 px) und Pausenakzent in #e6c77b. Die örtliche Pause-Taste besitzt 44 × 44 px und zeigt ein 24-px-SVG mit zwei gefüllten senkrechten Balken; beim Anhalten erscheint ein Play-Dreieck im gleichen Goldton. Bei reduzierter Bewegung steht der vollständige Text statisch mit Umbruch. Ohne aktive Anzeige entfällt die Zeile. Die Einstellungen liegen als vollständige Bediengruppe unter Moderation → Lauftext.

Beim Überfahren der Laufleiste zeigt der Tooltip den kurzen neutralen Hinweis „Informationen von Radio MischWerk“. Der vollständige Lauftext bleibt in der Laufschrift und für Screenreader verfügbar.

Auch die übrigen Radiofelder verwenden kurze neutrale Hinweise: „Aktueller Titel“, „Interpret“, „Thema der Sendung“, „Aktuelle Moderation“, „Sendung und Moderation“ und „Dein Musikwunsch“. Die Daten selbst bleiben vollständig in ihren bisherigen Text- und Leseflächen. Play, Mute, Wunschbox, Studio- und Verwaltungsaktionen benennen die jeweilige Handlung; notwendige kurze Zustands- und Fehlerhinweise bleiben erhalten. Die Aktualisierungstasten zeigen nach Abschluss wieder ihren Aktionsnamen.

Aktuelle lokale Ansichten: [Lauftext unter der Appleiste](../pruefung/oberflaeche/radio/lauftext-1280.png) · [Moderator-Einstellungen](../pruefung/oberflaeche/moderation/moderation-lauftext.png).

## Menüs

Alle drei nativen Overlays haben mittige Titel, das Original-Logo links und eine frei erreichbare Schließen-Taste rechts. Die Köpfe bleiben vom ersten HTML-Anstrich bis zur fertigen Ansicht 76 px hoch, mit 64-px-Logo und 24-px-Titel. Die dekorative Zusatzzeile entfällt; Reiterwechsel verändern den Kopf nicht. Außenflächen und leere native Ladeabdeckung entsprechen #0f1114. Eingaben haben 16-px-Text; Aktionen bleiben mindestens 44 px groß.

- **Wunschbox:** flaches Formular mit einem Textfeld und Zeichenzähler; nach Abgabe kurze Quittung und Weiteren Wunsch eingeben. Eigener Song, Platz und Status stehen in der Appleiste. [Ansicht](../pruefung/oberflaeche/wunschbox/wunschbox-flach-560.png).
- **Moderation:** Deine Sendung, Musikwünsche, Heute gespielt und Lauftext. Goldene aktive Reiter und Hauptaktionen auf einer durchgehenden anthrazitfarbenen Fläche; An-/Abmeldung ohne Zeitlimit und private Übergabe; keine Restzeit- oder Studiozeitanzeige. Vollständige Texte bleiben über Inhaltsseiten erreichbar. Der Lauftexteditor passt mit kompakter Beschriftung, Textfeld, Optionen und Aktionen ohne äußere Scrollleiste; niedrige Rahmen verwenden Bereichsseiten. [Breit](../pruefung/oberflaeche/moderation/moderation-780.png) · [Schmal](../pruefung/oberflaeche/moderation/moderation-320.png).
- **Verwaltung:** Radio-Team und Bot-Texte. Bei Bot-Texten bleiben Kopf, Reiter und Aktionen fest; eine Inhaltsfläche scrollt, Textfelder wachsen ohne eigene Scrollleiste. [Bot-Texte](../pruefung/oberflaeche/verwaltung/verwaltung-bottexte-560.png).
- **Sendeplan:** Das bisherige Overlay samt Gestaltung und Layout ist entfernt. Die Taste in der Appleiste bleibt für alle Nutzer deaktiviert und zeigt „In Kürze“. Für den späteren Neuaufbau gibt es aktuell keine native Kalendergestaltung.

## Theatervorhang

Roter Samt mit natürlichen Falten und bordeauxgetönter Inhaltskarte. Zwei rein dekorative CSS-Hälften gleiten nach bestätigter Freigabe zu beiden Seiten; reduzierte Bewegung schaltet unmittelbar. Die logische Freigabe wartet nicht auf eine Animation. Werbung startet nur durch eigenen Klick.

[Geschlossen](../pruefung/oberflaeche/vorhang/vorhang-1920.png) · [Schmal](../pruefung/oberflaeche/vorhang/vorhang-320.png) · [Öffnungsphase](../pruefung/oberflaeche/vorhang/vorhang-oeffnung.png).

## Eigene Samttextur für den Theatervorhang

Mit dem eingebauten Imagegen-Werkzeug erzeugt, keine fremden Bilddateien übernommen. Die unveränderte PNG liegt unter [app/www/img/curtain-velvet.png](../../app/www/img/curtain-velvet.png), 1536 × 1024 px. Die beiden Stoffhälften verwenden dieselbe eigene Textur, rechts gespiegelt; das Original-Logo bleibt unverändert. Reines lokales Radio-Asset, im vorhandenen Inventar und Medienmanifest enthalten.

Gestaltungsreferenz: [ShowTex – Curtain pleats and fullness](https://www.showtex.com/en/knowledge-hub/curtain-pleats-and-fullness), insbesondere voller Theatersamt und natürliche Falten; außerdem [Rose Brand – Stage curtain specifications](https://mcprod.rosebrand.com/blog/post/how-to-specify-a-stage-curtain-to-obtain-a-cost-estimate?postId=5427). Als Orientierung recherchiert, nicht als Bildquelle eingebunden.

Finaler Imagegen-Prompt:

```text
Use case: photorealistic-natural. Asset type: original fabric texture for the two moving halves of a web radio theatre curtain. Primary request: luxurious modern crimson-red velvet theatre/musical curtain, fully closed, realistic soft heavy fabric. Composition: landscape 3:2, straight-on close view, fabric fills the entire image edge to edge; many generous irregularly spaced rounded vertical gathered folds, gentle natural waviness, dense matte short velvet pile. Lighting: soft even theatrical illumination revealing rich folds, restrained broad highlights and deep burgundy shadows, consistent brightness across the image, no white glare. Colors: elegant true theatre red/crimson, dark wine-red in the folds. The middle horizontal band must be usable as a very wide shallow UI banner crop. Constraints: only continuous cloth; no centre opening, no stage, no people, no valance, no swag, no rod, no tassels, no floor, no trim, no border, no text, no logo, no watermark. Avoid corrugated metal, rigid straight ribs, regular stripes, glossy plastic, satin sheen, horizontal scan lines, obvious repeating pattern.
```


## Prüfung

Breiten von 320 bis 3840 px, mehrere Rollen und Pixeldichten, Tastatur, lange Texte, Sperren und Wiedergabezustände werden mit den vorhandenen Browser-/Emulatormodellen geprüft. Die native Größenannahme und verbleibende Erstöffnungsblitze sind separat abzunehmen. [Aktueller Prüfbericht](../pruefung/PRUEFBERICHT.md).
