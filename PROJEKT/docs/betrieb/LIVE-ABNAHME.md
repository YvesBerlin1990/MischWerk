# MischWerk – LIVE-Abnahme

Lokaler Stand **0.1.106 mit RadioKing** ist nicht veröffentlicht. Uploadordner, ZIP und Manifest sind ausschließlich lokal vorbereitet. Zuletzt ausdrücklich im laufenden Knuddels-Fenster beobachtetes LIVE: **0.1.103**, Backend gestartet, Radioleiste leer. Der Startfehler ist mit der parserbasierten Knuddels-Dateieinbindung lokal reproduziert und in 0.1.104 korrigiert: includeJS/includeCSS während des Parsens, nur die Zusammensetzung nach DOMContentLoaded. Ohne neue ausdrückliche Freigabe erfolgen weder FTP-Upload noch Knuddels-Update oder Serverneustart.

## Bestätigtes LIVE-Ziel

- App-ID: `knuddelsDEV.30807196.MischWerk`
- Installations-ID: `30807196.MischWerk`
- Channel: `MischWerk`
- Besitzer: `Otterchen`
- FTP-Ziel: `/ftp/MischWerk` auf `appupload.knuddels.de`
- Im echten App-Log beobachtete LIVE-Version: `0.1.103` (Radioleiste leer; Korrektur 0.1.104 lokal)

Zugangspasswörter gehören weder in dieses Projekt noch in die App. Maßgeblich für einen späteren Upload sind [INSTALLIEREN-LIVE.md](../../../ANLEITUNGEN/INSTALLIEREN-LIVE.md), das aktuelle Manifest und die ZIP-Prüfsumme.

## Vor einem freigegebenen Update

- AppPersistence für Thema, Wunschbox-Status, Radio-Team und Studiozustand sichern. Die Wunschqueue ist ab 0.1.32 bewusst flüchtig.
- Prüfen, dass `UPLOAD/MischWerk/` ausschließlich die Laufzeitdateien des Manifests enthält, einschließlich aller Module unter `server/` (aktuell 80 Dateien).
- Quellcode, Uploadordner, ZIP, Manifest und SHA-256 gegeneinander prüfen.
- Alle 206 lokalen Tests plus die echte Rhino-Prüfung und `node tools/check.cjs` erfolgreich ausführen.
- Erst nach ausdrücklicher Freigabe alle Manifestdateien vollständig übertragen. Beim ersten Wechsel auf 0.1.36 einmal über die bisherige Appverwaltung aktualisieren; danach steht Appmanagern `/update` zur Verfügung.

## Offene echte Abnahme für 0.1.93

- Aktuelle Radioleiste: großes unverändertes Logo, plastische goldene Hauptaktionen und rote Verwaltungsaktionen sowie ausschließlich innerer weißer Wiedergaberahmen. Titel und Interpret untereinander; Sendungsangaben und native Lautstärke gemeinsam mittig. Höreraktionen ohne Verwaltung untereinander. Tatsächliche Breiten von 320 bis 3840 px einschließlich 699/700 und 1099/1100, feste 160-px-K3-Höhe und mobile Vollansicht prüfen. Langtexte und Lautstärke bleiben nativ scrollbar erreichbar. STAPP passt die natürliche Höhe bis 500 px an; in K3 keine HostFrame-Größenaufrufe. Keine eigene Skalierung.

- Fehlerkorrekturen 0.1.86: Bei fehlgeschlagenem Rechteentzug müssen laufende Moderation, Thema und Übergabe erhalten bleiben. Sendeplan nach erfolgreichem Speichern nur einmal bestätigen, auch wenn ein anderes Fenster geschlossen wurde. Termine bis exakt 00:00 ohne leere Fortsetzung. Tastaturfokus im Radio-Team bei Refresh erhalten; manuelles Aktualisieren in Radio-Team und Sendeplan nach Verbindungsverlust erreichbar.

- Titel und Interpret mit Unterlängen prüfen, etwa „Dancing In The Dark“ und „Bruce Springsteen“: Desktop und schmale Leiste, ein-/zweizeilige Angaben, mit und ohne Thema. Keine unten abgeschnittenen Buchstaben, keine Überlagerung mit Lautstärke oder Thema. Lokale Layout- und Bildnachweise stehen im aktuellen Prüfbericht; die echte Clientdarstellung ist gesondert abzunehmen.

