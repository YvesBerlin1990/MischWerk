# MischWerk – technische Abnahme und Datenhaltung

Lokaler Stand 0.1.106 mit RadioKing. Zuletzt im echten App-Log beobachtet: LIVE 0.1.103 mit leerer Radiooberfläche. Weiterhin kein Upload/Update/Neustart ohne erneute ausdrückliche Nutzeranweisung.

Vorhang 0.1.103 nach einem später autorisierten vollständigen Upload mit getrennten echten Nutzern prüfen: normaler Hörer zunächst verhüllt, Otterchen und Polaroid unverhüllt. Nur Otterchen als Channelinhaber sieht Vorhang öffnen/schließen; beide Richtungen aktualisieren alle Radioleisten und bleiben nach Neustart erhalten. Vorwertfehler dürfen keinen fremden Zustand überschreiben. Werbung startet/stoppt nur nach lokalem Hörer-Klick, lädt die eigene MP3 erst dann und verändert den Vorhang nicht. Audioende öffnet nichts; das globale Umschalten unterbricht keine laufende Wiedergabe. MP3, server/radio/curtain.js und alle Manifestdateien vollständig übertragen. Native Audiofreigabe in K3/STAPP bleibt Bestandteil der echten Abnahme.

Ladeoptimierung 0.1.102 nach späterem vollständigem Upload separat echt prüfen: erster Channelbeitritt, erneuter Beitritt mit Cache und erster Aufruf nach Appupdate. Die Radioleiste benötigt nur ihren eigenen Ladeplan; vier Popupaktionen einschließlich aller Rollen und unabhängiger Audiowiedergabe prüfen. Logo darf nachladen, seine Fläche bleibt reserviert. Lokale Browserprüfungen ersetzen keine Zeitmessung des Knuddels-Plattformstarts.

Seit 0.1.94 erneuert der Updatebefehl nach erfolgreichem Dateiabruf auch bei leerer Dateiliste den dokumentierten Oberflächen-Cache. Beim Appstart erfolgt dies vor dem Öffnen der Ansichten. Fehlende neue Dateien lösen weiterhin keinen Neustart aus. Laufende Version im App-Log prüfen und Radio-Team → Statuszentrale schließen und neu öffnen. Vollständiges Paket und korrektes FTP-Ziel bleiben Voraussetzung.

## Appmanager-Befehl ab 0.1.36

Nach einmaligem vollständigem Einspielen und Aktualisieren auf 0.1.36 können Appmanager sowie Channelinhaber im Channel `/update` eingeben. Bei späteren Versionen zuerst alle Dateien des neuen Manifests einschließlich `server/` vollständig hochladen und den Abschluss des FTP-Programms abwarten, dann `/update` verwenden. Der Befehl übernimmt mit `updateAppFiles()` die auf dem Knuddels-FTP angekommenen Änderungen. Nur wenn die API mindestens eine neue Datei meldet, wird das vollständige Update mit Neustart angefordert; andernfalls bestätigt MischWerk, dass keine neuen Dateien gefunden wurden, und läuft ohne Neustart weiter. Die Prüfung erkennt keinen noch unvollständigen Upload, deshalb bleibt die vollständige Manifestübertragung zwingend. Die gemeldeten Sekunden sind eine Schätzung; bei Serverlast kann das Update später erfolgen. Ein bereits angeforderter Auftrag wird nicht wiederholt angelegt. Die laufende Wunschqueue bleibt bis zum tatsächlichen Neustart nutzbar und beginnt danach leer. Persistente Einstellungen und Radio-Team bleiben erhalten.

„Erledigt“ entfernt im Moderationsmenü einen gespielten Wunsch; „Verwerfen“ entfernt beispielsweise einen nicht verfügbaren Titel. Es wird jeweils nur die ausgewählte Wunsch-ID entfernt. Appmanager benötigen für diese Moderationsaktionen zusätzlich die Radiomoderatorrolle oder den Channelinhaberstatus.

