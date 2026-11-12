# MischWerk – Installation, Betrieb und STREAMPANEL

**App 0.1.391 · Build 391**, Stand 12.11.2026. Playbutton und Vinylkreise passen vollständig in die Leistenhöhe; im kompakten Radio stehen Play und Logo vor Musik und Thema mit dezenter Trennung. Die native Wunschansicht zeigt eine einzige scrollbare Liste mit Nickname, Empfangsuhrzeit und vollständigem Wunschtext in MischWerk-Gold ohne Seitenaufteilung. Der neue Sendeplan öffnet eine rein lesende Tagesansicht aus bestätigten Homepage-Einträgen; freie Zeiten zeigen Mischwerk Show / AutoDJ. Gespeicherte Wochen, Studioabgleich und Homepage-/Android-Anbindung bleiben erhalten. Build 290 ergänzt lokal den kanonischen Lauftext in der Android-Senderprojektion; Veröffentlichung und native Abnahme dieses Builds sind offen. Das lokale Paket umfasst 120 Auslieferungsdateien und fünf Manifeste; der modulare App-Arbeitsbestand behält alle 167 Dateien. GitHub enthält Quellen und Nachweise; der erzeugte UPLOAD ist ausgeschlossen. Build 270 ist nativ mit HTTP 200/accepted:true und unabhängig exakt passendem Firestore-Zeitstempel bestätigt. Build 289 übernimmt Androidwünsche aus der erfolgreichen Statusantwort in dieselbe Queue und ist ohne WebHook/Relay-Schlüssel aktivierbar. Native Installation und regulärer Betrieb von 289 sind bestätigt: Publisher läuft, beide Flags true; aktuell ein Android-Wunsch empfangen/übernommen und vier technische Statusupdates bestätigt, keine Dubletten/Verwerfungen/ungültigen Einträge. Die Gegenseite hat pending → queued → Platz 1 in der normalen Android-App und Entfernung des pending-Auftrags unabhängig belegt. Nur echtes Vorrücken in einer späteren normalen Queue-Situation mit Vorgänger bleibt offen. Den vorhandenen Wunsch normal bearbeiten; kein neuer Build oder erneutes Speichern/Aktivieren nötig. GitHub-Veröffentlichung und Knuddels-Installation sind getrennt. Build 308 setzt lokal den Plan-/Teamvertrag von 03:10 Uhr um; seine native Installation und gemeinsame Homepage-/Android-Abnahme sind noch offen. Vorhandene Schlüssel und Aktivierung nicht erneut speichern. Nach Installation unter `/mw admin` → Verbindung den Status aktualisieren und die reguläre Übertragung prüfen; anschließend reale Homepageänderung samt genau einmaliger nativer Wirkung und Ergebnisquittung verfolgen. `/mw verbindung` einschließlich Unterbefehlen ist seit Build 365 entfernt. `lastFailure` meldet bei Fehlern nur Stufe, HTTP-Code oder null und UTC. [Übergabe und Prüfschritte](../api/HOMEPAGE-SENDEPLAN-RUECKANTWORT.md).

Die Appleiste verwendet die bestätigte mittige Aufteilung „Musik im Fokus“: Titel/Interpret als größte Gruppe über die volle Informationshöhe, auf allen Breiten ein waagerechter Lautstärkeregler unter Thema und Moderationsname und eine nur bei eigenen Wünschen sichtbare dritte Gruppe. Original-Logo, Vinyl-Player und äußere Positionen bleiben erhalten. Ohne Moderationsanmeldung gelten weiterhin Thema 20 px und Status 15 px, kompakt 18 und 14 px. Angemeldete Moderation erhält einen gemeinsamen mittig ausgerichteten Bereich mit Thema 22/26 px in Gewicht 600 und darunter Mikrofon, „Es moderiert“ sowie dem Nick in Gold mit 16 px. Die doppelte „Im Studio“-Markierung entfällt. „Es moderiert“ bleibt neutral und nachgeordnet. Mobil bleiben Thema 18/22 px und kompakte Abstände erhalten. Ohne Wunsch wächst die Musikfläche. Bestehende 160-px-Leiste, Lauftext und kompakte native Scrollwege bleiben erhalten. Die Wunschbox hält den Platz ihrer Hinweiszeile auch bei Freigabe unsichtbar frei; Beschriftung und Symbol bleiben beim Sperren/Freigeben stabil.

Radio bleibt eine Headerbar. Sendeplan, Wunschbox, Moderation und Verwaltung öffnen als getrennte Channel-Overlays; Menüwechsel ersetzen die Radioleiste nicht. [Aufbau](../architektur/ARCHITEKTUR.md) · [Verbindliche Projektregeln](../../AGENTS.md).

Der Sendeplan öffnet für alle verbundenen Hörer ein eigenes, rein lesendes Tagesfenster mit 640 × 320 px Anfangsgröße und dynamischer Inhaltshöhe bis 600 px. Thema, Moderation und Uhrzeit stehen in einer ruhigen anthrazitfarbenen Liste; die laufende geplante Sendung trägt eine goldene Linie. Davor und danach sind unmittelbar zugeordnet. Pfeile wechseln den Tag, die Datumsmitte führt zu Heute. Leere Tage und freie Zeiträume erscheinen als „Mischwerk Show“ mit „AutoDJ“. Einträge ausschließlich auf der Homepage pflegen. [Sendeplan bedienen](SENDEPLAN.md).

## Moderationsanmeldung

Die Ernennung im Radio-Team ermöglicht den Zugang zum nativen Moderationsfenster. Dort startet Anmelden die Sendung direkt ohne persönliche PIN. Erst die bestätigte Anmeldung schaltet Thema und Wunschregie frei und aktiviert die Wunschbox. Übergaben benötigen weiterhin eine passende Anfrage und die ausdrückliche Annahme durch den Empfänger, ebenfalls ohne native PIN. Konto, Anwesenheit, Sitzung und aktuelle Moderationsrechte werden serverseitig geprüft. Die separate Website-Anmeldung und deren persönliche PIN bleiben unverändert.

Ohne aktive Moderation bleiben Thema und Wunschregie gesperrt; die öffentliche Wunschbox ist deaktiviert. Ausschließlich Otterchen als anwesender echter Channelinhaber kann die Wunschbox für sich auch dann manuell freigeben. Andere Konten und öffentliche Website-/Androidwünsche bleiben gesperrt. Seine Ausnahme erweitert die Themen-/Wunschrechte nicht. Abmelden oder Ende der Moderation schließt die Wunschbox wieder.

## Begrüßung im MyChannel

Bei jedem echten menschlichen Channelbeitritt erscheint „Willkommen bei Radio MischWerk, {Nick}. Viel Spaß beim Zuhören.“ Der erste Begrüßungssatz erscheint größer, fett und im Goldton #e6c77b der Appleiste; „Viel Spaß beim Zuhören.“ folgt mit einem Leerzeichen in normaler Channelschrift. Die Nachricht enthält keinen erzwungenen Zeilenumbruch. Nick und Foto öffnen über native Profillinks dasselbe Nutzerprofil. Das vorhandene Profilfoto steht ganz am Ende, nach dem letzten Punkt und einem Leerzeichen. Die kleine Anfrage beträgt weiterhin 24 × 24 Pixel. Für normale User, MCM, Radio-Team und Inhaber gilt derselbe Text. Die bisherigen 30 Sätze und die Zufallsauswahl sind entfernt. Ohne nutzbares Foto bleibt der Text erhalten; bereits Anwesende erhalten beim Appstart keine nachträgliche Meldung.

