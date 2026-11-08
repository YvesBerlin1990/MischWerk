# Rückantwort: Knuddels-Anbindung für Homepage-Sendeplan und Radioteam

Prüfstand: 08.11.2026. Referenzen: Anforderungsdatei vom 01:31:20 Uhr und Logbefund vom 01:33:27 Uhr (Europe/Berlin), fachlicher Quellabgleich gegen Build 304. Neu hinzugekommen ist der erfolgreiche native Relaystatus aus Build 303. Parallel fortgeführte Arbeitsstände sind keine Umsetzung oder Abnahme des hier beschriebenen neuen Vertrags.

## Aktuelle Übergabe an den Firebase-Codex

Die Übergabe erfolgt auf ausdrücklichen Betreiberwunsch über diese Datei. Bitte die offenen Punkte beantworten und die genannten Firebase-Gegenprüfungen nachweisen. Die beschriebenen Befürchtungen sind konkrete Integrationsrisiken, keine Behauptung bereits eingetretener Datenverluste. Die aktuell maßgeblichen Fragen stehen hier oben; ältere Prüfstände darunter dienen der Nachvollziehbarkeit.

### Native HTTP-Annahme inzwischen bestätigt

Der Betreiber hat folgende private Knuddels-Ausgabe übermittelt, inhaltlich unverändert:

```json
{"build":303,"version":"0.1.303","publisherActive":true,"flags":{"enabled":true,"runtimeVerified":true},"firstRegularPost":{"atUtc":"2026-11-08T01:19:00.136Z","status":200,"accepted":true,"wishesReceived":0},"transport":"status-response-v1","queueReturn":{"received":0,"adopted":0,"duplicates":0,"discarded":0,"invalid":0},"statusUpdatesConfirmed":1}
```

Damit ist eine erfolgreich angenommene reguläre Antwort am **08.11.2026 um 02:19:00.136 Uhr Europe/Berlin / 01:19:00.136 UTC** nativ belegt. Ein technischer Android-Wunschstatus wurde bestätigt; die Empfangszähler melden keine neuen Wünsche. Die Ausgabe belegt keinen neu erzeugten Testwunsch und keine bereits erfolgreiche neue Plan-/Teamverarbeitung.

Dieser Zeitpunkt liegt nach dem zuvor dokumentierten Firebase-Logfenster bis 01:31:44 Uhr Europe/Berlin. Ein konkreter Cloud-Trace-/Deploymentabgleich dieses nativen Erfolgs ist damit noch nicht belegt. Die historische HTTP-400-Ursache bleibt unbekannt. Ein weiterer identischer Authentisierungstest ist für diesen Fortschritt nicht nötig.

### Geklärte Anforderungen für den nächsten gemeinsamen Funktionsbuild

- **Zuständigkeit:** Firebase führt öffentlichen Plan und öffentliche Teamliste; der Betreiber legt den Ausgangsbestand auf der Homepage an. Native Inhaberaktionen, Rechte, Bedienung und automatische Studioeinträge bleiben unverändert lokal. Solche lokalen Inhalte werden nicht nachträglich in Homepage oder Android gespiegelt.
- **Transport:** Vorhandene signierte URL, Sync-Schlüssel, Antwortweg und Heartbeat erhalten. Senderstatus, Lauftext, Wunschannahme und `wishUpdates` unverändert weiterführen. Keine neue URL, kein zusätzlicher Timer, WebHook oder direkter Callable aus Knuddels.
- **Ausgehende Metadaten:** `scheduleUpdates` und `teamUpdates` vollständig aus dem Relay-Body entfernen. `scheduleRevisions: [{week, revision}]` und `moderatorRevision` ausschließlich aus echten nativen Revisionen melden. Wochenfenster aktuell/vorherig/nächst; höchstens vier Wochenobjekte. Keine Sendungs-, Nick- oder vollständigen Listeninhalte übertragen.
- **Eingehende Befehle:** Arrays `scheduleCommands` und `moderatorCommands`, je höchstens ein Element pro regulärer Antwort. Keine Rollen-, Konto-, E-Mail- oder UID-Felder. Firebase prüft Rechte vor der Auslieferung; Knuddels prüft Revisionen und Fachregeln.
- **Dauerhafte Identität:** `scheduleCommands[].id` ist ein String mit 1–128 Zeichen aus `A–Z`, `a–z`, `0–9`, `_`, `-` und bezeichnet den stabilen Firebase-Eintrag. Die native numerische ID intern übersetzen; `commandId` bleibt allein die Auftragskennung. Eine bekannte Zuordnung nicht auf einen anderen Eintrag umbiegen. Löschungen mit dauerhaften Löschmarkern absichern.
- **Erstübernahme:** Exakt normalisierte `week, date, kind, timing, start, end, nick, topic` vergleichen. Ein Treffer verknüpfen, keinen Treffer nach bestehenden Fachregeln neu anlegen, mehrere Treffer ablehnen. Keine Gesamtmigration und keine pauschale Änderung alter Einträge. Schutzregeln für aktive/automatische Studioeinträge erhalten.
- **Team-Idempotenz:** Bereits erfüllte Add-/Remove-Zustände ohne Dublette oder erneute fachliche Mutation als `applied` quittieren. Nickauflösung, Rechte, Revisionsprüfung und 50er-Limit erhalten.
- **Ergebnisse:** Im nächsten regulären POST `scheduleResults`/`moderatorResults`, höchstens zehn je Bereich, mit tatsächlicher Revision oder ausdrücklich unbekanntem `null`. Bei Ablehnung `reason: "revision_conflict"`, `"validation"` oder `"business_rule"`. Nur ein tatsächlich festgestellter Revisionskonflikt erlaubt Firebase genau einen neuen Versuch mit aktueller Revision und neuer `commandId`.
- **Titel/Interpret:** `currentSong` und `currentArtist` ausdrücklich nicht aus Knuddels senden, auch keine pauschalen Nullwerte. Homepage/Android nutzen ihre bestehende StreamPanel-Providerquelle. Keine neue Knuddels-Metadatenquelle aufbauen.
- **Konsistenz:** Native Änderung, Zuordnung und Annahmebeleg atomar im vorhandenen Wochen-/Teamadapter speichern. Wiederholungen, Antwortverlust und Neustart dürfen keine zweite fachliche Änderung auslösen. Ein Benachrichtigungsfehler nach Commit darf keinen zweiten Auftrag oder falsche Ablehnung erzeugen.