- Headerstart auf echtem Knuddels-Desktop und K3 prüfen: Channelbeitritt einmal und kurz hintereinander, vorhandene Leiste erhalten, keine ungestaltete Zwischenansicht und kein zusätzlicher initialer Größenwechsel. Schmale/breite Darstellung und langsames Netz testen; Wunschbox-/Studiopopups dürfen die Leiste nicht ersetzen. Der native Rahmen beim erstmaligen Öffnen wird von Knuddels gesteuert und ist durch lokale Browser-Mocks nicht vollständig nachgebildet.

- Modularer Start: Alle `server/`-Dateien laden, Startmeldung 0.1.86 sichtbar, keine fehlenden Module. Appmanager führt `/update` ohne neue FTP-Dateien aus: verständliche Meldung, kein Neustart. Nach vollständig übertragenem Manifest meldet `/update` mindestens eine übernommene Datei, fordert das Update an und fängt einen weiteren Aufruf ab; Neustart erfolgt nach Knuddels-Planung. Hörer und bloßer Radio-/Channelmoderator werden abgewiesen. Diese echten Updateaktionen erst bei ausdrücklicher Freigabe ausführen.

- Besitzer: Studiozugriff, An-/Abmeldung, Verlängerung und Ablauf prüfen.
- Übergabebutton: in der Mikrofon-Karte direkt unter Anmeldung/Abmeldung über die volle Breite sichtbar, mindestens 40 px hoch, Kontur und Symbol erkennbar. Mit Tastatur öffnen und auf schmalem K3 mit langen Nicks auf vollständige Darstellung prüfen; Beschriftungen „Sendung übergeben“, „Übergabe läuft …“ und „Übergabe ansehen“ passend zum bestätigten Zustand.
- Studio-Übergabe mit zwei echten Accounts: anwesenden Radiomoderator auswählen, privaten Hinweis und Anfrage im Zielstudio prüfen. Erst nach „Jetzt übernehmen“ Moderator/Thema gemeinsam wechseln. Ablehnen, Abbrechen, veraltete Anfrage, Verlassen/Rückkehr beider Nutzer, Speicherfehler und Rechteentzug prüfen. Direkte Übernahme bleibt gesperrt; nach erfolgreicher Übergabe beendet das Verlassen des alten Moderators nicht die neue Sendung. Wünsche und Wunschboxstatus bleiben erhalten.
- Öffentliche Nick-Bot-Meldungen: Beide bestätigten Texte mit tatsächlichem Moderatornick beim An-/Abmelden im Channel sichtbar; bei bestätigter Übergabe genau eine kombinierte Meldung „{Bisheriger Nick} macht Platz im Studio – {Neuer Nick} ist jetzt live ON AIR bei Radio MischWerk!“. Verlängern/Refresh/Appstart ohne doppelte Begrüßung. Channel-Verlassen, Ablauf und Rechteentzug mit einmaliger Endmeldung; keine Verbindung zwischen lokalem Play/Stop und Botansage. Unicode-Mikrofon und Nicks mit KCode-Zeichen auf Desktop und K3 prüfen.
- Normaler Hörer: kein Studiozugriff; manipulierte Moderationsereignisse müssen abgewiesen werden.
- Channel-CM: kein automatischer Studiozugriff. Danach denselben Account als Radiomoderator ernennen, Studiozugriff verwenden, wieder entfernen und den sofortigen Entzug prüfen.
- Radio-Team: nur als Channelinhaber sichtbar/änderbar; unbekannten Nick ablehnen, Liste und Ernennung nach Neustart erhalten.
- Moderationsfenster: 780 × 680 px Ausgangsgröße und automatische Studio-/Wünsche-Reiter bei fester zu niedriger K3-Höhe prüfen. Restliche Überhöhe per Rad, Touch und Tastatur erreichbar; kein früherer Fußtext oder abgeschnittene Steuerungen. Radio-Team initial 560 × 560 px. Wunschbestätigung auch im festen 360-px-Popup unmittelbar sichtbar. Sendeplan zeigt nach Neuanlage/Bearbeitung den tatsächlichen Eintrag, auch auf Folgeseiten langer Tage.
- Wunschbox: „Aha – Take on me (Testwunsch)“ senden. Der Hörer muss über `mw:wish.receipt` sofort die gut sichtbare Meldung „Dein Musikwunsch wurde an die Moderation gesendet.“ erhalten; ausschließlich im Moderationsfenster darf der Wunsch in der Warteschlange erscheinen. Link ablehnen, echten Hörer-Nick prüfen, Wunsch bearbeiten und bei deaktivierter Wunschbox Frontend und Backend sperren. Im App-Log darf bei diesem Weg weder `WISH_QUEUE`, `WISH_APPEND` noch eine Speicherkennung erscheinen. Nach einem kontrollierten App-Neustart muss die Wunschqueue leer sein.
- Thema: speichern, bei anderen Hörern anzeigen, durch erfolgreiche ausdrückliche Abmeldung automatisch entfernen und nach Neustart auf Persistenz prüfen. Abgewiesene/fehlgeschlagene Abmeldung sowie Verlassen, Ablauf oder Rechteverlust dürfen es nicht löschen; Wünsche bleiben erhalten.
- Playersymbole: im Desktop-/K3-Client Playdreieck und zwei klar getrennte Pausenbalken in großer und kleiner Leiste prüfen. Beim Start/Stop passend umschalten, vollständige Darstellung und Tastaturbedienung erhalten.
- Lautstärke: ohne gespeicherten Wert und mit früheren 56/100 % mit höchstens 10 % starten. Manuell lauter regeln, Mute/Unmute und Nachladen prüfen; nach Stop und neuem Play wieder höchstens 10 %. Niedrigere Werte und stummen Start erhalten.
- Titelwechsel: mit real laufender Sendung prüfen, Titel/Interpret gemeinsam spätestens beim nächsten erfolgreichen Fünfsekundenabruf anzeigen. Rückkehr aus Hintergrund sofort aktualisieren, RadioKing-Quellenverzögerung und Stream-Puffer getrennt beurteilen. Keine API-Abrufe in Popups oder nach Schließen; keine Audiounterbrechung durch Metadatenfehler.
- RadioKing: `started`, `stopped`, unbekannten Status, Medienfehler, bewussten Play-Klick, Stop und Wiederanlauf ohne Autostart prüfen.
- Desktop-JX sowie K3/Web/Mobil: 320–3840 px, Tastaturbedienung, Popups, Channelwechsel, Hintergrund/Wiederaufnahme und vollständig erreichbare Darstellung prüfen.
- Mit einem zweiten echten Account Vertraulichkeit, echten Nick und Rechteabgrenzung bestätigen.