Als erste eigene Botnachricht beim Beitritt erhält der Eintretende privat das Willkommensbanner und drei Bildflächen. Direkt danach folgt die öffentliche Text-/Foto-Begrüßung; Nicklistenabgleich und Radioöffnung erfolgen anschließend. Lieblings-MyChannel verknüpft /edit setlmc, Channelinfo /info; Mach mit! bleibt inaktiv. Die Grafiken liegen unter app/www/img/welcome/. Die native Startfolge LEFT → °#r° → CENTER soll das Absenderpräfix links halten und das Banner auf der nächsten KCode-Zeile zentrieren. Die Buttonzeile erhält ihr eigenes CENTER. Der frühere LF-Versuch wurde durch den Nutzerscreenshot als wirkungslos zurückgemeldet. Channelthema und iOS-Hinweis stehen nur im Banner; außerhalb der vier Bilder enthält die Nachricht keinen normalen Text. Die große Überschrift einschließlich des i in MischWerk ist vollständig gold. Bei ungültiger Bildauflösung wird die private Nachricht vollständig ausgelassen. Doppelte Beitrittshooks und Appneustarts senden nicht erneut an bereits Anwesende. Die bisherige öffentliche Begrüßung bleibt erhalten.

Text und Fotoausgabe liegen in `src/backend/users/greetings.js`. Die Begrüßung verändert keine Apprechte und meldet niemanden im Studio an. Die tatsächliche native Fotoanzeige und Bildgröße bleiben nach Installation zu prüfen. Eine lokale Bereitstellung führt selbst keine echte Nachricht oder Installation aus.

## Channel-Thema setzen