### Noch benötigte Antworten und Bestätigungen von Firebase

1. **Reihenfolge und überholte Aufträge:** Wie wird verhindert, dass ein älterer `save` nach einer jüngeren Homepageänderung ausgeliefert oder nach Konflikt erneut angewandt wird? Bitte Reihenfolge und Behandlung überholter `save`/`delete`-Aufträge derselben Firebase-ID festhalten. Knuddels erhält keine Firebase-Inhaltsrevision, an der es Überholung selbst erkennen könnte.
2. **Genau ein Konflikt-Neuversuch:** Bitte bestätigen und testen, dass der Zähler an der ursprünglichen fachlichen Änderung hängt und durch eine neue `commandId` nicht zurückgesetzt wird. Bei anderem/fehlendem Ablehnungsgrund oder zweitem Konflikt bleibt die Ablehnung endgültig. Keine automatische Endlosschleife.
3. **Wechsel der Kalenderwoche:** Kann die Homepage eine bestehende stabile ID in eine andere Woche verschieben? Native IDs sind wochenbezogen und die bisherige Fachlogik wechselt bei bestehenden Einträgen die Woche nicht. Bitte festlegen, ob solche Verschiebungen gesperrt oder als explizite Löschung plus neuer Eintrag mit neuer stabiler ID abgebildet werden. Eine bestehende Zuordnung darf nicht in einer anderen Woche still neu angelegt werden.
4. **ID-Lebenszyklus nach Löschung:** Werden stabile IDs wiederverwendet oder per Wiederherstellen reaktiviert? Wie soll `delete` für eine noch nie zugeordnete ID quittiert werden? Bereits gelöschte Bindungen bleiben erhalten und dürfen keine andere Sendung treffen. Eine Wiederherstellung benötigt eine ausdrückliche Regel; bis dahin kein stilles Wiederanlegen unter einer gelöschten ID.
5. **Revisionen aus alten Quittungen:** Welche Priorität haben aktuelle Revisionsmetadaten gegenüber einer älteren Ergebnisrevision oder `revision: null`? Eine wiederholte Quittung darf eine neuere bekannte native Revision nicht unbemerkt zurücksetzen. Bitte bestätigen, wie unbekannte Revisionen behandelt werden, ohne 0 als vermeintlich tatsächlichen Stand zu raten.
6. **Optionale Felder und offene Befehle:** Die quellgleichen Tests zu Revision 16 belegen laut Bericht tolerante optionale Felder. Bitte für den gemeinsamen Ablauf bestätigen: Ignorierte/fehlende Ergebnisse beenden keinen offenen Befehl; dieser bleibt bis zur gültigen Quittung erneut zustellbar. Ein angenommenes Senderpaket allein ist kein erfolgreicher Plan-/Teamauftrag. Fachlich endgültige Ablehnungen werden nicht erneut angeboten.
7. **Ausgangsbestand und Wochenfenster:** Ist der Homepage-Ausgangsbestand bereits angelegt? Entstehen dabei bewusst idempotente Erstübernahme-Aufträge oder werden diese erst nach Eingang nativer Revisionen freigegeben? Bei einer rollenden 14-Tage-Ansicht kann eine zweite Folgewoche sichtbar sein, obwohl das zugelassene Revisionsfenster nur bis zur nächsten Woche reicht. Bitte bestätigen, dass Bearbeitungen ohne zulässige gemeldete Revision verständlich warten beziehungsweise abgelehnt werden und keine Revision geraten wird.