Die aktuelle Nutzeranleitung steht ausschließlich unter [ANLEITUNGEN/INSTALLIEREN-LIVE.md](../../../ANLEITUNGEN/INSTALLIEREN-LIVE.md). Die [RadioKing-Einrichtung](../../../ANLEITUNGEN/RADIOKING-EINRICHTUNG.txt) beschreibt die öffentlichen Endpunkte. Backend-Quellmodule liegen unter `PROJEKT/src/backend/`; `PROJEKT/app/server/` enthält die erzeugten getrennten Laufzeitkopien, `main.js` nur den kurzen Einstieg. Fertiger Upload liegt unter `UPLOAD/MischWerk/`, ZIP und Prüfsummen unter `ANLEITUNGEN/Paket/` (jeweils relativ zum MischWerk-Hauptordner).

## Echte Abnahme

- Otterchen als tatsächlicher Channelbesitzer: Studio sichtbar, An-/Abmeldung möglich.
- Normaler Hörer: kein Studio; auch selbst gesendete Moderations-Events werden abgewiesen.
- Channel-CM: kein automatischer Studiozugriff. Als Channelinhaber das getrennte Radio-Team-Popup öffnen, einen existierenden Nick ernennen, Studiozugriff prüfen, wieder entfernen und den sofortigen Rechteentzug testen. Ernennung nach Neustart auf Persistenz prüfen.
- Zuerst einen YouTube-/sonstigen Link ablehnen lassen (Entwurf erhalten, kein Wunsch). Dann einen Wunsch als Interpret + Titel im einzigen Textfeld schicken: Der Hörer muss deutlich „Dein Musikwunsch wurde an die Moderation gesendet.“ sehen. Der Wunsch darf ausschließlich in der Warteschlange des Moderationsfensters erscheinen; dort richtigen Hörer-Nick und vollständigen Text prüfen und als Moderator bearbeiten. Andere Hörer dürfen weder Queue noch Historie sehen.
- Wunschbox schließen: Form und Backend müssen Wünsche ablehnen. Wieder öffnen und erneut prüfen.
- Im Studio Thema wie „80er und 90er“ speichern: in der Radioleiste anderer Hörer prüfen; Thema nach Neustart erhalten. Erfolgreich ausdrücklich abmelden: Thema muss ohne getrenntes Speichern bei allen Ansichten verschwinden, die Wunschqueue bleibt erhalten. Abgewiesene/fehlgeschlagene Abmeldung sowie automatisches Ende durch Verlassen, Ablauf oder Rechteverlust behalten das Thema. Feld leeren und speichern entfernt es weiterhin. Normalen Hörern keine Themenänderung erlauben; bei Fehler Entwurf erhalten.
- App neu starten: Wunschbox-Status und Thema bleiben erhalten; die flüchtige Wunschqueue beginnt leer.
- Echten Stream mit Klick starten, Lautstärke prüfen, stoppen und nach Netzwerkunterbrechung erneut starten.
- RadioKing-Senderstatus prüfen: `started` gibt Play frei, `stopped` zeigt „Sendepause“ und sperrt Play, ein unbekannter oder nicht erreichbarer Status erlaubt einen manuellen Hörversuch. Ein Wiederanlauf darf niemals automatisch Audio starten.
- Radiowiedergabe ohne Pegelanzeige prüfen: keine Balken oder Ruhe-/Ersatzmeldung, kein leerer reservierter Bereich. Titel/Interpret, kurze Lautstärke, Stummschaltung und tatsächlichen Wiedergabestatus testen. Popup-/Ansichtswechsel dürfen laufenden Ton nicht unterbrechen; Seitenende stoppt die Wiedergabe.
- Titelwechsel mit dem echten Sender vergleichen; Stream und Metadaten können zeitversetzt sein.
- K3 auf Desktop und Mobilgerät: kleine Ansicht, Tastatur, Scrollen, Channelwechsel, Hintergrundbetrieb und Schließen prüfen.

## Betrieb und Daten

