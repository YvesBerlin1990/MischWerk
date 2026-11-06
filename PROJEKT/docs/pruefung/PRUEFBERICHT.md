# MischWerk – Prüfbericht 0.1.239 / Build 239

## Otterchen erhält automatische Inhaberrechte 239

Stand 06.11.2026. Der Nutzer korrigiert die bisherige Vorgabe ausdrücklich: Otterchen ist der Channelinhaber und erhält alle bestehenden Apprechte automatisch, ohne Radio-Team-Eintragung. Die Einschränkungen aus 233/238 gelten für ihn nicht mehr. Die serverseitige Freigabe nutzt den bestehenden canAdminister-Nachweis mit authentifiziertem Nick, echtem Channelinhaberrecht und Channelanwesenheit. Der Browser leitet keine Rechte allein aus einem Namen oder behaupteten Clientrollen ab.

Fachlich geändert sind ausschließlich ui/snapshot.js, radio/handover.js und radio/team.js samt generierten Laufzeitkopien. Der Moderationsbutton ist für den echten Inhaber sofort sichtbar; er wird als Übergabeempfänger angeboten und kann annehmen, ohne in radioModeratorUserIds zu stehen. Kein automatischer oder versteckter Persistenzeintrag. Das Entfernen eines optionalen eigenen Listeneintrags beendet weder seine aktive Moderation noch eine offene Übergabe oder seine bestehende Websiteanmeldung. Regulärer Entzug anderer Moderatoren bleibt erhalten. Verwaltung, Sendeplan, Bot-Texte, Vorhang und private Betreibereinrichtung waren bereits durch die bestehenden Inhaberrechte freigegeben und bleiben geschützt; die bestätigte Übergabe beziehungsweise das ausdrückliche Beenden einer fremden Moderation wird nicht umgangen.

Die aktualisierten Anforderungen scheitern am alten Stand vor der Korrektur: Moderationsbutton fehlt ohne Eintrag, Inhaber fehlt als Ziel und Selbstentfernung beendet die aktive Anmeldung. Danach bestehen 33 gezielte Nodefälle für Verwaltung, Übergabe und Website. Sie prüfen automatische Rechte ohne Listeneintrag, tatsächlichen Neustart, Ein-/Austragen, erhaltene aktive Sitzung, erhaltene offene Anfrage, normale Ernennung/Entzug, korrekte Kandidatenliste und Verlust der automatischen Freigabe ohne echtes Inhaberrecht. Ein Nick oder eine andere Plattformrolle allein reicht nicht. Browsernormalisierung verlangt weiterhin strikt bestätigte boolesche Serverfreigabe.

Zwei native K3-/STAPP-Modellfälle beginnen ausdrücklich mit einem nicht eingetragenen Otterchen. Sie prüfen den sofort sichtbaren Button, Verwaltung, Ernennen/Entziehen des DJ, fehlenden Zugriff eines unregistrierten Appmanagers, unveränderten Inhaberzugriff nach optionaler eigener Ein-/Austragung und die vollständige Übergabe vom eingetragenen DJ an den weiterhin nicht eingetragenen Inhaber. Beide Fälle bestehen. Die entsprechenden Rhino-Proben prüfen automatische Freigabe, Ende/Wiederkehr des echten Inhaberrechts und Übergabeziele. Aktuelle Oberflächen und sämtliche Browsercontroller, Audio-/Heartbeat-/Übergabebestätigungswege, native Fenstermaße und Originalmedien sind SHA-256-gleich zu Build 238; reine Versionskonfiguration und erzeugter Einstieg ausgenommen.

Vollständiger Paketbau bestanden: 351/351 Nodefälle und je 1012 Prüfungen in Rhino 1.7.7.2 und 1.9.1. Architektur, API-Signaturen, Quellen-/Laufzeitgleichheit, fünf Manifeste und Längengrenzen bestanden. Unverändert 132 Laufzeitdateien, 125 Texte, maximal 9492 Zeichen. Die vollständige Browserrunde am endgültigen Desktop-UPLOAD besteht mit 294/294 Fällen, ohne Fehler, Abbruch oder übersprungenen Fall, in 528,8 Sekunden. Nur lokale Bereitstellung, keine Veröffentlichung, GitHub-/FTP-/Update-/Neustart-/echte Nachrichtenaktion.

## Übergabe vollständig kontrolliert und korrigiert 238

Stand 06.11.2026. Der Nutzer verlangt nach dem ungeklärten Fehler aus 237 eine vollständige Funktionsprüfung statt eines bloßen Nachlaufs. Kontrolliert wurden radio/handover, Moderationscommit, Identität/Anwesenheit, private Snapshots, Entzug/Verlassen/Neustart, UI-Entwürfe, Befehlsbestätigung, Seitenlogik, kleine Rahmen sowie die vorhandenen Node-/Rhino-/Browser- und Emulatorfälle. Die bisherige Testhilfe tests/support/studio-browser.cjs ist SHA-256-gleich zu Build 237.

Vier Frontendfehler sind jeweils vor ihrer Korrektur durch gezielte Gegenfälle fehlgeschlagen:

- Eine ausgewählte Themen-/Notizgruppe verschwindet nach kleinem → großem → kleinem Hostrahmen. Die bisher gespeicherte Seitennummer wurde beim Zusammenfassen der Gruppen auf null geklemmt. studio/pages hält jetzt die gewählte DOM-Gruppe als logischen Anker; ausdrückliche Seitennavigation hat Vorrang vor Fokusankern. Normale Zustandsupdates erhalten außerdem den nativen Scrollstand. Dies belegt einen echten Fehler in der im alten Mehrnutzertest betroffenen Bediengruppenauswahl. Die genaue damalige Hostantwortfolge wurde nicht aufgezeichnet; sie wird nicht nachträglich als vollständig rekonstruierter Ablauf ausgegeben.
- In 320 × 360 passt die Notiz-/Annahmegruppe teilweise nicht vollständig in ihre Seite. overflow:hidden blockierte Rad/Touch. Überlange Einzelgruppen sind nun intern nativ scrollbar; native Fenstermaße und Dokument bleiben unverändert. Ein echter Zustandsrefresh darf die gelesene Position nicht zurücksetzen.
- Geht die Annahmequittung verloren, blieb das Formular trotz bereits bestätigter neuer Moderation offen, der alte Studioentwurf erhalten und die Befehlssperre aktiv. Ein frischer authentifizierter Zustand beendet die ausstehende Annahme jetzt nur bei eigener aktiver Moderation, neuem Sitzungsschlüssel, höherer Übergaberevision, verschwundenem Eingang und passendem privaten Annahmebeleg. commands.send besitzt dafür ein optionales lokales Prädikat. Keine synthetische RPC-Erfolgsantwort. Der Übergabe-UI-Zustand wird geschlossen und alter Themenentwurf samt Entwurfshinweis zurückgesetzt. Eine verspätete Quittung kann keinen späteren Entwurf löschen und keine falsche Zeitüberschreitung mehr auslösen.
- Kommt die Erfolgsquittung an, aber der Zustandspush geht verloren, blieb die Anzeige zunächst beim bisherigen Moderator. Nach erfolgreicher Annahme wird deshalb genau einmal über den bestehenden mw:refresh-Weg nachgelesen. Ohne Quittung oder frischen Zustand wird keine Übernahme behauptet. Keine zusätzlichen Timer, Hintergrundpolls oder Plattformmethoden.

Zusätzlich war der nicht im Radio-Team eingetragene Inhaber ein mögliches Ziel, obwohl dessen Moderationsbutton nach dem ausdrücklichen Sichtbarkeitsauftrag verborgen bleibt. Zielauswahl und Validierung verlangen nun denselben Radio-Team-Eintrag zusätzlich zu bestehender Berechtigung und Channelanwesenheit. Auch Otterchen kann nach eigener Eintragung empfangen. Entfernen des Eintrags verwirft die Anfrage endgültig; erneutes Eintragen belebt alte IDs nicht wieder. Verwaltung und bestehende Inhaber-Fachrechte bleiben erhalten. Diese Zielregel ist mit einem zusätzlichen Node-Gegenfall und beiden echten Rhino-Engines geprüft.

Die übrigen Serverregeln sind überprüft und erhalten: erst die ausgewählte Person nimmt an; Moderator und Thema wechseln in einem Commit; Speicherfehler lassen alten Stand und Anfrage bestehen; ursprünglicher Moderator bleibt bis Annahme aktiv; Ablehnen/Abbrechen ändert keine Sendung; Verlassen, Rechte-/Sitzungswechsel und Shutdown verwerfen offene Anfragen; 500 Zeichen Notizen und 80 Zeichen Thema; Queue/Wunschboxfreigabe erhalten; keine privaten Beteiligten/Notizen für Hörer; genau eine öffentliche Übergabemeldung, keine Wiederbelebung durch alte Pakete oder doppelte Annahme.

Die Gegenprüfung der Zustandskorrektur deckte zusätzlich eine alte, nach Ablehnung stehengebliebene Eingangskennung auf: Eine spätere unabhängige Anmeldung konnte dadurch als Übergabeabschluss behandelt und ihr neuer Studioentwurf geleert werden. Dieser neue Gegenfall war rot und besteht nach Bereinigung der Eingangskennung vor dem Verfügbarkeitsausstieg.

Ein weiterer Gegenfall zeigte, dass eine zwischen Annahme und Zustandszustellung vorgenommene Themenänderung nicht zur falschen Sperre führen darf. Ein privater, erst nach erfolgreichem Commit gesetzter acceptedId-Beleg bestätigt deshalb die genaue Anfrage unabhängig vom inzwischen geänderten Thema. Er ist ausschließlich für den Empfänger sichtbar, auch ohne Notiz vorhanden, flüchtig und endet mit der übernommenen Sendung. Speicherfehler setzen ihn nicht. Node, Browser und Rhino prüfen Zuordnung und Privatsphäre.

Alle elf gezielten Übergabe-Browserfälle bestehen, einschließlich maximaler Notizen, Speicherfehler, Ablehnen/Abbruch, Größenwechsel, Rad-Scrollen, Refresh, verlorener/verspäteter Quittung, verlorener/verspäteter Zustände, unveränderter neuer Entwürfe und fehlender falscher Erfolgsmeldung. Die bisherigen 24 Server-/Studiofälle plus die neuen Fälle für Zielzugang und privaten Annahmebeleg bestehen (26/26). Zwei zusätzliche echte native Emulatorabläufe in K3 und STAPP führen bei 320 × 360 die vollständige Anfrage und Übernahme mit 500-Zeichen-Notizen aus, verlieren gezielt die Annahmequittung und prüfen neuen Moderator, Thema, empfangene Notizen und weiterlaufendes echtes lokales Audio beider Personen. Beide Fälle bestehen. Der anfänglich neue Testaufbau wurde korrekt mit geöffnetem Vorhang für den DJ und dem tatsächlichen Emulator-Persistenzleseweg ausgestattet; keine Anwendungskorrektur für diese Fixture-Voraussetzungen und keine abgeschwächte Funktionsprüfung.

