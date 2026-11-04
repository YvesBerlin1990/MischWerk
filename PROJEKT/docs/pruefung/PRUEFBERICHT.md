# MischWerk – aktueller Prüfbericht 0.1.202 · Build 202

Stand: 04.11.2026, Europe/Berlin. Die beiden bestätigten ZIP-Designs wurden zuerst auf die Appleiste und danach auf die vier bestehenden Menüs übertragen. Aktueller Stand ausschließlich lokal im festen Desktop-UPLOAD. Keine Live-Aktion.

## GitHub-Abschluss von Build 202

Auf ausdrücklichen Nutzerauftrag den bestehenden Quellstand 0.1.202 auf origin/main zusammengeführt und die GitHub-README als aktuellen Einstieg mit Funktionen, Vorschau, lokalem Start, Prüfungen, Projektstruktur und Bereitstellungsgrenzen überarbeitet. Kein neuer Appversionsstand und keine Knuddels- oder Websiteaktion.

Für den reproduzierbaren Gitstand **22 Textdateien ausschließlich von CRLF auf LF** gemäß der bereits vorhandenen .gitattributes vereinheitlicht. SHA-256 jedes Ergebnisses ist exakt der vorab berechnete Hash desselben Inhalts nach ausschließlichem Entfernen des CR-Anteils der Zeilenenden. Originale API-Referenzdateien sind bytegleich erhalten; keine fachlichen Änderungen und keine Minifizierung. Manifeste und fester Desktop-UPLOAD aus diesen Quellen neu erzeugt, weiterhin 106 Laufzeitdateien und 100 Texte. Das aktuelle Längenmaximum sinkt durch die Git-konformen Zeilenenden von 9496 auf **9393 Zeichen**.

Erneuter Paketbau: **236/236 Nodefälle**, beide Rhino-Engines **je 802 Prüfungen**, Architektur, Syntax, Version-/Buildgleichheit, Längen und Uploadkontrolle bestanden. **12/12 relevante vorhandene Browserfälle am tatsächlichen Upload erneut grün**: Parserstart in allen Fenstern, Pflichtdateifehler, verzögerte Ressourcen, einmalige Ladepläne und native Lade-/SDK-Übergabe in K3-/STAPP-Modellen. Die früheren UI-Bilder bleiben bei unverändertem visuellen Inhalt erhalten. Die folgenden Nachweise der Hintergrundanpassung 202 und Platzverteilung 201 beschreiben den jeweils davor geprüften Stand.

Private .env-Dateien, Zugangsdaten, installierte Abhängigkeiten und erzeugter UPLOAD werden nicht in den GitHub-Commit aufgenommen; die Beispieldatei enthält keine privaten Empfänger- oder Zugangsdaten. Der pausierte Websiteentwurf bleibt isoliert und deaktiviert.


## Aktueller äußerer Radiohintergrund 202

Die unveränderte Datei medien/mychannel/Hintergrund_MischWerk_Knuddels.png (1610 × 977 px) ausgelesen. Häufigster Farbwert der oberen 60 Bildzeilen: **RGB 15/17/20 = #0F1114** (47.255 von 96.600 Pixeln); der Median aller drei Kanäle ist derselbe Wert. Auch der linke 60-px-Rand hat diesen Median und häufigsten Wert. Das Bild besitzt eine feine Textur und geringfügige Farbabweichungen; die Appleiste übernimmt seine passende Grundfarbe, nicht das Bildmotiv.

Nur der äußerste Radio-Untergrund wechselt von #0a0a0a auf #0f1114. HTML/Body und Radioleiste verwenden dieselbe Canvas-Variable, im frühen kritischen CSS bereits vor dem Modulstart. Für andere Ansichten bleibt der bisherige #0a0a0a-Rückfall erhalten. Die innere Playerkarte bleibt **#141414**; Anordnung 201, Vinyl, Logos, Menüs und native Ladefarben sind unverändert. Keine neue Bilddatei oder Schnittstelle ausgeliefert.

