# MischWerk – Installation, Betrieb und STREAMPANEL

**App 0.1.449 / Build 449 · Website 0.2.13 · 18.11.2026.**

Sendung, Thema, Wunschbox, DJ-Freigaben und Wunschregie liegen zentral in Firebase/MischWerk Live Studio. Knuddels zeigt bestätigte Daten und überträgt eigene Wünsche über den vorhandenen signierten Anschluss. Native Moderationsanmeldung und zusätzliche Node-Websiteanmeldung sind entfernt. Radioaudio und öffentlicher Sendeplan bleiben unabhängig. Lokale Paketierung ist keine Installation oder Produktionsfreigabe.

## Moderationsanmeldung

Die Sendung wird ausschließlich im MischWerk Live Studio angemeldet und übergeben. In Knuddels gibt es weder Moderationsknopf noch PIN-, Anmelde-, Abmelde- oder Übergabeweg. DJ-Anwesenheit im Channel und laufende Knuddels-App sind keine Voraussetzung. Die Wunschbox erscheint nur bei frischer zentraler Live-Sendung und Freigabe; eine Inhaberausnahme gibt es nicht mehr.

## Begrüßung im MyChannel

Bei jedem echten menschlichen Channelbeitritt erscheint „Willkommen bei Radio MischWerk, {Nick}. Viel Spaß beim Zuhören.“ Der erste Begrüßungssatz erscheint größer, fett und im Goldton #e6c77b der Appleiste; „Viel Spaß beim Zuhören.“ folgt mit einem Leerzeichen in normaler Channelschrift. Die Nachricht enthält keinen erzwungenen Zeilenumbruch. Nick und Foto öffnen über native Profillinks dasselbe Nutzerprofil. Das vorhandene Profilfoto steht ganz am Ende, nach dem letzten Punkt und einem Leerzeichen. Die kleine Anfrage beträgt weiterhin 24 × 24 Pixel. Für normale User, MCM, Radio-Team und Inhaber gilt derselbe Text. Die bisherigen 30 Sätze und die Zufallsauswahl sind entfernt. Ohne nutzbares Foto bleibt der Text erhalten; bereits Anwesende erhalten beim Appstart keine nachträgliche Meldung.

Als erste eigene Botnachricht beim Beitritt erhält der Eintretende privat das Willkommensbanner und drei Bildflächen. Direkt danach folgt die öffentliche Text-/Foto-Begrüßung; Nicklistenabgleich und Radioöffnung erfolgen anschließend. Lieblings-MyChannel verknüpft /edit setlmc, Channelinfo /info; Mach mit! bleibt inaktiv. Die Grafiken liegen unter app/www/img/welcome/. Die native Startfolge LEFT → °#r° → CENTER soll das Absenderpräfix links halten und das Banner auf der nächsten KCode-Zeile zentrieren. Die Buttonzeile erhält ihr eigenes CENTER. Der frühere LF-Versuch wurde durch den Nutzerscreenshot als wirkungslos zurückgemeldet. Channelthema und iOS-Hinweis stehen nur im Banner; außerhalb der vier Bilder enthält die Nachricht keinen normalen Text. Die große Überschrift einschließlich des i in MischWerk ist vollständig gold. Bei ungültiger Bildauflösung wird die private Nachricht vollständig ausgelassen. Doppelte Beitrittshooks und Appneustarts senden nicht erneut an bereits Anwesende. Die bisherige öffentliche Begrüßung bleibt erhalten.

Text und Fotoausgabe liegen in `src/backend/users/greetings.js`. Die Begrüßung verändert keine Apprechte und meldet niemanden im Studio an. Die tatsächliche native Fotoanzeige und Bildgröße bleiben nach Installation zu prüfen. Eine lokale Bereitstellung führt selbst keine echte Nachricht oder Installation aus.

## Channel-Thema setzen