Vollständiger endgültiger Paketbau bestanden: 351/351 Nodefälle und je 1002 Prüfungen in Rhino 1.7.7.2 und 1.9.1. Architektur, API-Signaturen, Quellen-/Laufzeitgleichheit, fünf Manifeste und Längengrenzen bestanden. 132 Laufzeitdateien, 125 Texte, maximal 9492 Zeichen. Radioleiste einschließlich einheitlicher Tasten, Audio-/Heartbeatmodule, geschützte Wunschcontroller/-transporte, Originalmedien und native Größen-/Sitzungsmodule bleiben SHA-256-gleich zu Build 237. Die vor dem ergänzten Ablehnungs-/Neuanmeldungsgegenfall gestartete vollständige Vorprüfung besteht mit 292/292 Fällen ohne Fehler (475,2 Sekunden), darunter auch der zuvor gescheiterte Mehrnutzerfall. Eine weitere Vorprüfung besteht nach der Eingangsbereinigung mit 293/293 Fällen (461,5 Sekunden). Der zusätzlich geprüfte private Annahmebeleg und gleichzeitige Themenwechsel erhalten nochmals eine vollständige Prüfung am endgültigen Bündel. Die vollständige abschließende Browserrunde am endgültigen Desktop-UPLOAD besteht ohne Fehler und ohne Nachlauf mit 294/294 Fällen (464,0 Sekunden). Darin bestehen der ursprüngliche Mehrnutzerfall mit unveränderter Testhilfe sowie alle neuen Gegenfälle einschließlich des privaten Annahmebelegs. Dieses vollständig geprüfte Bündel ist der finale lokale Bereitstellungsstand. Echte Knuddels-Abnahme nach Nutzerinstallation bleibt separat; keine Veröffentlichung, GitHub-/FTP-/Update-/Neustart-/echte Nachrichtenaktion.

## Einheitliche Radiotasten 237

Stand 06.11.2026. Der Nutzer beauftragt mit dem Dreier-Tastenbild ausdrücklich die gleiche Größe, Höhe, Beschriftung und Abstände von Sendeplan, Wunschbox und Moderation. Bisher verschob die Zusatzzeile Deaktiviert nur die beiden öffentlichen Tasten; Moderation hatte eine andere Breite sowie eigene responsive Schrift-/Ausrichtungsregeln. Die bisherige reine Gegenprüfung von Sendeplan/Wunschbox reichte deshalb nicht aus.

Ausschließlich radio-actions.css und radio-responsive.css sind fachlich geändert. Alle drei verwenden dieselbe Beschriftungsfläche mit dauerhaft reservierter 14-px-Zusatzzeile. Aktivieren/Deaktivieren verschiebt weder Taste noch Symbol oder Hauptbeschriftung. Breit: 92 px Tastenhöhe, 44-px-Scheibe, 22-px-Symbol, 13-px-Hauptschrift; bei sichtbarer Moderation jeweils 90 px Tastenbreite und 20 px Abstand. Die beiden letzten Rasterspalten wechseln dafür von 178/112 auf 200/90 px bei unveränderter Summe und Informationsbreite. Natürlich schmal: gemeinsame 84-px-Tasten, 36-px-Scheiben, 20-px-Symbole, drei gleich breite Spalten mit 10 px Abstand. Im begrenzten Radio bleiben 44-px-Tastenhöhe, 24/16-px-Scheiben/Symbole und bisherige zugängliche kompakte Moderationsdarstellung erhalten; die drei Aktionen stehen unten mit gleichen Breiten und 6 px Abstand. Hörer ohne Moderation behalten zwei öffentliche Tasten im vorhandenen Bereich. Schloss, Deaktiviert, tatsächliche Sperre und ausschließlich eingetragene Moderatoren bleiben erhalten.

Die bestehende Inhaltsgeometrieprüfung umfasst jetzt alle drei tatsächlich sichtbaren Tasten, einschließlich des jeweils sichtbaren Musik-/Schloss-SVGs. Sie verlangt gleiche Breite/Höhe, Scheiben-/Symbolgröße, absolute Symbol-/Hauptbeschriftungshöhe, Schriftmaße und beide Zwischenräume. Am bytegleich erhaltenen 236er Ausgangsstand scheitert sie an abweichenden Tastenmaßen; am neuen Stand besteht sie. Der bestehende Sperr-/Reaktivierungsfall verlangt zusätzlich exakt identische Tasten-/Symbol-/Haupttextgeometrie vor und nach dem Umschalten, ohne Aufgabe der echten Klicksperre oder des laufenden Audios. Die neue gemeinsame breite Sollhöhe ersetzt die bisherige 84-px-Erwartung in der bestehenden Tastaturprüfung. Fünf gezielte Geometrie-/Schmal-/Sperr-/Tastaturfälle sowie Rollen-/32-Breiten-/Vier-Pixeldichtenmatrix, Glow und beide HTML-Vorlagen-/Audiofälle bestehen (5/5 plus 4/4).

Am tatsächlichen endgültigen Desktop-UPLOAD sind zusätzlich 36 native K3-/STAPP-Modellmessungen mit aktivierter/deaktivierter Wunschbox bei 320/390/700/701/901/1199/1200/2124/2290 px bestanden. Dabei bleiben Scheiben, Haupttexte, drei Tastenbreiten, Höhen und Abstände gleich; echtes lokales Audio läuft durch. Keine Browserfehler oder fremden Netzaufrufe. Bestehende aktuelle Tasten-/Radiobilder wurden aus diesem Bündel erneuert und visuell geprüft. Die Beispiele enthalten lokale Testdaten; native Knuddels-Ausführung bleibt gesondert abzunehmen.

![Gleiche Höhe auch mit deaktivierter Wunschbox](oberflaeche/wunschbox-deaktiviert.png)

Sämtliche Browsercontroller, Backendfachmodule, übrigen Stylesheets und Originalmedien sind SHA-256-gleich zu Build 236, Versionskonfiguration und erzeugter Einstieg ausgenommen. DOM, Rollen, Verwaltung per /MW Verwaltung, Entwürfe, Fensterwege und Audio/Heartbeat besitzen keine neue Implementierung. Vollständiger Paketbau: 349/349 Nodefälle, je 987 Rhino-Prüfungen, Architektur, API-Signaturen, Quellen-/Laufzeitgleichheit, fünf Manifeste und Längengrenzen bestanden. Unverändert 132 Laufzeitdateien, 125 Texte, maximal 9492 Zeichen. Die vollständige Browserrunde am Desktop-UPLOAD führt 285 Fälle aus: 284 bestehen sofort; der Mehrnutzerfall für Wunschregie/Thema/Übergabe scheitert einmal an der Testhilfe beim Sichtbarmachen von #studio-topic in der paginierten Bediengruppe (410,1 Sekunden Gesamtlauf). Derselbe Fall besteht am exakt selben Bündel ohne Änderung im gezielten Nachlauf vollständig (41,3 Sekunden), einschließlich Themenbearbeitung, Notizenübergabe und Wunschabschluss zwischen drei Nutzern. Die genaue zeitliche Ursache des ersten Hilfsprüfungsfehlers ist damit nicht belegt; keine Fehlerunterdrückung oder Anpassung von Anwendung/Testhilfe. Alle 285 unterschiedlichen Browserfälle sind erfolgreich geprüft. Nur lokale Bereitstellung; keine Veröffentlichung, GitHub-/FTP-/Update-/Neustart-/echte Nachrichtenaktion.

## Überschneidungen in schmalen Ansichten 236

Stand 06.11.2026. Der Nutzer begrenzt die Änderung ausdrücklich auf kleinere Breiten und Rahmen. Reproduziert wurden die dekorative Schallplatte unter Musik-/Lautstärketexten im natürlichen mobilen Radio, überlappende Schriftboxen von Titel und Interpret im begrenzten Radio und ineinandergedrückte Wunschtexte, Textseitensteuerung, Absender und Aktionen in sehr niedriger Moderation. Ein bloßer Rahmen-/Buttoncheck fand diese Text- und Dekorationsfehler zuvor nicht.

Ausschließlich zwei fachliche CSS-Dateien geändert: radio-responsive.css innerhalb bestehender max-width:1199/700-Regeln und studio-queue.css bei höchstens 420 px Höhe. Im natürlichen schmalen Radio liegt eine 96-px-Schallplatte mittig um die unveränderte 60-px-Taste; begrenzt sind es 112 px, jeweils mit freiem Abstand vor Text und über Aktionen. Im begrenzten Stapel trennen zwei Pixel ausschließlich vor dem Interpreten die Angaben; der Titel nutzt 19 statt 20 px bei 22 px Zeilenhöhe. So bleibt der vollständige 44-px-Lautstärkeregler bei kurzen Angaben innerhalb der bisherigen oberen Fläche. Der sehr niedrige Wunschbereich scrollt als vollständiger Arbeitsbereich mit seinen bisherigen Textseiten, Metadaten, Aktionen und Wunschseiten. Lesefläche darf nicht auf null schrumpfen. Keine CSS-Änderung an der breiten Hauptansicht und kein neuer Größen-/Audio-/Rechte-/Timerweg.

Die neue geometrische Prüfung scheiterte vor der Korrektur an tatsächlich überlappenden Titel-/Interpretenzeilen. Danach bestehen 590 Messungen über Radio, Wunschbox, Moderation, Verwaltung und Sendeplan in K3-/STAPP-Modellen: 320 bis 1199 px, einschließlich Größenübergängen, 160/176-px-Radio, 320/360/420/500/568/760-px-Rahmen, langen Angaben, privaten Wünschen, Arbeitsreitern, Bot-Texten, Text-/Aktionsumschaltung, Endzeit und Übergabe. Gemessen werden echte sichtbare Textzeilen und Eingabeflächen unter Beachtung ihrer nativen Scrollclips; zusätzlich Nichtüberdeckung der Dekoration, erhaltene Lesefläche und echte Klicktreffer der Wunsch-/Textaktionen. Die bestehende Rollen-/Breiten-/Pixeldichtematrix bleibt zusätzlich erhalten.

Vier Vorher-/Nachherbilder des unveränderten Hauptlayouts bei 1920 und 2290 px in beiden Clientmodellen sind byte- und damit pixelgleich. Alle bisherigen Frontendcontroller, anderen Stylesheets, Backendfachmodule und Originalmedien sind SHA-256-gleich zu Build 235; reine Kennung/erzeugter Einstieg ausgenommen.