Tatsächlicher gebündelter UPLOAD 202: **14/14 relevante bestehende Browserfälle** bestanden. Enthalten sind die **456 Geometriefälle** über 320–3840 px, vier Pixeldichten und drei Rollen sowie 108 Langtext-/Wunschkombinationen, jeweils mit Prüfung von HTML-/Body-/Leistenfarbe und erhaltener Playerkartenfarbe. Zusätzlich früher/verzögerter Start, fehlende Pflichtdateien, SDK-Fehler, parserbasierter Aufbau aller Fenster, ansichtsabhängiger Ladeplan, langsames Logo, echte SDK-Ladeübergabe und unveränderte Overlayfarben in K3-/STAPP-Modellen. Die vollständige 234-Fälle-Abnahme aus 201 bleibt als darunter gekennzeichneter Ausgangsnachweis erhalten; für 202 wurde gezielt der betroffene Umfang geprüft.

Paket 202: **236/236 Nodefälle**, Rhino 1.7.7.2 und 1.9.1 **je 802 Prüfungen**, Architektur, Syntax, Backendgleichheit, Kennungen, Paket-/Längen- und Uploadprüfung bestanden. **106 Laufzeitdateien / 100 Texte / fünf Manifeste**, größter tatsächlicher Laufzeittext **9496 Zeichen**, damit strikt unter 9500.

SHA-256 über **138 Quell-/Laufzeit-/Bilddateien** gegen 201: ausschließlich radio-surface.css, kritisches CSS in index.html und vier Kennungsdateien ändern sich. Alle ausführbaren HTML-Skripte, sämtliche Controller/Fachmodule, andere Stylesheets einschließlich metadata-layout.css, Originalmedien und Channelhintergrundbild sind unverändert. Keine neue Nachrichten-, Timer-, Größen-, Cache-, Öffnungs- oder Audiologik. Die vorherigen Start-/Event-/Sitzungskorrekturen bleiben erhalten.

[Lokaler Farbvergleich mit unverändertem Channelbild](oberflaeche/appleiste-hintergrund.png), [breite Leiste](oberflaeche/webradio-verwaltung.png), [320 px](oberflaeche/webradio-smartphone.png). Der Farbvergleich zeigt die tatsächlich gebündelte App im vorhandenen Emulator mit dem unveränderten Bild ohne die zusätzliche Emulatortönung; nur die umgebenden Laborbedienelemente sind für das Bild ausgeblendet. Keine native Knuddels-Abnahme oder Änderung am echten Channel behauptet.

## Erhaltene Platzverteilung 201

Auf Nutzerbefund zur großen Lücke in der breiten Appleiste ausschließlich metadata-layout.css angepasst. Die Musikspalte erhält nicht mehr nahezu den gesamten Mittelbereich; Musik/Lautstärke, Thema/Sendestatus und vorhandener eigener Wunsch teilen ihn proportional. Ohne Wunsch teilen sich Musik und Sendungsinformation die Breite. Ab 1200 px gemeinsame Oberkante und feine Trennlinien mit passenden Innenabständen. Lautstärkegruppe bis 440 px statt 330 px; Titel zwischen 1200 und 1500 px mit 20–24 px an den tatsächlich verfügbaren Raum angepasst. Unterhalb 1200 px bleiben die bisherigen mobilen Raster und 160-px-Fallbacks erhalten.

Lokaler Vergleich bei 2290 px mit demselben Beispiel aus dem Nutzerscreenshot (Since U Been Gone / Kelly Clarkson und Wunsch 1), ausschließlich im integrierten Emulator:

| Anteil am Informationsbereich | Vorher 200 | Jetzt 201 |
| --- | ---: | ---: |
| Musik/Lautstärke | 78,0 % (1240 px) | 36,3 % (578 px) |
| Thema/Sendestatus | 10,7 % (170 px) | 33,0 % (525 px) |
| Eigener Wunsch | 8,8 % (140 px) | 28,1 % (447 px) |