Im MischWerk-Channel **`/settopic TEXT`** eingeben, beispielsweise `/settopic Willkommen bei Radio MischWerk!`. Nach erfolgreicher Änderung erscheint eine private Bestätigung. Der Befehl verwendet das native Channel-Thema; Sendungsthema und Lauftext sind eigene Einstellungen. KCode wird unverändert übernommen. Der Themeneditor kann eine kleinere Eingabegrenze anzeigen als der API-Weg. Rechte, Zeichenlimit und Fehlerverhalten stehen zentral in [AGENTS.md](../../AGENTS.md#natives-channel-thema).

Nach Installation von Build 286 als Otterchen im MischWerk-Channel eingeben:

```text
/settopic --buttons
```

Der Befehl erzeugt den Radiotext samt drei Buttons unmittelbar im Backend; der lange KCode muss nicht mehr in die Chat-Eingabe eingefügt werden. Die Vorlage fordert eine mittige Ausrichtung an, mit goldenem Sendernamen, neutralhellgrauem Spruch und drei gleich großen neutral anthrazitfarbenen Buttons. Die oliv wirkende Goldtönung der Flächen ist entfernt. Sie übernimmt die bereits fette native Themenschrift ohne zusätzliche Unterstriche. Der vollständige Themeninhalt endet mit `°#r°°>LEFT<°` für nativen Zeilenumbruch, Farbreset und Links-Reset. Die tatsächliche Zentrierung und normale Position/Formatierung der nächsten Chatzeile müssen in der StApp separat bestätigt werden. Der Befehl muss nach dem Update erneut eingegeben werden, um das bereits gespeicherte Thema auf die neue Gestaltung umzustellen. Die drei Buttons stehen unter dem Sendertext, getrennt durch eine leere Zeile und ausdrücklich erneut mittig ausgerichtet. Der mittlere Button heißt jetzt „Homepage“ als vorerst funktionsloser Platzhalter. Er ist deaktiviert und enthält kein Befehlsziel. Die bisherige Readme-Setzung ist aus der Vorlage entfernt. Nach Installation /settopic --buttons erneut ausführen, um auch das bereits gespeicherte Channel-Thema zu aktualisieren.

Eigene Texte mit eigenen Buttons lassen sich weiterhin unmittelbar über `/settopic TEXT` übergeben; `--buttons` ist nur die fertige Vorlage. Ein kurzes Syntaxbeispiel für einen eigenen Button:

```text
/settopic Radio MischWerk °>{button}Channelinfo||call|/info|color|44,44,44~26,26,26~36,36,36<°
```

Beschriftung und call-Ziel können im selbst geschriebenen KCode angepasst und mehrere vollständige Elemente hintereinander gesetzt werden. Für eigene native Zeilenumbrüche die vollständige Anweisung `°#r°` verwenden; der freie Textweg führt keine ChannelMaster-artige Normalisierung durch. Die bestätigte Anzeige der serverseitigen Radio-Vorlage ist von einer noch zu prüfenden manuellen Eingabe im jeweiligen Client zu unterscheiden.

Die private Antwort nennt das Rückleseergebnis. „Rücklesen unverändert. Button-Elemente: 3 von 3“ bedeutet, dass Knuddels denselben Text zurückliefert; sichtbare Darstellung und Klickwirkung sind damit nicht bestätigt. Liefert Knuddels veränderten Text oder weniger Elemente zurück, nennt die Antwort die Abweichung. Ohne erneutes Setzen kann `/settopic --pruefen` die aktuell gespeicherte Zeichen- und Buttonzahl anzeigen. Ein späterer Channelbeitritt kann dann mit dem Speichernachweis verglichen werden. Es wird kein Thema beim Start oder Update automatisch gesetzt. Verbindliche Einzelheiten und Clientgrenzen stehen in [AGENTS.md](../../AGENTS.md#natives-channel-thema).

## Lauftext unter der Appleiste

Als anwesende Radiomoderation im MischWerk-Channel eingeben:

```text
/lauftext Willkommen bei Radio MischWerk!
```

Der Befehl setzt und aktiviert den bestätigten Text für alle Hörer. Die Anzeige ergänzt automatisch **+++ Willkommen bei Radio MischWerk! +++**. Ein eigener Lauftextreiter entfällt. Nur Inhaber und ernannte Radiomoderation dürfen ändern; eine aktive Studioanmeldung ist nicht erforderlich.

Bis 300 Zeichen Text. Bereits eingegebene Randmarker werden zusammengefasst, innere Pluszeichen wie C++ bleiben erhalten. `/lauftext --aus` blendet die Zeile aus und erhält den Text; `/lauftext --an` schaltet ihn wieder ein. `/lauftext` oder `/lauftext --hilfe` zeigt privat den aktuellen Status und alle Einstellungen.

| Befehl | Wirkung |
| --- | --- |
| `/lauftext --an` | Gespeicherten Text einschalten |
| `/lauftext --aus` | Ausblenden und den Text behalten |
| `/lauftext --tempo langsam` | 32 px/s |
| `/lauftext --tempo normal` | 48 px/s |
| `/lauftext --tempo schnell` | 72 px/s |

Alternativ sind `/lauftext --tempo 32`, `48` und `72` zulässig. Eine Tempoänderung erhält den Text, die Laufrichtung und den Ein-/Aus-Zustand; sie kann auch bei ausgeschaltetem oder noch leerem Lauftext vorbereitet werden. Textsetzen und Ein-/Ausschalten erhalten die gewählte Geschwindigkeit. Die bisherige Pause-Taste, lokale Schrift, Android-Projektion und der an echte Wiedergabe gebundene Glow bleiben erhalten. Speicherfehler veröffentlichen keinen unbestätigten Text.

Die Moderation enthält ausschließlich **Sendung** und **Wünsche**. Die Anbieterhistorie ist entfernt. Ab Build 334 liest der Player den Titel ausschließlich über den schnellen Anschluss `currentsong?sid=1`; currentSong.txt wird nicht mehr angefragt.

## Installation und Upload

Ausschließlich **C:/Users/Yves/Desktop/MischWerk/UPLOAD** verwenden. Darunter liegt der vollständige Appordner **MischWerk** mit app.config, main.js, server/ und www/. Die Projektwurzel enthält zusätzlich Quellen, Dokumentation und Git und gehört nicht auf den App-FTP. Keine ZIP erstellen oder entpacken.

Der aktuelle, am 09.11.2026 online abgeglichene Aufbau:

```text
UPLOAD/
└── MischWerk/
    ├── app.config
    ├── main.js
    ├── server/             Servermodule nach Fachbereich
    └── www/
        ├── index.html
        ├── relay-settings.html
        ├── js/             Browsermodule nach Fachbereich
        ├── css/            Styles nach Fachbereich
        ├── img/
        ├── fonts/          Lokale Schriften mit ihren Lizenzen
        └── audio/
```

Das offizielle [Knuddels-Wiki zur Projektstruktur](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur) beschreibt main.js und app.config im App-Hauptordner sowie www/ für Clientdateien einschließlich eigener Unterordner. [HTMLFile](https://developer.knuddels.de/docs/classes/HTMLFile.html) bezieht HTML-Pfade auf www/. MischWerks server/ ist die eigene fachliche Ablage für zusätzliche Serverdateien; ihr Laden aus Unterordnern ist durch das Beispiel von [KnuddelsServer.execute](https://developer.knuddels.de/docs/classes/KnuddelsServer.html#method_execute) abgedeckt. Der Appordnername bestimmt den [App-Key](https://developer.knuddels.de/docs/classes/AppInfo.html#method_getAppKey); MischWerk daher als eine zusammengehörige App erhalten. Im Wiki gezeigte require-Aufrufe werden nicht übernommen: Maßgeblich ist die vorhandene, ausdrücklich dokumentierte execute-Methode. Manifeste bleiben unter PROJEKT/deployment/manifests/ außerhalb der Auslieferung.

| Angabe | Bestätigter Wert |
| --- | --- |
| Channel / Besitzer | MischWerk / Otterchen |
| Entwickler-ID / FTP-Benutzername | 30807196 |
| FTP-Host / Port | appupload.knuddels.de / 21 |
| Verbindung | FTP mit explizitem TLS |
| Zielverzeichnis | /ftp/MischWerk |
| Vollständige App-ID | knuddelsDEV.30807196.MischWerk |
| Eingabe im Installationsdialog | 30807196.MischWerk |
| Bestätigter AppBot | MischWerkBot |
| App | Öffnet automatisch beim Channelbeitritt |
| Befehlsübersicht | /mw |

Passwörter ausschließlich im FTP-Programm eingeben. Die Entwickler-ID ersetzt kein Passwort. app.config verwendet den Entwicklernamen Otterchen; das bestätigte knuddelsDEV-Präfix der App-ID darf nicht aus dem LIVE-FTP-Host anders abgeleitet werden. [App-ID-Dokumentation](https://developer.knuddels.de/docs/classes/AppInfo.html).

Aus PROJEKT/ mit **node tools/build/prepare-upload.cjs** die Bereitstellung prüfen und den verbindlichen Desktop-Upload aktualisieren. **node tools/checks/upload.cjs** gleicht alle 120 Auslieferungsdateien einschließlich 49 Serverdateien, Größen, SHA-256 und Textgrenzen mit den fünf Manifesten ab. Im App-Arbeitsbestand bleiben alle 167 Dateien und 81 Backendmodule erhalten. Vollständige benachbarte Backend-, Browser-JS- und CSS-Module sind in Ladepaketen enthalten; ihre alten lokalen Einzelkopien samt dadurch leeren Ordnern werden ausschließlich im UPLOAD beim Paketbau gezielt entfernt. Der ausgelieferte Server-Ladeplan lädt jeden Modultext weiterhin genau einmal in derselben Reihenfolge. Beide echten Rhino-Engines prüfen zusätzlich das fertige Paket. Der Build erzeugt keine zweite Uploadkopie und veröffentlicht nichts. main.js allein enthält keine App-Fachlogik. Tests, Referenzstubs, Dokumentation und Zugangsdaten gehören nicht ins FTP-Ziel.

Nach einem gesonderten Uploadauftrag:

1. In FileZilla mit den obigen Angaben verbinden. Rechts /ftp, links C:/Users/Yves/Desktop/MischWerk/UPLOAD öffnen. Den lokalen Ordner MischWerk nach /ftp übertragen. Direkt unter /ftp/MischWerk müssen main.js, app.config, server/ und www/ liegen; kein zusätzliches MischWerk/MischWerk. Fremde Appordner erhalten. Vor einem Produktivupdate bestehende Dateien und AppPersistence sichern.
2. Das Ende der Übertragung aller im aktuellen Paket enthaltenen Dateien abwarten, einschließlich neuer Unterordner, sämtlicher server/-Dateien und der drei Bilder unter www/img/nicklist/. Insbesondere server/users/nicklist-storage.js und server/users/nicklist.js müssen mit übertragen werden; main.js oder server/app.js allein reichen nicht. Die fünf lokalen Manifeste dienen dem Abgleich und gehören nicht in den Appordner. Eine leere FileZilla-Warteschlange allein genügt nicht: Auch fehlgeschlagene Übertragungen und den tatsächlichen Zielpfad prüfen. Erst nach vollständiger Übertragung den bestehenden /update-Weg verwenden; eine zusätzliche Plattform-Synchronisationszeit ist möglich.
3. Bei Erstinstallation als Otterchen im eigenen Channel /apps öffnen, App installieren und 30807196.MischWerk eintragen. Knuddels ergänzt das bestätigte Präfix. Falls nötig den bestätigten AppBot einrichten; anschließend die App starten. Bei bestehender Installation den unten beschriebenen /update-Weg verwenden. Beim erstmaligen Wechsel von einem Stand vor 0.1.36 einmal über /apps aktualisieren.
4. Die tatsächlich gestartete Version und Buildnummer im App-Log mit package.json und manifest-live.json vergleichen; der aktuelle lokale Stand ist 0.1.391 / Build 391. Das lokale Paket belegt keine native Installation. Die Startmeldung enthält Version und Buildnummer sowie die Radioleiste mit Channel-Overlays für Moderation, Verwaltung, Wunschbox und Sendeplan. Die Radioleiste öffnet automatisch beim Channelbeitritt; bestehende Appansichten nach Updates schließen und neu öffnen.

Für eine ausdrücklich angeforderte Auslieferungsabnahme anschließend aus PROJEKT/ **pnpm run check:delivery --base-url https://apps8.knuddels.biz/apps/de2635007/** ausführen. Die hier am 03.11.2026 beobachtete öffentliche Basisadresse bei einem Appwechsel erneut prüfen. Das Werkzeug lädt ausschließlich öffentliche HTML-/JS-/CSS-Dateien lesend und vergleicht deren tatsächliche SHA-256 mit den reproduzierbaren gebündelten Auslieferungsbytes. Fehlende Dateien oder alte Fassungen liefern Exitcode 1; vollständig passende Dateien Exitcode 0. Keine Benutzer-/Sitzungsdaten oder Zugangsdaten angeben. Betriebsvorgaben bleiben zentral in AGENTS.md.

Der vorhandene /update-Weg übernimmt über updateAppFiles den auf dem FTP verfügbaren Stand und erneuert danach den Clientcache. Eine atomare Vollständigkeitsgarantie für noch laufende Übertragungen ist damit nicht belegt. Werden keine neuen Dateien gemeldet und sind auch keine Dateien aus einem zuvor fehlgeschlagenen Update vorgemerkt, wird kein Neustart erzwungen; die leere Änderungsmenge beweist keinen vollständigen Upload. Dann Zielpfad, alle Dateien, tatsächliche Logversion und erneutes Öffnen nach Cacheerneuerung prüfen. Eine höhere lokale Versionsnummer überträgt keine Dateien.

Der native Fehler vom 11.11.2026 um 16:36 zeigt die Folgen eines beim Start unvollständigen Runtime-Bestands: `No such file or directory` für die beiden Nicklisten-Dateien, anschließend `Cannot find function attachNicklistStorage`. Die drei betreffenden Zeilen 26, 27 und 95 stimmen mit dem kompakten Ladeplan des lokalen Builds 369 überein. Der Folgefehler ist kein Nachweis einer falsch benannten Funktion; deren Definition fehlt, weil ihre Datei nicht geladen wurde. Ob die damalige Dateiübertragung oder der anschließende Plattformimport unvollständig war, ist aus diesem Protokoll nicht zu entscheiden. Bei Wiederholung zuerst die genannten Zielpfade gegen das vollständige Paket abgleichen; keine Quell-/Bündeldateien aus unterschiedlichen Ständen mischen. Der frühere Eintrag zu `attachAndroidSettingsAccess` um 15:42 zeigt ebenfalls eine fehlende Definition, lässt im sichtbaren Ausschnitt aber keinen bestimmten fehlenden Dateipfad erkennen.

Aktiver Entwicklerzugang und Channelbesitz sind Voraussetzung; Verifizierung und Entwickler-AGB erledigt der Kontoinhaber über /apps developer. Zielclients sind K3 und die aktuelle Knuddels-Desktop-App; JFX ist ausgeschlossen. iOS benötigt laut Plattform eine separate gültige Apple Developer ID, keine Knuddels-Entwicklernummer. Die offiziellen Unterlagen empfehlen DEV vor LIVE; hier ist auf Nutzerauftrag LIVE vorbereitet, eine reale Abnahme bleibt separat.

[Projektstruktur](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur) · [Erste Schritte](https://github.com/knuddelsgmbh/UserApps/wiki/Erste-Schritte) · [FAQ](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ) · [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html) · [Entwicklerportal](https://developer.knuddels.de/).

## Appmanager-Befehl mit Dateiprüfung ab 0.1.370

Der neue Schutz gilt erst, wenn **0.1.370 / Build 370** vollständig installiert ist. Ein noch laufender älterer `/update`-Handler prüft die Dateien noch nicht; die erstmalige Installation deshalb weiterhin nur nach vollständig abgeschlossener Übertragung ausführen. Appmanager verwenden danach `/update` im Channel. Der Befehl übernimmt wie bisher Dateien über `updateAppFiles()`, erneuert den Clientcache und liest den Dateibedarf aus dem Prüfzweig des neu übertragenen `server/app.js`. Er lädt dabei keine neuen Fachmodule und startet keine zweite Appinstanz. Die tatsächlichen Runtime-Verzeichnisse werden über `KnuddelsServer.listFiles` abgeglichen.

Fehlt beispielsweise `server/users/nicklist-storage.js`, erscheint privat: „Update abgebrochen. Kein Neustart. Es fehlen: server/users/nicklist-storage.js. Bitte das vollständige Paket übertragen und /update erneut versuchen.“ Höchstens fünf fehlende Pfade plus Restanzahl werden genannt. Auch eine nicht verfügbare Dateiprüfung, ein nicht unterstützter alter Ladeplan oder eine ungültige Dateiliste verhindert den Neustart. Nach dem Nachliefern nochmals ausdrücklich `/update` aufrufen. Bereits übernommene Änderungen bleiben dafür flüchtig vorgemerkt, sodass der erneute Versuch auch dann funktioniert, wenn die Plattform keine weiteren Änderungen meldet.

Nur nach erfolgreicher Dateiprüfung und bei neuen oder bereits vorgemerkten Dateien wird `updateApp()` angefordert. Ohne Änderungen läuft die App weiter. Ein bereits angeforderter Auftrag wird nicht doppelt eingereiht. Die gemeldeten Sekunden sind weiterhin eine Plattformschätzung. Die Prüfung belegt vorhandene Dateinamen zum Prüfzeitpunkt, keine Inhaltsprüfsummen und keinen atomaren Uploadstand. Das vollständige Paket einschließlich neuer Unterordner vor `/update` übertragen. Offene Musikwünsche bleiben über den vorhandenen dauerhaften Queueadapter erhalten; Radio-Team, Einstellungen und die laufende Sendung werden durch die Vorprüfung nicht neu gespeichert oder initialisiert.

„Gespielt“ entfernt im Moderationsmenü einen gespielten Wunsch; „Verwerfen“ entfernt beispielsweise einen nicht verfügbaren Titel. Es wird jeweils nur die ausgewählte Wunsch-ID entfernt. Appmanager benötigen für diese Moderationsaktionen zusätzlich die Radiomoderatorrolle oder den Channelinhaberstatus.

Diese Anleitung bündelt Installation, laufenden Betrieb und die [STREAMPANEL-Einrichtung](#streampanel-einrichten). Backendquellen liegen unter src/backend/, erzeugte Laufzeitkopien unter app/server/. Verbindlicher Upload bleibt C:/Users/Yves/Desktop/MischWerk/UPLOAD mit dem Appordner MischWerk/. Fünf Dateimanifeste unter deployment/manifests; keine ZIP-Dateien.



## Echte Abnahme

Nach vollständiger Übernahme Version, tatsächlich geladene Dateien und native Bedienung gemäß [LIVE-ABNAHME.md](LIVE-ABNAHME.md) prüfen. Lokale Tests belegen keine installierte Knuddels-Version. Der kontrollierte Inaktivitätstest des alten Clients und die Korrektur 223 stehen im [Prüfbericht](../pruefung/PRUEFBERICHT.md).

## Radio verwenden

Play startet den direkten HTTPS-Stream im nativen Audioelement. Ein neuer manueller Start beginnt mit höchstens 10 % Lautstärke; niedrigere Werte und Stumm bleiben erhalten. Während des Hörens ist die Lautstärke frei einstellbar. Stop trennt die Quelle und beendet weitere Versuche.

Kurze Nachladephasen behalten Quelle und vorhandenen Puffer. Nach einem echten Audioabbruch verbindet die App automatisch neu, solange der Hörer weiter hören möchte. Lautstärke und Mute bleiben dabei erhalten. Browserfreigabefehler verlangen einen bewussten Klick. Ein geschlossenes Knuddels-Dokument kann seinen Ton nicht selbst erhalten.

Titel-, Status- und Modusabfragen dienen ausschließlich der Anzeige. Auch ein gemeldeter Senderstopp schaltet Audio nicht ab und sperrt keinen manuellen Hörversuch. Der echte Audiotransport bestimmt den Wiedergabezustand. Der vorhandene Heartbeat sendet `/confirm` nur bei geprüftem Audiofortschritt und passender frischer Channelantwort. Kurze Engpässe verschieben seinen Termin nicht mehr endlos.

## Betrieb und Daten

Offene Musikwünsche werden vor ihrer erfolgreichen Annahme dauerhaft gespeichert und nach App-Updates sowie Neustarts samt Eingangsreihenfolge, Empfang und manuellem Regiestatus wiederhergestellt. Erledigte oder verworfene Wunschtexte werden gelöscht. Speicherfehler bestätigen keine Annahme und erhalten den Entwurf für erneutes Senden. Das erste Update von Build 267 oder älter kann die dort bisher nur im Arbeitsspeicher liegenden Wünsche noch nicht übernehmen; diese vorher abarbeiten. Keine persönliche oder feste Gesamtanzahl-Begrenzung und keine Wartezeit. Ein Text bis 300 Zeichen, keine Links; der authentifizierte Nick stammt vom Server.

Nach Annahme erscheint die direkte Quittung. Eigener Song, Platz und Bearbeitungsstatus stehen privat in der Appleiste. Die Wunschbox bietet anschließend Weiteren Wunsch eingeben. Nur berechtigte Moderatoren sehen die vollständige Queue und fremde Absender. Wiederholte Übertragungskennungen erzeugen während derselben App-Sitzung keinen zweiten Wunsch.

Thema, Wunschboxfreigabe, Radio-Team, datierte Wochenpläne und Bot-Einstellungen bleiben gespeichert. Private Übergaben und Entwürfe sind flüchtig. Die App enthält keine Analyse-/Trackingbibliotheken. Audio- und Metadatenabrufe gehen an die konfigurierten öffentlichen Anbieteradressen.

Die native Wunschbox verwendet dieselbe flache Anthrazit-/Goldgestaltung wie die Moderation. Ein freies Pflichtfeld mit höchstens 300 Zeichen bleibt erhalten. Das Fenster passt bereits beim Öffnen und während der Eingabe seine Höhe an; nach erfolgreichem Versand wird es für die Bestätigung kleiner und für einen weiteren Wunsch wieder größer. Versand, Entwürfe und Rückmeldungen bleiben im vorhandenen Weg.

## Moderation verwenden

- **Sendung:** Anmeldung, Abmeldung, Thema, Wunschboxfreigabe und Übergabe.
- **Wünsche:** vollständiger Text, Absender, Empfang und manuelle Bearbeitungsstufen. Gespielt oder Verwerfen entfernt den ausgewählten Wunsch; das steuert keinen Encoder.

Eine Studio-Anmeldung gilt ohne Zeitlimit. Es gibt keine automatische Sechs-Stunden-Abmeldung, Verlängerung oder Zeitangaben im Moderationsmenü. Solange angemeldet, stehen Abmelden und Sendung übergeben bereit. Wiederholtes Anmelden verändert die Sitzung nicht. Verlassen oder Rechteverlust beendet die Anmeldung weiterhin. Ausdrückliche Abmeldung leert das gespeicherte Thema, automatisches Ende durch Verlassen/Rechteverlust erhält es. Ohne Thema zeigt die Appleiste MischWerk Radio Show als reinen Standardtext.

Die neu aufgebaute Moderation startet mit 640 × 580 px und bleibt ohne Scrollfunktion. Wünsche passt seine Höhe zwischen 320 und 580 px an den Inhalt an und kann nach dem Leeren wieder wachsen; zurück in Sendung gilt die ursprüngliche Fensterhöhe. Bei kleinen Fenstern führen Vor/Zurück durch vollständige Bereiche; lange Wunschtexte und private Notizen werden verlustfrei auf Textseiten verteilt. Themenbearbeitung erhält eine stabile Geometrie. Studioanmeldung und tatsächliche Anbieterübertragung sind unabhängige Zustände.

## Sendung an den nächsten Moderator übergeben

Die aktive Moderation wählt **Sendung übergeben**, einen anwesenden, im Radio-Team eingetragenen Empfänger oder Otterchen als automatisch berechtigten Channelinhaber und optional eine private Notiz bis 500 Zeichen. Bis zur Annahme bleibt sie aktiv. Der Nachfolger öffnet **Übergabe ansehen**, kann ein neues Thema eintragen und bestätigt mit **Jetzt übernehmen**. Erst dann wechseln Appstatus und öffentliche Botmeldung. Leeres Thema entfernt das bisherige Thema.

In sehr niedrigen Fenstern sind übergroße Bediengruppen mit Rad, Touch und Tastatur intern erreichbar. Die ausgewählte Gruppe bleibt bei Größenwechseln erhalten. Bei einer verlorenen Annahmequittung bestätigt erst der frische Serverzustand den Wechsel; fehlt nach einer echten Erfolgsquittung der Zustandspush, liest die Oberfläche einmal neu. Ohne Bestätigung wird kein Erfolg behauptet.

Ablehnen/Abbrechen ändern die Anmeldung nicht. Verlassen, Rechteverlust, Ablauf oder geänderte Moderationssitzung machen die Anfrage ungültig. Fehler erhalten den Entwurf; Wunschqueue und Wunschboxfreigabe bleiben erhalten. Encoderwechsel erledigen die Moderatoren selbst in ihrer Sendesoftware.

## Verwaltung und Bot-Texte

Otterchen öffnet die Verwaltung im MischWerk-Channel ausschließlich mit **/mw admin**. Der alte Unterbefehl `verwaltung` ist entfernt. Der Verwaltungsknopf in der Appleiste entfällt. Geprüft werden der authentifizierte Nick, tatsächliches Channelinhaberrecht und Anwesenheit; Appmanager, Entwickler, Channel- und Radiomoderatoren erhalten keinen Zugang. Die Verwaltung verwendet 500 × 560 px und ihre Bereiche Radio-Team, Bot-Texte und Verbindung. Eine vorhandene Radioleiste mit laufendem Ton bleibt erhalten; eine fehlende Leiste wird regulär geöffnet. Beim Schließen kehrt der Fokus zu Moderation zurück.

Otterchen erhält als authentifizierter, anwesender Channelinhaber automatisch alle bestehenden Apprechte. Moderationsbutton und Übergabeempfang sind ohne Radio-Team-Eintrag verfügbar. Ein optionaler eigener Listeneintrag kann entfernt werden, ohne seine Rechte oder laufende Moderation zu beenden. Für andere Nutzer bleiben Ernennung und Entzug wie bisher. Nick, Appmanager-, Entwickler- oder CM-Rolle allein verleihen keinen Inhaberzugriff.

Unter **Bot-Texte** stehen bis zu sechs Texte mit je 300 Zeichen zur Verfügung. Automatisch senden ist zunächst aus; Abstände: 20, 30, 40 oder 50 Minuten. Gefüllte Texte laufen der Reihe nach, leere Felder werden übersprungen. Speichern beginnt einen vollen Abstand; verpasste Termine werden nicht nachgeholt. Eine Inhaltsfläche scrollt, Kopf/Reiter/Aktionen bleiben erreichbar.

Ab Build 347 ist die Übernahme eigener benannter Knuddels-Smileys vorbereitet: Otterchen sendet einmal privat `/p MischWerkBot:smiley :(nosmoking-happy-y):`, mit dem tatsächlichen Botnick. Der Bot bestätigt die Übernahme erst, wenn die App die von Knuddels gelieferte Grafik erkennt und dauerhaft speichert. Anschließend dasselbe Kürzel in einem Bot-Text verwenden, etwa `Rauchen bitte vor der Tür. :(nosmoking-happy-y):`. Bis zu 32 Zuordnungen bleiben im privaten Bot-Speicher auch über Updates und Neustarts erhalten. Das Eingabefeld behält die Kürzel; unbekannte Kürzel werden als Text gesendet. Der Import verändert weder die Automatik noch den nächsten Versandtermin. Einfache Knuddels-Bildtags sind ebenfalls möglich, übrige Formatierung bleibt Klartext.

Build 349 korrigiert die anhand des Diagnoseeingangs belegte Ursache: Der echte Bildname enthält drei aufeinanderfolgende Punkte vor seinen Größenmodifikatoren. Diese wurden bisher als Pfadwechsel fehlgedeutet. Der Bildname bleibt jetzt vollständig erhalten; gesperrt werden nur echte `.`-/`..`-Pfadsegmente. Nach Installation denselben Smiley-Befehl erneut senden und die Übernahme bestätigen lassen, anschließend die öffentliche Ausgabe prüfen. Die vorherige Aussage über einen fehlenden aktiven Smiley war kein Besitznachweis. Falls ein anderes Format nicht erkannt wird, enthält die private Antwort unter „Empfangen“ weiterhin den begrenzten, als Text maskierten App-Eingang.

## STREAMPANEL einrichten

Aktiver Anbieter ist STREAMPANEL/SPCast. Bestätigte öffentliche Höreradresse: **https://mischwerk.sp.radio.fm/stream**. Sie leitet beim Aufbau per HTTPS auf den eigenen SPCast-Stream weiter. Beim datierten Kontrolllauf am 05.11.2026 wurde MP3 mit 320 kbit/s empfangen; diese Momentaufnahme ist keine dauerhafte Verfügbarkeitsgarantie.

Konfiguration: `src/backend/config.js`, `MischWerkConfig.streampanel`.

| Feld | Bedeutung |
| --- | --- |
| `streamUrl` | Öffentliche HTTPS-Höreradresse |
| `allowedHosts` | Exakt erlaubte öffentliche Datenhosts |
| `metadata` | Direkter SPCast-Titelabruf und ergänzende Modusquelle |
| `status` | SPCast-Statistik mit Stream-, Pfad- und Stationszuordnung |

Statistik: exakt `/statistics?json=1` am eigenen Hörerhost, Stream-ID 1 und `/stream`; keine zusätzlichen Cacheparameter, die dort nachgewiesen 404 liefern. Modus: `/scripts/whoIsLive.php`, ausschließlich bestätigtes autodj/live. Einzige Titelquelle ab Build 334: `https://mischwerk.sp.radio.fm/currentsong?sid=1`, Format `spcast-shoutcast-song`. Der Anbieter verlinkt diese Route auf seiner Statusseite; HTTP 200, CORS * und eine einzelne Songzeile sind geprüft. MIME text/html oder text/plain zulassen, HTML-Markup und ungültige Zeilen abweisen. Eindeutigen `_mw`-Parameter anhängen und sid=1 erhalten, auch über XHR. Die alte currentSong.txt-Quelle und ihr Format sind aus der Runtime entfernt; bei einem realen Wechsel lag die Datei trotz Cacheparameter rund 29 Sekunden hinter ICY. Keine Historie, kombinierte Anbieter-Player-API oder spekulative SSE-Ersatzquelle abfragen. Titel am ersten exakten ` - ` aufteilen und ohne vollständige Teile als Original erhalten; Titel oben, Interpret darunter. [Untersuchung und Schnittstellen](../api/API-NACHWEIS.md).

Status, Modus und Metadaten steuern kein Audio. Titel starten ohne Statuswartezeit und folgen nach zwei Sekunden, Modus nach fünf, Status nach 30 Sekunden, bei bestätigter Sendepause nach zwei Sekunden bis zur Rückkehr. Titelfehler warten zunächst zwei Sekunden, wiederholte Fehler begrenzt 4/8/16/30 Sekunden. Vor Neuaufbau alte HTTP-Aufträge abbrechen und Timer löschen; genau ein Auftrag pro Quelle/URL. Sichtbarkeits- und Quellenwechsel verwerfen alle alten Antworten. Eine Studioanmeldung bestätigt keinen Anbieter-LIVE-Modus.

Encoder-Host, Passwort, Benutzer und Mountpoint gehören nur in die Sendesoftware. Die App benötigt keine Anbieterzugangsdaten. `node tools/checks/streampanel.cjs` prüft die eigenen öffentlichen Quellen ausdrücklich lesend; kein automatischer Bestandteil des Radiohörens.

## Website

Die [Homepage](../../website/README.md) liegt außerhalb des Knuddels-UPLOAD. Appanschluss standardmäßig aus, bewusste Besitzerfreigabe nötig. Der Arbeitsbereich verwendet bestehende Rollen/Fachaktionen. Mailversand bleibt aus. Hosting, HTTPS und echte Kopplung separat abnehmen: [Anbindung](../../website/docs/ANBINDUNG.md).

[Sendeplan](SENDEPLAN.md) · [Lautstärke](LAUTSTAERKE.md) · [Native Abnahme](LIVE-ABNAHME.md).
# Private Verbindung einrichten

Die Einrichtung erfolgt ausschließlich unter `/mw admin` im Reiter **Verbindung**. Bei bereits eingerichteter laufender Verbindung keinen Schlüssel erneut eingeben oder speichern. Das Öffnen und Aktualisieren liest nur den Status und erhält die vorhandenen Einstellungen.

1. Nach autorisierter Installation des vollständigen lokalen `UPLOAD/MischWerk` als tatsächlicher, im Channel anwesender Inhaber `/mw admin` öffnen und **Verbindung** wählen. Laufendes Radio bleibt bestehen.
2. Nur bei notwendiger Neueinrichtung oder Änderung **Verbindungsschlüssel ändern** aufklappen und den Sync-Schlüssel aus dem eigenen geschützten Schlüsselspeicher eingeben. Er muss mit `KNUDDELS_SYNC_SECRET` im Firebase Secret Manager übereinstimmen. Keine Schlüsselwerte über Chat, gemeinsame JSON oder Quelltext austauschen. Ein Relay-Schlüssel ist für den Android-Rückkanal nicht erforderlich; alte gespeicherte Werte bleiben erhalten.
3. Eine notwendige Änderung ausdrücklich speichern und den Status aktualisieren. Die Vorhandenseinsanzeige muss passen; bestehende Werte erscheinen nicht im Formular. Ohne neue Eingabe bleibt Speichern gesperrt. Die Zieladresse ist fest vorgegeben.
4. Speichern legt die Werte ausschließlich im serverseitigen Schlüssel `mischwerk.android.private.v1` ab und setzt `enabled=false` sowie `runtimeVerified=false`. Ein vorhandener Relaylauf wird beendet. Der Dialog registriert keinen Hook, sendet keinen HTTP-POST und aktiviert nichts.
5. Nur das Ergebnis der Einrichtung zurückmelden, keine Schlüsselwerte. Bereitstellung auf Firebase-Seite und native Abnahme bleiben eigenständige, ausdrücklich beauftragte Schritte.

Die Anwendung verwendet dokumentierte Knuddels-Identitäten, Sitzungen, `Client.sendEvent`, `App.onEventReceived` und AppPersistence. Nur die eröffnete private Sitzung des aktuellen Channelinhabers ist berechtigt. Rolle/Anwesenheit, aktive Sitzung, Frist, Revision und Eingabeschema werden serverseitig erneut geprüft. Schließen, Rechteverlust, Channelverlassen und Shutdown entfernen die private Berechtigung. Die Anwendung schreibt Schlüssel weder in Logs noch in Statusantworten oder Browser-Storage. Eingabefelder werden vor dem Versand und bei Seitenende geleert. Der serverseitige Plattform-Speicher ist damit kein zusätzlich nachgewiesener verschlüsselter Secret-Vault; lokale Plattform-Fakes sind kein nativer Transportnachweis.

## Signierter Statusanschluss ab Build 270

### Regulärer Rückkanal ab Build 289

Nach Installation des aktuellen vollständigen UPLOADs in Knuddels `/mw admin` öffnen und den Reiter **Verbindung** wählen. Der bereits gespeicherte Sync-Schlüssel genügt; ihn nicht erneut eingeben und nicht erneut speichern. Eine bereits aktive Verbindung weiterlaufen lassen. **Aktivieren** startet eine ausgeschaltete Verbindung über den vorhandenen signierten Publisher sofort und anschließend alle 20 Sekunden. Es gibt keine WebHook-Vorbereitung, zusätzliche Schlüsselübergabe oder Freischaltungsanfrage mehr. Die Wunschboxschaltung bleibt die echte Knuddels-Schaltung.

Die erfolgreiche Firebase-Antwort enthält bis zu zehn Wünsche. MischWerk übernimmt gültige neue IDs einmalig in die gemeinsame dauerhafte Queue und meldet im nächsten regulären POST queued/received samt echtem Platz zurück. Wiederholungen, Neustart und Antwortverlust erzeugen keinen zweiten Eintrag; Bearbeitung und Vorrücken stammen weiter aus derselben Regie. Android bleibt bis zur Quittung pending. Firebase setzt seine feste Drei-Minuten-Frist durch.

Danach unter `/mw admin` → Verbindung den Status aktualisieren. „Aktiv – Daten werden übertragen.“ bestätigt eine angenommene reguläre Übertragung. Der frühere Chat-Statusaufruf ist entfernt; keine technische JSON-Ausgabe aus dem Verwaltungsreiter ableiten. Keine Schlüssel oder Wunschtexte weitergeben. Die Gegenseite übernimmt den echten Android-Durchlauf und Positionsnachweis. **Verbindung ausschalten** stoppt und speichert false; ein erneutes Speichern schaltet ebenfalls aus.

Die nachfolgenden Einmal-Prüfschritte beschreiben ausschließlich historische Abnahmen. Die dort genannten `/mw verbindung`-Aufrufe einschließlich Status und Prüfungen sind seit Build 365 vollständig entfernt und nicht mehr ausführbar. Die internen Prüffunktionen bleiben für lokale Tests erhalten; es gibt keinen Ersatzbefehl. Für den Betrieb ausschließlich den Reiter Verbindung unter `/mw admin` verwenden.

Der verbindliche Vertrag aus Brückenstand Revision 23 verwendet HMAC-SHA256 im Requestbody und ersetzt sämtliche bisherigen Header-/Probeheader-Aufträge. Bestehenden Sync-Schlüssel behalten; keine neue Eingabe oder Rotation erforderlich. Der vollständige Build 270 ist lokal unter dem festen Desktop-UPLOAD vorbereitet und geprüft.

Abnahmestand 06.11.2026: Build 270 ist installiert. Der angeforderte Einmaltest um 23:33:57.830 MEZ / 22:33:57.830 UTC wurde mit HTTP 200/accepted:true und errors:[] angenommen. stationUpdatedAt=1794004437830. station/current ist in der Firebase Console zur passenden Sekunde sichtbar; die Oberfläche zeigt keine Millisekunden. Firebase-Codex gleicht den gespeicherten Wert exakt ab und dokumentiert das Ergebnis in Revision 25. Dafür keinen weiteren Knuddels-Aufruf ausführen. Der Dauerbetrieb bleibt ausgeschaltet, bis die übrige Abnahme und ausdrückliche Freigabe vorliegen. Die folgenden Schritte beschreiben den allgemeinen Ablauf und sind für diesen bereits erfolgreichen Aufruf nicht erneut abzuarbeiten.

1. Den vollständigen Build durch den Betreiber installieren und als anwesender tatsächlicher Inhaber genau einmal `/mw verbindung http-pruefen` ausführen. Dieser neue Aufruf sendet den aktuellen Senderstatus mit den vier Strings payload, ts, nonce und sig ohne eigene Header. Keine Wünsche und keine Konfigurationsänderung.
2. Die vollständige private JSON-Antwort mit Appversion/Build, checkedAt, request.stationUpdatedAt und HTTP-/accepted-Ergebnis weitergeben. Der Bericht enthält weder Schlüssel noch Signatur oder Nutzlast. Erwartet: native-signed-status-post, HTTP 200 und accepted:true. Firebase gleicht station/current unabhängig mit exakt dem gesendeten Zeitstempel ab. Der Dauerbetrieb bleibt bis zur vollständigen Abnahme ausgeschaltet.
3. Bei Fehler zuerst den einmaligen Aufruf in Firebase zuordnen. Nur freigegebene Metadaten wie authMode, payloadPresent, tsPresent, nonceStringOk, sigPresent, sigLength, tsSkewBucket und requestContentType lesen. postURLs tatsächlicher nativer Content-Type ist noch nicht nachgewiesen; die Gegenstelle akzeptiert JSON und form-urlencoded, kein Multipart. Keine Body-/Signaturausgaben oder Formatvarianten auf Verdacht.

Der bestehende `/mw verbindung auth-pruefen` sendet bei Bedarf ebenfalls signierte Felder, aber payload `{}`. Ein 400 bestätigt nach dem festen Firebase-Vertrag erfolgreiche Authentisierung vor der Nutzlastvalidierung ohne Datenbankschreiben. Dieser Zusatztest ist für den jetzt angeforderten echten Statuslauf nicht vorgeschaltet. Beide Befehle teilen den bisherigen Port, 10-Sekunden-Timeout und 30-Sekunden-Abstand. Jeder neue Zustand und Heartbeat verwendet eine streng höhere Projektionszeit; nach über 45 Sekunden keine alte Nutzlast wiederholen.

## Historischer Headervergleich ab Build 265

Der folgende Ablauf beschreibt den bisherigen Nachweis und wird durch den signierten Vertrag ab Build 270 ersetzt. Keine weiteren Header-Proben ausführen.

Revision 21 bestätigt die bereitgestellte sichere Probeheader-Diagnose auf Firebase-Seite. Build 265 erweitert `/mw verbindung auth-pruefen` um den gemeinsam vereinbarten harmlosen Zusatzheader und liest ausschließlich den HTTP-Status. Bestehende private Schlüssel bleiben erhalten. Den vollständigen lokalen UPLOAD wie gewohnt durch den Betreiber installieren. Dieser Arbeitsschritt enthält keine automatische FTP-Übertragung, Aktualisierung oder Neustartfreigabe.

Aktueller realer Abnahmestand: Build 265 ist durch den Betreiber installiert. Der einmalige Vergleich aus Revision 21 am 06.11.2026 um 21:27:45.399 MEZ ergibt HTTP 401. Über identische Trace eindeutig zugeordnete Firebase-Logs zeigen Authorization=false, Bearer=false, Tokenlänge 0 und Probeheader=false. Der geprüfte konkrete Quellaufruf setzt beide Einträge im dokumentierten header-Objekt; eine sichere Korrektur ist nicht belegt. Vor weiteren Tests tatsächliche Headerunterstützung des AppServers klären. Keine weitere identische Probe, Formatvariante oder Statusübertragung ausführen. Die folgenden Schritte beschreiben den allgemeinen Abnahmepfad nach Klärung.

1. Als anwesender tatsächlicher Channelinhaber einmal `/mw verbindung auth-pruefen` ausführen. Der Test sendet nur `{}` als payload-String mit dem vorhandenen Sync-Schlüssel und dem vereinbarten Zusatzheader im dokumentierten header-Objekt an die feste Hosting-Adresse. Keine Senderdaten oder Wünsche, kein Konfigurationsschreiben.
2. Private JSON-Antwort mit tatsächlicher Appversion, Buildnummer und checkedAt weitergeben. Keine Schlüssel- oder Headerwerte. Build 265 meldet `native-header-probe-post`; bodyRead/jsonParsed bleiben false und Antwortadress-/Bodyvergleich null, weil nur der Statuscode gelesen wird. HTTP 400 und `authenticationAccepted=true` bestätigen den vereinbarten Auth-Statusvertrag für die leere Nutzlast. 401 oder unerwarteter 200 sind kein Erfolg. Die Gegenstelle liest dazu ausschließlich authorizationHeaderPresent, bearerPrefixPresent, deliveredTokenLength und probeHeaderPresent aus den zugehörigen Firebase-Logs.
3. Erst nach dieser Auswertung, bestätigter Authentisierung und mindestens 30 Sekunden Abstand genau einmal den nachfolgenden Statusbefehl ausführen. Danach `station/current` unabhängig prüfen. Bei 401 den Probeheaderbefund zur Eingrenzung verwenden und keine weiteren Varianten oder Wiederholungen auf Verdacht senden. Ohne vollständige Nachweise bleibt der Dauerbetrieb ausgeschaltet.

Der Auth-Test verwendet denselben physischen HTTP-Port und Prüf-Timeout wie der Statusbefehl. Ein nach zehn Sekunden logisch abgelaufener Auftrag hält den Port bis zum echten nativen Callback belegt. Speichern, Verlassen, Rechteverlust und Shutdown verhindern verspätete Bestätigungen. `firestoreWriteConfirmed` bleibt im privaten Bericht unbekannt; Auth-Erfolg ist keine Status-/Firestore-Abnahme.

## Einmalige native Statusprüfung ab Build 240

Firebase-Brückenstand Revision 16 meldet `publishKnuddelsState` einschließlich sicherer Auth-Fehlerdiagnose als bereitgestellt. Build 240 ist durch den Betreiber installiert und nativ geprüft. Der Test vom 06.11.2026 13:02:40.346 UTC ergibt HTTP 401; zeitlich zugehörige Function-Logs zeigen keinen Authorization-Wert, kein Bearer-Präfix und Tokenlänge 0. Der Headerpfad muss vor einer weiteren identischen Probe geklärt werden. Dafür ist derzeit kein neuer FTP-Upload erforderlich. Der allgemeine Abnahmepfad bleibt:

1. Als tatsächlicher anwesender Channelinhaber `/mw verbindung http-pruefen` ausführen. Der Befehl sendet einmal die aktuellen Senderdaten an `https://radio-mischwerk.web.app/api/publishKnuddelsState` und kann damit `station/current` in Firebase aktualisieren. Keine Testsenderdaten und keine Wünsche.
2. Die private JSON-Antwort abwarten, spätestens nach zehn Sekunden. `nativeResponseAccepted=true` bestätigt HTTP 200, angenommene JSON-Antwort und passende Serverzeit. Der Bericht enthält den gesendeten `stationUpdatedAt`-Zeitstempel, Callbackart und Ziel-/JSON-Prüfung; keine Schlüssel oder Antwortrohdaten.
3. Auf Firebase-Seite `station/current` mit genau diesem Zeitstempel und echten Zustandsfeldern vergleichen. `firestoreWriteConfirmed` bleibt im Knuddels-Bericht unbekannt (`null`), bis diese unabhängige Folgeprüfung vorliegt.
4. Erst danach eine ausdrückliche Betriebsfreigabe vorbereiten. Der Einmaltest schreibt weder Konfiguration noch `enabled/runtimeVerified`, registriert keinen Hook und startet keinen Heartbeat. Nach Fehlern frühestens nach 30 Sekunden erneut testen; ein physisch noch hängender nativer Auftrag bleibt gesperrt.

Ein neuer Schlüssel ist dafür nicht erforderlich. Bestehende Sync-Konfiguration bleibt erhalten, der Wunsch-Schlüssel ist für diesen Einzeltest optional. Lokale Node-/Rhino-/Emulatorprüfungen ersetzen weder den echten POST noch die Firestore-Folgeprüfung.