Am vollständigen endgültigen Desktop-UPLOAD wurde zusätzlich der echte native STAPP-Modellweg mit synthetischem lokalem Audio ausgeführt: natürliche 390-px-Radioleiste, Wunschabgabe über echtes Overlay, begrenzte Moderation 320 × 360, vollständiges Lesen aller 300 Zeichen über die bestehenden Textseiten und tatsächliches Abschließen über Gespielt. Kein Audioverlust, keine Browserfehler oder fremden Netzaufrufe. Nur die beiden bestehenden Nachweisbilder wurden aus diesem Bündel erneuert und visuell geprüft: [schmales Radio](oberflaeche/vinyl-glow-mobil.png), [Wunschbereich im niedrigen Rahmen](oberflaeche/moderation-wuensche-320.png). Vergleichs-/Kandidatenbilder liegen ausschließlich im System-Tempordner.

Vollständiger Paketbau: 349/349 Nodefälle, je 987 Prüfungen in Rhino 1.7.7.2 und 1.9.1, Architektur, API-Signaturen, Quellen-/Laufzeitgleichheit, fünf Manifeste und Längengrenzen bestanden. Unverändert 132 Laufzeitdateien, 125 Texte, maximal 9492 Zeichen. Die erste vollständige Browserrunde am Desktop-UPLOAD führt 285 Fälle aus: 283 bestanden, zwei bestehende Kompakt-Radiofälle erkannten die durch zunächst pauschalen Textabstand nach unten verschobene Lautstärke (403,4 Sekunden). Korrigiert ist ausschließlich die kompakte Typografie wie oben beschrieben; keine abgeschwächte Testgrenze. Beide Gegenfälle und zusätzlich Rollen-/Breiten-/Pixeldichtematrix, neue 590-fache Geometrieprüfung, Glowauslauf und beide HTML-Vorlagen-/Audiofälle bestehen im gezielten Nachlauf (7/7). Die vollständige Radio-Browserdatei am neu gebauten endgültigen Upload besteht mit 145/145 Fällen ohne Fehler (285,2 Sekunden). Damit sind alle 285 unterschiedlichen Browserfälle erfolgreich geprüft. Der oben beschriebene gebündelte native Modell-Roundtrip wurde nach der abschließenden CSS-Korrektur erneut erfolgreich ausgeführt; auch die vier finalen breiten Vergleichsbilder sind weiterhin pixelgleich. Native Knuddels-Abnahme nach Nutzerinstallation bleibt offen; keine Veröffentlichung, FTP-/Update-/Neustart-/echte Nachrichtenaktion.

## Glowauslauf mit 16 Pixeln 235

Stand 06.11.2026. Vergleich der tatsächlichen lokalen grünen RGB-Phase mit 40/24/20/16 px im System-Tempordner. Gewählt sind 16 px statt 40: 24 px weniger dekorativer Abstand, entsprechend 176 statt 200 px native Anfangshöhe. Radio bleibt dieselbe 160-px-Bedienfläche; STAPP misst dieselbe Oberfläche plus 16 px und behält die 500-px-Grenze. Im vorhandenen Footer endet der Verlauf einen Pixel vor dem Rand vollständig in Canvasfarbe. Begrenzte Hosts behalten den festen, klickdurchlässigen Fadeweg, kompakt weiterhin 8 px.

Die bestehende Glowprüfung war vor Änderung rot (alter 18-px-Fallback statt neuer 16-px-Auslauf bei 176 px Rahmenhöhe). Nach Änderung bestehen die Breiten-/Rollen-/Pixeldichtematrix, die vollständige RGB-Interpolation und die erweiterte Glowprüfung (3/3 gezielte Fälle). Der endgültige gebündelte UPLOAD besteht dieselbe Pixelprüfung und den tatsächlichen STAPP-Modellaufruf über das Chatfeld samt Audio-/Entwurfserhalt.

14 echte Screenshot-Messungen: sechs Farbstationen breit je in K3 (Pixeldichte 1) und STAPP (Pixeldichte 2), zusätzlich Grün bei 390 px. An drei Positionen der letzten Pixelzeile beträgt die maximale Abweichung von #0f1114 exakt 0 RGB-Stufen; der größte Schritt zur vorherigen Pixelzeile beträgt 1. Vor dem Fade wird weiterhin sichtbarer Lichtsaum verlangt. Der gesamte unveränderte CSS-Bereich ab der Halo-/Vinylkonfiguration, einschließlich aller Schatten, Farbwerte und RGB-Keyframes, ist SHA-256-gleich zu Build 234. Keine abgeschaltete Leuchte als falscher grüner Randtest.

Die vorhandenen breiten/schmalen Radiobilder wurden aus dem tatsächlichen gebündelten Stand in derselben grünen Farbphase erneuert und visuell geprüft. Keine Kandidatenbilder im Projekt. Node-Suite 349/349 und beide Rhino-Engines mit je 987 Prüfungen bestanden; Architektur, API-Signaturen, Modul-/Paket-/Manifest-/Längenprüfungen bestanden. 132 Laufzeitdateien, 125 Texte, fünf Manifeste, maximal 9492 Zeichen. Die vollständige Browserrunde am endgültigen Desktop-UPLOAD besteht im ersten Abschlusslauf mit 284/284 Fällen ohne Fehler (402,0 Sekunden).

Die Änderungen an ui/sessions beschränken sich auf den vorhandenen Headerhöhenwert. Moderation, Verwaltung, Sendeplan und Wunschbox behalten ihre Fenstermaße; Wiedergabe, Heartbeat, Rollen, Wünsche, alte Übertragungs-/Sitzungskorrekturen und Originalmedien bleiben erhalten. Die native Wirkung von Build 235 muss nach Nutzerinstallation separat bestätigt werden; diese Phase bleibt lokale Bereitstellung ohne FTP-/Update-/Neustart-/echte Nachrichtenaktion.

## Deaktivierte Wunschbox auf Sendeplanhöhe 234

Stand 06.11.2026. Die bisherige Zusatzregel verkleinerte das deaktivierte Schlosssymbol auf 32 statt 44 px und veränderte die Abstände. Zugleich verschob die zusätzliche Zeile Deaktiviert die Hauptbeschriftung gegenüber Sendeplan; im begrenzten 320-px-Rahmen lag sie nachweislich sieben Pixel höher. Die Sondergeometrie ist entfernt. Ein ausschließlich im deaktivierten Zustand vorhandener leerer CSS-Layoutplatz unter Sendeplan gleicht die zusätzliche Textzeile aus. Beide Tasten behalten damit gleiche Symbolgröße, Tastenhöhe und relative Symbol-/Titeloberkante. Kein zusätzlicher sichtbarer Sendeplantext und kein neues DOM.

Die bestehende Inhaltsgeometrieprüfung scheiterte vor Änderung an der abweichenden Titeloberkante und besteht danach. Drei gezielte Browserfälle prüfen Rollen-/Breitenmatrix, deaktivierte Wunschbox samt Sperre und erneuter Aktivierung sowie breite Tastaturbedienung. Im tatsächlichen gebündelten UPLOAD ist der deaktivierte Zustand zusätzlich erfolgreich geprüft und bei 320/681/901/2124 px aufgenommen. Schlosssymbol und Deaktiviert bleiben erkennbar; deaktivierte Klicks senden weiterhin keinen Öffnungsauftrag, laufendes Radio bleibt erhalten.

![Gleiche Symbol- und Titelhöhe der deaktivierten Wunschbox](oberflaeche/wunschbox-deaktiviert.png)

Vollständiger Paketbau: 349 Nodefälle und je 987 Rhino-Prüfungen bestanden; Architektur, API-Signaturbestand, Quellen-/Laufzeitgleichheit und fünf Manifeste sind geprüft. Die vollständige Browserrunde am endgültigen Desktop-UPLOAD besteht im ersten Abschlusslauf mit 284/284 Fällen ohne Fehler (404,6 Sekunden). Unverändert 132 Laufzeitdateien und 125 Textdateien, maximal 9492 Zeichen einschließlich Manifesten. Fachlich geändert ist ausschließlich radio-actions.css; sämtliche Browsercontroller, Backendfachmodule, anderen Styles und Originalmedien sind bytegleich zu Build 233, Kennungen/erzeugter Einstieg ausgenommen. Native Installation von Build 234 steht aus; keine Übertragung oder echte Channelaktion.

## Moderationsbutton nach Radio-Team-Eintragung 233

Stand 06.11.2026. Ausschließlich echte Einträge in radioModeratorUserIds geben den Moderationsbutton frei. Inhaber, Manager, Entwickler und Channelmoderatoren erhalten keine automatische Sichtbarkeit. Auch Otterchen kann sich ausdrücklich über das Radio-Team eintragen und entfernen; ohne Eintrag bleibt der Button verborgen. Bestehendes Inhaber-Fachrecht, Verwaltung per /MW Verwaltung, Gestaltung, Audio und Wünsche bleiben erhalten. Kein bestehender Nutzer wird automatisch eingetragen.

Zwei neue Nodefälle scheiterten vor Änderung am fehlenden Sichtbarkeitsfeld und bestehen danach. Sie prüfen alle Rollen, persistente Ernennung, User-ID trotz Nickänderung, Neustart und Entfernen sowie eigene Eintragung ohne Verlust der Verwaltung. Browser prüfen strikt boolesche Freigabe aus demselben Snapshot; fehlende oder behauptete Freigaben und canModerate allein zeigen nichts. Zwei neue native K3-/STAPP-Modellfälle tragen DJ-Test und Otterchen über das echte Verwaltungsformular ein und entfernen beide über die bestätigte Listenaktion. Die Buttons werden in den bereits offenen Radioleisten unmittelbar sichtbar/verborgen; ein unregistrierter Appmanager bleibt unverändert ausgeschlossen. Diese vier gezielten Browserfälle sind bestanden.

Der vollständige lokale Paketbau besteht mit 349 Nodefällen und je 987 Prüfungen in Rhino 1.7.7.2 und 1.9.1. Die Rhino-Probe verwendet nun die für Selbsternennung benötigten dokumentierten UserAccess-Methoden; die Prüfung auf fehlende Wunschpersistenz misst unverändert ausschließlich Schreibvorgänge nach den ausdrücklich ausgeführten Teamänderungen. Keine Produktionskorrektur am Wunschtransport. Architektur, API-Signaturen, Laufzeitkopien, fünf Manifeste und 132 Dateien/125 Texte sind geprüft. Die vollständige Browserrunde am gebündelten Desktop-UPLOAD führte 284 Fälle aus: 283 sofort bestanden; ein bisheriger Rechteentzugstest wurde an die jetzt ausdrücklich eingetragene Testinhaberrolle angepasst und besteht im gezielten Nachlauf. Insgesamt sind alle 284 unterschiedlichen Fälle erfolgreich geprüft. Der Test entzieht vor dem Plattformrollenwechsel nun auch den tatsächlichen Radio-Team-Eintrag und stellt ihn bei erneuter Freigabe ausdrücklich wieder her; reine Plattformrollen sind nicht mit Radio-Team-Mitgliedschaft gleichgesetzt. Keine Anwendungskorrektur für diesen Nachlauf.