Die übrige Breite entfällt auf die vorhandenen Spaltenabstände. Dies sind Layoutmessungen mit lokalen Beispielwerten, keine Änderung am Radiosender oder an echten Nutzerwünschen. Aktuelle Bilder stammen aus dem tatsächlichen gebündelten Upload: [breit mit Wunsch](oberflaeche/webradio-verwaltung.png), [1920 px](oberflaeche/webradio-desktop.png), [700 px](oberflaeche/webradio-tablet.png), [320 px](oberflaeche/webradio-smartphone.png).

Vorhandene Breiten-/Rollen-/Pixeldichtematrix um sinnvolle Verteilungsgrenzen ergänzt: bei breiten Rahmen ohne Wunsch keine übergroße Musikspalte; mit Wunsch vergleichbare Breiten aller drei Bereiche. **456 Geometriefälle und 108 Langtext-/Wunschkombinationen** bei 320–3840 px, vier Pixeldichten und drei Rollen. Gezielter Quelllauf für Matrix, hohe Auflösungen und direkte Bedienbarkeit **3/3 grün**. Vollständiger Lauf aller fünf vorhandenen Browsersuiten am tatsächlichen gebündelten UPLOAD 201: **234/234 Fälle bestanden**, keine übersprungenen Fälle. Enthalten sind K3-/STAPP-Modelle, Rollen, lange Texte, Wünsche, Historie, alle Overlays, Fokus, natives Scrollen, Audio, Startfehler und Event-/Sitzungs-Gegenfälle.

Paket 201: **236/236 Nodefälle**, beide Rhino-Engines **je 802 Prüfungen**, Architektur, Syntax, API-Signaturen, Backendgleichheit, Kennungen, Paket-/Längen- und Uploadprüfung bestanden. **106 Laufzeitdateien / 100 Texte**, Maximum **9438 Zeichen**, fünf konsistente Manifeste. Lokaler HTTP-Abgleich **64/64 HTML-/JS-/CSS-Dateien bytegleich** zum erwarteten gebündelten Upload; kein neuer öffentlicher Abgleich und kein externer Laborverkehr.

SHA-256 gegen 200 über 137 Quell-/Laufzeitdateien: ausschließlich metadata-layout.css sowie app/app.config, app/main.js, app/server/config.js und src/backend/config.js ändern sich. Sämtliche Browsercontroller, anderen Stylesheets einschließlich aller Overlays, Fachmodule, Original-Logos und MP3 sind unverändert. Keine neue Nachricht, Anfrage, Timer-, Größen-, Öffnungs- oder Cachelogik. Start-/Event-/Sitzungs-, Wunsch- und Audio-/Heartbeatkorrekturen bleiben erhalten.

## Erhaltener Versionsabschluss 200

Auf ausdrücklichen Nutzerauftrag Appversion **0.1.199 → 0.1.200** und Build **199 → 200** erhöht. package.json, Backendquelle/-laufzeit, app.config (Build ausschließlich als Kommentar), erzeugter Einstieg und alle fünf Manifeste sind konsistent. Der feste Desktop-UPLOAD enthält den vollständigen Stand 200. Keine automatische Erhöhung bei erneutem identischem Paketbau, keine echte Knuddels-Aktion.

Abschließender Paketbau 200: **236/236 Nodefälle**, beide Rhino-Engines **je 802 Prüfungen**, Architektur, Syntax, API-Signaturen, Backendgleichheit, Version-/Buildabgleich, Längen und Uploadprüfung bestanden. **106 Laufzeitdateien / 100 Texte**, Maximum unverändert **9438 Zeichen**. SHA-256-Abgleich über **210 vorhandene Quell-/Laufzeit-/Uploaddateien**: ausschließlich app/app.config, app/main.js, app/server/config.js und src/backend/config.js ändern sich. Nach Rückabbildung nur der beiden Kennungen ergeben auch diese vier Dateien wieder exakt ihre 199-Hashes. Sämtliche 73 Frontend-Quelldateien und 73 tatsächlichen gebündelten Frontend-Uploaddateien bleiben bytegleich.

