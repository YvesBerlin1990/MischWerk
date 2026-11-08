# MischWerk – Installation, Betrieb und STREAMPANEL

**App 0.1.305 · Build 305**, Stand 08.11.2026. Der Sendeplan öffnet ab heute für genau 14 Tage; der Inhaber behält die separate Wochenverwaltung. Automatische Anmeldungen zeigen volle Stunden und erscheinen für Hörer ab fünf Minuten Dauer. Normale und abgeschlossene automatische Einträge kann der Inhaber direkt mit „Entfernen“ bestätigen und löschen. Build 290 ergänzt lokal den kanonischen Lauftext in der Android-Senderprojektion; Veröffentlichung und native Abnahme dieses Builds sind offen. Das lokale Paket umfasst 131 Auslieferungsdateien und fünf Manifeste; der modulare App-Arbeitsbestand behält alle 149 Dateien. GitHub enthält Quellen und Nachweise; der erzeugte UPLOAD ist ausgeschlossen. Build 270 ist nativ mit HTTP 200/accepted:true und unabhängig exakt passendem Firestore-Zeitstempel bestätigt. Build 289 übernimmt Androidwünsche aus der erfolgreichen Statusantwort in dieselbe Queue und ist ohne WebHook/Relay-Schlüssel aktivierbar. Native Installation und regulärer Betrieb von 289 sind bestätigt: Publisher läuft, beide Flags true; aktuell ein Android-Wunsch empfangen/übernommen und vier technische Statusupdates bestätigt, keine Dubletten/Verwerfungen/ungültigen Einträge. Die Gegenseite hat pending → queued → Platz 1 in der normalen Android-App und Entfernung des pending-Auftrags unabhängig belegt. Nur echtes Vorrücken in einer späteren normalen Queue-Situation mit Vorgänger bleibt offen. Den vorhandenen Wunsch normal bearbeiten; kein neuer Build oder erneutes Speichern/Aktivieren nötig. GitHub-Veröffentlichung und Knuddels-Installation sind getrennt.

Radio bleibt eine Headerbar. Wunschbox, Moderation, Verwaltung und Sendeplan öffnen als getrennte Channel-Overlays; Menüwechsel ersetzen die Radioleiste nicht. [Aufbau](../architektur/ARCHITEKTUR.md) · [Verbindliche Projektregeln](../../AGENTS.md).

Otterchen kann als anwesender Channelinhaber den Sendeplan über die Taste der Appleiste zum Weiterarbeiten öffnen; der Hinweis „In Kürze“ entfällt dabei. Für andere Nutzer bleibt die Taste deaktiviert mit „In Kürze“. Ohne Verbindung oder während eines laufenden Auftrags ist die Taste auch beim Inhaber gesperrt. Wunschbox und Radioregie bleiben über ihre vorhandenen Aktionen erreichbar.

## Begrüßung im MyChannel

Bei jedem echten menschlichen Channelbeitritt erscheint „Willkommen bei Radio MischWerk, {Nick}. Viel Spaß beim Zuhören.“ Der erste Begrüßungssatz erscheint größer, fett und im Goldton #e6c77b der Appleiste; „Viel Spaß beim Zuhören.“ folgt mit einem Leerzeichen in normaler Channelschrift. Die Nachricht enthält keinen erzwungenen Zeilenumbruch. Nick und Foto öffnen über native Profillinks dasselbe Nutzerprofil. Das vorhandene Profilfoto steht ganz am Ende, nach dem letzten Punkt und einem Leerzeichen. Die kleine Anfrage beträgt weiterhin 24 × 24 Pixel. Für normale User, MCM, Radio-Team und Inhaber gilt derselbe Text. Die bisherigen 30 Sätze und die Zufallsauswahl sind entfernt. Ohne nutzbares Foto bleibt der Text erhalten; bereits Anwesende erhalten beim Appstart keine nachträgliche Meldung.

Text und Fotoausgabe liegen in `src/backend/users/greetings.js`. Die Begrüßung verändert keine Apprechte und meldet niemanden im Studio an. Die tatsächliche native Fotoanzeige und Bildgröße bleiben nach Installation zu prüfen. Eine lokale Bereitstellung führt selbst keine echte Nachricht oder Installation aus.

## Channel-Thema setzen