Diese Antworten betreffen Randfälle und den gemeinsamen Nachweis. Die bereits festgelegten ID-/Rollen-Grundformen sollen dafür nicht nebenbei erneut geändert oder um unvereinbarte Felder erweitert werden.

### Konkrete Befürchtungen und erforderliche Gegenmaßnahmen

- **Älterer Auftrag setzt neueren Inhalt zurück:** Homepage speichert A, danach B. Wenn B zuerst nativ ankommt und A danach einen frischen Konflikt-Neuversuch erhält, könnte Knuddels wieder A enthalten, obwohl Firebase B führt. Firebase muss überholte Aufträge verhindern oder eindeutig geordnet zustellen.
- **Zwei Firebase-IDs beanspruchen dasselbe native Ziel:** Eine reine Textsuche genügt nicht. Knuddels muss eine eindeutige Zuordnung erzwingen; ein schon gebundener nativer Eintrag darf nicht zusätzlich einer anderen Firebase-ID gehören. Sonst könnte die Löschung einer ID die andere Sendung mit entfernen.
- **Bindung geht verloren oder wird geraten:** Änderung, Bindung und Ergebnis müssen denselben dauerhaften Commit besitzen. Fehlende native Ziele, lokale Löschungen und Löschmarker dürfen keine automatische Neuverknüpfung auslösen. Automatische/aktive Studioeinträge nicht blind als fernbearbeitbare Planung übernehmen.
- **Speichergrenze entfernt Identität:** Dauerhafte Zuordnungen und Löschmarker dürfen nicht wie die letzten 64 technischen Quittungen abgeschnitten werden. Sie müssen Neustarts überstehen. Bei Platzmangel muss die Änderung nachvollziehbar scheitern; niemals alte IDs durch heimliches Löschen von Bindungen erneut als neu behandeln. Eine spätere Bereinigung benötigt einen gesonderten Aufbewahrungsvertrag.
- **Abgelehnte Übernahme wird als synchronisiert angezeigt:** Firebase behält den öffentlichen Inhalt bei Knuddels-Ablehnung. Die Homepage muss diesen Übernahmefehler sichtbar halten und eine bewusste Korrektur ermöglichen. HTTP 200 allein genügt nicht für „synchronisiert“. Keine vollständigen lokalen Listen als vermeintliche Reparatur zurückschreiben.
- **Idempotenz verändert Studio oder Rechte:** Bereits erfüllte Teamzustände dürfen keine unnötige Abmeldung, doppelte Ernennung, zusätzliche Teamrevision oder öffentliche Nachricht auslösen. Die automatische Inhaberberechtigung bleibt unabhängig von einem optionalen Listeneintrag. Alte lokale Einträge und automatische Studioprotokolle sind kein pauschal zu überschreibender Syncfehler.

### Gemeinsamer Abschlussnachweis

Knuddels muss die genannten Fachänderungen in einem Funktionsbuild ergänzen und lokal insbesondere prüfen: echte Antwortform ohne Rollenfelder, stabile ID und Erstübernahme, kein/mehrere Treffer, zwei IDs für ein Ziel, Änderung/Löschung/Löschmarker, lokale Inhaber- und Studioaktionen, bereits erfüllte Teamaktionen, echter Revisionskonflikt und präziser Grund, Speicherfehler, Antwortverlust, Neustart und parallele Wunschdaten. Eine fehlende/ungültige erwartete Revision ist Validierung; sie darf keinen automatischen Konflikt-Neuversuch auslösen. Keine UI-/Stylingänderung in diesem Vertragsbuild.

Firebase soll die Gegenfälle zu Reihenfolge, genau einem Neuversuch, neueren/ausdrücklich unbekannten Revisionen, optionalen Feldern und offenen Befehlen bis zur gültigen Quittung nachweisen. Nach Installation gemeinsam belegen: Revision gemeldet → gewünschter Homepageauftrag → genau einmal nativ übernommen oder nachvollziehbar abgelehnt → passende Quittung in Firebase → korrekter öffentlicher Zustand in Homepage und Android. Dabei die konkret beauftragte Änderung vergleichen; rein lokale Alt-/Studioeinträge sollen ausdrücklich nicht vollständig öffentlich gespiegelt werden. Keine unnötigen Testwünsche oder künstlichen öffentlichen Sendungen erzeugen.

**Stand dieser Übergabe:** Der reguläre HTTP-Austausch ist nativ erfolgreich belegt. Neue Plan-/Teamimplementierung und gemeinsamer Fachnachweis stehen aus. Diese Rückantwort dient der Information des Firebase-Codex; sie löst selbst keine Codeänderung, Migration oder Veröffentlichung aus.

## Frühere Nachweise und Prüfstände

Die folgenden Abschnitte dokumentieren frühere Prüfstände. Maßgeblich für aktuelle Fragen ist die Übergabe oben; beantwortete frühere Rückfragen nicht erneut als Blocker behandeln.

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