Die folgenden Gestaltungs-, Browser- und Bildnachweise stammen aus dem unveränderten Stand **199** und gelten als erhaltene Nachweise. Für diese reine Versionsfortschreibung keine neue Browser-/native Abnahme behauptet und keine unnötigen UI-Bilder erzeugt.


## Erhaltene Gestaltung und Nutzerkorrekturen aus 199

B · Vinyl Deck: dunkle Deckfläche mit statischer Schallplatte, silbernem Player, hochwertigem Original-Logo und gleich großen öffentlichen Aktionen. Responsive Raster statt fester 1280-px-Leinwand. MischWerk_Alle_Menues: gemeinsame schwarze/silberne Oberflächen, Eingaben, Karten und Reiter für Moderation, Verwaltung, Wunschbox und Sendeplan. Outfit für UI und Fraunces für Titel lokal als variable WOFF2 mit OFL-Lizenztexten; keine fremden Fontabrufe aus der App. Keine React-/support.js-/Demo-Handler, neuen Fachregeln oder Demo-Daten in der App.

Alle Fenster- und Abschnittsüberschriften sind auf Nutzerwunsch mittig. Symmetrische Seitenflächen zentrieren Fenstertitel über die gesamte Kopfbreite; X und Original-Logo bleiben seitlich. Nach dem konkreten Logo-Befund steht das Logo links direkt auf der ruhigen Kopfzeilenfläche, das Vinylmotiv rechts. Auch früher HTML-Kopf und kompakte native Ansichten sind berücksichtigt. Schmale Listenüberschriften erhalten eine eigene Aktionszeile.

Die Prüfung deckte zu wenig Lesefläche nach manueller Verkleinerung der Historie, eine Überlappung der Wunsch-Textnavigation und umgebrochene Tageszahlen auf. CSS-Korrekturen stellen vollständige Textseiten, getrennte 44-px-Bedienflächen und sieben vollständig sichtbare leere Tage im breiten Sendeplan wieder her. Bestehende Größencontroller bleiben unverändert. Veraltete reine Farb-/Schrift-/Rastererwartungen wurden an die bestätigten Vorlagen angepasst; Funktionsprüfungen erhalten. Bei simulierten schrittweisen Hosts wartet der Geometrievergleich auf das letzte tatsächlich angeforderte Maß. Quellen- und Uploadtests berücksichtigen ihren tatsächlichen deklarativen Ladeplan einschließlich vollständiger Bündel.

Erhaltene Bilder aus den tatsächlich gebündelten Upload-Dateien von Build 199 mit ausschließlich lokalen Labordaten:

- Appleiste: [breit](oberflaeche/webradio-desktop.png), [Tablet](oberflaeche/webradio-tablet.png), [320 px](oberflaeche/webradio-smartphone.png).
- Moderation: [breit](oberflaeche/moderation-780.png), [320 px](oberflaeche/moderation-320.png), [Wünsche](oberflaeche/moderation-wuensche-320.png), [Historie](oberflaeche/moderation-historie-320.png).
- Verwaltung: [560 px](oberflaeche/radio-team-560.png), [320 px](oberflaeche/radio-team-320.png).
- Wunschbox: [560 px](oberflaeche/wunschbox-flach-560.png), [320 px](oberflaeche/wunschbox-flach-320.png), [nach Versand](oberflaeche/wunschbox-nach-versand-560.png).
- Sendeplan: [820 px](oberflaeche/sendeplan-820.png), [320 px](oberflaeche/sendeplan-320.png).

## Erhaltene Prüfungen aus 199