Bestehende Oberflächetests, die einen sichtbaren Besitzerbutton benötigen, tragen ihren Testinhaber jetzt ausdrücklich über die echte Ernennungsaktion ein. Neue Negativfälle verwenden bewusst einen nicht eingetragenen Inhaber. Keine simulierte Sonderfreigabe im Produktionscode. Die bestehenden breiten/schmalen Radiobilder wurden am endgültigen Bündel mit ausdrücklich eingetragenem Testinhaber erneuert. Native Knuddels-Ausführung von Build 233 bleibt ausstehend; keine FTP-/Update-/Neustart-/echte Nachrichtenaktion.

## Runder Moderationsbutton 232

Stand 06.11.2026. Moderation verwendet dieselben vorhandenen wish-button-/public-action-icon-Bausteine wie Sendeplan und Wunschbox. Goldkontur, dunkle Vinylrillen, Mikrofon, Beschriftung, Hover/Druck/Fokus und gesperrter Zustand stammen dadurch aus der gemeinsamen Darstellung. Im breiten Radio liegt der Text unter dem Symbol; natürliche schmale Ansichten ordnen Symbol und Text nebeneinander. Der begrenzte K3-/STAPP-Rahmen behält die direkte 44-px-Symboltaste.

Die vorhandene Breiten-/Rollen-/Pixeldichtematrix wurde um den Vergleich der runden Symbolflächen erweitert. Sie scheiterte vor der Änderung wegen der fehlenden Mikrofon-Symbolfläche und besteht danach. Geprüft sind 32 repräsentative Breiten von 320 bis 3840 px samt Grenzbreiten, natürliche/begrenzte Höhen, Hörer/Moderation/Inhaber und vier Pixeldichten. Auch die bestehende Rollen- und breite Tastaturprüfung bestehen (3/3 gezielte Fälle). Die lokalen aktuellen breiten/schmalen Radiobilder wurden auf dem tatsächlichen gebündelten UPLOAD erneuert und angesehen.

Vollständiger Paketbau: 347 Nodefälle sowie je 977 Prüfungen in Rhino 1.7.7.2 und 1.9.1 bestanden. Architektur, API-Signaturbestand, Quellen-/Laufzeitgleichheit, 132 Dateien, 125 Texte, fünf Manifeste und Desktop-UPLOAD bestanden. Die vollständige Browser-/Emulatorrunde am Bündel besteht im ersten Abschlusslauf: 281/281 Fälle ohne Fehler (393,8 Sekunden). Zwei zusätzliche Chatfeld-/Audio-/Entwurfsfälle auf dem endgültigen Bündel sind bestanden.

Nur statisches Radiomarkup, radio-actions.css und radio-responsive.css sind fachlich verändert. Sämtliche übrigen Browsercontroller, Backendfachmodule, Medien, API-Referenzen und native Größen-/Rechte-/Wunsch-/Audioverträge bleiben bytegleich zu Build 231; Versionskonfiguration und erzeugter Einstieg sind fortgeschrieben. Keine neue Laufzeitdatei, Plattformfunktion oder Veröffentlichung. Native Installation von Build 232 steht aus.

## Verwaltung per Chat 231

Stand 06.11.2026. Ausgang ist der vorhandene lokale Desktopstand 230 einschließlich privater Android-Betreibereinrichtung. Verwaltung und ihr Click-Binding sind aus der Appleiste entfernt. /MW Verwaltung führt ausschließlich für den authentifizierten anwesenden Otterchen mit tatsächlichem Channelinhaberrecht in das vorhandene 560 × 630-px-Overlay. Radio-Team- und Bot-Daten/-Aktionen verwenden dieselbe Berechtigung. Alte UI-Aufrufe umgehen diese Prüfung nicht; der endgültige Fensterwechsel prüft das Recht erneut.

Vier neue Nodefälle waren vor der Implementierung rot und bestehen danach. Sie prüfen das Öffnen mit/ohne Radioleiste, Syntax, andere Inhaber, Nick ohne Rolle, Manager/Moderatoren, Abwesenheit, Shutdown, wiederholte Öffnung, Entwurfsübernahme und Rechtewechsel während des verzögerten Fenstertauschs. Die neue gemeinsame Funktion liegt unter ui/administration; native Fenster, Speicherung und Entwurfstransport bleiben bei ihren bestehenden Modulen.

| Prüfung | Ergebnis |
| --- | --- |
| Vollständiger lokaler Paketbau / Node-Suite | 347 bestanden |
| Rhino 1.7.7.2 und 1.9.1 | Je 977 Prüfungen bestanden |
| Vollständige Browser-/Emulatorrunde am gebündelten Desktop-UPLOAD | 279 Fälle ausgeführt: 277 bestanden; zwei veraltete Testerwartungen korrigiert und danach beide erfolgreich nachgeprüft |
| Neue tatsächliche Chatfeldeingabe /MW Verwaltung in K3-/STAPP-Modellen | Beide Fälle bestanden: kein Verwaltungsknopf, Radioelement/Ton erhalten, Team-Entwurf nach Schließen/Wiederöffnung erhalten, Fokus auf Sendeplan |
| Rollenmatrix der Appleiste | Gezielter Nachlauf bestanden; Hörer, Channelmoderator, Appmanager, Radiomoderator und Inhaber |
| Architektur, API, Laufzeitkopien, fünf Manifeste und tatsächlicher UPLOAD | 132 Laufzeitdateien, 125 Texte, 48 Backendmodule, höchstens 9492 Zeichen einschließlich Manifesten |
| Unbetroffene Audio-/Wunschcontroller, Originalmedien, sämtliche Styles und API-Stubs | 27 geschützte Quelldateien SHA-256-gleich zum vorhandenen lokalen Build 230 |
| Aktuelle visuelle Nachweise | Bestehende vinyl-glow-desktop.png und vinyl-glow-mobil.png mit lokalen Beispieldaten erneuert und angesehen |
| Native Installation / Chatbefehl auf dem echten Knuddels-Server | Für Build 231 noch nicht durchgeführt; keine Übertragung, /update-, Neustart- oder echte Nachrichtenaktion |

Die erste Browserrunde erwartete im breiten Rollen-/Pixeldichteraster noch fünf statt nun vier sichtbare Inhaberaktionen. Der Übergabetest verwendete außerdem einen erfundenen Inhabernick; er verwendet jetzt Otterchen und behält den 50-Zeichen-Nick der nächsten Moderation. Beide Anpassungen betreffen ausschließlich Tests. Der abschließende Nachlauf mit beiden zuvor roten Fällen und den zwei neuen Chatfeldfällen besteht vollständig (4/4); die überarbeitete separate Rollenmatrix besteht ebenfalls. Insgesamt sind 281 unterschiedliche Browser-/Emulatorfälle erfolgreich geprüft, mit den genannten Wiederholungsläufen. Breite und schmale erneuerte Bilder wurden visuell kontrolliert.

Die folgenden Abschnitte erhalten die früheren getrennten Befunde. Website und private Android-Einrichtung bleiben unverändert; diese Phase aktiviert keine externe Verbindung.

## Private Betreibereinrichtung 230

Ausgang ist Brückenstand Revision 9. Der private Einrichtungsweg ist nun als eigener dokumentierter Knuddels-UI-/Sitzungsablauf implementiert. `/mischwerk-relay einrichten` wird ausschließlich für den tatsächlichen anwesenden Channelinhaber geöffnet. Manager, Entwickler, Moderatoren, fremde und normale Radio-Sitzungen sind ausgeschlossen. Alte Schlüsselwerte werden niemals zurückgesendet; die feste Zieladresse und Vorhandenseinsflags sind die einzigen Konfigurationsinformationen im Client.

Beim Speichern werden Schema, Schlüsseltrennung, Revision und Anfragewiederholung geprüft; die Anwendung schreibt nur serverseitig, beendet einen Relaylauf und setzt enabled/runtimeVerified auf false. Private Fenster werden bei Ablauf/Statusaktion, Rechteverlust, Channelverlassen und Shutdown unbrauchbar. Die Berechtigungsbereinigung beim Verlassen erfolgt vor dem allgemeinen Zustandsladen und funktioniert auch bei dessen Fehler. Der native HTTP-Port bleibt über neu erzeugte Adapter hinweg belegt, bis ein alter nicht abbrechbarer Auftrag tatsächlich beantwortet ist.

| Prüfung | Ergebnis |
| --- | --- |
| Abschließender lokaler Paketbau: vollständige Node-Suite | 343 bestanden, darunter 46 Android-Vertrags-/Adapter- und 14 Einrichtungsfälle |
| Rhino 1.7.7.2 und 1.9.1 | Je 965 Prüfungen bestanden |
| Vollständige Browser-/Emulatorrunde auf Build 230 | 279 Fälle ausgeführt; Erstlauf 278 bestanden, ein STAPP-Zeitlimit im bestehenden Overlaylogo-Test |
| Gezielter Nachlauf des Zeitlimitfalls | Beide Overlaylogo-Varianten K3/STAPP bestanden; bestehender Fall ohne Quelländerung erfolgreich |
| Neuer privater Dialog auf dem endgültigen Desktop-UPLOAD | Alle sieben Fälle bestanden, nach abschließender Backend-Fehlerpfadabsicherung wiederholt |
| Paket, API, Architektur, Quellen-/Laufzeitgleichheit und Manifeste | 131 Laufzeitdateien, 124 Texte, 47 Backendmodule, fünf Manifeste; Maximum einschließlich Manifesten 9477 Zeichen |
| Bisherige Oberfläche, Medien und Wunschtransport | 82 geschützte Dateien bytegleich zu HEAD; zwei getrennte neue Betreiberdateien |
| Native Ausführung/Einrichtung auf Knuddels | Für Build 230 noch nicht durchgeführt; letzter echter Diagnosebericht bleibt Build 229 |
| Echte Secrets, Firebase-/Knuddels-HTTP und Ende-zu-Ende-Betrieb | Nicht eingerichtet/ausgeführt durch diesen Codex |