Die lokalen Browser-Mocks ersetzen diese Abnahme nicht. Der aktuelle technische Nachweis steht in [PRUEFBERICHT.md](../pruefung/PRUEFBERICHT.md). Separate Archive früherer Versionen werden auf Nutzerwunsch seit dem 31.10.2026 nicht aufbewahrt.

Sendeplan 0.1.55 zusätzlich echt prüfen: Neuanlage direkt über das Datum in der nächsten Woche, einem späteren Monat und im nächsten Jahr wählen; native Kalenderzellen dürfen nicht durch die aktuelle Woche gesperrt sein. Bei Datumswechsel Zielwoche laden, Entwurf erhalten und Speichern bis zur passenden Antwort sperren. Schnellen Wechsel, Fehler/Retry und Revisionskonflikt prüfen. Button über der Wunschbox, Wochen-/Datumswechsel, unabhängiges Popup ohne Audiostopp, Lesezugriff für Hörer und Schreibzugriff ausschließlich für den Channelinhaber. Sendungen speichern, ändern, löschen und nach Neustart wieder laden. Kleine Clientfenster und über Mitternacht laufende Termine einschließen. STAPP-Fenster wächst/schrumpft mit Sendungen; bis zur Bildschirmgrenze kein Leerraum. Bei fester K3-Höhe und langen Tagen alle Seiten erreichbar; überhohe Einträge und der Besitzereditor dürfen nativ scrollen. Besitzerformular mit Fehlern prüfen.