- **236/236 Nodefälle** im abschließenden Paketbau bestanden, einschließlich Event-/Sitzungs-Gegenfällen und fehlender optionaler Ladeeigenschaften.
- **234/234 bestehende Browserfälle** über alle fünf Suiten am tatsächlichen gebündelten Upload verifiziert. Abschließender vollständiger Frontendlauf **129/129** nach Berücksichtigung des schmalen Aktionen-Reiters; übrige vier Suiten **105/105** im vollständigen Uploadlauf. Nach der letzten Logo-Hintergrundkorrektur zusätzlich **14/14** native Overlay-/Lade-/Interaktionsfälle und **2/2** Nachversandansichten erneut grün. Keine übersprungenen Fälle.
- Appleistenmatrix: **456 Geometriefälle**, 32 Breiten von **320 bis 3840 px** einschließlich beider Seiten aller neuen Rastergrenzen, vier Pixeldichten **1 / 1,25 / 1,5 / 2**, drei Rollen **Hörer / Radiomoderation / Inhaber** und sechs zusätzliche natürliche Rahmen. Weitere **108 Langtext-/Wunschkombinationen** derselben Rollen/Pixeldichten prüfen 300-Zeichen-Wunsch, 80-Zeichen-Thema, langen Nick und native Erreichbarkeit. Kein horizontaler Überlauf; alle angezeigten Aktionstasten mindestens 44 × 44 px. Zusätzliche vollständige K3-/STAPP-Fälle mit angenommenen, verzögerten, ignorierten und begrenzten Hostmaßen.
- Original-Logo ohne schwarzes Rechteck (transparenter CSS-Hintergrund und lighten), mittiger Kopf, alle Abschnittsüberschriften, schmale/breite Menüs, Entwürfe, Fokus, Hover-/Druckstabilität, Fehler und Quittungen geprüft. Wunschinformation bleibt ausschließlich im eigenen Bereich der Appleiste; kurze Fünf-Sekunden-Quittung und Weiteren Wunsch eingeben erhalten. Nachversandbilder aus dem tatsächlichen Upload in 320/560 px erneuert.
- Chronologie 197/198 erhalten und erneut geprüft: Start mit neuesten Titeln auf letzter Seite; Zurück zeigt ältere Titel bei sinkender Zahl bis Seite 1; Weiter zeigt neuere bei steigender Zahl. Vollständige lange Titel, Seitenanker, Berliner Tagesfilter und Rechte erhalten.
- Rhino **1.7.7.2 und 1.9.1 jeweils 802 Prüfungen**, 125 Wünsche und zwölf abgewiesene Links bestanden.
- Architektur, Syntax, API-Signaturen, UI-IDs, Backendgleichheit, Version/Build, Paket und fester Upload geprüft. **106 Laufzeitdateien / 100 Texte / 31 Backendmodule / 73 Browserdateien / 44 Komponenten / 17 Stylesheets / fünf Manifeste**. Alle Laufzeittexte und Manifeste strikt unter **9500 Zeichen**, Maximum **9438**.
- Reproduzierbare lokale HTTP-Auslieferungsprüfung des festen Uploads: **64/64 HTML-/JS-/CSS-Dateien bytegleich**. Dies ist ein lokaler Abgleich, kein neuer öffentlicher Befund. Kein externer Laborverkehr.

## Integrität und beibehaltene Fehlerkorrekturen

SHA-256-Vergleich gegen den unmittelbar vor der Designübernahme gesicherten Stand 198: sämtliche Fachcontroller unverändert, darunter geschützte wishes/wishbox und Backend wishes/transport samt Laufzeitkopie, Player, Volume, Viewport, Präsentation, Historienansicht/-controller, start.js, transport/lifecycle, Sessions/Session-State und Wish-Surface. Original-PNGs und Werbe-MP3 bytegleich. Die ausführbaren HTML-Skripte sind ebenfalls bytegleich, gemeinsamer SHA-256 **c55527239bd590c7198f33196961b73f7a2af6c3ff8e726c1ce65275a03e60a4**. Neben Gestaltung und zwei statischen Markups ändern sich im Backend nur Versionsmetadaten und die beiden nativen Ladefarbliterale. Keine neue Plattformmethode, Nachricht, Abfrage, Timer-, Fenster- oder Wiederholungslogik.