Vor Einführung scheiterten die Einrichtungstests an der fehlenden privaten Ansicht. Nach der Implementierung prüfen sie Rollen-/Sitzungsgrenzen, Speicherfehler und verspätete/revidierte Aufträge. Drei zusätzliche Fehlerpfade wurden jeweils vor der Korrektur rot nachgewiesen: Berechtigungsbereinigung bei allgemeinem Zustandsfehler, fehlender Statusfehlerkanal und Portparallelität über Adapterwechsel. Browserfälle prüfen Sperre ohne bestätigten Kanal, leere Passwortfelder vor Versand/nach Antwort/bei Seitenende, fehlende Browser-Storage-Schreibvorgänge, fremde Antworten sowie schmale Breite und Tastaturbedienung. Statische und dynamische Tests verwenden ausschließlich lokale Testwerte. Es wird keine zusätzliche Plattform-Verschlüsselung, native Secret-Abnahme oder Firebase-Bereitstellung behauptet.

Die zuvor dokumentierten 22 Websitefälle gehören zum unveränderten separaten Websiteprojekt und wurden in dieser Phase nicht erneut ausgeführt. Die folgende Darstellung hält den vorherigen Stand fest.

## Bestätigte API-Rückgaben und Formatkorrektur 229

Aktueller nativer Nachtrag: Betreiberupload/-update von Build 229 bestätigt. Neue private Diagnose aus 0.1.229/Build 229 enthält korrekte ServerInfo-Strings und errors:[]; beide konkrete URL-Freigaben und WebHook-API weiterhin vorhanden. Die Diagnosekorrektur ist damit auf dem echten Server geprüft. Gemeinsame Rückmeldung bleibt auf Nutzerwunsch in Revision 7.

Der Nutzerbericht aus Build 228 zeigt primitive, vollständig gelesene Strings: getVersion liefert SNAPSHOT-, getServerId eine ID mit @. Die eigenen Formatfilter verwarfen diese vorhandenen Werte. Damit ist die Ursache bestätigt; der vorherige Verdacht auf Java-String-Kapselung erklärt den tatsächlichen Fehler nicht. URL-Freigaben und WebHook-API sind weiterhin bestätigt, Registrierung und HTTP-Übertragung weiterhin ungeprüft.

Build 229 erhält gültige Informationsstrings und vergleicht nur datierte Releaseversionen. SNAPSHOT- ergibt einen unbekannten Mindestversionsvergleich, keine fehlgeschlagene API-Abfrage. Die Diagnose bleibt rein lesend.

- Vollständige Node-Suite: 328 Fälle bestanden, darunter 45 Androidfälle. Regression für Snapshotlabel und Server-ID mit @; ungültige Typen, leere/überlange und Steuerzeichen enthaltende Werte bleiben abgewiesen.
- Rhino 1.7.7.2 und 1.9.1: je 951 Prüfungen bestanden, einschließlich Snapshotlabel ohne erfundenen Versionsvergleich.
- Lokaler Paketbau und Uploadprüfung: 128 Laufzeitdateien, 121 Texte, fünf Manifeste, Maximum einschließlich Manifesten 9477 Zeichen. Oberfläche und bisheriger Wunschtransport unverändert.
- Build 229 wurde durch den Betreiber hochgeladen/aktualisiert und mit fehlerfreier nativer Diagnose ausgeführt; keine FTP-/Update-/Neustartaktion durch diesen Codex. Nach Übernahme der zurückgekommenen Revision 6 wurde die eigene Rückmeldung in Revision 7 gespeichert und vollständig nachgelesen. Die noch ungelesene Revision 7 wird auf Nutzerhinweis um den erfolgreichen Build-229-Nachweis ergänzt; Datei-ID und Firebase-Abschnitt bleiben erhalten.

Für den tatsächlichen Serverbefund genügen die sichtbaren Build-228-Rückgaben; ein erneuter sofortiger Installationslauf ist dafür nicht erforderlich. Nachfolgend sind die vorherigen Untersuchungsstände als Verlauf dokumentiert.

## Unveränderter nativer Fehler und Rückgabebeobachtung 228

Die vom Nutzer übermittelte Diagnose aus dem echten Build 227 meldet weiterhin server-version-invalid und server-id-invalid; konkrete URL-Freigaben und WebHook-API bleiben bestätigt. Die Ursache der tatsächlichen Serverrückgaben ist weiterhin unbekannt. Der lokale Java-String-Test aus Build 227 hat diesen echten Fehler nicht behoben.

Build 228 macht die tatsächliche öffentliche Rückgabe von getVersion/getServerId samt Typ und höchstens 160 Zeichen Textdarstellung im privaten Bericht sichtbar, auch wenn die Formatprüfung sie nicht akzeptiert. Beide Getter werden unabhängig geprüft; keine Secret-/Konfigurations-/HTTP- oder Wunschaktion.

- Vollständige Node-Suite: 326 Fälle bestanden, darunter 43 Androidfälle. Drei neue Gegenfälle waren vor Implementierung rot: verworfene Rohdaten, verdeckter zweiter Getter und begrenzte unbekannte Objektwerte.
- Rhino 1.7.7.2 und 1.9.1: je 947 Prüfungen bestanden; zusätzliche Rückgabetyp-/Textbeobachtung und isolierte Getterfehler.
- Lokaler Paketbau mit Backend-/API-/Architektur-/Längenprüfung erfolgreich. 128 Laufzeitdateien, 121 Texte, fünf Manifeste; keine Änderung der Oberfläche oder des bisherigen Wunschtransports.
- Echte Ausführung von Build 228 und deren Werte stehen aus. Build 227 wurde durch den Nutzer ausgeführt; kein FTP-Upload oder Knuddels-Update durch diesen Codex.

Revision 5 bleibt auf ausdrücklichen Nutzerwunsch bestehen. Bestätigte URL-Freigaben und WebHook-API stehen dem anderen Codex bereits zur Übernahme bereit; die offene Versionsauswertung ist dafür kein Wartegrund.

## Native Rückmeldung und Diagnosekorrektur 227

Der vom Nutzer übermittelte private Bericht aus Build 226 bestätigt am 05.11.2026 um 19:45:38.808 UTC die konkrete canAccessURL-Freigabe beider Hosting-Zieladressen und die Verfügbarkeit der WebHook-API. Kein HTTP-POST oder registrierter Hook wurde damit getestet. Die Domainliste meldet drei Einträge ohne bisherigen exakten Treffer. Reale Serverversion und Server-ID bleiben wegen der Diagnosefehler unbekannt.

Die primitive Stringprüfung ließ sich in beiden echten Rhino-Engines mit java.lang.String als Fehler reproduzieren. Build 227 normalisiert unterstützte Stringobjekte und berücksichtigt den HTTPS-Standardport im exakten Domainvergleich. Die tatsächlichen Rohdatentypen und Domainwerte des echten Servers sind weiterhin nicht bekannt.

- Vollständige Node-Suite: 323 Fälle bestanden, darunter 40 Androidfälle. Zwei neue Gegenfälle vor der Korrektur rot; danach alle grün. Zahlen, beliebige Objekte, fremde Hosts und andere Ports werden weiterhin abgewiesen.
- Rhino 1.7.7.2 und 1.9.1: je 941 Prüfungen bestanden, einschließlich echter Java-Stringobjekte.
- Paket-, Backend-, API-, Architektur- und Uploadprüfung bestanden: 128 Laufzeitdateien, 121 Texte, fünf Manifeste; Maximum einschließlich Manifesten 9477 Zeichen.
- 82 Oberflächen-/Medien-/bisherige Wunschtransportdateien bytegleich zu HEAD. Keine erneute Browser-/Websiteprüfung; die unveränderten Dateien wurden zuletzt auf Build 225 mit 272 Browser-/Emulator- und 22 Websitefällen geprüft.
- Build 227 ausschließlich lokal vorbereitet. Keine Installation durch diesen Codex; der Nutzer übernimmt Installationen selbst. Vollständiger nativer Transport, geschützte Provisionierung und Ende-zu-Ende-Lauf bleiben offen.

Nachfolgend bleiben die vorherigen Prüfstände als datierter Verlauf erhalten.

## Lesende Diagnose 226

Die Veröffentlichung der knuddelsAccess.txt aus Brückenstand Revision 4 ist zusätzlich vom Entwickler-PC bestätigt: HTTP 200 und erwarteter Inhalt. Kein Aufruf lief aus einem Knuddels-AppServer. `/mischwerk-relay pruefen` ist ausschließlich für den anwesenden tatsächlichen Channelinhaber vorbereitet. Der private Bericht liest Version und konkrete Domainrechte; er schreibt nichts, sendet keine HTTP-Anfrage und aktiviert nichts.

- Vollständige Node-Suite: 320 Fälle, darunter 37 Androidfälle. Geprüft werden auch stille Ablehnung anderer Rollen, fehlende APIs, Fehler ohne Datenpreisgabe, anders typisierte Freigaben und ungültige Aktionen.
- Rhino 1.7.7.2 und 1.9.1: je 933 Prüfungen mit lokalen Plattform-Fakes.
- Architektur, API-Inventar und Backendgleichheit: 46 Module; 128 Laufzeitdateien und 121 Texte im lokalen Paket, jeweils strikt unter 9500 Zeichen.
- Die 82 Oberflächen-/Medien-/bisherigen Wunschtransportdateien bleiben bytegleich zu HEAD. Keine erneute Browser- oder Websiteprüfung für diese unveränderten Dateien; nachfolgend dokumentierte 272 Browser-/Emulator- und 22 Websitefälle stammen aus Build 225.
- Reale Serverversion, Domainfreigabe, nativer HTTP-Transport, Secret-Provisionierung und Ende-zu-Ende-Abnahme sind weiterhin offen. Nur der lokale Desktop-UPLOAD wurde vorbereitet; kein FTP-Upload oder Knuddels-Update/Neustart.

Der folgende Abschluss dokumentiert den vorherigen Build 225.

## Aktueller Abschluss: lokale Android-Vorbereitung

Stand 05.11.2026, Arbeitsquelle C:/Users/Yves/Desktop/MischWerk/PROJEKT. Der Auftrag betrifft ausschließlich die technische Knuddels-Seite. Die JSON-Anforderung wurde mit dem tatsächlichen Code abgeglichen; vorhandene Websiteadapter liegen inzwischen unter src/backend/website. Oberfläche, sichtbare UI-Texte, Browsercontroller, Medien und API-Originalreferenzen wurden nicht bearbeitet. Der Herkunftswert Android erscheint als Datenwert im vorhandenen Absenderfeld der Moderation.