Im MischWerk-Channel **`/settopic TEXT`** eingeben, beispielsweise `/settopic Willkommen bei Radio MischWerk!`. Nach erfolgreicher Änderung erscheint eine private Bestätigung. Der Befehl verwendet das native Channel-Thema; Sendungsthema und Lauftext sind eigene Einstellungen. KCode wird unverändert übernommen. Der Themeneditor kann eine kleinere Eingabegrenze anzeigen als der API-Weg. Rechte, Zeichenlimit und Fehlerverhalten stehen zentral in [AGENTS.md](../../AGENTS.md#natives-channel-thema).

Nach Installation von Build 286 als Otterchen im MischWerk-Channel eingeben:

```text
/settopic --buttons
```

Der Befehl erzeugt den Radiotext samt drei Buttons unmittelbar im Backend; der lange KCode muss nicht mehr in die Chat-Eingabe eingefügt werden. Die Vorlage fordert eine mittige Ausrichtung an, mit goldenem Sendernamen, neutralhellgrauem Spruch und drei gleich großen neutral anthrazitfarbenen Buttons. Die oliv wirkende Goldtönung der Flächen ist entfernt. Sie übernimmt die bereits fette native Themenschrift ohne zusätzliche Unterstriche. Der vollständige Themeninhalt endet mit `°#r°°>LEFT<°` für nativen Zeilenumbruch, Farbreset und Links-Reset. Die tatsächliche Zentrierung und normale Position/Formatierung der nächsten Chatzeile müssen in der StApp separat bestätigt werden. Der Befehl muss nach dem Update erneut eingegeben werden, um das bereits gespeicherte Thema auf die neue Gestaltung umzustellen. „Readme setzen“ trägt bei der klickenden Person „Ich höre Radio MischWerk.“ als neue Readme ein und ersetzt damit ihre bisherige Readme.

Eigene Texte mit eigenen Buttons lassen sich weiterhin unmittelbar über `/settopic TEXT` übergeben; `--buttons` ist nur die fertige Vorlage. Ein kurzes Syntaxbeispiel für einen eigenen Button:

```text
/settopic Radio MischWerk °>{button}Channelinfo||call|/info|color|44,44,44~26,26,26~36,36,36<°
```

Beschriftung und call-Ziel können im selbst geschriebenen KCode angepasst und mehrere vollständige Elemente hintereinander gesetzt werden. Für eigene native Zeilenumbrüche die vollständige Anweisung `°#r°` verwenden; der freie Textweg führt keine ChannelMaster-artige Normalisierung durch. Die bestätigte Anzeige der serverseitigen Radio-Vorlage ist von einer noch zu prüfenden manuellen Eingabe im jeweiligen Client zu unterscheiden.

Die private Antwort nennt das Rückleseergebnis. „Rücklesen unverändert. Button-Elemente: 3 von 3“ bedeutet, dass Knuddels denselben Text zurückliefert; sichtbare Darstellung und Klickwirkung sind damit nicht bestätigt. Liefert Knuddels veränderten Text oder weniger Elemente zurück, nennt die Antwort die Abweichung. Ohne erneutes Setzen kann `/settopic --pruefen` die aktuell gespeicherte Zeichen- und Buttonzahl anzeigen. Ein späterer Channelbeitritt kann dann mit dem Speichernachweis verglichen werden. Es wird kein Thema beim Start oder Update automatisch gesetzt. Verbindliche Einzelheiten und Clientgrenzen stehen in [AGENTS.md](../../AGENTS.md#natives-channel-thema).

## Lauftext unter der Appleiste

Unter **Radioregie → Lauftext** den Reiter öffnen. Nur bestehende Radiomoderation einschließlich des automatisch berechtigten Inhabers darf ändern; normale User, MCM und Appmanager erhalten keinen Zugriff.

Der Editor verwendet kompakte Felder ohne äußere Scrollleiste. Bei niedrigen Fenstern führen **Zurück/Weiter** durch Text, Anzeigeoptionen und Rückmeldung/Aktionen. Verwerfen oder aktuellen Stand laden kehrt zum sichtbaren Textfeld zurück.

Text bis 300 Zeichen eingeben, Tempo Langsam/Normal/Zügig und Laufrichtung wählen, Ein/Aus setzen und **Speichern**. Erst die erfolgreiche Quittung veröffentlicht die Werte senderweit. Die Einstellungen bleiben nach App-Neustart erhalten. Der Anfangszustand ist leer und aus; Einschalten braucht Text. Ausschalten erhält Text, Tempo und Richtung.

Bei gleichzeitiger Bearbeitung bleibt der eigene Entwurf erhalten; **Aktuellen Stand laden** übernimmt den bestätigten Stand. Fehler oder Schließen verwerfen den Entwurf nicht. Die goldene Pause-Taste mit zwei deutlichen Balken hält nur die eigene Anzeige an; das anschließend sichtbare Play-Dreieck setzt den Lauftext fort. Reduzierte Bewegung zeigt den Text statisch umgebrochen. Die ursprüngliche Appleiste einschließlich Logo-Einblendung bleibt erhalten. Der Übergang zur Laufleiste hat gerade seitliche Kanten und eine gemeinsame gerundete Außenkontur. Die eingeschaltete Laufleiste schließt ohne Zwischenstreifen an diesen Rahmen an und verwendet dieselbe Schriftpalette auf einfarbigem dunklem Grund ohne Muster. Der Lauftext ist 20 px groß, auf schmalen Ansichten bis 700 px 18 px, und sitzt vertikal mittig in der weiterhin 44 px hohen Zeile. Bei laufendem Radio liegt der Glow um die gemeinsame Fläche und erhält unter der Laufleiste denselben weichen Auslauf wie früher. Der Abstand zwischen den Leisten bleibt unverändert. Die Kennzeichnung am Anfang lautet „Information“ und ist 16 px groß, auf schmalen Ansichten bis 700 px 14 px. Die Anzeige beeinflusst keine Wiedergabe.

Aktuelle lokale Ansichten: [Lauftext unter der Appleiste](../pruefung/oberflaeche/radio/lauftext-1280.png) · [Moderator-Einstellungen](../pruefung/oberflaeche/moderation/moderation-lauftext.png).

## Installation und Upload

Ausschließlich **C:/Users/Yves/Desktop/MischWerk/UPLOAD** verwenden. Darunter liegt der vollständige Appordner **MischWerk** mit app.config, main.js, server/ und www/. Die Projektwurzel enthält zusätzlich Quellen, Dokumentation und Git und gehört nicht auf den App-FTP. Keine ZIP erstellen oder entpacken.

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
| App öffnen | /mischwerk |

Passwörter ausschließlich im FTP-Programm eingeben. Die Entwickler-ID ersetzt kein Passwort. app.config verwendet den Entwicklernamen Otterchen; das bestätigte knuddelsDEV-Präfix der App-ID darf nicht aus dem LIVE-FTP-Host anders abgeleitet werden. [App-ID-Dokumentation](https://developer.knuddels.de/docs/classes/AppInfo.html).

Aus PROJEKT/ mit **node tools/build/prepare-upload.cjs** die Bereitstellung prüfen und den verbindlichen Desktop-Upload aktualisieren. **node tools/checks/upload.cjs** gleicht alle 127 Auslieferungsdateien einschließlich 58 Backendmodulen, Größen, SHA-256 und Textgrenzen mit den fünf Manifesten ab. Im App-Arbeitsbestand bleiben alle 145 Dateien erhalten. 16 vollständig gebündelte JS-Einzeldateien und zwei CSS-Einzeldateien entfallen ausschließlich im UPLOAD; ihre alten lokalen Kopien werden beim Paketbau gezielt entfernt. Die fachliche Ordnerstruktur bleibt erhalten. Der Build erzeugt keine zweite Uploadkopie und veröffentlicht nichts. main.js allein enthält keine App-Fachlogik. Tests, Referenzstubs, Dokumentation und Zugangsdaten gehören nicht ins FTP-Ziel.

Nach einem gesonderten Uploadauftrag:

1. In FileZilla mit den obigen Angaben verbinden. Rechts /ftp, links C:/Users/Yves/Desktop/MischWerk/UPLOAD öffnen. Den lokalen Ordner MischWerk nach /ftp übertragen. Direkt unter /ftp/MischWerk müssen main.js, app.config, server/ und www/ liegen; kein zusätzliches MischWerk/MischWerk. Fremde Appordner erhalten. Vor einem Produktivupdate bestehende Dateien und AppPersistence sichern.
2. Das Ende aller Manifestübertragungen abwarten, einschließlich www/audio/werbung.mp3 und sämtlicher server/-Module. Eine leere FileZilla-Warteschlange und erfolgreiche Übertragungen prüfen; anschließend kann noch Plattform-Synchronisationszeit nötig sein.
3. Bei Erstinstallation als Otterchen im eigenen Channel /apps öffnen, App installieren und 30807196.MischWerk eintragen. Knuddels ergänzt das bestätigte Präfix. Falls nötig den bestätigten AppBot einrichten; anschließend die App starten. Bei bestehender Installation den unten beschriebenen /update-Weg verwenden. Beim erstmaligen Wechsel von einem Stand vor 0.1.36 einmal über /apps aktualisieren.
4. Die tatsächlich gestartete Version im App-Log bestätigen: lokal ist 0.1.284 (Build 284) mit aktiver leerer dunkler Overlayabdeckung vorbereitet. Die Startmeldung enthält Version und Buildnummer sowie die Radioleiste mit vier Channel-Overlays. Radioleiste bei Bedarf mit /mischwerk erneut öffnen; bestehende Appansichten nach Updates schließen und neu öffnen.

Für eine ausdrücklich angeforderte Auslieferungsabnahme anschließend aus PROJEKT/ **pnpm run check:delivery --base-url https://apps8.knuddels.biz/apps/de2635007/** ausführen. Die hier am 03.11.2026 beobachtete öffentliche Basisadresse bei einem Appwechsel erneut prüfen. Das Werkzeug lädt ausschließlich öffentliche HTML-/JS-/CSS-Dateien lesend und vergleicht deren tatsächliche SHA-256 mit den reproduzierbaren gebündelten Auslieferungsbytes. Fehlende Dateien oder alte Fassungen liefern Exitcode 1; vollständig passende Dateien Exitcode 0. Keine Benutzer-/Sitzungsdaten oder Zugangsdaten angeben. Betriebsvorgaben bleiben zentral in AGENTS.md.

Die offizielle API übernimmt mit /update keine noch laufende Übertragung als vollständig. Meldet sie keine neuen Dateien, werden keine weiteren Dateien übernommen und kein Neustart erzwungen; dies beweist keinen vollständigen Upload. Dann Zielpfad, alle Dateien, tatsächliche Logversion und erneutes Öffnen nach Cacheerneuerung prüfen. Eine höhere lokale Versionsnummer überträgt keine Dateien.

Aktiver Entwicklerzugang und Channelbesitz sind Voraussetzung; Verifizierung und Entwickler-AGB erledigt der Kontoinhaber über /apps developer. Zielclients sind K3 und die aktuelle Knuddels-Desktop-App; JFX ist ausgeschlossen. iOS benötigt laut Plattform eine separate gültige Apple Developer ID, keine Knuddels-Entwicklernummer. Die offiziellen Unterlagen empfehlen DEV vor LIVE; hier ist auf Nutzerauftrag LIVE vorbereitet, eine reale Abnahme bleibt separat.

[Projektstruktur](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur) · [Erste Schritte](https://github.com/knuddelsgmbh/UserApps/wiki/Erste-Schritte) · [FAQ](https://github.com/knuddelsgmbh/UserApps/wiki/FAQ) · [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html) · [Entwicklerportal](https://developer.knuddels.de/).

## Appmanager-Befehl ab 0.1.36

Nach einmaligem vollständigem Einspielen und Aktualisieren auf 0.1.36 können Appmanager sowie Channelinhaber im Channel `/update` eingeben. Bei späteren Versionen zuerst alle Dateien des neuen Manifests einschließlich `server/` vollständig hochladen und den Abschluss des FTP-Programms abwarten, dann `/update` verwenden. Der Befehl übernimmt mit `updateAppFiles()` die auf dem Knuddels-FTP angekommenen Änderungen. Nur wenn die API mindestens eine neue Datei meldet, wird das vollständige Update mit Neustart angefordert; andernfalls bestätigt MischWerk, dass keine neuen Dateien gefunden wurden, und läuft ohne Neustart weiter. Die Prüfung erkennt keinen noch unvollständigen Upload, deshalb bleibt die vollständige Manifestübertragung zwingend. Die gemeldeten Sekunden sind eine Schätzung; bei Serverlast kann das Update später erfolgen. Ein bereits angeforderter Auftrag wird nicht wiederholt angelegt. Die laufende Wunschqueue bleibt bis zum tatsächlichen Neustart nutzbar und beginnt danach leer. Persistente Einstellungen und Radio-Team bleiben erhalten.

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

## Moderation verwenden

- **Deine Sendung:** Anmeldung, Abmeldung, Thema, Wunschboxfreigabe und Übergabe.
- **Wünsche:** vollständiger Text, Absender, Empfang und manuelle Bearbeitungsstufen. Gespielt oder Verwerfen entfernt den ausgewählten Wunsch; das steuert keinen Encoder.
- **Heute gespielt:** verfügbare Titelmeldungen des Tages mit vollständigen Textseiten.
- **Lauftext:** Text für alle Hörer, Tempo, Richtung und Ein/Aus einstellen; speichern, Änderungen verwerfen oder bei einem Konflikt den aktuellen Stand laden. [Bedienung](#lauftext-unter-der-appleiste).

Eine Studio-Anmeldung gilt ohne Zeitlimit. Es gibt keine automatische Sechs-Stunden-Abmeldung, Verlängerung oder Zeitangaben im Moderationsmenü. Solange angemeldet, stehen Abmelden und Sendung übergeben bereit. Wiederholtes Anmelden verändert die Sitzung nicht. Verlassen oder Rechteverlust beendet die Anmeldung weiterhin. Ausdrückliche Abmeldung leert das gespeicherte Thema, automatisches Ende durch Verlassen/Rechteverlust erhält es. Ohne Thema zeigt die Appleiste MischWerk Radio Show als reinen Standardtext.

Die Radioregie startet mit 640 × 580 px und passt ihre Höhe an vollständige Bediengruppen an. Bei Clientgrenzen bleiben Gruppen-/Textseiten erreichbar. Themenbearbeitung erhält eine stabile Geometrie. Studioanmeldung und tatsächliche Anbieterübertragung sind unabhängige Zustände.

## Sendung an den nächsten Moderator übergeben

Die aktive Moderation wählt **Sendung übergeben**, einen anwesenden, im Radio-Team eingetragenen Empfänger oder Otterchen als automatisch berechtigten Channelinhaber und optional eine private Notiz bis 500 Zeichen. Bis zur Annahme bleibt sie aktiv. Der Nachfolger öffnet **Übergabe ansehen**, kann ein neues Thema eintragen und bestätigt mit **Jetzt übernehmen**. Erst dann wechseln Appstatus und öffentliche Botmeldung. Leeres Thema entfernt das bisherige Thema.

In sehr niedrigen Fenstern sind übergroße Bediengruppen mit Rad, Touch und Tastatur intern erreichbar. Die ausgewählte Gruppe bleibt bei Größenwechseln erhalten. Bei einer verlorenen Annahmequittung bestätigt erst der frische Serverzustand den Wechsel; fehlt nach einer echten Erfolgsquittung der Zustandspush, liest die Oberfläche einmal neu. Ohne Bestätigung wird kein Erfolg behauptet.

Ablehnen/Abbrechen ändern die Anmeldung nicht. Verlassen, Rechteverlust, Ablauf oder geänderte Moderationssitzung machen die Anfrage ungültig. Fehler erhalten den Entwurf; Wunschqueue und Wunschboxfreigabe bleiben erhalten. Encoderwechsel erledigen die Moderatoren selbst in ihrer Sendesoftware.

## Verwaltung und Bot-Texte

Otterchen öffnet die Verwaltung im MischWerk-Channel mit **/MW Verwaltung**. Der Verwaltungsknopf in der Appleiste entfällt. Geprüft werden der authentifizierte Nick, tatsächliches Channelinhaberrecht und Anwesenheit; Appmanager, Entwickler, Channel- und Radiomoderatoren erhalten keinen Zugang. Die Verwaltung verwendet 500 × 560 px und ihre Bereiche Radio-Team und Bot-Texte. Eine vorhandene Radioleiste mit laufendem Ton bleibt erhalten; eine fehlende Leiste wird regulär geöffnet. Beim Schließen kehrt der Fokus zu Sendeplan zurück.

Otterchen erhält als authentifizierter, anwesender Channelinhaber automatisch alle bestehenden Apprechte. Moderationsbutton und Übergabeempfang sind ohne Radio-Team-Eintrag verfügbar. Ein optionaler eigener Listeneintrag kann entfernt werden, ohne seine Rechte oder laufende Moderation zu beenden. Für andere Nutzer bleiben Ernennung und Entzug wie bisher. Nick, Appmanager-, Entwickler- oder CM-Rolle allein verleihen keinen Inhaberzugriff.

Unter **Bot-Texte** stehen bis zu sechs Texte mit je 300 Zeichen zur Verfügung. Automatisch senden ist zunächst aus; Abstände: 20, 30, 40 oder 50 Minuten. Gefüllte Texte laufen der Reihe nach, leere Felder werden übersprungen. Speichern beginnt einen vollen Abstand; verpasste Termine werden nicht nachgeholt. Eine Inhaltsfläche scrollt, Kopf/Reiter/Aktionen bleiben erreichbar.

## Tageshistorie verwenden

**Radioregie → Heute gespielt** ist nur für Channelinhaber und ernannte Radiomoderatoren verfügbar. Titelmeldungen gelten für heute in Europe/Berlin. Beim Öffnen erscheinen die neuesten Titel auf der letzten Seite; Zurück führt zu älteren, Weiter zu neueren Titeln. Lange Texte sind vollständig auf Fortsetzungsseiten lesbar.

Im sichtbaren Reiter wird nach Erfolg alle 15 Sekunden, nach Fehlern nach 60 Sekunden erneut gelesen. Geladene heutige Titel bleiben bei Fehlern erhalten; an Berliner Mitternacht beginnt die Liste neu. Rechteverlust beendet Abrufe und leert den Cache. Bekannte Senderjingles werden per vollständigem Titelvergleich ausgefiltert. Senderzeit und hörbarer Beginn können abweichen; kein vollständiges Tagesarchiv und keine privaten Musikwünsche.

## STREAMPANEL einrichten

Aktiver Anbieter ist STREAMPANEL/SPCast. Bestätigte öffentliche Höreradresse: **https://mischwerk.sp.radio.fm/stream**. Sie leitet beim Aufbau per HTTPS auf den eigenen SPCast-Stream weiter. Beim datierten Kontrolllauf am 05.11.2026 wurde MP3 mit 320 kbit/s empfangen; diese Momentaufnahme ist keine dauerhafte Verfügbarkeitsgarantie.

Konfiguration: `src/backend/config.js`, `MischWerkConfig.streampanel`.

| Feld | Bedeutung |
| --- | --- |
| `streamUrl` | Öffentliche HTTPS-Höreradresse |
| `allowedHosts` | Exakt erlaubte öffentliche Datenhosts |
| `metadata` | Getrennte Titel-/Interpretenfelder und ergänzende Modusquelle |
| `status` | SPCast-Statistik mit Stream-, Pfad- und Stationszuordnung |
| `historyUrl`, `historyIgnoredTitles` | Öffentliche Titelhistorie und vollständige Jinglefilter |

Statistik: `/statistics?json=1` am eigenen Hörerhost, Stream-ID 1 und `/stream`. Modus: `/scripts/whoIsLive.php`, ausschließlich `autodj`/`live`; andere Werte bleiben unbekannt. Titel/Interpret kommen aus dem tatsächlich eingebundenen öffentlichen SPCast-Playerdienst. Einmal fehlende Titel sind kein dauerhafter Istzustand. [Quellen und Schnittstellennachweise](../api/API-NACHWEIS.md).

Status, Modus und Metadaten steuern kein Audio. Keine zusätzlichen Statusabrufe bei Medienereignissen. Sichtbare Titel-/Modusabfragen regulär alle fünf Sekunden nach Abschluss, Status alle 30 Sekunden; Fehler und Sichtbarkeitswechsel werden getrennt behandelt. Eine Studioanmeldung bestätigt keinen Anbieter-LIVE-Modus.

Encoder-Host, Passwort, Benutzer und Mountpoint gehören nur in die Sendesoftware. Die App benötigt keine Anbieterzugangsdaten. `node tools/checks/streampanel.cjs` prüft die eigenen öffentlichen Quellen ausdrücklich lesend; kein automatischer Bestandteil des Radiohörens.

## Website

Die [Homepage](../../website/README.md) liegt außerhalb des Knuddels-UPLOAD. Appanschluss standardmäßig aus, bewusste Besitzerfreigabe nötig. Der Arbeitsbereich verwendet bestehende Rollen/Fachaktionen. Mailversand bleibt aus. Hosting, HTTPS und echte Kopplung separat abnehmen: [Anbindung](../../website/docs/ANBINDUNG.md).

[Sendeplan](SENDEPLAN.md) · [Lautstärke](LAUTSTAERKE.md) · [Native Abnahme](LIVE-ABNAHME.md).
# Private Android-Einrichtung ab Build 230

Der native Diagnosebefund aus Build 229 bleibt gültig. Build 230 ergänzt den eigenen Betreiber-Eingabeweg; erfolgreiche Sync-Speicherung und Statusabruf auf Knuddels sowie Firebase-Secret-Version 1 sind bestätigt.

1. Das vollständige lokale `UPLOAD/MischWerk` durch den Betreiber übertragen und aktualisieren. Als tatsächlicher, im Channel anwesender Inhaber `/mischwerk-relay einrichten` aufrufen. Eine andere offene Channelansicht zuvor schließen; laufendes Radio bleibt bestehen.
2. Zuerst den Sync-Schlüssel aus dem eigenen geschützten Schlüsselspeicher eingeben. Er muss mit `KNUDDELS_SYNC_SECRET` im Firebase Secret Manager übereinstimmen. Für den späteren Wunschversand kann ein anderer Relay-Schlüssel eingegeben werden. Keine Schlüsselwerte über Chat, gemeinsame JSON oder Quelltext austauschen.
3. Speichern und die Einrichtung erneut öffnen. Die Vorhandenseinsanzeigen müssen passen; bestehende Werte erscheinen nicht im Formular. Leere Felder erhalten bereits gespeicherte Schlüssel. Die Zieladresse ist fest vorgegeben.
4. Speichern legt die Werte ausschließlich im serverseitigen Schlüssel `mischwerk.android.private.v1` ab und setzt `enabled=false` sowie `runtimeVerified=false`. Ein vorhandener Relaylauf wird beendet. Der Dialog registriert keinen Hook, sendet keinen HTTP-POST und aktiviert nichts.
5. Nur das Ergebnis der Einrichtung zurückmelden, keine Schlüsselwerte. Nach sicherer Bereitstellung desselben Sync-Schlüssels auf Firebase-Seite kann der dortige Codex `publishKnuddelsState` gezielt bereitstellen. Echte native Header-/Payload-/Antwortprüfung, Freigabe und späterer Wunschversand folgen getrennt.

Die Anwendung verwendet dokumentierte Knuddels-Identitäten, Sitzungen, `Client.sendEvent`, `App.onEventReceived` und AppPersistence. Nur die eröffnete private Sitzung des aktuellen Channelinhabers ist berechtigt. Rolle/Anwesenheit, aktive Sitzung, Frist, Revision und Eingabeschema werden serverseitig erneut geprüft. Schließen, Rechteverlust, Channelverlassen und Shutdown entfernen die private Berechtigung. Die Anwendung schreibt Schlüssel weder in Logs noch in Statusantworten oder Browser-Storage. Eingabefelder werden vor dem Versand und bei Seitenende geleert. Der serverseitige Plattform-Speicher ist damit kein zusätzlich nachgewiesener verschlüsselter Secret-Vault; lokale Plattform-Fakes sind kein nativer Transportnachweis.

## Signierter Statusanschluss ab Build 270

### Regulärer Rückkanal ab Build 289

Nach Installation des aktuellen vollständigen UPLOADs in Knuddels `/mischwerk-relay einrichten` öffnen. Der bereits gespeicherte Sync-Schlüssel genügt; ihn nicht erneut eingeben und nicht erneut speichern. **Verbindung aktivieren** startet den vorhandenen signierten Publisher sofort und anschließend alle 20 Sekunden. Es gibt keine WebHook-Vorbereitung, zusätzliche Schlüsselübergabe oder Freischaltungsanfrage mehr. Die Wunschboxschaltung bleibt die echte Knuddels-Schaltung.

Die erfolgreiche Firebase-Antwort enthält bis zu zehn Wünsche. MischWerk übernimmt gültige neue IDs einmalig in die gemeinsame dauerhafte Queue und meldet im nächsten regulären POST queued/received samt echtem Platz zurück. Wiederholungen, Neustart und Antwortverlust erzeugen keinen zweiten Eintrag; Bearbeitung und Vorrücken stammen weiter aus derselben Regie. Android bleibt bis zur Quittung pending. Firebase setzt seine feste Drei-Minuten-Frist durch.

Danach `/mischwerk-relay status` ausführen und die private technische JSON-Antwort weitergeben. Sie enthält tatsächliche Flags, laufenden Publisher, ersten regulären POST mit wishesReceived sowie anonyme Übernahme-/Quittungszähler. Keine Schlüssel oder Wunschtexte weitergeben. Die Gegenseite übernimmt den echten Android-Durchlauf und Positionsnachweis. **Verbindung ausschalten** stoppt und speichert false; ein erneutes Speichern schaltet ebenfalls aus.

Die nachfolgenden Einmal-Prüfschritte beschreiben die historische Build-270-Abnahme und sind für die reguläre Aktivierung nicht erneut vorgeschaltet.

Der verbindliche Vertrag aus Brückenstand Revision 23 verwendet HMAC-SHA256 im Requestbody und ersetzt sämtliche bisherigen Header-/Probeheader-Aufträge. Bestehenden Sync-Schlüssel behalten; keine neue Eingabe oder Rotation erforderlich. Der vollständige Build 270 ist lokal unter dem festen Desktop-UPLOAD vorbereitet und geprüft.

Abnahmestand 06.11.2026: Build 270 ist installiert. Der angeforderte Einmaltest um 23:33:57.830 MEZ / 22:33:57.830 UTC wurde mit HTTP 200/accepted:true und errors:[] angenommen. stationUpdatedAt=1794004437830. station/current ist in der Firebase Console zur passenden Sekunde sichtbar; die Oberfläche zeigt keine Millisekunden. Firebase-Codex gleicht den gespeicherten Wert exakt ab und dokumentiert das Ergebnis in Revision 25. Dafür keinen weiteren Knuddels-Aufruf ausführen. Der Dauerbetrieb bleibt ausgeschaltet, bis die übrige Abnahme und ausdrückliche Freigabe vorliegen. Die folgenden Schritte beschreiben den allgemeinen Ablauf und sind für diesen bereits erfolgreichen Aufruf nicht erneut abzuarbeiten.

1. Den vollständigen Build durch den Betreiber installieren und als anwesender tatsächlicher Inhaber genau einmal `/mischwerk-relay http-pruefen` ausführen. Dieser neue Aufruf sendet den aktuellen Senderstatus mit den vier Strings payload, ts, nonce und sig ohne eigene Header. Keine Wünsche und keine Konfigurationsänderung.
2. Die vollständige private JSON-Antwort mit Appversion/Build, checkedAt, request.stationUpdatedAt und HTTP-/accepted-Ergebnis weitergeben. Der Bericht enthält weder Schlüssel noch Signatur oder Nutzlast. Erwartet: native-signed-status-post, HTTP 200 und accepted:true. Firebase gleicht station/current unabhängig mit exakt dem gesendeten Zeitstempel ab. Der Dauerbetrieb bleibt bis zur vollständigen Abnahme ausgeschaltet.
3. Bei Fehler zuerst den einmaligen Aufruf in Firebase zuordnen. Nur freigegebene Metadaten wie authMode, payloadPresent, tsPresent, nonceStringOk, sigPresent, sigLength, tsSkewBucket und requestContentType lesen. postURLs tatsächlicher nativer Content-Type ist noch nicht nachgewiesen; die Gegenstelle akzeptiert JSON und form-urlencoded, kein Multipart. Keine Body-/Signaturausgaben oder Formatvarianten auf Verdacht.

Der bestehende `/mischwerk-relay auth-pruefen` sendet bei Bedarf ebenfalls signierte Felder, aber payload `{}`. Ein 400 bestätigt nach dem festen Firebase-Vertrag erfolgreiche Authentisierung vor der Nutzlastvalidierung ohne Datenbankschreiben. Dieser Zusatztest ist für den jetzt angeforderten echten Statuslauf nicht vorgeschaltet. Beide Befehle teilen den bisherigen Port, 10-Sekunden-Timeout und 30-Sekunden-Abstand. Jeder neue Zustand und Heartbeat verwendet eine streng höhere Projektionszeit; nach über 45 Sekunden keine alte Nutzlast wiederholen.

## Historischer Headervergleich ab Build 265

Der folgende Ablauf beschreibt den bisherigen Nachweis und wird durch den signierten Vertrag ab Build 270 ersetzt. Keine weiteren Header-Proben ausführen.

Revision 21 bestätigt die bereitgestellte sichere Probeheader-Diagnose auf Firebase-Seite. Build 265 erweitert `/mischwerk-relay auth-pruefen` um den gemeinsam vereinbarten harmlosen Zusatzheader und liest ausschließlich den HTTP-Status. Bestehende private Schlüssel bleiben erhalten. Den vollständigen lokalen UPLOAD wie gewohnt durch den Betreiber installieren. Dieser Arbeitsschritt enthält keine automatische FTP-Übertragung, Aktualisierung oder Neustartfreigabe.

Aktueller realer Abnahmestand: Build 265 ist durch den Betreiber installiert. Der einmalige Vergleich aus Revision 21 am 06.11.2026 um 21:27:45.399 MEZ ergibt HTTP 401. Über identische Trace eindeutig zugeordnete Firebase-Logs zeigen Authorization=false, Bearer=false, Tokenlänge 0 und Probeheader=false. Der geprüfte konkrete Quellaufruf setzt beide Einträge im dokumentierten header-Objekt; eine sichere Korrektur ist nicht belegt. Vor weiteren Tests tatsächliche Headerunterstützung des AppServers klären. Keine weitere identische Probe, Formatvariante oder Statusübertragung ausführen. Die folgenden Schritte beschreiben den allgemeinen Abnahmepfad nach Klärung.

1. Als anwesender tatsächlicher Channelinhaber einmal `/mischwerk-relay auth-pruefen` ausführen. Der Test sendet nur `{}` als payload-String mit dem vorhandenen Sync-Schlüssel und dem vereinbarten Zusatzheader im dokumentierten header-Objekt an die feste Hosting-Adresse. Keine Senderdaten oder Wünsche, kein Konfigurationsschreiben.
2. Private JSON-Antwort mit tatsächlicher Appversion, Buildnummer und checkedAt weitergeben. Keine Schlüssel- oder Headerwerte. Build 265 meldet `native-header-probe-post`; bodyRead/jsonParsed bleiben false und Antwortadress-/Bodyvergleich null, weil nur der Statuscode gelesen wird. HTTP 400 und `authenticationAccepted=true` bestätigen den vereinbarten Auth-Statusvertrag für die leere Nutzlast. 401 oder unerwarteter 200 sind kein Erfolg. Die Gegenstelle liest dazu ausschließlich authorizationHeaderPresent, bearerPrefixPresent, deliveredTokenLength und probeHeaderPresent aus den zugehörigen Firebase-Logs.
3. Erst nach dieser Auswertung, bestätigter Authentisierung und mindestens 30 Sekunden Abstand genau einmal den nachfolgenden Statusbefehl ausführen. Danach `station/current` unabhängig prüfen. Bei 401 den Probeheaderbefund zur Eingrenzung verwenden und keine weiteren Varianten oder Wiederholungen auf Verdacht senden. Ohne vollständige Nachweise bleibt der Dauerbetrieb ausgeschaltet.

Der Auth-Test verwendet denselben physischen HTTP-Port und Prüf-Timeout wie der Statusbefehl. Ein nach zehn Sekunden logisch abgelaufener Auftrag hält den Port bis zum echten nativen Callback belegt. Speichern, Verlassen, Rechteverlust und Shutdown verhindern verspätete Bestätigungen. `firestoreWriteConfirmed` bleibt im privaten Bericht unbekannt; Auth-Erfolg ist keine Status-/Firestore-Abnahme.

## Einmalige native Statusprüfung ab Build 240

Firebase-Brückenstand Revision 16 meldet `publishKnuddelsState` einschließlich sicherer Auth-Fehlerdiagnose als bereitgestellt. Build 240 ist durch den Betreiber installiert und nativ geprüft. Der Test vom 06.11.2026 13:02:40.346 UTC ergibt HTTP 401; zeitlich zugehörige Function-Logs zeigen keinen Authorization-Wert, kein Bearer-Präfix und Tokenlänge 0. Der Headerpfad muss vor einer weiteren identischen Probe geklärt werden. Dafür ist derzeit kein neuer FTP-Upload erforderlich. Der allgemeine Abnahmepfad bleibt:

1. Als tatsächlicher anwesender Channelinhaber `/mischwerk-relay http-pruefen` ausführen. Der Befehl sendet einmal die aktuellen Senderdaten an `https://radio-mischwerk.web.app/api/publishKnuddelsState` und kann damit `station/current` in Firebase aktualisieren. Keine Testsenderdaten und keine Wünsche.
2. Die private JSON-Antwort abwarten, spätestens nach zehn Sekunden. `nativeResponseAccepted=true` bestätigt HTTP 200, angenommene JSON-Antwort und passende Serverzeit. Der Bericht enthält den gesendeten `stationUpdatedAt`-Zeitstempel, Callbackart und Ziel-/JSON-Prüfung; keine Schlüssel oder Antwortrohdaten.
3. Auf Firebase-Seite `station/current` mit genau diesem Zeitstempel und echten Zustandsfeldern vergleichen. `firestoreWriteConfirmed` bleibt im Knuddels-Bericht unbekannt (`null`), bis diese unabhängige Folgeprüfung vorliegt.
4. Erst danach eine ausdrückliche Betriebsfreigabe vorbereiten. Der Einmaltest schreibt weder Konfiguration noch `enabled/runtimeVerified`, registriert keinen Hook und startet keinen Heartbeat. Nach Fehlern frühestens nach 30 Sekunden erneut testen; ein physisch noch hängender nativer Auftrag bleibt gesperrt.

Ein neuer Schlüssel ist dafür nicht erforderlich. Bestehende Sync-Konfiguration bleibt erhalten, der Wunsch-Schlüssel ist für diesen Einzeltest optional. Lokale Node-/Rhino-/Emulatorprüfungen ersetzen weder den echten POST noch die Firestore-Folgeprüfung.