Die Eventkorrektur 194 bleibt erhalten: lokale Eingabe sofort, Abgleich gebündelt auf 400 ms, letzte Sequenz vor X/Escape/Submit/Wechsel, deduplizierte Darstellungen, unmittelbare Pflichtquittungen, nur aktuelle Sitzung höchstens einmal schließen. Erhaltener reproduzierter Vergleich mit 36 Zeichen bei 110 ms Abstand:

| Messung aus Fehleranalyse 194 | Servernachrichten | Stärkstes 5-s-Fenster |
| --- | ---: | ---: |
| Ausgangsstand | 108 | 108 |
| Korrigierter Quellstand | 18 | 18 |
| Gebündelter Upload | 18 | 18 |

Reduktion 83,3 Prozent bei vollständigem Text. Die beobachtete Grenze 50/5 s stammt aus dem Nutzerlog; keine allgemeine Lastgarantie oder Nachbildung des proprietären Limit-Algorithmus. Mehrnutzer-, Schlusszeichen-, Einzelversand- und Session-remove-Gegenfälle bleiben Bestandteil der vollständigen Prüfung. Aktuelle Sitzung weiterhin über dokumentiertes AppContent.getSessions und getOpenTimestamp zuordnen; keine erfundene isClosed-Methode.

Die Startkorrektur 195 bleibt bytegleich erhalten: frühe Pflichtdateifehler sichtbar, keine falsche mw-ready-Freigabe nach fehlgeschlagenem Stylesheet, vorhandener 15-s-Wächter und reguläre späte Fertigstellung erhalten, keine Nachladeschleife. Der damalige öffentliche Befund war ein Mischstand: von 65 HTML-/JS-/CSS-Dateien 49 passend, 13 älter und drei HTTP 404 (wishes/feedback.js, wishes/relay.js, studio/window.js). Schlussabgleich gegen 195: 47 passend, 15 verschieden, drei fehlend. Dieser historische Befund wurde bei der Gestaltung nicht erneut öffentlich abgerufen und wird nicht als live repariert ausgegeben.

## Native Abnahme und Bereitstellung

Ausschließlich **C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk** auf **0.1.202 / Build 202** vorbereitet. Vollständige 106 Dateien einschließlich aller Unterordner, Fonts und OFL-Texte gemeinsam übernehmen; einzelne neue Dateien reichen wegen der Bündel und des früheren öffentlichen Mischstands nicht. Keine Veröffentlichung, FTP-Verbindung, Aktivierung, echte Appaktualisierung, Neustart, ZIP oder zweite Uploadkopie.

Nach eigener vollständiger Übernahme Versionskennung 0.1.202 / Build 202 im App-Startlog prüfen, dann kalten/warmen Beitritt, Aktualisierung, breite/schmale Appleiste und alle vier Overlays in K3/STAPP kontrollieren. Mittige Titel, freie Logos, lange Texte, Fokus, private Wünsche und Historien-Zeitrichtung prüfen. Begrenzter nativer Gegencheck mit zwei bis drei Nutzern: Tippen/Einfügen, direkt schließen/absenden, Ansicht wechseln, verlassen und erneut beitreten; APP-LIMIT- und bereits-geschlossen-Warnungen mit Uhrzeit/Version erfassen.

Die lokale Prüfung ersetzt keine native Freigabe. Bekannter nativer weißer Erstöffnungsblitz und eigener Langzeitnachweis des Wiedergabe-Heartbeats bleiben offen. Ladefarben sind nun #0a0a0a; Enabled-/Sitzungsabläufe unverändert. Der Heartbeat bleibt an fortschreitendes Audio und frische Channelantwort gebunden. Der frühere lesende Vergleich des OR-Players belegt dort Client.executeSlashCommand('/confirm') alle 180000 ms; die aktuelle Knuddels-Whitelist garantiert /confirm nicht ausdrücklich. Keine neue Wirksamkeitsbehauptung für den nativen Langzeitaufenthalt. [Native Abnahme](../betrieb/LIVE-ABNAHME.md), [API-Nachweis](../api/API-NACHWEIS.md), [Design](../architektur/DESIGN.md).