Es gibt weder eine persönliche noch eine feste Gesamtanzahl-Begrenzung, keine Zwei-Wünsche-Grenze und keine Wartezeit. Während die App läuft, werden Wünsche serverseitig einzeln paginiert; ein App-Neustart leert diese Queue bewusst.

Wünsche werden nicht gespeichert. Die laufende Queue hält nur den authentifizierten Nutzer, dessen Nick, Wunschtext, Zeitpunkt und technische Übertragungs-ID im Arbeitsspeicher der App. Der Hörer erhält nur die direkte Versandbestätigung; Queue, Nick und Bearbeitung erscheinen ausschließlich für berechtigte Moderatoren im Moderationsfenster. Die Liste ernannter Radiomoderatoren speichert weiterhin ausschließlich numerische Knuddels-User-IDs in AppPersistence; sichtbare Nicks werden serverseitig aufgelöst. Die App verwendet keine Analyse- oder Trackingbibliotheken. Beim konfigurierten Sender gehen Stations-/Metadatenanfragen und beim Abspielen der Streamabruf an RadioKing.

Seit 0.1.34 besitzt die Wunschbox einen auf Rhino-Grundoperationen reduzierten Laufzeitweg aus reinen JavaScript-Werten. Das Frontend sendet `mw:wish.submit` mit `submissionId` und Text; das Backend reiht ID, Nick, Text und Zeitpunkt ohne AppPersistence- oder Java-Objekt ein und quittiert unmittelbar über `mw:wish.receipt`. Eine wiederholte `submissionId` erzeugt während der gesamten laufenden App-Sitzung keinen zweiten Wunsch. Nachgelagerte UI-Aktualisierungen können die Annahme nicht mehr in einen Fehler umwandeln. Backend und Frontend deshalb bei einem später freigegebenen Update gemeinsam vollständig hochladen und die App anschließend kontrolliert neu starten.

Eine Studio-Anmeldung läuft nach 6 Stunden aus. Sie weist aus, wer sich in dieser App angemeldet hat; sie erkennt keinen Encoder oder echten Sendebeginn bei RadioKing. Ein Moderatorwechsel in RadioKing muss auch im App-Studio übernommen werden.

Vor einem Produktivupdate AppPersistence sichern. `autoUpdate = false` ermöglicht einen kontrollierten Neustart nach vollständigem Upload. Die ausführlichen API- und K3-Regeln stehen dauerhaft in `AGENTS.md`.

## Sendung an den nächsten Moderator übergeben

Die aktive Moderation verwendet im Moderationsmenü den Button „Sendung übergeben“ direkt unter Anmeldung/Abmeldung in der Mikrofon-Karte, wählt einen anwesenden Radiomoderator aus und fragt die Übergabe an. Bis zur Annahme bleibt sie ON AIR. Der Nachfolger erhält einen privaten Hinweis und öffnet „Übergabe ansehen“. Dort kann er sein neues Sendungsthema bis 80 Zeichen eintragen und mit „Jetzt übernehmen“ bestätigen; leer lassen entfernt das bisherige Thema. Erst dann wechselt die App den angezeigten Moderator und sendet die gemeinsame öffentliche Botmeldung. Die Wunschliste und der Wunschboxschalter bleiben erhalten.

„Ablehnen“ und „Übergabe abbrechen“ ändern die bisherige Anmeldung nicht. „Zurück zum Studio“ lässt eine offene Anfrage bestehen. Bei Verlassen des Channels, Rechteverlust, Ablauf oder geänderter Moderationssitzung verfällt sie. Nach einem App-Neustart gibt es keine offene Übergabe mehr. Bei Speicherfehler kann der Nachfolger mit erhaltenem Themenentwurf erneut bestätigen. Der Channelinhaber kann weiterhin eine Moderation ausdrücklich beenden; die direkte Übernahme einer fremden laufenden Sendung ist gesperrt. Den Encoderwechsel führen die Moderatoren in ihrer Radiosoftware durch und bestätigen passend dazu in MischWerk.