Fensterkorrektur 0.1.86 im echten Client prüfen: Moderation 780 × 680 px und Radio-Team 560 × 560 px ab Öffnung ohne nachträglichen Größenwechsel. Erster und erneuter Aufruf, langsames Netz und App-Update getrennt prüfen; lange Wünsche, Teamseiten, Rückmeldungen und Übergabe dürfen den Rahmen nicht ändern. Bei niedriger tatsächlicher Höhe alle Aktionen über Reiter und natives Scrollen erreichen.

Hörerzahl 0.1.86 echt prüfen: in allen Rollen und ohne Play sichtbar; nach erfolgreichem Abruf alle 20 Sekunden erneuern. Im RadioKing-Manager muss die öffentliche Freigabe unter Einstellungen/Sicherheit aktiv bleiben. Echte Null anzeigen; bei Fehlern nicht verfügbar und erneuter Versuch nach 60 Sekunden. Hintergrund, Popups und Seitenende ohne weitere Hörerabfragen; Ton bei Zählerfehler unverändert. Kein Zählen von Channelnutzern.

Höreranzeige 0.1.87 im echten Client prüfen: größere fette goldene Beschriftung auf dunklem Feld; auch bei 320 px Breite und mit nicht verfügbar vollständig lesbar und nativ erreichbar.

Hörerposition 0.1.88: Zahl direkt unter Play, keine sichtbare Bereit-/LIVE-Zeile oder Statuspunkt. Die Moderationsgruppe bleibt in der Musikkarte. Bei 320 × 160 px dürfen Hörersymbol/Zahl die Aktionsbuttons nicht überlagern. Play-Sperre und Tooltip bei Sendepause sowie Fehlerhinweise unverändert prüfen.

Statuszentrale 0.1.89 separat im echten Client abnehmen: Als Besitzer Radio-Team → Statuszentrale öffnen, Übertragung und Hörer-/Titeldaten samt Prüfzeit prüfen. Live-/AutoDJ-Titelstatus und Studio-Anmeldung getrennt ändern/beobachten, Konfliktanzeige prüfen. Keine Encodersteuerung durch MischWerk. Statuswechsel dürfen Radioaudio und Fenstermaße nicht beeinflussen. Zu Radio-Team zurückkehren und Hintergrundverhalten sowie Wiederverbindung prüfen. Nichtbesitzer erhalten weiterhin keinen Zugang. Echter Cross-Origin-Anbieterabruf lokal erfolgreich; Knuddels-Zustände im Nachweis sind ausdrücklich gemockt.

Kompakte Statuszentrale 0.1.90 im echten Client zusätzlich prüfen: alle neun Statuswerte bei 560 × 560 px und schmaler 320-px-Ansicht im normalen Zustand direkt sichtbar. Details & Prüfzeiten mit Tastatur/Touch öffnen, vollständige Titel-/Thementexte und Anbieterlink erreichen. Geöffnete Details bei automatischem Refresh erhalten. Konfliktwarnung bleibt ohne Aufklappen sichtbar. Erweiterte Texte dürfen vertikal scrollen, aber weder überlagern noch den nativen Rahmen vergrößern.

Statuspunkte 0.1.91 im echten Client prüfen: grüne bzw. rote Punkte direkt vor den Statuswerten, neutrale Punkte bei unbekannten/inaktiven Zuständen. Kartenränder stets neutral. Bei bestätigter Sendepause rote Punkte an Sendebetrieb und Übertragung; gültige Hörerzahl weiterhin eigener Befund. Breite/schmale Statuszentrale, Details und unveränderte native Fenstermaße prüfen.

Beschriftung 0.1.92: Übersicht und Details & Prüfzeiten zeigen „Offene Musikwünsche“. Anzahl, Statuspunkt und automatische Aktualisierung bleiben erhalten. Die längere Beschriftung bei 320 px prüfen.

Statuskopf 0.1.93: keine technische 30-/60-Sekunden-Zeile in der Hauptübersicht. Automatische Aktualisierung unter Details & Prüfzeiten, fehlende Einrichtung/Verbindung dort verständlich erklären. Beim Abruf zeigt der feste Button „Prüfe …“, danach „Jetzt prüfen“. Quelle RadioKing · Titelstatus und Warnungen bleiben sichtbar. Normale und schmale Ansicht sowie geöffnete Details bei Refresh prüfen.
