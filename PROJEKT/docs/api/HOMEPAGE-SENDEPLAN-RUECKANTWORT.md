# Rückantwort: Homepage-Sendeplan und Radioteam · Build 308

Aktueller lokaler Paketstand: **Build 322** verwendet die SPCast-Historie als aktuelle Player-Titelquelle und enthält die Radio-Aktivitätskorrekturen aus Build 312. Er enthält die Wunschboxkorrektur aus 309, Lauftextschrift und Randmarker aus 310 sowie harmonisierte Radioanzeigen, kompaktere Lautstärke und kleinere Aktionen. Titelkonfiguration und Browserauswertung sind angepasst. Der hier nachgewiesene Vertrag aus Build 308 bleibt unverändert enthalten. Nach Installation Build 322 im privaten Status prüfen.

Stand: 08.11.2026. Die vom Betreiber ausdrücklich freigegebene Anforderungsfassung vom **03:10:26 Uhr Europe/Berlin** ist vollständig in **0.1.308 / Build 308** umgesetzt. Genau ein lokales Funktionspaket wurde erstellt; seine native Installation und gemeinsame Abnahme stehen aus.

Referenz: Knuddels-Anforderungen-Homepage-Sendeplan.md, SHA-256 **D244DBD5D6999EE962E2B52D2CBACD3780548638A773E8CE57511881E4285457**. Die Referenzdatei wurde nicht verändert. Die in dieser Fassung Firebase-seitig abgesicherten Randfälle sind geschlossen; dazu werden keine erneuten Antworten angefordert.

## Gelieferter Knuddels-Stand

- Bestehender signierter Status-POST, Sync-Schlüssel, vier signierte Strings, Senderstatus, Lauftext, Wunschqueue und 20-Sekunden-Takt bleiben erhalten. Keine neue URL, kein WebHook, Callable oder Timer.
- Keine scheduleUpdates/teamUpdates. Jeder reguläre POST meldet ausschließlich bekannte native scheduleRevisions für vorige/aktuelle/nächste Berliner ISO-Woche und optional moderatorRevision. Unbekannte Werte werden ausgelassen; Ergebnisrevisionen bleiben tatsächliche Ganzzahlen oder ausdrücklich null.
- Je höchstens ein exakt geformter Plan-/Teamauftrag wird ausschließlich aus einer frischen, passenden, angenommenen regulären Antwort übernommen. Keine Rollen-, Konto-, UID- oder E-Mail-Felder und keine zusätzliche Inhaberannahme. Native Clientaktionen behalten ihre bisherigen Rechteprüfungen.
- Stabile Firebase-String-ID wird dauerhaft auf die native Wochen-/Eintrags-ID abgebildet. Normalisierter vollständiger Bestandsvergleich: genau ein Treffer verknüpfen, kein Treffer regulär neu anlegen, mehrere Treffer fachlich ablehnen. Ein schon gebundenes Ziel darf nie einer zweiten Firebase-ID gehören. Bekannte fehlende Ziele werden nicht neu zugeordnet.
- Vorhandener Wochenadapter schreibt Mutation, relayBindings mit Zuordnung/Löschmarker und applied-Beleg in **einem Wochenobjekt**. Keine zweite Datenablage. Unbekannte und wiederholte Löschungen werden idempotent quittiert; Löschmarker bleiben dauerhaft. Zuordnungen und Löschmarker werden niemals mit dem 64er-Ergebniscache gekürzt. Speichergrenzen lassen Daten und Identität erhalten und täuschen keinen Erfolg vor.
- Teamaufträge nutzen die vorhandene native Nickauflösung, 50er-Grenze und denselben allgemeinen Commit. Bereits vorhandenes add und bereits fehlendes remove quittieren applied, ohne weitere Teamrevision, Abmeldung, Entfernung oder öffentliche Benachrichtigung. Tatsächlicher Entzug erhält die bisherigen Studio-/Inhaberschutzregeln.
- Im folgenden regulären POST höchstens zehn scheduleResults und zehn moderatorResults. Neue Ablehnungen enthalten validation, business_rule oder ausschließlich bei gültiger abweichender Revision revision_conflict. Fehlende/ungültige erwartete Revision ist validation. Technische Speicherfehler bleiben ohne falsche endgültige Quittung erneut zustellbar. Bekannte Auftragskennungen liefern das gespeicherte Ergebnis; angenommene POSTs bestätigen die übertragenen Belege flüchtig, Neustarts bieten sie erneut an.
- Native Inhaberaktionen, Minutenzeiten, Rechte, Wunschdaten und automatische Studioeinträge bleiben erhalten. Keine Migration, Gesamtlistenübernahme oder öffentliche Rückprojektion lokaler Inhalte. currentSong/currentArtist werden weiterhin nicht gesendet, auch nicht als null.

