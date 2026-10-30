# MischWerk – technische Abnahme und Datenhaltung

Lokaler Stand 0.1.28 mit RadioKing, zuletzt bestätigtes LIVE 0.1.13. Weiterhin kein Upload/Update/Neustart ohne erneute ausdrückliche Nutzeranweisung.

Die aktuelle Nutzeranleitung steht ausschließlich unter [ANLEITUNGEN/INSTALLIEREN-LIVE.md](../../ANLEITUNGEN/INSTALLIEREN-LIVE.md). Die [RadioKing-Einrichtung](../../ANLEITUNGEN/RADIOKING-EINRICHTUNG.txt) beschreibt die öffentlichen Endpunkte. Backend-Quellmodule liegen unter `PROJEKT/src/backend/`; `PROJEKT/app/main.js` ist das daraus erzeugte Laufzeit-Bundle. Fertiger Upload liegt unter `UPLOAD/MischWerk/`, ZIP und Prüfsummen unter `ANLEITUNGEN/Paket/` (jeweils relativ zum MischWerk-Hauptordner).

## Echte Abnahme

- Otterchen als tatsächlicher Channelbesitzer: Studio sichtbar, An-/Abmeldung möglich.
- Normaler Hörer: kein Studio; auch selbst gesendete Moderations-Events werden abgewiesen.
- Channel-CM: kein automatischer Studiozugriff. Als Channelinhaber das getrennte Radio-Team-Popup öffnen, einen existierenden Nick ernennen, Studiozugriff prüfen, wieder entfernen und den sofortigen Rechteentzug testen. Ernennung nach Neustart auf Persistenz prüfen.
- Zuerst einen YouTube-/sonstigen Link ablehnen lassen (Entwurf erhalten, kein gespeicherter Wunsch). Dann einen Wunsch als Interpret + Titel im einzigen Textfeld schicken: zunächst „gespeichert“. Im Moderationsfenster richtigen Hörer-Nick und vollständigen Text prüfen; danach muss der Absender „An [Moderator-Nick] übergeben“ sehen. Ein geschlossenes Studio darf keine Zustellung bestätigen. Mit anderem Hörer Vertraulichkeit prüfen, als Moderator bearbeiten.
- Wunschbox schließen: Form und Backend müssen Wünsche ablehnen. Wieder öffnen und erneut prüfen.
- Im Studio Thema wie „80er und 90er“ speichern: in der Radioleiste anderer Hörer prüfen; Thema nach Neustart erhalten. Feld leeren und speichern: Anzeige muss verschwinden. Normalen Hörern keine Themenänderung erlauben; bei Fehler Entwurf erhalten.
- App neu starten: Wunschbox und offene Wünsche müssen erhalten bleiben.
- Echten Stream mit Klick starten, Lautstärke prüfen, stoppen und nach Netzwerkunterbrechung erneut starten.
- RadioKing-Senderstatus prüfen: `started` gibt Play frei, `stopped` zeigt „Sendepause“ und sperrt Play, ein unbekannter oder nicht erreichbarer Status erlaubt einen manuellen Hörversuch. Ein Wiederanlauf darf niemals automatisch Audio starten.
- Radiowiedergabe ohne Pegelanzeige prüfen: keine Balken oder Ruhe-/Ersatzmeldung, kein leerer reservierter Bereich. Titel/Interpret, kurze Lautstärke, Stummschaltung und tatsächlichen Wiedergabestatus testen. Popup-/Ansichtswechsel dürfen laufenden Ton nicht unterbrechen; Seitenende stoppt die Wiedergabe.
- Titelwechsel mit dem echten Sender vergleichen; Stream und Metadaten können zeitversetzt sein.
- K3 auf Desktop und Mobilgerät: kleine Ansicht, Tastatur, Scrollen, Channelwechsel, Hintergrundbetrieb und Schließen prüfen.

## Betrieb und Daten

Seit dem lokalen Stand 0.1.14 werden Wünsche nach Bearbeitung entfernt und verfallen nicht mehr automatisch nach 24 Stunden. Es gibt weder die persönliche Zwei-Wünsche-Grenze noch eine zweiminütige Wartezeit. Die technische Gesamtkapazität bleibt bei 50 Wünschen; Listen werden serverseitig einzeln paginiert.

Gespeichert werden Knuddels-User-ID und Nick, ein freier Wunschtext und Zeitpunkt sowie Daten zur Erkennung wiederholter Übermittlungen. Nach bestätigtem Empfang im Studio kommen Moderator-ID, dessen Nick und Zustellzeit hinzu. Die Liste ernannter Radiomoderatoren speichert ausschließlich numerische Knuddels-User-IDs in AppPersistence; die sichtbaren Nicks werden serverseitig aufgelöst. Texte und öffentliche Empfangsquittung sind nur für berechtigte Moderatoren und den Absender sichtbar; interne User-IDs bleiben im Backend. Der Empfang im Fenster ist keine Lesebestätigung. Alte gespeicherte Wünsche bleiben lesbar. Gelöschte Knuddels-Nutzer werden über `onUserDeleted` aus Wunsch- und Radio-Team-Listen entfernt. Die App verwendet keine Analyse- oder Trackingbibliotheken. Beim konfigurierten Sender gehen Stations-/Metadatenanfragen und beim Abspielen der Streamabruf an RadioKing.

Wunsch und Wiederholungsschutz werden zusammen in der AppPersistence gespeichert. Der historische Feldname cooldowns bezeichnet im lokalen Stand nur noch die letzte Anfrage-ID pro Nutzer und erzwingt keine Wartezeit. Alte UserPersistence-Zeitstempel werden dafür nicht mehr gelesen. Anfrage-IDs erkennen erneut übermittelte Anfragen auch nach Bearbeitung. Bestätigungen enthalten Aktion und Anfrage-ID. Backend und Frontend deshalb gemeinsam vollständig hochladen und die App anschließend kontrolliert neu starten.

Eine Studio-Anmeldung läuft nach 6 Stunden aus. Sie weist aus, wer sich in dieser App angemeldet hat; sie erkennt keinen Encoder oder echten Sendebeginn bei RadioKing. Ein Moderatorwechsel in RadioKing muss auch im App-Studio übernommen werden.

Vor einem Produktivupdate AppPersistence sichern. `autoUpdate = false` ermöglicht einen kontrollierten Neustart nach vollständigem Upload. Die ausführlichen API- und K3-Regeln stehen dauerhaft in `AGENTS.md`.
