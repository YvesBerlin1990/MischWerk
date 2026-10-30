# MischWerk – technische Abnahme und Datenhaltung

Lokaler Stand 0.1.33 mit RadioKing, zuletzt im echten App-Log beobachtetes LIVE 0.1.32. Weiterhin kein Upload/Update/Neustart ohne erneute ausdrückliche Nutzeranweisung.

Die aktuelle Nutzeranleitung steht ausschließlich unter [ANLEITUNGEN/INSTALLIEREN-LIVE.md](../../ANLEITUNGEN/INSTALLIEREN-LIVE.md). Die [RadioKing-Einrichtung](../../ANLEITUNGEN/RADIOKING-EINRICHTUNG.txt) beschreibt die öffentlichen Endpunkte. Backend-Quellmodule liegen unter `PROJEKT/src/backend/`; `PROJEKT/app/main.js` ist das daraus erzeugte Laufzeit-Bundle. Fertiger Upload liegt unter `UPLOAD/MischWerk/`, ZIP und Prüfsummen unter `ANLEITUNGEN/Paket/` (jeweils relativ zum MischWerk-Hauptordner).

## Echte Abnahme

- Otterchen als tatsächlicher Channelbesitzer: Studio sichtbar, An-/Abmeldung möglich.
- Normaler Hörer: kein Studio; auch selbst gesendete Moderations-Events werden abgewiesen.
- Channel-CM: kein automatischer Studiozugriff. Als Channelinhaber das getrennte Radio-Team-Popup öffnen, einen existierenden Nick ernennen, Studiozugriff prüfen, wieder entfernen und den sofortigen Rechteentzug testen. Ernennung nach Neustart auf Persistenz prüfen.
- Zuerst einen YouTube-/sonstigen Link ablehnen lassen (Entwurf erhalten, kein Wunsch). Dann einen Wunsch als Interpret + Titel im einzigen Textfeld schicken: Der Hörer muss deutlich „Dein Musikwunsch wurde an die Moderation gesendet.“ sehen. Der Wunsch darf ausschließlich in der Warteschlange des Moderationsfensters erscheinen; dort richtigen Hörer-Nick und vollständigen Text prüfen und als Moderator bearbeiten. Andere Hörer dürfen weder Queue noch Historie sehen.
- Wunschbox schließen: Form und Backend müssen Wünsche ablehnen. Wieder öffnen und erneut prüfen.
- Im Studio Thema wie „80er und 90er“ speichern: in der Radioleiste anderer Hörer prüfen; Thema nach Neustart erhalten. Feld leeren und speichern: Anzeige muss verschwinden. Normalen Hörern keine Themenänderung erlauben; bei Fehler Entwurf erhalten.
- App neu starten: Wunschbox-Status und Thema bleiben erhalten; die flüchtige Wunschqueue beginnt leer.
- Echten Stream mit Klick starten, Lautstärke prüfen, stoppen und nach Netzwerkunterbrechung erneut starten.
- RadioKing-Senderstatus prüfen: `started` gibt Play frei, `stopped` zeigt „Sendepause“ und sperrt Play, ein unbekannter oder nicht erreichbarer Status erlaubt einen manuellen Hörversuch. Ein Wiederanlauf darf niemals automatisch Audio starten.
- Radiowiedergabe ohne Pegelanzeige prüfen: keine Balken oder Ruhe-/Ersatzmeldung, kein leerer reservierter Bereich. Titel/Interpret, kurze Lautstärke, Stummschaltung und tatsächlichen Wiedergabestatus testen. Popup-/Ansichtswechsel dürfen laufenden Ton nicht unterbrechen; Seitenende stoppt die Wiedergabe.
- Titelwechsel mit dem echten Sender vergleichen; Stream und Metadaten können zeitversetzt sein.
- K3 auf Desktop und Mobilgerät: kleine Ansicht, Tastatur, Scrollen, Channelwechsel, Hintergrundbetrieb und Schließen prüfen.

## Betrieb und Daten

Es gibt weder eine persönliche noch eine feste Gesamtanzahl-Begrenzung, keine Zwei-Wünsche-Grenze und keine Wartezeit. Während die App läuft, werden Wünsche serverseitig einzeln paginiert; ein App-Neustart leert diese Queue bewusst.

Wünsche werden nicht gespeichert. Die laufende Queue hält nur den authentifizierten Nutzer, dessen Nick, Wunschtext, Zeitpunkt und technische Übertragungs-ID im Arbeitsspeicher der App. Der Hörer erhält nur die direkte Versandbestätigung; Queue, Nick und Bearbeitung erscheinen ausschließlich für berechtigte Moderatoren im Moderationsfenster. Die Liste ernannter Radiomoderatoren speichert weiterhin ausschließlich numerische Knuddels-User-IDs in AppPersistence; sichtbare Nicks werden serverseitig aufgelöst. Die App verwendet keine Analyse- oder Trackingbibliotheken. Beim konfigurierten Sender gehen Stations-/Metadatenanfragen und beim Abspielen der Streamabruf an RadioKing.

Seit 0.1.33 besitzt die Wunschbox einen minimalen Laufzeitweg aus reinen JavaScript-Werten. Das Frontend sendet `mw:wish.submit` mit `submissionId` und Text; das Backend reiht ID, Nick, Text und Zeitpunkt ohne AppPersistence- oder Java-Objekt ein und quittiert unmittelbar über `mw:wish.receipt`. Eine wiederholte `submissionId` erzeugt während der laufenden App keinen zweiten Wunsch. Nachgelagerte UI-Aktualisierungen können die Annahme nicht mehr in einen Fehler umwandeln. Backend und Frontend deshalb bei einem später freigegebenen Update gemeinsam vollständig hochladen und die App anschließend kontrolliert neu starten.

Eine Studio-Anmeldung läuft nach 6 Stunden aus. Sie weist aus, wer sich in dieser App angemeldet hat; sie erkennt keinen Encoder oder echten Sendebeginn bei RadioKing. Ein Moderatorwechsel in RadioKing muss auch im App-Studio übernommen werden.

Vor einem Produktivupdate AppPersistence sichern. `autoUpdate = false` ermöglicht einen kontrollierten Neustart nach vollständigem Upload. Die ausführlichen API- und K3-Regeln stehen dauerhaft in `AGENTS.md`.