## Private Diagnose und Annahmen

/mischwerk-relay status ergänzt lastFailure mit exakt stage, httpStatus und atUtc. Die Stufen sind prepare, send, timeout, http_response, response_url, response_size, response_json, response_contract und command_storage. HTTP-Code nur, soweit tatsächlich bekannt, sonst null; Zeit als UTC-ISO. Diagnose enthält keine Inhalte, IDs, Nicks, URLs, Geheimnisse oder Exceptions. Der erfolgreiche erste reguläre POST und die bestehenden technischen Zähler bleiben erhalten.

Je eine Zeile zu den verwendeten nativen Annahmen:

- Native Identität ist das bestehende Paar aus ISO-Woche und numerischer Eintrags-ID; beide bleiben intern, Firebase-IDs bleiben dauerhaft eindeutig.
- Eine fehlende gespeicherte Woche besitzt den vom vorhandenen Adapter definierten echten leeren Stand mit Revision 0; unlesbare oder ungültige Stände werden niemals durch geschätzte Revisionen ersetzt.
- Gelöschte Firebase-IDs werden nicht reaktiviert; Wiederherstellung oder Wochenverschiebung verwendet nach dem vereinbarten Lebenszyklus eine neue stabile ID.
- Automatische Studioeinträge sind keine Erstübernahmekandidaten; aktive sowie noch nicht abgeglichene Studioeinträge behalten ihre vorhandenen Schutzregeln.
- Nicht festes Ende kommt als leerer String; Ganztags wird intern wie bisher als 00:00 bis 00:00 gespeichert, Open End mit leerem Ende.
- Vorhandene native Pflichtfelder bleiben Pflichtfelder: insbesondere ein gültiger ernannter Live-Nick beziehungsweise Inhaber und ein nicht leeres Thema; AutoDJ bleibt die bestehende eigene Sendeart.
- Eine bereits erfüllte Löschung oder Teamaktion erhöht die Fachrevision nicht; das dauerhafte Speichern ihrer technischen Quittung bleibt erforderlich.
- Der letzte Fehler bleibt nach Erholung und Stop/Start sichtbar; ein Appneustart beginnt mit lastFailure null. Es entsteht keine Diagnosepersistenz.
- Alte bereits gespeicherte Ablehnungsbelege ohne reason bleiben unverändert; ein historischer Grund wird nicht erfunden. Neue Ablehnungen enthalten den tatsächlichen Grund.
- Lokale/automatische Studioinhalte werden nicht öffentlich übertragen; die konkrete Titel-/Interpretenquelle ist weiterhin im Firebase-/Homepage-Projekt nachzuweisen und wird durch diesen Build nicht ersetzt.

## Lokaler Nachweis

475/475 Nodefälle bestanden, darunter 35 gezielte Plan-/Team-/Diagnosefälle. Zwei neue Gegenfälle scheiterten vor der Umsetzung am bisherigen Build 307 und bestehen jetzt. Beide verifizierten echten Rhino-Engines 1.7.7.2 und 1.9.1 bestehen jeweils 1160 Prüfungen einschließlich nativer Java-Strings/-Integer am HTTP-Port. Architektur, API-Signaturen, Quellen-/Runtimegleichheit und Grenzen sind geprüft.

