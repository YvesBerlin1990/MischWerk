# MischWerk – LIVE-Abnahme: lokal 0.1.223 / Build 223

Stand 05.11.2026. Build 223 ist lokal geprüft; seine native Langzeitabnahme bleibt offen. Ein GitHub-Push überträgt keine Appdateien nach Knuddels.

## Tatsächlich beobachtet

Im ausdrücklich freigegebenen Windows-Test am 05.11.2026 wurde ausschließlich das vorhandene `/confirm` vorübergehend ausgesetzt. Letzte reguläre Bestätigung 13:57:36.297, native Trennung 14:07:37.061 Europe/Berlin, rund zehn Minuten später. Etwa zehn Millisekunden danach schloss die Headerbar mit `target_closed`. Kurz zuvor lief Audio fehlerfrei mit 2,22 Sekunden Puffer; keine vorhergehenden Medienfehler oder eigenen Stoppaufrufe beobachtet.

Die Hörsitzung wurde wiederhergestellt, Radio lief bei 38 %, Testsperre und temporäre Beobachter waren entfernt. Geladen war noch die alte Audiosteuerung. Belegt ist ein konkreter Inaktivitäts-/Headerbar-Abbruchmechanismus, keine native Abnahme von 223 und keine rückwirkende Erklärung jedes früheren Abbruchs. [Messungen](../pruefung/PRUEFBERICHT.md#kontrollierter-nativer-ursachentest).

Frühere Nutzerbeobachtungen zum weißen Erstöffnungsblitz belegen eine Verkürzung, keine vollständige Behebung. Lokale Ladeabdeckung, frühe HTML-Farben und Parserreihenfolge sind geprüft; verbleibenden nativen Erstöffnungsblitz separat beobachten.

## Nach vollständiger Installation prüfen

1. **Dateistand:** Startlog 0.1.223 / Build 223 und tatsächlich geladene Frontenddateien. Alle 122 Dateien, Unterordner und fünf Manifeste zusammengehörig. HTTP 200 allein belegt keine richtigen Bytes.
2. **Längeres Hören:** Windows-App im Vorder-/Hintergrund; gleiche Headerbar und fortschreitende Medienzeit. Aktivitätsbestätigung bei gültiger Channelverbindung bleibt trotz kurzer Engpässe regelmäßig.
3. **Audioerholung:** Kurze Engpässe behalten Quelle/Puffer; echte Fehler/Ende führen bei bestehendem Hörwunsch zu Erholung. Lautstärke/Mute erhalten. Status-/Titelantworten stoppen kein Audio. Stop, Quellenwechsel und Seitenende beenden weitere Versuche.
4. **Menüs:** Alle vier Overlays öffnen, wechseln, mit X/Escape schließen. Radio bleibt hörbar. Breite/schmale Rahmen, Erstöffnungsblitz, Fokus, Goldlicht, Lautstärketaste und lange Texte beobachten.
5. **Wünsche/Rollen:** Quittung, eigener Song/Platz/Status in der Appleiste, weitere Eingabe und Entwurfserhalt. Fremde Wünsche nur für Moderation. Rechteentzug und Wunschboxsperre greifen serverseitig. Ab Build 268 müssen bestätigte offene Wünsche Update/Neustart mit Reihenfolge und Regiestatus überstehen; erledigte/verworfene Wünsche bleiben entfernt. Speicherfehler dürfen keine erfolgreiche Annahme melden. Vor dem ersten Wechsel von einem älteren flüchtigen Build dessen offene Wünsche abarbeiten.
6. **Studio:** Anmeldung ohne Zeitlimit und ohne automatische Sechs-Stunden-Abmeldung; auch nach langer Laufzeit keine Verlängerung nötig. Keine Endzeit-, Restzeit- oder Studiozeit-Anzeige. Abmeldung, Verlassen und Rechteverlust prüfen. Bestätigte Übergabe und private Notizen.
7. **Plan/Verwaltung:** Live/AutoDJ, Ganztags/Open End, Nacht-/Wochenfortsetzung, Revisionen und Besitzerrechte. Team und sechs Bot-Texte mit vorgesehenen Intervallen. Echte öffentliche Testausgaben nur im ausdrücklich freigegebenen Rahmen.
8. **Website separat:** Unterstütztes Node ab 22, HTTPS, bewusste WebHook-Freigabe, Channelkopplung, beide Änderungsrichtungen, Anwesenheit/Rechte, Fehlerwiederholung und Privatsphäre. App-Menüs bis dahin erhalten; Mailversand bleibt aus.

Lokale K3-/STAPP-Profile belegen keine native mobile/iOS-Abnahme oder garantierte unterbrechungsfreie Wiedergabe bei beliebigen Netzwerk-/Clientausfällen. [Installation](INBETRIEBNAHME.md#installation-und-upload) · [Prüfbericht](../pruefung/PRUEFBERICHT.md).
