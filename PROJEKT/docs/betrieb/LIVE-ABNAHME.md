# MischWerk – native und produktive Abnahme

Die folgenden offenen Punkte ergänzen den [App-Prüfbericht](../pruefung/PRUEFBERICHT.md). Den aktuellen Stand und die fachlichen Vorgaben führt [AGENTS.md](../../../AGENTS.md).

## Offen

- Native Sendungsanzeige, Wunschannahme, eigene Status und Studio-Übergabe zusammen mit hörbarem Intro und echter Audioausgabe prüfen. Produktive Synchronisation und tatsächliche Plattformlimits nach Installation separat beobachten. [Wünsche und Thema](../../../AGENTS.md#wünsche-und-thema) · [Studio-Übergabe](../../../AGENTS.md#studio-übergabe) · [Zentraler Abgleich](../../../AGENTS.md#website-und-android-vorbereitung)
- Native Headerbar, Overlays, Größenannahme, langsame Ressourcen, Textdarstellung und Klickziele in K3 und STAPP abnehmen. Polaroids nativen Smiley-Import sowie die tatsächliche Darstellung, Erkennbarkeit und Entfernung der Nicklistenbilder prüfen. [Native Ansichten](../../../AGENTS.md#native-ansichten-und-entwürfe) · [Bot-Texte](../../../AGENTS.md#bot-texte) · [Native Nicklisten-Icons](../../../AGENTS.md#native-nicklisten-icons)
- Native Themenbuttons samt Ausrichtung, nachfolgender Chatformatierung und Klickwirkung sowie private Willkommensgrafik und öffentliche Begrüßung abnehmen. [Channel-Thema](../../../AGENTS.md#natives-channel-thema) · [Userbegrüßung](../../../AGENTS.md#öffentliche-und-private-userbegrüßung)
- Eine gezielte Bereinigung der lokalen Legacyoriginale bleibt gesondert offen. [Originalmigration](../../../AGENTS.md#website-und-android-vorbereitung)

## Historische Betriebs- und Abnahmenachweise

### Native Verbindung und zentrale Bereitstellung

Historischer Nutzerbefund vom 17.11.2026, 21:00 Uhr: Build 447 zeigte im Verbindungsreiter eine aktive, aber noch nicht bestätigte Übertragung und „HTTP-Antwort nicht bestätigt (HTTP 400)“. Das Log enthielt eine einzelne Warnung `ANDROID_HTTP_RESPONSE` mit `Stufe:http_response` und `HTTP:400`. Die ablehnende Gegenstellenantwort war damit belegt; Antwortinhalt und konkrete serverseitige Ablehnungsursache nicht. Dies ist kein Nachweis eines bestimmten Parser- oder Secretfehlers. Die Version um 20:17 Uhr bleibt davon getrennt.

Das frühere lesend abgerufene produktive Inventar ohne `studioBroadcastAction` ist ein historischer Zwischenstand. Der koordinierende Chat bestätigte die Basis-V2-Bereitstellung vom 17.11.2026, 21:16 MEZ: zwölf gezielte Funktionen, 32 insgesamt, Quellabgleich gegen `f27739e`, Rules/Indizes/TTLs und Hosting verifiziert. Die danach ergänzten drei Wunschaktionen, `queueToken` und die Kompatibilitätsbehandlung alter Tickeranfragen gehören zu einer getrennten zweiten Bereitstellung, die der koordinierende Chat inzwischen ebenfalls als vollständig byteverifiziert meldet. Der Metadatenbericht der Basis-Publishrevision zeigt 28 Antworten mit 409, aber keinen erfolgreichen nativen Abgleich. Dieser Chat hat keine Produktionsprobe ausgeführt. Zu diesem Zeitpunkt waren End-to-End-Abnahme und Originalmigration noch offen. Die damals fehlende Studiofunktion erklärte allein nicht HTTP 400 am vorhandenen nativen Port.

Die lokale reale Firebase-Prüfung für 448 bestätigte tatsächliche Signaturen, Firestorebestand, Busy-Übertragung, Antwortverlust ohne Duplikat, drei Stufen und eigene Löschung. Der Demo-Slot wurde mit leerer Queue, beendeter Sitzung und unveränderter Uhr/Runtime zurückgegeben. Dies ersetzt keine native oder produktive Abnahme.

### Produktiver Koordinationsnachweis vom 17.11.2026

Der koordinierende Chat meldete nach einer dortigen ausdrücklichen menschlichen Freigabe den produktiven Job `studio-prod-20261117T213149Z-0888c319` bis `activate` erfolgreich. Der Originalexport wurde in der geöffneten nativen Polaroid-Verwaltung einmal ausdrücklich gestartet. Bestätigter Bestand: null aktive Wünsche, zehn Wiederholungsendbelege, fünf historische Aktionsquittungen, ein Android-Endbeleg und zehn Aliasse; fünf Cloudbelege sind exakt nach Kennung und Status abgedeckt. Eine geschützte Sicherung ist vorhanden. Firebase meldet `authority=studio`, `frozen=false`, `phase=active`. Danach wurde in der echten nativen Oberfläche „Aktiv – Daten werden übertragen.“ ohne angezeigten 400/409 gesehen. Dies ist ein gesonderter Koordinationsnachweis; dieser Chat hat den produktiven Ablauf weder ausgelöst noch selbst geprüft.

Audio und Broadcast wurden bei der gemeldeten Aktivierung nicht gestartet. Ein vollständiger Live-Betriebsnachweis und eine lokale Originalbereinigung wurden in diesem Nachweis nicht erbracht.

### Frühere Plattformbefunde

Der Nutzer bestätigte das Audio-Startverhalten von Build 401 einschließlich des betroffenen A54 im Channel. Build 402 entfernte ausschließlich Nutzerdiagnose; Build 447 ändert diesen Audioweg nicht. Früher bestätigter V1-HTTP-/Firestorebetrieb ist kein produktiver V2-Nachweis. Historische API-/Rhino-Befunde bleiben im [API-Nachweis](../api/API-NACHWEIS.md).

Am 11.11.2026 um 16:36 meldete der native Start ein fehlendes Nicklisten-Speichermodul und danach `Cannot find function attachNicklistStorage`. Die Zeilen 26, 27 und 95 passten zum gebündelten Ladeplan von Build 369. Ob der Fehler bei der Übertragung oder beim nachfolgenden Plattformimport entstand, blieb offen. Die frühere Meldung zu `attachAndroidSettingsAccess` um 15:42 zeigte ebenfalls eine fehlende Definition, ohne einen bestimmten fehlenden Dateipfad zu belegen. [API-Befund zur Dateiprüfung](../api/API-NACHWEIS.md#dateiprüfung-vor-dem-appupdate--11112026)