**Ergebnis: nativer Versandadapter lokal ergänzt, Produktivanschluss weiterhin offen.** Gemeinsame Dropbox-Revision 1 meldet Unterstützung für data:{payload:JSON.stringify(contract)} über Firebase Hosting. android/connection.js setzt diesen Vertrag mit postURL und header (Singular) um. Start nur nach privater Aktivierung, explizitem runtimeVerified=true und positiver canAccessURL-Freigabe. Ohne diese Voraussetzungen bleibt Android ausgeschaltet. Alle Versandnachweise verwenden weiterhin isolierte Plattform-Fakes; reale AppServer-/Hosting-Übertragung und geschützter Knuddels-Provisionierungsweg sind nicht bestätigt. Kein Firebase-/Android-Code, keine Console, Abrechnung oder echte AppServer-Konfiguration wurde geändert. Keine echte Hook-URL erzeugt oder geteilt, keine Secrets gesetzt, keine Live-Anforderungen, Channelnachrichten, Wünsche, FTP-Uploads oder Knuddels-Updates/Neustarts ausgeführt.

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| Vollständige Node-Suite im abschließenden lokalen Paketbau | 315 Fälle bestanden, darin 32 Androidfälle (sechs zusätzliche native Adapterfälle) |
| Vollständige Browser-/Emulatorsuite | 272 Fälle bestanden; vollständige Wiederholung auf Build 225, ohne produktiv aktivierte Android-Anbindung |
| Separates Websiteprojekt | 22 Fälle bestanden, Websitecode unverändert |
| Rhino 1.7.7.2 und 1.9.1 | Je 927 Prüfungen bestanden, einschließlich nativer postURL-Wrapper-/Header-/Antwortprüfung mit Fakes |
| Backend-/Architektur-/API-/Inventarprüfung | 45 Backendmodule, azyklische Schnittstellen, 49 unveränderte Frontendkomponenten |
| Lokales Paket und fünf Manifeste | 127 Laufzeitdateien, 120 Laufzeittexte; strikt unter 9500 Zeichen; nur fester Desktop-UPLOAD aktualisiert |
| Echte Firebase-Emulator-/Rules-/Auth-/App-Check-/Eigentümertests | Nicht durchgeführt: Gegenprojekt/Function-Code hier nicht vorhanden |
| Echte WebHook-, AppServer-, Domain- und Ende-zu-Ende-Abnahme | Nicht durchgeführt; Produktionsvoraussetzungen weiterhin offen |

Die Browserprüfung untersucht die bestehenden nativen Abläufe ohne aktivierte Android-Brücke. Der native postURL-Adapter wird in Node und beiden Rhino-Engines mit isolierten Plattformobjekten geprüft. Neue Android-Ende-zu-Ende-Browser-/Geräteprüfungen oder echte Domainfreigaben werden damit nicht behauptet.

Die erste Android-Gegenprüfung vor Implementierung ergab erwartungsgemäß 15 fehlgeschlagene Fälle und einen bestandenen Abschaltungsfall. Nach Implementierung bestehen sämtliche 32 Androidfälle. Die sechs zusätzlichen nativen Adapterfälle enthalten vier vor Implementierung rot nachgewiesene Gegenfälle. Geprüft: drei native Wünsche plus Android auf Platz 4, echte Positionsänderung, getrennte ID-Herkunft, Idempotenz vor/nach Entfernen, manipulierte Inhalte, Bearbeitungsstufen queued/received/preparing/playing/done/discarded, geschlossen/unbekannt, Auth-/Header-/Schema-/Größenfehler, Links, Raten, Datenminimierung, Speicherfehler vor Annahme und beim Entfernen, fehlende Commitbestätigung, Antwortverlust/Verspätung, überholte Statusrevisionen, Uhr-Rücksprung, Neustart, sieben Tage Ablauf, 100er-Pakete und 256er-Markergrenze. Keine Firebase-UID wird von Knuddels behauptet oder simuliert.

Endmarker werden vor der Entfernung erfasst; ihr tatsächlicher Empfang bei Firebase vor dem Entfernen ist bei asynchronem Versand nicht garantiert. Eine Reservierung ohne bestätigten Queue-Commit erhält keinen Erfolg und wird nicht übertragen. Offene Marker werden nach Neustart verworfen, die Wunschqueue bleibt flüchtig. Die ersten Statusübertragungen werden begrenzt wiederholt, um eine verzögert geschriebene Eigentümerzuordnung auf der Gegenseite aufzufangen. Deren tatsächlicher Lebenszyklus ist erst im Firebase-Projekt prüfbar.

Die gemeinsamen Vertragsdaten wurden zunächst aus /Familienbereich/ANDROID-RELAY-SHARED-STATE.json, Revision 1 gelesen. Vor dem Rückschreiben wurde deren Ablösung erkannt und der aktuelle /Familienbereich/MischWerk-Brückenstand.json, Revision 1 eingelesen. Der dort als veröffentlicht gemeldete Hostingstand bleibt erhalten; Function und knuddelsAccess.txt sind laut Betreiber noch offen. Die benötigte FTP-User-ID stimmt in bereits vorhandener Deploymentkonfiguration, FTP-Username und App-ID überein; sie wird nur in der gemeinsamen secretsfreien Dropbox-Datei zurückgegeben, ohne neue Git-Kopie. Firebase-Abschnitt und dessen Zuständigkeit bleiben unverändert. Native Adapterprüfungen: exakter Hosting-Zielpfad, ausschließlich String-payload, header statt headers, HTTP-/JSON-/Antwortgrößenfehler, fehlerhafter Callback, fremde gemeldete Antwort-URL, erneut entzogene Domainfreigabe und keine parallelen nativen Requests nach logischem Timeout. Redirectverhalten und tatsächlich gesendeter Content-Type werden erst im echten Appserver geprüft.