Im MischWerk-Channel **`/settopic TEXT`** eingeben, beispielsweise `/settopic Willkommen bei Radio MischWerk!`. Nach erfolgreicher Änderung erscheint eine private Bestätigung. Der Befehl verwendet das native Channel-Thema; Sendungsthema und Lauftext sind eigene Einstellungen. KCode wird unverändert übernommen. Der Themeneditor kann eine kleinere Eingabegrenze anzeigen als der API-Weg. Rechte, Zeichenlimit und Fehlerverhalten stehen zentral in [AGENTS.md](../../../AGENTS.md#natives-channel-thema).

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

Die private Antwort nennt das Rückleseergebnis. „Rücklesen unverändert. Button-Elemente: 3 von 3“ bedeutet, dass Knuddels denselben Text zurückliefert; sichtbare Darstellung und Klickwirkung sind damit nicht bestätigt. Liefert Knuddels veränderten Text oder weniger Elemente zurück, nennt die Antwort die Abweichung. Ohne erneutes Setzen kann `/settopic --pruefen` die aktuell gespeicherte Zeichen- und Buttonzahl anzeigen. Ein späterer Channelbeitritt kann dann mit dem Speichernachweis verglichen werden. Es wird kein Thema beim Start oder Update automatisch gesetzt. Verbindliche Einzelheiten und Clientgrenzen stehen in [AGENTS.md](../../../AGENTS.md#natives-channel-thema).

## Lauftext unter der Appleiste

Als tatsächlicher anwesender Channelinhaber Otterchen oder als authentifizierter anwesender Polaroid `/mw admin` öffnen und im Reiter Anzeige Text, Ein/Aus und Langsam/Normal/Schnell einstellen. Anzeige speichern übernimmt die Änderung; der bestehende Lauftext bleibt audio-unabhängig. `/lauftext` ist entfernt. Im selben Reiter lassen sich MW-Teamzeichen, Mikrofon, Kopfhörer und öffentliche Sendungsmeldungen getrennt schalten. Die Iconoptionen ersetzen keine zentrale Freigabe und keinen tatsächlichen DJ-/Hörerstatus. Freigegebene Nicks sind rein lesend.

## Installation und Upload

Das Uploadziel ist automatisch **Desktop des aktuellen Nutzers/MischWerk/UPLOAD**. Unter Windows wird der tatsächliche Desktop einschließlich einer möglichen Umleitung verwendet. Keine personenbezogene Pfadanpassung oder Rückfrage erforderlich. Darunter liegt der vollständige Appordner **MischWerk** mit app.config, main.js, server/ und www/. Die Projektwurzel enthält zusätzlich Quellen, Dokumentation und Git und gehört nicht auf den App-FTP. Keine ZIP erstellen oder entpacken.

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

Aus PROJEKT/ mit **node tools/build/prepare-upload.cjs** die Bereitstellung prüfen und das konfigurierte lokale Uploadziel aktualisieren. **node tools/checks/upload.cjs** gleicht alle tatsächlich inventarisierten Auslieferungsdateien, Größen, SHA-256 und Textgrenzen mit den fünf Manifesten ab. Im App-Arbeitsbestand bleiben die lesbaren Quelldateien und 76 Backendmodule erhalten. Vollständige benachbarte Backend-, Browser-JS- und CSS-Module sind in Ladepaketen enthalten; ihre alten lokalen Einzelkopien samt dadurch leeren Ordnern werden ausschließlich im UPLOAD beim Paketbau gezielt entfernt. Der ausgelieferte Server-Ladeplan lädt jeden Modultext weiterhin genau einmal in derselben Reihenfolge. Beide echten Rhino-Engines prüfen zusätzlich das fertige Paket. Der Build erzeugt keine zweite Uploadkopie und veröffentlicht nichts. main.js allein enthält keine App-Fachlogik. Tests, Referenzstubs, Dokumentation und Zugangsdaten gehören nicht ins FTP-Ziel.

Persönliches Uploadziel: `%LOCALAPPDATA%/MischWerk/build.json` außerhalb von Git kann `{"schemaVersion":1,"uploadDirectory":"D:\\Releases\\MischWerk"}` enthalten. Dieser absolute Endordner enthält direkt main.js, app.config, server und www. Nur dieser Windows-Benutzer verwendet die Einstellung; andere PCs behalten den Desktopstandard. Die fünf Dateimanifeste bleiben außerhalb der Uploaddateien unter deployment/manifests.

Nach ausdrücklicher Freigabe aus PROJEKT/ `node tools/build/prepare-upload.cjs --approve` ausführen. Erst nach allen Prüfungen entsteht neben dem direkten Appordner `.freigaben/MischWerk.json` im Format des vorhandenen MyChannel Deploy. Der normale Paketbau erteilt keine neue Freigabe. Das bisherige Tool akzeptiert nur zweiteilige Appversionen: Die lokale optionale Einstellung `approvalAppVersion` kann dafür ausdrücklich `0.1` verwenden; nur das externe Freigabefeld wird angepasst, die App bleibt 0.1.449 / Build 449. Die Unterstützung vollständiger dreiteiliger Versionen wurde an den zuständigen Tool-Chat übergeben.

Nach einem gesonderten Uploadauftrag:

1. In FileZilla mit den obigen Angaben verbinden. Rechts /ftp, links den konfigurierten fertigen Appordner öffnen und dessen Inhalt nach /ftp/MischWerk übertragen. Ohne persönliche Einstellung ist dies <Desktop des aktuellen Nutzers>/MischWerk/UPLOAD/MischWerk. Direkt unter /ftp/MischWerk müssen main.js, app.config, server/ und www/ liegen; kein zusätzliches MischWerk/MischWerk. Fremde Appordner erhalten. Vor einem Produktivupdate bestehende Dateien und AppPersistence sichern.
2. Das Ende der Übertragung aller im aktuellen Paket enthaltenen Dateien abwarten, einschließlich neuer Unterordner, sämtlicher server/-Dateien und der drei Bilder unter www/img/nicklist/. Insbesondere server/users/nicklist-storage.js und server/users/nicklist.js müssen mit übertragen werden; main.js oder server/app.js allein reichen nicht. Die fünf lokalen Manifeste dienen dem Abgleich und gehören nicht in den Appordner. Eine leere FileZilla-Warteschlange allein genügt nicht: Auch fehlgeschlagene Übertragungen und den tatsächlichen Zielpfad prüfen. Erst nach vollständiger Übertragung den bestehenden /update-Weg verwenden; eine zusätzliche Plattform-Synchronisationszeit ist möglich.
3. Bei Erstinstallation als Otterchen im eigenen Channel /apps öffnen, App installieren und 30807196.MischWerk eintragen. Knuddels ergänzt das bestätigte Präfix. Falls nötig den bestätigten AppBot einrichten; anschließend die App starten. Bei bestehender Installation den unten beschriebenen /update-Weg verwenden. Beim erstmaligen Wechsel von einem Stand vor 0.1.36 einmal über /apps aktualisieren.
4. Die tatsächlich gestartete Version und Buildnummer im App-Log mit package.json und manifest-live.json vergleichen; der aktuelle lokale Stand ist 0.1.449 / Build 449. Das lokale Paket belegt keine native Installation. Die Startmeldung enthält Version und Buildnummer sowie die Radioleiste mit Channel-Overlays für Verwaltung, Wunschbox und Sendeplan. Die Radioleiste öffnet automatisch beim Channelbeitritt; bestehende Appansichten nach Updates schließen und neu öffnen.

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

Diese Anleitung bündelt Installation, laufenden Betrieb und die [STREAMPANEL-Einrichtung](#streampanel-einrichten). Backendquellen liegen unter src/backend/, erzeugte Laufzeitkopien unter app/server/. Verbindlicher Upload bleibt <Desktop des aktuellen Nutzers>/MischWerk/UPLOAD mit dem Appordner MischWerk/. Fünf Dateimanifeste unter deployment/manifests; keine ZIP-Dateien.



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

MischWerk Live Studio steuert zentrale Sendung und Queue. Knuddels zeigt ausschließlich eigenen Wunschstatus. Veraltete native Regieereignisse werden ohne Mutation abgewiesen.

## Sendung an den nächsten Moderator übergeben

Übergabe ausschließlich im MischWerk Live Studio ausführen. Knuddels empfängt das bestätigte zentrale Übergabeereignis; Kandidaten, Übertragungsfehler oder Ablauf erzeugen keine lokale Ersatzsendung und keine falsche Endmeldung.

## Verwaltung und Bot-Texte

`/mw admin` öffnet die bestehende Inhaberverwaltung mit Anzeige, Bot-Texte und Verbindung. Bot-Texte bleiben im bisherigen Speicher und Ablauf. Anzeige bearbeitet Lauftext und lokale MW-Team-/Meldungsoptionen; zentrale Nickfreigaben sind lesend. Verbindung zeigt nur Schlüsselvorhandensein. Speichern mit neuem Schlüssel schaltet aus; Aktivieren/Ausschalten sind ausdrücklich. Reiterwechsel/Schließen löscht Secret-Eingaben. Weitere Rechte erhalten weder CM noch Appmanager aus dieser Ansicht.

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

## Website und bestehende Verbindung

Die reguläre redaktionelle Homepage unter www.radio-mischwerk.de bleibt bei ihrem bisherigen Firebase-Betrieb. Der zusätzliche Node-Arbeitsbereich ist stillgelegt; alte Workspaceadressen liefern410. Das lokale öffentliche Node-Projekt und seine Test-/Mailadapter bleiben unabhängig, sein alter nativer Wunsch-POST ist gesperrt.

Über `/mw admin` → Verbindung den vorhandenen Schlüssel und die expliziten Freigaben verwenden. Keine neue URL oder zweiten Schlüssel einrichten. Der V2-Abgleich nutzt denselben festen nativen postURL-Port und dieselbe HMAC-Hülle. Aktivierte Bestandskonfiguration nicht unnötig erneut speichern. Private Betriebsdiagnose nennt nur technische Flags/HTTP-Fristen und keine Schlüssel, Signaturen, Namen oder Wunschtexte.

## Originalbestand übertragen

Zuerst in der zentralen Verwaltung einen Import für den passenden nativen Namensraum vorbereiten. Danach ausschließlich als echter Inhaber unter Verbindung → Originalbestand übertragen den vorbereiteten Export starten. Statuslesen allein startet nichts. Export anhalten bleibt reversibel; Originale und eingefrorener Bestand bleiben bestehen. Derselbe Chunk wird bis zur exakten Digestquittung wiederholt.

Nach dem letzten Chunk steht die zentrale Gesamtverifikation noch aus. Neue Wünsche bleiben bis zur ausdrücklich zentral umgeschalteten neuen Studio-Protokollepoche gesperrt. Es gibt keinen automatischen Cutover aus einem lokalen Exporterfolg. Ein veränderter Originalbestand, insbesondere Nutzerlöschung, verlangt einen neuen gebundenen Importstand; dauerhafte zentrale Ownersperren verhindern Wiederbelebung.

Die Originale bleiben privat und ohne Fachautorität gespeichert. Produktiver Freeze, Gesamtverifikation, Umschaltung und gezielte spätere Bereinigung benötigen einen eigenen Auftrag und Gesamtbeleg. station.authority=studio allein erlaubt keine irreversible Löschung. Aktuelle lokale Nachweise stehen im [Prüfbericht](../pruefung/PRUEFBERICHT.md), offene native/produktive Schritte in [LIVE-Abnahme](LIVE-ABNAHME.md).