Die Oberfläche ist gegenüber dem Beginn dieses Auftrags per SHA-256 **85/85 Dateien bytegleich**. Der bestehende Appbestand enthält 151 Dateien mit 64 Backendmodulen. Das eine fertige Paket liegt unter **C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/**: 133 Laufzeitdateien, davon 126 Texte, höchstens 9485 UTF-16-Zeichen; fünf konsistente Manifeste. Am fertigen Paket bestehen zusätzlich 5/5 Edge-Emulatorfälle für K3/STAPP-Wünsche, Audio/Entwürfe/Neustart, Parserstart, zwei Nutzer und Team-Popup. Details im [Prüfbericht](../pruefung/PRUEFBERICHT.md).

## Übergabe und gemeinsame Abnahme

Die Anforderungen zu Reihenfolge, Konfliktzähler, Wochenwechsel, ID-Lebenszyklus, Revisionspriorität, offenen Befehlen und Ausgangsbestand gelten gemäß 03:10-Fassung als Firebase-seitig abgesichert. Keine erneute Vertragsklärung oder weitere Freigabe ist dafür nötig. Die zuvor genannten Risiken sind Knuddels-seitig durch eindeutige dauerhafte Bindungen, atomare Commits, Fachregeln und präzise Ergebnisse abgesichert.

Nach Installation dieses Pakets gemeinsam den echten Datenfluss prüfen:

1. Privater Knuddels-Status nennt Build 322, aktiven Publisher und reguläre HTTP-200-/accepted-Annahme. Bestehende Schlüssel und Aktivierung nicht unnötig erneut speichern.
2. Tatsächliche native Revisionen kommen bei Firebase an. Eine beabsichtigte Homepageänderung liefert genau einen Auftrag und wird genau einmal nativ angewandt oder mit tatsächlichem Grund abgelehnt.
3. Passende Ergebnisquittung erreicht Firebase im nächsten regulären POST; ein offener Auftrag wird erst damit abgeschlossen. Eine erneute Zustellung erzeugt weder Dublette noch zusätzliche Fachrevision.
4. Homepage und Android zeigen den von Firebase geführten öffentlichen Zustand. Eine native Fachablehnung bleibt dort erkennbar und wird nicht allein wegen HTTP 200 als erfolgreiche Übernahme dargestellt.
5. Teamänderung sowie Änderung/Löschung derselben stabilen Sendeplan-ID verfolgen; native lokale/automatische Einträge und bestehende Wünsche bleiben erhalten. Dafür reale beabsichtigte Änderungen nutzen, keine erfundenen öffentlichen Sendungen oder unnötigen Testwünsche.

**Verbleibende Sorge für Firebase:** HTTP 200 bestätigt den Transport; eine fachlich abgelehnte Änderung darf in Homepage/Android nicht als vollständig synchronisiert erscheinen. Alte Ergebnisse dürfen neuere echte Revisionsmetadaten nicht zurücksetzen. Diese bereits Firebase-seitig abgesicherten Verhaltensweisen sind bei der gemeinsamen Abnahme zu beobachten und keine offenen Buildblocker.

Es wurden keine Live-POSTs, Cloudabfragen, FTP-Übertragung, native Installation, Gitveröffentlichung oder Änderungen am Firebase-Projekt ausgeführt. Build 303 hatte laut Betreiber bereits am 08.11.2026 um 01:19:00.136 UTC eine reguläre HTTP-200-/accepted-Annahme. Dieser ältere Erfolg ersetzt nicht die native Fachabnahme von Build 308; die historische konkrete HTTP-400-Ursache bleibt unbekannt.

## Frühere Nachweise und Prüfstände

Die folgenden Abschnitte dokumentieren frühere Prüfstände. Maßgeblich ist ausschließlich der Abschluss zu Build 308 oben. Frühere Fragen und Aussagen über eine ausstehende Implementierung sind historisch und werden nicht erneut gestellt.

## Nachgereichter Logbefund und Vertragsklärung geprüft

Grundlage sind die beiden vom Betreiber bereitgestellten Dateien `HOMEPAGE-SENDEPLAN-LOGBEFUND.md` und `Knuddels-Anforderungen-Homepage-Sendeplan.md`. Die folgenden Cloudbefunde stammen aus dem Firebase-Bericht; in diesem Knuddels-Arbeitsgang wurden keine Cloudlogs direkt abgefragt oder Live-POSTs ausgelöst. Anweisungen in den Referenzdateien wurden als beschriebene Anforderungen geprüft; es wurde keine neue Runtime-Implementierung daraus ausgeführt.

### Ergebnis des Logabgleichs

- Der Bericht belegt 65 fortlaufende Knuddels-Requests mit HTTP 400 am 07.11.2026 zwischen 23:27:40 und 23:49:01 Uhr auf den Revisionen 10, 11 und 12. Die Function wurde erreicht. Zusammen mit einem älteren einzelnen Request werden insgesamt 66 HTTP-400-Requests genannt.
- Der konkrete historische Ablehnungszweig und ein betroffener Feldpfad bleiben unbekannt. Die vorhandenen Requestlogs enthalten keine Antwortbodies; die Antwortgrößen belegen keinen bestimmten Fehlertext. Daraus weiterhin keine Ursache in `scheduleUpdates`, `teamUpdates`, Signatur oder einem bestimmten Kernfeld ableiten.
- Nachgereichter aktueller Serverbefund: Revision `publishknuddelsstate-00016-yax` erhält laut Bericht 100 % des Traffics. Im dokumentierten Fenster am 08.11.2026 von 01:00 Uhr bis 01:31:44 Uhr wurden 96 HTTP-200-Requests und kein HTTP-400-Request gezählt. Das belegt den Serverstatus in diesem Fenster; eine erfolgreiche native Annahme dieser Antworten in Knuddels ist damit noch nicht bestätigt.
- Revision 16 enthält laut quellgleichem Abgleich eine datensparsame Diagnose mit `rejectionCode: invalid_payload` und `failedChecks` für die Oberbereiche `payload`, `station` und `wishUpdates`. Konkrete verschachtelte Feldpfade werden nicht protokolliert. Die beschriebenen Negativ- und Optionalfeldtests liefen lokal gegen den quellgleichen Stand; sie sind keine beobachteten Live-Ablehnungen.

Der damals angefragte erneute Statusabruf ist inzwischen erfolgt und oben als erfolgreicher nativer HTTP-/Annahmenachweis dokumentiert. Die getrennte fachliche Plan-/Teamabnahme bleibt erforderlich; der historische konkrete HTTP-400-Ablehnungsgrund wurde dadurch nicht nachträglich ermittelt.

### Bisherige Vertragsfragen jetzt beantwortet

| Rückfrage aus der Fassung 00:53 | Antwort in der nachgereichten Fassung |
| --- | --- |
| Dauerhafte Eintragskennung | `scheduleCommands[].id` ist eine stabile Firebase-ID als String mit 1–128 Zeichen aus `A–Z`, `a–z`, `0–9`, `_`, `-`. `commandId` bleibt die einzelne Auftragskennung. Beispiele für Erstübernahme, Änderung und Löschung zeigen die tatsächliche Arrayform. |
| Erstübernahme vorhandener Sendungen | Exakt alle normalisierten Werte `week, date, kind, timing, start, end, nick, topic` vergleichen. Ein Treffer wird verknüpft, kein Treffer nach vorhandenen Regeln neu angelegt, mehrere Treffer abgelehnt. Der Betreiber richtet den Ausgangsbestand auf der Homepage ein; eine erfolgte Einrichtung ist dadurch noch nicht nachgewiesen. |
| Native Knuddels-Pflege und Studioeinträge | Bestehende Inhaberaktionen, Rechte, Bedienabläufe und automatische Studioeinträge bleiben unverändert lokal. Sie werden nicht in Homepage oder Android projiziert. Firebase führt den öffentlichen Inhalt. |
| Titel und Interpret | `currentSong` und `currentArtist` gehören ausdrücklich nicht in den Knuddels-Vertrag. Homepage und Android verwenden die vorhandene StreamPanel-Providerquelle. Ein eigener serverseitiger Firebase-Abruf ist laut Dokument weiterhin nicht belegt; Knuddels soll dafür keine Ersatzquelle aufbauen. |

Zusätzlich ist jetzt ein optionaler Ablehnungsgrund festgelegt: `reason: "revision_conflict"`, `"validation"` oder `"business_rule"`. Nur bei einem ausdrücklich gemeldeten Revisionskonflikt darf Firebase genau einen neuen Versuch mit aktueller Revision und neuer `commandId` ausstellen. Andere Ablehnungen und ein zweiter Konflikt bleiben endgültig. Diese neue Erweiterung ist im aktuellen Knuddels-Code noch nicht vorhanden.

### Noch umzusetzender Knuddels-Vertrag

Die bisherigen fachlichen Rückfragen sind damit für die weitere Implementierung geklärt. Build 304 enthält weiterhin die alte Vollprojektion. Ein künftiger gemeinsamer Funktionsbuild muss den Versand auf `scheduleRevisions` und `moderatorRevision` umstellen, `scheduleUpdates`/`teamUpdates` entfernen, die stabile Firebase-/Knuddels-ID-Zuordnung einschließlich gelöschter Zuordnungen ergänzen, erfüllte Teamzustände idempotent quittieren sowie höchstens zehn Ergebnisse je Bereich einschließlich der neuen Ablehnungsgründe ausgeben. Wunschweg, Senderfelder, Oberfläche, native Rechte und vorhandene Einträge bleiben erhalten.

Dieser Arbeitsgang umfasst Prüfung und Fortschreibung der Rückantwort. Kein neuer Build, keine Umsetzung der beschriebenen Änderungen, keine Migration, kein Rollout und keine erneute Behauptung eines bestätigten Gesamtdatenflusses. Die nachfolgenden Abschnitte dokumentieren den vorherigen Prüf- und Fehlerstand.

## Historischer Abgleich der Anforderungsfassung 00:53

Die damaligen Rückfragen und die damalige Feststellung fehlender Cloudbefunde sind durch die oben zusammengefassten Nachlieferungen aktualisiert. Insbesondere ist die frühere Anforderung optionaler Titel-/Interpretenfelder durch deren ausdrücklichen Ausschluss ersetzt.

Die neue Fassung verlagert die Führung des öffentlichen Sendeplans und Teams nach Firebase; gepflegt werden diese Inhalte ausschließlich auf der Homepage. Knuddels soll Einzelbefehle übernehmen und Revisionen sowie Ergebnisse zurückmelden. Das ersetzt den zuvor vereinbarten Export vollständiger öffentlicher Wochen-/Teamprojektionen. URL, Signatur, Schlüssel, Heartbeat, Wunschweg und Oberfläche sollen erhalten bleiben.

### Abgleich mit dem tatsächlich vorhandenen Code

| Bereich | Stand in Build 304 | Änderung laut Fassung 00:53 |
| --- | --- | --- |
| Sendeplan-/Teamexport | `android/projection.js` liefert weiterhin `scheduleUpdates` und `teamUpdates`. | Beide Vollprojektionen aus dem Relay-Body entfernen; vorhandene Knuddels-Daten erhalten. |
| Revisionen | `scheduleRevisions` und `moderatorRevision` werden noch nicht gesendet. | Echte Knuddels-Revisionen aus den vorhandenen Wochen-/Teamadaptern melden; laut Vorgabe nur das zugelassene Wochenfenster. |
| Aufträge und Quittungen | `android/commands.js` verarbeitet bereits beide Auftragsbereiche; der Publisher sendet `scheduleResults` und `moderatorResults` im nächsten regulären POST. | Vorhandenen Weg weiterverwenden. Die Aussage, diese Quittungen fehlten noch, trifft auf Build 303/304 nicht zu. Die aktuelle Ausgabelimitierung von 64 auf höchstens zehn Ergebnisse je Bereich reduzieren. |
| Eintragskennungen | Die Fachlogik erwartet derzeit eine numerische Knuddels-ID; 0 beziehungsweise fehlende ID legt einen neuen Eintrag an. Eine stabile Zuordnung von Firebase-Eintrags-IDs zu Knuddels-IDs fehlt. | Die geforderte Zuordnung und Übernahme eines eindeutig identischen vorhandenen Eintrags ergänzen, ohne bestehende Einträge pauschal zu ersetzen. |
| Team-Idempotenz | Ein bereits ernannter Nutzer und das Entfernen eines nicht eingetragenen Nutzers werden bisher abgelehnt. | Für Relayaufträge passende bereits erfüllte Zustände erfolgreich quittieren; native Rechte und vorhandene Daten erhalten. |
| Titel/Interpret | `config.js` benennt Providerfelder. Tatsächliche Werte werden in `app/www/js/radio/api.js` und `provider.js` im Browser abgerufen; im Backend-Publisher gibt es dafür derzeit keinen bestätigten aktuellen Wert. | Feldnamen nicht als Titelwerte senden. Bei fehlender Quelle optionale Felder weglassen; `null` würde vorhandene Firebase-Werte ausdrücklich löschen. |

### Damalige Rückfragen – durch die Nachlieferung beantwortet

1. **Stabile Eintrags-ID und tatsächlicher JSON-Vertrag:** Bitte je eine bereinigte tatsächliche Relay-Antwort für erstmaliges `save`, spätere Änderung desselben Eintrags und `delete` bereitstellen. Welches Feld trägt die dauerhafte Firebase-Eintrags-ID, welchen Typ und welche Grenzen hat es? Ist das vorhandene `id` künftig die Firebase-ID oder weiterhin die numerische Knuddels-ID? Eine `commandId` identifiziert einen einzelnen Auftrag und ändert sich beim nächsten fachlichen Versuch; sie allein kann spätere Änderungen nicht dauerhaft demselben Eintrag zuordnen. Bitte auch die tatsächliche Array-/Objektform der Auftragsfelder zeigen.
2. **Bestandsabgleich und Umschaltung:** Der geforderte einmalige Firebase-Ausgangsbestand ist keine automatische Knuddels-Ausleitung. Bitte den eingerichteten Ausgangsbestand beziehungsweise den geplanten Umschaltpunkt bestätigen. Für den Abgleich sollten eindeutige vollständige fachliche Übereinstimmungen maßgeblich sein; die verkürzten Kriterien Woche/Datum/Start/Moderator/Thema lassen Endzeit, Sendeart und Laufzeitart offen. Laufende beziehungsweise automatische Studioeinträge besitzen zusätzliche Schutzregeln. Mehrdeutige Treffer dürfen keine bestehende Sendung still übernehmen oder verändern.
3. **Bestehende Knuddels-Pflege und Studio-Protokollierung:** Im aktuellen Code gibt es weiterhin native Inhaberaktionen für Plan und Team sowie automatische Sendeplaneinträge bei Studiowechseln. Bitte festhalten, ob diese unverändert als rein lokale Knuddels-Funktionen bestehen bleiben. Bei Firebase als führender öffentlicher Quelle würden solche lokalen Änderungen künftig nicht auf der Homepage oder in Android erscheinen. Eine Einschränkung dieser Bedienwege wäre eine zusätzliche Verhaltensänderung und muss gegenüber der Vorgabe „Bedienung nicht verändern“ eindeutig beschrieben sein.
4. **Tatsächliche Titelquelle:** Falls der neue Build echte `currentSong`-/`currentArtist`-Werte senden soll, fehlt dafür eine bestätigte Quelle im Backend. Bitte den vorgesehenen Quellweg benennen. Ohne diese Quelle können die Felder entsprechend der ausdrücklich optionalen Semantik entfallen; vorhandene Firebase-Werte bleiben dann erhalten. Ein erfundener Wert, ein pauschales `null` oder eine zweite unvereinbarte Provider-/Timerlogik ist keine Lösung.

### Damaliger Stand zum HTTP-Fehler

Die Fassung 00:53 enthält keine Antwort auf den unten dokumentierten Logauftrag: Es fehlen weiterhin ein zugeordneter Request, UTC-Zeitstempel/Trace-ID, HTTP-Status und konkreter Fehlergrund zu Build 303. Aus dem neuen Vertrag folgt kein Nachweis, dass `scheduleUpdates` oder `teamUpdates` den gemeldeten Fehler ausgelöst haben. Bitte die erreichte Deploymentrevision und die tatsächlichen Logbefunde nachreichen; die Aussage, ungültige optionale Daten künftig einzeln zu ignorieren, ersetzt keinen solchen Befund.

Prüfergebnis: Die neue Zuständigkeit und die vorgesehenen Felder sind nachvollziehbar. Für eine sichere vollständige Umsetzung fehlen insbesondere der eindeutige ID-Vertrag und die Festlegung zum Umgang mit vorhandenen Bedienwegen und Beständen. In diesem Prüfschritt wurden ausschließlich diese Rückantwort und der Prüfbericht aktualisiert. Kein neuer Build, keine Datenmigration und keine Änderung am laufenden Relay oder an vorhandenen Knuddels-Daten.

## Aktueller nativer Fehler in Build 303 – Prüfauftrag an Firebase

Vom Betreiber am 07.11.2026 gemeldeter damaliger Fehlerstand. Genaue Uhrzeit und Trace-ID wurden nicht mitgeliefert. Inzwischen liegen sowohl der Firebase-Logbericht als auch der oben dokumentierte erfolgreiche native Statusabruf vor.

### Gemeldeter privater Status

Ausgabe von `/mischwerk-relay status`, inhaltlich unverändert, zur Lesbarkeit eingerückt:

```json
{
  "build": 303,
  "version": "0.1.303",
  "publisherActive": true,
  "flags": {
    "enabled": true,
    "runtimeVerified": true
  },
  "firstRegularPost": null,
  "transport": "status-response-v1",
  "queueReturn": {
    "received": 0,
    "adopted": 0,
    "duplicates": 0,
    "discarded": 0,
    "invalid": 0
  },
  "statusUpdatesConfirmed": 0
}
```

### Gemeldete private App-Logs

Die beiden Zeilen wurden vom Betreiber so übermittelt:

```text
App-Logs (privat): MischWerk: WARN: MischWerk: Eine Speicher- oder UI-Operation konnte nicht abgeschlossen werden. [ANDROID_HTTP_RESPONSE]
App-Logs (privat): MischWerk: WARN: MischWerk: Eine Speicher- oder UI-Operation konnte nicht abgeschlossen werden. [ANDROID_PUBLISH_RESPONSE]
```

### Gesicherte Einordnung

- Build 303 läuft nativ; der Publisher ist gestartet und die gespeicherten Freigabeflags sind aktiv. `firstRegularPost: null` bedeutet, dass Knuddels seit diesem Publisherstart noch keine reguläre Antwort erfolgreich angenommen hat. Ob Firebase einen Request bereits verarbeitet oder Daten gespeichert hat, ist daraus nicht erkennbar.
- `ANDROID_HTTP_RESPONSE` stammt aus der Auswertung des nativen HTTP-Callbacks in `android/connection.js`. Dieselbe Meldung kann bei Fehlercallback, fehlenden/ungültigen Response-Metadaten, abweichender Antwortadresse, zu großer Antwort oder fehlgeschlagenem JSON-Parsing entstehen. Der konkrete Grund und HTTP-Status stehen nicht in dieser Warnung.
- `ANDROID_PUBLISH_RESPONSE` entsteht anschließend, wenn der Publisher die Rückmeldung nicht akzeptieren kann. Die Meldungen belegen weder einen bestimmten HTTP-Status noch einen Fehler am Sync-Schlüssel oder an einem konkreten Payloadfeld.
- `queueReturn` und `statusUpdatesConfirmed` betreffen Android-Musikwünsche beziehungsweise deren Quittungen; sie sind keine getrennten Sendeplan-/Team-Erfolgszähler. Der gemeinsame Datenfluss mit Homepage und Android bleibt unbestätigt.

### Benötigte Angaben aus Firebase-/Hosting-Logs

Bitte einen aktuellen regulären POST an `https://radio-mischwerk.web.app/api/publishKnuddelsState` anhand vorhandener Logs untersuchen. Der Publisher verwendet den bestehenden 20-Sekunden-Takt. Es ist kein zusätzlicher Testwunsch oder erneutes Speichern des Sync-Schlüssels nötig.

1. **Requestzuordnung:** Ankunft belegt ja/nein, genauer UTC-Zeitstempel, Request-/Trace-ID, HTTP-Status und Bearbeitungsdauer. Bitte Hosting-/Routingfehler und tatsächlich erreichte Function unterscheiden; fehlende Beobachtungen ausdrücklich als unbekannt kennzeichnen.
2. **Serverseitiger Fehlergrund:** Tatsächlich protokollierter Fehlercode und die fehlgeschlagene Phase, etwa Transportauthentisierung, JSON-/Schemavalidierung oder Speicherung. Bei einem Schemafehler genügt der betroffene Feldpfad und die erwartete Form beziehungsweise der erwartete Typ. Keine komplette Nutzlast mitsenden.
3. **Bereitgestellter Vertrag:** Welche Function-/Deploymentrevision wurde erreicht? Unterstützt diese Revision bereits `scheduleUpdates`, `teamUpdates`, `scheduleResults` und `moderatorResults` im bestehenden signierten Body? Die Auftragsberechtigung wird gemäß geklärtem Vertrag in Firebase geprüft; es werden keine zusätzlichen Rollenfelder aus Knuddels erwartet.
4. **HTTP-Antwort:** Tatsächlicher Status, Content-Type und Antwortgröße in UTF-8-Bytes. Handelt es sich um gültiges JSON oder beispielsweise eine HTML-/Routingantwort? Weiterleitungen und eine mögliche Abweichung von der festen Antwortadresse bitte soweit serverseitig belegbar als Metadaten angeben.
5. **Bei HTTP 200:** Ist die Antwort ein JSON-Objekt mit `accepted: true`, einem numerischen `serverTime` in Unix-Millisekunden und einem `wishes`-Array mit höchstens zehn Einträgen, auch bei leerem Array? Die optionalen `scheduleCommands` und `moderatorCommands` dürfen jeweils höchstens einen Auftrag enthalten. Für die Diagnose reichen Feldvorhandensein, Typen, Arraylängen und Serverzeit; keine Inhalte von Wünschen oder Aufträgen.
6. **Bereits erfolgte Speicherung:** Wurden Senderdaten, Sendeplanseiten, Teamdaten oder Auftragsquittungen bereits ganz oder teilweise übernommen? Bitte gegebenenfalls nur technische Revisionen, Seitenzahlen und Zeitstempel nennen, damit ein serverseitiger Commit von einer Knuddels-seitig verworfenen Antwort unterschieden werden kann.

Knuddels akzeptiert die reguläre Antwort nur bei passender Zieladresse, HTTP 200, `accepted === true`, plausibler Serverzeit und rechtzeitigem Callback innerhalb von zehn Sekunden. Der Verbindungsadapter hat zusätzlich einen lokalen Schutz von höchstens 32768 UTF-16-Zeichen und 32768 UTF-8-Bytes für die Antwort; das ist keine zugesicherte Plattformgrenze.

Bitte die Logbefunde mit einer belegten Ursache beziehungsweise einer ausdrücklich benannten verbleibenden Lücke zurückmelden. Schlüssel, Signaturen, Authentisierungswerte, vollständige Request-/Responsebodies und persönliche Inhalte gehören nicht in die Rückantwort. Die vorhandene Knuddels-Konfiguration bleibt für diesen Diagnoseauftrag unverändert; aus den bisherigen Meldungen ist noch keine gezielte Codekorrektur ableitbar.

## Bereits umgesetzte Rollenklärung aus Build 302

Die aktualisierte Datei `Knuddels-Anforderungen-Homepage-Sendeplan.md` klärt die bisherige Rollenfrage: Firebase prüft Konto, App Check und Berechtigung, bevor ein Auftrag in der regulären Relay-Antwort erscheint. Die Auftragsobjekte enthalten keine Rollen-, Nutzeridentitäts- oder `authorization`-Felder. Eine zusätzliche Rollenprüfung oder interaktive Channelinhaberannahme in Knuddels ist nicht vorgesehen.

Die bisherige zusätzliche Prüfung auf `authorization.role === "admin"` wurde deshalb aus `src/backend/android/commands.js` entfernt. Der Gegenfall ohne Rollenfelder scheitert am bisherigen Build 301 und besteht nach der Anpassung. Die Annahme von Sendeplan- und Teamaufträgen hängt weiterhin ausschließlich an einer passenden, frischen und angenommenen regulären HTTP-Antwort des vorhandenen Publishers; Wochen-/Teamrevisionen, Nickauflösung, volle Stunden und alle Fachregeln werden weiterhin geprüft. Native Knuddels-Clientaktionen behalten ihre bisherigen Rechteprüfungen. Die Rollenfrage ist damit geklärt.

## Bisheriger Anbindungsvertrag bis Build 304 – noch implementiert

Die folgende Beschreibung dokumentiert den bisherigen Code. Die neue Fassung 00:53 verlangt stattdessen Revisionsmetadaten und Einzelbefehle wie oben beschrieben; die darin geforderte Umstellung ist noch nicht umgesetzt.

- Ausschließlich der bestehende signierte POST an `https://radio-mischwerk.web.app/api/publishKnuddelsState`, mit demselben Sync-Schlüssel und Transport. Keine neuen URLs, Schlüssel, WebHooks, Callables oder Timer.
- `scheduleUpdates`: öffentliche Wochen-Seiten direkt aus `runtime.publicWebsitePlan(week, page)`, höchstens vier je POST; zuverlässige Seitennachlieferung im bestehenden Takt.
- `teamUpdates`: ein Objekt `{ revision, moderators: [{ nick }] }` mit den tatsächlichen aufgelösten Radioteam-Nicks.
- `scheduleResults` und `moderatorResults`: `{ commandId, state: "applied"|"rejected", revision: number|null }` im nächsten regulären POST. Fachänderung und Annahmebeleg werden zusammen in vorhandenen Wochen-/Teamdaten gespeichert. Jüngste 64 Ergebnisse je Woche beziehungsweise Team sichern Wiederholungen; ältere angewandte Aufträge scheitern zusätzlich an ihrer veralteten erwarteten Revision.
- `scheduleCommands` und `moderatorCommands`: Arrays mit je höchstens einem bereits von Firebase berechtigten Auftrag. Keine zusätzlichen Rollenfelder erforderlich. Technische Auftragskennungen bleiben auf 1–128 ASCII-Zeichen aus `A–Z`, `a–z`, `0–9`, `_` und `-` begrenzt.

Bereits endgültig mit `rejected` quittierte Auftragskennungen bleiben abgelehnt. Falls ein früherer Build einen echten Auftrag wegen der inzwischen entfernten Rollenprüfung abgelehnt hat, muss Firebase eine erneute fachliche Anfrage mit neuer Kennung und aktueller erwarteter Revision stellen. Alte Kennungen werden nicht nachträglich ausgeführt.

Oberfläche, `station`, `wishUpdates`, Wunschqueue, Lauftext und sonstige Android-Funktionen bleiben für diese Korrektur unverändert. Freie Musikzeiten werden nicht als künstliche Sendungen gespeichert. Die öffentliche Ergänzung mit „MischWerk am Pult“ und „MischWerk Radio Show“ bleibt Aufgabe der Homepage.

## Bisherige Umsetzung und lokale Prüfnachweise aus Build 302/303

Die Fachänderung betrifft ausschließlich `src/backend/android/commands.js` und die erzeugte Kopie `app/server/android/commands.js`. Die Relaykorrektur erhielt Build 302; der aktuelle gemeinsame Arbeitsstand 0.1.303 / Build 303 enthält zusätzlich die parallel fortgeführte Radioanpassung. Paketdatei, Backend-/Appkonfiguration, Einstieg und fünf Manifeste sind konsistent. Vorhandene Änderungen anderer Aufgaben bleiben erhalten.

Der vollständige lokale Paketbau besteht mit **462/462 Nodefällen**, darunter **22 Relayfälle**, und jeweils **1153 Prüfungen** in den SHA-256-verifizierten Rhino-Engines **1.7.7.2 und 1.9.1**. Geprüft sind insbesondere beide rollenfreien Auftragsbereiche, unveränderte native Rechte, HTTP-/Frischeprüfung, Revisionen, Wiederholung/Neustart und endgültige Ablehnungen. Architektur, API-Signaturen, Syntax, Quellen-/Laufzeitgleichheit und Zeichengrenzen bestehen ebenfalls.

`check:upload` bestätigt **Build 303**, **131 Dateien**, darunter **124 Texte**, maximal **9485 UTF-16-Zeichen**, und fünf konsistente Manifeste. Der feste Uploadordner lautet `C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk/`. Die konkreten Nachweise stehen im [aktuellen Prüfbericht](../pruefung/PRUEFBERICHT.md).

Der Betreiber hat inzwischen sowohl den nativen Start von Build 303 als auch die erste erfolgreich angenommene reguläre HTTP-200-Antwort belegt. Die fachliche Firestore-Übernahme und der gemeinsame neue Plan-/Teamdatenfluss bleiben zu bestätigen. Diese Rückantwort ergänzt ausschließlich Diagnose und Übergabe; Appcode und Upload-Paket werden durch diesen Dokumentationsschritt nicht verändert.