Die API-Grenzen, privaten Speicherschlüssel, Paket-/Ratenlimits, Kostenquellen und noch nötigen Betreiberaktionen stehen im [API-Nachweis](../api/API-NACHWEIS.md#android-wunschbox--lokale-vorbereitung-225). Die maschinenlesbare Übergabe steht in [ANDROID-RELAY-HANDOFF.json](../api/ANDROID-RELAY-HANDOFF.json). Lokale Paketerzeugung ist keine Freigabe zur Aktivierung.

## Vorheriger Audio-/Knuddels-Nachweis 223

Stand 05.11.2026, ergänzt nach nativem Gegenversuch um 14:07 Uhr Europe/Berlin und vollständiger Abschlussprüfung für GitHub. Auftrag: Anbieter-zu-App-Verbindung vollständig erneuern, alte Audiowege entfernen, dauerhaftes Hören und kurze Störungen prüfen; OR Radio recherchieren, Datenlücken und den vorhandenen /confirm-Mechanismus untersuchen. Folgeaufträge: eigentlichen Knuddels-Trennungsfaktor weiter untersuchen und den aktuellen Projektstand einschließlich Dokumentation und Bildern auf GitHub committen und pushen. Arbeitsquelle ist C:/Users/Yves/Desktop/MischWerk/PROJEKT. Die Knuddels-Bereitstellung bleibt lokal; der Nutzer hat den unten beschriebenen vorübergehenden nativen Inaktivitätstest ausdrücklich freigegeben.

## Ergebnis und belegte Ursachen

Die bisherige Wiedergabesteuerung ist vollständig ersetzt. radio/connection besitzt allein den Hörwunsch, die native Audioquelle, Medienereignisse und einen Verbindungs-/Wiederherstellungstimer. radio/player steuert nur Bedienung und Anzeige. Der bestätigte öffentliche HTTPS-Höreranschluss wird direkt vom nativen Audioelement geöffnet, wie im aktuell öffentlich geprüften OR-Radio-Prinzip. Der Provider liefert ausschließlich Titel-, Modus- und Statusdaten. Keine fremden Streamadressen oder Playerbibliotheken, kein zusätzlicher Audio-/Encoder-/Web-Audio-Weg.

Drei konkrete Probleme der bisherigen Appsteuerung sind belegt:

1. Der alte Stillstandswächter löschte nach 20 Sekunden den Hörwunsch und verlangte erneut Play. Ebenso beendeten unerwartete Pause, Ende und Medienfehler den Versuch endgültig.
2. Eine Sendepause-Antwort des getrennten Statistikdienstes entfernte auch einen noch nutzbaren Audiostream. Statusprüfung und Audio waren unnötig gekoppelt.
3. Jede Nachladephase setzte den Drei-Minuten-Zähler der Knuddels-Aktivitätsbestätigung zurück. Reproduzierter Gegenfall: sechs Minuten mit je zwei Sekunden Engpass pro Minute, eine weiterhin aktive Verbindung, aber null Aktivitätsbestätigungen. Auch ein Engpass während einer ausstehenden Leseantwort konnte erneut drei Minuten Wartezeit verursachen; separater Gegenfall vor Korrektur rot, danach grün.

Die beiden Audioabschaltwege sind entfernt. Der vorhandene Heartbeat bleibt erhalten, behält seine Fälligkeit über kurze Engpässe und verwirft dabei nur unbrauchbare Fortschritts-/Antwortbelege. Erst eine tatsächlich ausgeführte Aktivitätsbestätigung beginnt den nächsten Drei-Minuten-Abstand. Verlorene Antworten werden bei tatsächlicher Wiedergabe und gültigem Channelzustand frühestens nach zehn Sekunden erneut angefordert. Slash-Aufruf weiterhin erst nach passender frischer mw:refresh-Antwort und danach weiterem Audiofortschritt. Stop, Seitenende, fehlende Verbindung, stehende Medienzeit sowie fremde/späte Antworten erzeugen keine Aktivität. Die automatisierten Prüfungen führen keine echten Chat-/Slash-Aktionen aus; der gesondert freigegebene native Gegenversuch ist nachfolgend abgegrenzt.

Der native Gegenversuch belegt inzwischen die Folge ausbleibender Aktivitätsbestätigungen: nach rund zehn Minuten trennt Knuddels die Chat-Sitzung und zerstört die Headerbar samt noch gesundem Audioplayer. Zusammen mit dem reproduzierten Zurücksetzen des alten Heartbeatzählers ist damit ein konkreter appseitiger Weg in diesen Abbruch belegt. Es wurde nicht nachträglich aufgezeichnet, ob genau dieser Weg jeden früher gemeldeten sporadischen Abbruch ausgelöst hat. Build 223 korrigiert den Zähler bereits; die neue Audiowiederverbindung allein wäre für ein zerstörtes Dokument wirkungslos.

## Untersuchung im tatsächlich laufenden Windows-Client

Die erste native Untersuchung erfolgte ausschließlich lesend über die bereits vorhandene Chromium-Diagnoseschnittstelle. Passive Medienbeobachtung und nicht anhaltende Diagnosepunkte erfassten Aufrufe der alten Abschaltfunktionen, Medienfehler, Framewechsel und die bereits vom Player selbst ausgeführten Aktivitätsbestätigungen. Die Logs wurden außerhalb des Browserdokuments im lokalen Temp-Verzeichnis gesichert und gingen beim späteren Schließen der Headerbar nicht verloren. Erst nach ausdrücklicher Nutzerzustimmung folgte der begrenzte Gegenversuch.

Der tatsächlich geladene Quelltext wurde aus dem laufenden Frame gelesen, nicht nur aus dem öffentlichen Download abgeleitet. Er enthält noch den alten Player mit 20-Sekunden-Endabschaltung, Statuskopplung und dem zurückgesetzten Heartbeatzähler. SHA-256 des geladenen player.js: 33fd82e4441dfbdab6c24f9e01d16147ee69887cd80d1fe6aa069e5efce6ed5b; lifecycle.js: 2bf6d14758914e7f09468c3ca92098aca5844b696f84afa79f09771404f6bf6a. Der neue lokale Build 223 ist dort noch nicht geladen.

Das native Clientprotokoll enthält am 05.11.2026 um 13:07:33 und 13:12:33 Uhr Europe/Berlin jeweils „got disconnected“ und „Disconnecting from server“. Nach dem ersten Ereignis folgt ein Verbindungsneuaufbau. Das belegt Knuddels-Verbindungsabbrüche, aber weder einen Streamserverausfall noch eine zeitliche Übereinstimmung mit dem gemeldeten sporadischen Radiostopp. Unmittelbar vor dem zweiten Ereignis ist eine beantwortete Client-Ping-Anfrage protokolliert; der Auslöser der Trennung wird dort nicht genannt. Geräteaufzählungen im Log sind kein Audiofehlernachweis.

Native Beobachtung am 05.11.2026 von 13:31:10 bis 13:41:16 Uhr Europe/Berlin: 600 Messpunkte, Medienzeit von 591,295 auf 1197,526 Sekunden fortgeschritten, durchgehend dieselbe Quelle und dasselbe Dokument, readyState 3, keine Pause, kein Medienfehler, kein waiting/stalled/ended, kein eigener Stopaufruf und kein Framewechsel. Kleinste beobachtete Pufferreserve rund 1,19 Sekunden. Drei bestehende /confirm-Aufrufe um 13:33:24, 13:36:26 und 13:39:27 führten zu keiner beobachteten Audiounterbrechung. Um 13:40:38 wechselte das Dokument ohne Eingriff des Diagnosewerkzeugs auf hidden; auch danach lief Audio weiter. Der sporadische Originalfehler trat in diesem begrenzten Zeitraum nicht auf. Diese Messung widerlegt keinen seltenen Fehler und ist kein Ursachennachweis für frühere Unterbrechungen.

Der geprüfte Backendweg mw:refresh versendet Zustandsdaten an die bestehende Sitzung. Er ruft weder sendAppContent noch die Entfernung der Radioleiste auf. Die Erzeugung einer neuen Radioansicht und das Entfernen bei tatsächlichem Channel-Verlassen bleiben getrennte Lebenszyklusaktionen.

## Kontrollierter nativer Ursachentest

Freigabe des Nutzers: ausschließlich die vorhandenen /confirm-Aufrufe vorübergehend aussetzen, Audio weiterlaufen lassen, nach spätestens elf Minuten wiederherstellen; mögliche Trennung und Musikstopp waren ausdrücklich genannt und genehmigt. Um 13:57:43 wurde nur die Methode im laufenden Dokument für exakt den Befehl /confirm vorübergehend umhüllt. Andere Befehle und normale mw:refresh-Anfragen blieben wirksam. Es wurden weder Streamquelle, Lautstärke, Audioereignisse noch Serverdaten manipuliert. Zeitlich begrenzte Rücknahme sowohl im Dokument als auch im externen Diagnoseprozess. Drei reguläre Bestätigungsversuche wurden unterdrückt.

| Zeitpunkt Europe/Berlin | Direkt beobachtetes Ereignis |
| --- | --- |
| 13:57:36,297 | Letzter regulärer /confirm-Aufruf vor dem Eingriff. |
| 13:57:43,903 | Beginn des auf höchstens elf Minuten begrenzten Tests. |
| 14:07:36,539 | Audio läuft: Medienzeit 2777,285 s, paused=false, readyState=3, kein Medienfehler, navigator.onLine=true, noch 2,222 s Puffer. Ursprüngliches Dokument unverändert. |
| 14:07:37,061 | Java-Client protokolliert got disconnected. Abstand zum letzten /confirm rund 600,764 s. |
| 14:07:37,063 | Client protokolliert Disconnecting from server. |
| 14:07:37,071–073 | Beide unabhängigen Diagnoseverbindungen melden target_closed; ursprünglicher Headerbar-Frame ist zerstört. |
| 14:07:37,216 | Native Chat-Verbindung beginnt ihren Neuaufbau. Die Radioleiste ist weiterhin weg. |

Vor dem Schließen kein waiting, stalled, pause, ended, Medienfehler oder eigener stopPlayback-/playbackFailed-Aufruf. Der Windows-Client zeigt anschließend Neu eintreten und Die Verbindung zum Server wurde unterbrochen. Damit ist in diesem Test ein gesunder Stream durch das Schließen seiner Knuddels-Ansicht beendet worden. Die gewöhnlichen App-Zustandsanfragen verhindern diese Inaktivitätstrennung nicht.

Nach dem Test Channel über die vorhandene Schaltfläche wieder betreten, Play betätigt und die zuvor eingestellten 38 Prozent wiederhergestellt. Das neue Dokument hat timeOrigin 1793884182274.6 statt 1793881276910.6. Prüfung um 14:12:04: genau ein Radioframe, laufende Medienzeit, kein Fehler, volume=0.38, muted=false, unveränderte ursprüngliche Slash-Methode und keine temporären Test-/Beobachterobjekte. Alle Diagnoseprozesse beendet. Der Eingriff endete mit dem zerstörten alten Dokument, vor Ablauf der elf Minuten; er wurde nicht in die neue Ansicht oder in Dateien übernommen.

Zusätzlicher statischer Nachweis am installierten Windows-Client V9.0cac / b261026: Die Meldung stammt aus px$19.run im Chat-Lesethread. Dieser erhält über den Empfangs-/Decodierpfad kein weiteres Paket und wirft die entsprechende RuntimeException; der nachfolgende Fehlerpfad beendet die Chat-Sitzung. Der unveränderte Bytecode wurde lokal gelesen, die Clientinstallation nicht bearbeitet. main.jar SHA-256: 09948ac4003112f2c28a5e858e266fc79499a52f39b4823b063809a41cc0e3de. Das ist ein anderer Befund als der separat protokollierte SocketTimeoutException um 04:15 Uhr. Aus dem bloßen Text got disconnected allein wurde keine Netz-/Anbieterursache abgeleitet.

Historische Gegenprobe: Am 05.11. um 01:06:15 folgt auf die Chat-Trennung nach 5,296 s ein neu erzeugter MischWerk-Headerbar-Browser; um 01:22:06 folgt eine neue Headerbar beim späteren Wiedereintritt. Der Abbruch 13:07:33 liegt 599,984 s nach Erzeugen der Headerbar um 12:57:33. Diese Zeiten stützen den nativ reproduzierten Sitzungsmechanismus, ersetzen aber keine damals fehlende Audiomessung.

Die Korrektur des dafür anfälligen Appwegs befindet sich bereits in Build 223 in transport/lifecycle.js: kurze Engpässe behalten die Fälligkeit, verlorene Antworten beginnen keinen neuen Drei-Minuten-Zyklus. Die vier gezielten Gegenprüfungen zu wiederkehrenden Datenlücken, unterbrochener Heartbeatantwort, Stop/neuem Hörversuch und verspäteter Bestätigung wurden nach diesem nativen Befund erneut erfolgreich ausgeführt. Keine zusätzliche Wiederverbindungs-, Autostart- oder Persistenzfunktion eingeführt. Die vollständige native Abnahme des neuen Builds setzt dessen tatsächliche Übernahme voraus; der untersuchte echte Client lädt weiterhin den alten Code.

## Verhalten des neuen Verbindungswegs

Ein bewusster Play-Klick eröffnet den Hörwunsch. Die bereits bestätigte eigene öffentliche Adresse bleibt maßgeblich; dynamische Weiterleitungsziele werden nicht gespeichert. Status-/Titelantworten, Rollenänderungen, Historienrechte und Channelaktualisierungen verändern die Audioquelle nicht. Nur eine tatsächlich andere oder entfernte Audioadresse beendet den alten Hörwunsch.

waiting erhält Quelle und Browserpuffer. stalled allein bei weiterlaufender Wiedergabe verändert sie nicht. Tatsächlicher Medienfortschritt wird über native Zeit/Zustände beurteilt; ein einzelnes playing-Ereignis kann keinen Dauerstillstand verbergen. Kurze Engpässe erholen sich ohne eigene neue Play-/Load-Aufrufe. Unerwartete Pause versucht dieselbe Quelle fortzusetzen. Echte Fehler/Ende oder Stillstand führen zu einer neuen Verbindung, ohne den Hörwunsch zu löschen. Nach 15 Sekunden ohne Fortschritt beziehungsweise 30 Sekunden ohne ersten Fortschritt wird ein festhängender Versuch ersetzt. Wiederholungsabstände 1/2/4/8/15/30 Sekunden, Rücknahme erst nach stabiler Wiedergabe. Genau ein Steuerungstimer, keine parallelen Versuche; monotone Frist einschließlich Rücksprungschutz ohne Performance-Uhr.

Stop, Werbestart, tatsächlicher Quellenwechsel und Seitenende schließen die Quelle und alle Wiederholungen. Generationszuordnung verwirft späte Play-Ablehnungen. Automatische Erholung erhält Lautstärke und Stumm; bewusster neuer Hörversuch verwendet weiterhin höchstens 10 Prozent Startlautstärke. Verweigert der Browser ausdrücklich die Wiedergabefreigabe, wird der nötige Play-Klick verständlich angezeigt. Goldlicht/RGB-Glow folgen tatsächlicher Wiedergabe; Stop/Nachladen bleiben dunkel.

## Tatsächliche Anbieter- und Datenlückenmessung

Die HTTP-Lücken und Verbindungsabbrüche in den Fehlertests wurden bewusst lokal erzeugt. Sie sind keine beobachteten Ausfälle von STREAMPANEL.

Eigene parallele Messung zweier öffentlicher Anschlüsse für jeweils 120 Sekunden, Abschluss 05.11.2026 um 12:01:20 UTC / 13:01:20 Europe/Berlin:

| Messung | Öffentlicher Höreranschluss | Direkter Anschluss des Anbieterplayers |
| --- | --- | --- |
| Weg | sp.radio.fm/stream → einmal HTTP 302 → spcast.eu/stream | spcast.eu/stream direkt |
| Ziel | derselbe eigene Streamserver | derselbe eigene Streamserver |
| Antwort | HTTP 200, audio/mpeg | HTTP 200, audio/mpeg |
| Format | 320 kbit/s, 44100 Hz | 320 kbit/s, 44100 Hz |
| Empfangene Bytes | 4.874.469 | 4.874.469 |
| Größter beobachteter Abstand zwischen Datenblöcken | 372 ms | 381 ms |
| Lücken über zwei Sekunden / unerwartetes Ende | 0 / 0 | 0 / 0 |

Die Weiterleitung erfolgt beim Öffnen, nicht zwischen Musiktiteln. Audioantworten verbieten Caching (no-cache/no-store). In diesen Messungen ist weder eine Datenlücke beim Anbieter noch ein Vorteil durch Umgehen der Weiterleitung belegt. Die öffentliche Statusseite zeigte keine veröffentlichte Incident-/Wartungsmeldung; das ist kein individueller Verfügbarkeitsnachweis.

Mehrere echte fünfminütige Headless-Edge-Läufe gegen den eigenen Radiostream verliefen mit einer durchgehenden nativen Verbindung und fortschreitender Medienzeit, ohne spätere waiting-/pause-/ended-/error-Ereignisse. Die beobachtete native Reserve lag meist bei etwa ein bis zwei Sekunden. Das erklärt, warum mehrsekündige Lieferpausen bei diesem Direktstream hörbar werden könnten; es beweist keine solche Pause in der gemeldeten Windows-Sitzung. Ein größerer künstlicher Liveversatz oder ein anderer fremder Player wurde nicht eingeführt.

Die Quellen und API-Grenzen stehen im [API-Nachweis](../api/API-NACHWEIS.md). Temporäre Messdaten enthalten nur Zeitabstände, Bytezahlen, Medienzustände und öffentliche Anschlussangaben; keine Musikaufzeichnung oder Anbieterzugänge.

## Prüfungen

- Node: 283/283 Prüfungen am endgültigen Stand bestanden.
- Browser: abschließender vollständiger Lauf aller fünf Suiten gegen den tatsächlichen Desktop-UPLOAD am 05.11.2026: **272/272 bestanden**, keine Fehler, rund 422 Sekunden. Im vorherigen Gesamtlauf hatte ein unveränderter Moderations-Geometriefall vorübergehend ein nicht sichtbares Themenfeld gemeldet (271/272); der anschließende Einzellauf und der jetzige vollständige Lauf bestanden ohne funktionale Codeänderung. Alle Audio-/Heartbeatfälle bestanden in beiden Gesamtläufen.
- Website: vollständiger separater Lauf mit **22/22 bestandenen Node-/HTTP-/Browserfällen**, rund 13,9 Sekunden. Gemeinsame Appkomponenten aus Build 223; ausschließlich lokale Testdaten und API-Modelle.
- Rhino: jeweils 906 Prüfungen mit 1.7.7.2 und 1.9.1 bestanden. Projekt-, Architektur-, Syntax-, Textlängen-, Manifest- und vollständige Upload-Integritätsprüfung bestanden.
- Echtes lokales Audio in K3-/STAPP-Modellen: Streamende mit nativer pause-vor-ended-Reihenfolge, harter HTTP-Abriss und Wiederverbindung, Lautstärke/Mute, dauerhafter Stop, echte sechssekündige Lieferlücke mit automatischer nativer Erholung auf derselben Quelle.
- Vier Sekunden echte HTTP-Lücke mit vorhandener Reserve: kein waiting/pause/error nach Wiedergabestart, eine einzige HTTP-Audioverbindung.
- Zeitbeschleunigt: 24 Stunden fortschreitende Wiedergabe mit genau einem Play; wiederholte Ausfälle mit begrenzter Versuchsrate; Ereignisflut, Stillstand ohne Ereignisse, rückwärts gestellte Systemuhr, alte Promise-Ablehnungen, Browserfreigabe, Online-Signal, Kurzstörungen und Heartbeatbestätigungen. Keine 24-stündige Echtzeitmessung behauptet.
- Metadatenentkopplung: Stopp-/Fehlerantworten und Änderungen ausschließlich der Datenanschlüsse erhalten laufendes Audio. Ungültige Höreradressen bleiben gesperrt; manipulierte Datenadressen werden nicht abgerufen.
- Architekturprüfung verweigert alte Steuerungsnamen und Audioquellenbesitz außerhalb radio/connection. Quellen und tatsächlich ausgelieferte Dateien enthalten keinen playbackFailed-/playbackTimedOut-/wantedPlayback-/station-changed-Altpfad.

## Erhalt und Bereitstellung

Hashvergleich innerhalb des Audio-Umbaus auf Build 223: Gestaltung, Originalmedien, API-Referenzstubs, Lautstärkekomponente, Wunschtransport und sämtliche Backendfachmodule blieben dabei unverändert. Außer Versionsdateien wurden für diesen Umbau nur Audioverbindung, Radiobedienung, Trennung der Providerdaten, Zusammensetzung/Ladeplan und der bestehende Client-Heartbeat angepasst. Neu ist dabei genau ein fachliches Laufzeitmodul radio/connection.js. Keine neue Abhängigkeit, Minifizierung oder Doppelimplementierung. Der GitHub-Abgleich umfasst zusätzlich die bereits lokal abgeschlossenen Änderungen seit Build 208.

122 Laufzeitdateien, 115 Texte, 40 Backendmodule, 80 Browserdateien, 49 Komponenten, 18 Stylesheets und fünf Manifeste. Alle ausgelieferten Texte und Manifeste strikt unter 9500 Zeichen; Quellenmaximum 9416, tatsächliches Bündelmaximum 9477. Vollständiger lokaler Ordner C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk. Kein FTP, natives Update oder Neustart. Website und Testwerkzeuge bleiben außerhalb des Uploads.

## GitHub-Dokumentation und aktuelle Bilder

Haupt-README und technische Übersicht auf App 0.1.223 / Website 0.2.0 zusammengeführt. Architektur-, Gestaltungs-, Betriebs-, Sendeplan-, Lautstärke- und Abnahmetexte beschreiben den aktuellen Code; der ausführliche API-Nachweis kennzeichnet ältere Einträge ausdrücklich als historische Recherche. Vorhandene Freigaben, native Befunde und noch offene Abnahmen bleiben nachvollziehbar. Die Dokumentationspflege ändert keine Versionsnummer und keine Laufzeitlogik. radio/player.js wurde lediglich auf die im Repository vorgegebenen LF-Zeilenenden vereinheitlicht; danach wurden Manifeste und UPLOAD neu erstellt und vollständig geprüft.

Aktuelle Aufnahmen stammen aus dem tatsächlich gebündelten Build beziehungsweise dem lokalen Websiteserver. Beispieldaten, Rollen und Senderantworten sind lokale Prüfdaten. Sie belegen weder eine Veröffentlichung noch die native Langzeitabnahme. Ungenutzte ältere Oberflächenbilder wurden entfernt; Originalmedien bleiben erhalten.

| Bereich | Aktuelle Ansichten |
| --- | --- |
| Radioleiste | [Bereit](oberflaeche/webradio-desktop.png), [Wiedergabe breit](oberflaeche/vinyl-glow-desktop.png), [Wiedergabe schmal](oberflaeche/vinyl-glow-mobil.png), [schmal bereit](oberflaeche/vinyl-pause-mobil.png) |
| Tasten und Lautstärke | [Goldene Aktionen](oberflaeche/radio-buttons.png), [schmale Aktionen](oberflaeche/radio-buttons-schmal.png), [Lautstärke](oberflaeche/lautstaerke-gruppe.png), [Stumm](oberflaeche/lautstaerke-stumm.png), [100 Prozent schmal](oberflaeche/lautstaerke-schmal-100.png) |
| Wunschbox | [560 px](oberflaeche/wunschbox-flach-560.png), [320 px](oberflaeche/wunschbox-flach-320.png), [Quittung breit](oberflaeche/wunschbox-nach-versand-560.png), [Quittung schmal](oberflaeche/wunschbox-nach-versand-320.png) |
| Moderation | [780 px](oberflaeche/moderation-780.png), [320 px](oberflaeche/moderation-320.png), [Wünsche breit](oberflaeche/moderation-wuensche-780.png), [Wünsche schmal](oberflaeche/moderation-wuensche-320.png) |
| Verwaltung | [Radio-Team](oberflaeche/verwaltung-menue.png), [Bot-Texte breit](oberflaeche/verwaltung-bottexte-560.png), [Bot-Texte schmal](oberflaeche/verwaltung-bottexte-320.png) |
| Sendeplan | [Woche breit](oberflaeche/sendeplan-sendungen-820.png), [Woche schmal](oberflaeche/sendeplan-320.png), [Editor breit](oberflaeche/sendeplan-editor-820.png), [Editor schmal](oberflaeche/sendeplan-editor-320.png) |
| Vorhang | [Geschlossen breit](oberflaeche/vorhang-1920.png), [geschlossen schmal](oberflaeche/vorhang-320.png), [Öffnungsphase](oberflaeche/vorhang-oeffnung.png) |

Die drei aktuellen Websiteaufnahmen und deren gesonderte Prüfergebnisse stehen im [Websitebericht](../../website/docs/PRUEFUNG.md). Reale Umgebungsdateien, Zugangsdaten, Diagnoseprotokolle und lokale Testartefakte gehören nicht zum Commit.

## Grenzen

Echte Browser-/HTTP-Prüfung und modellierte K3-/STAPP-Plattform sind voneinander zu unterscheiden. Der freigegebene Gegenversuch weist die native Inaktivitätstrennung dieser Windows-Sitzung und die anschließende Zerstörung der Headerbar nach. Er ist keine Langzeitabnahme des noch nicht veröffentlichten Builds 223 und keine Garantie für andere Clients oder künftige Serverregeln. Die öffentliche aktuelle Client-Dokumentation führt /confirm weiterhin nicht ausdrücklich in ihrer Whitelist; die dokumentierte Methode, der OR-Radio-Code und der lokale native Versuch sind getrennte Nachweise. Beliebige Netz-/Anbieterausfälle jenseits der verfügbaren Pufferreserve sowie eine Beendigung des nativen Clients lassen sich nicht durch JavaScript lückenlos überbrücken. Eine dauerhaft nicht erreichbare Quelle wird mit begrenzter Rate weiter versucht, solange der Nutzer hören möchte.
