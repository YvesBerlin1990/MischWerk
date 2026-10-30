# MischWerk 0.1.25 – RadioKing-Sendepause erkennen

30.10.2026. Ausschließlich lokale Änderung, Paketvorbereitung und lesende Prüfung des eigenen öffentlichen RadioKing-Endpunkts. Kein FTP-Upload, Knuddels-Update, Serverneustart oder Start-/Stop-Befehl an RadioKing. Zuletzt bestätigtes LIVE bleibt 0.1.13.

## Tatsächlich geprüfte Anbieterantwort

`https://api.radioking.io/widget/radio/mischwerk` liefert HTTP 200, JSON, `slug=mischwerk`, `idradio=950821`, `status=active`, aber `stream_status=stopped`. CORS `Access-Control-Allow-Origin: *`, Cache-Control max-age=15. Derselbe Sender lieferte am 29.10.2026 im unveränderten Bericht 0.1.17 `stream_status=started`, zusammen mit tatsächlicher MP3-Dekodierung. Bei der aktuellen Pause antwortet der Titel-Endpunkt mit HTTP 404; dies allein wäre kein ausreichender Stop-Nachweis.

Für die Sperre wird ausschließlich `stream_status` aus einer gültigen Antwort zur gleichen Radio-ID verwendet. Der Kontostatus `active`, `live=null`, RadioKing `is_live` oder eine fehlende Titelantwort beweisen weder Sendepause noch aktiven AutoDJ. Die Widget-API ist direkt geprüft; ein versionierter öffentlicher API-Vertrag liegt weiterhin nicht vor.

## Verhalten

- Erste kurze Statusprüfung „Prüfe …“. Bei bestätigtem `stopped`: „Sendepause“, vollständig grauer Play-Button ohne Gold, deaktiviert und mit verständlichem Tooltip/ARIA-Status. Native und synthetische Klicks starten keinen Stream.
- Status und, sofern passend, Titel etwa alle 30 Sekunden nur bei sichtbarer Radioleiste prüfen. Anbieter-Cache von 15 Sekunden und Netzwerklaufzeit können Erkennung zusätzlich verzögern. Bekannte Pause benötigt weder Titelabruf noch Audio-Probe.
- Bestätigter Stop während Wiedergabe beendet die Audioverbindung und entfernt alte Titel-/Interpretenwerte. Thema, Studio-ON-AIR, Wünsche und Rollen bleiben unabhängig.
- Bei `started` automatisch freigeben, anschließend bewusster Play-Klick. Kein Autostart nach Senderneustart, API-Antwort oder Seitenwechsel. Ein lokal vom Hörer gestoppter Player bleibt ebenfalls gestoppt.
- Nicht erreichbare/fehlerhafte API, unbekannte Werte oder unpassende Senderidentität ergeben „Status unbekannt“ und erlauben manuellen Hörversuch. Bereits laufender Ton bleibt erhalten; dies ist kein bestätigter Sender-Stop.
- Medienfehler prüft den Anbieterstatus erneut, statt eine bekannte Sendepause als generischen Streamfehler zu behandeln. Antworten eines früheren Senders werden anhand der bestehenden Generation ignoriert.

## Nachweise und Grenzen

99 automatisierte Fälle: 49 Backend-/HTTP- und 50 Browserfälle. Sechs neue Browser-Regressionen für bestätigte Pause/Klicks/Layout, Wiederanlauf ohne Autostart, Stop bei laufender nativer PCM-Wiedergabe, Fehler-/unbekannte Statuswerte, veraltete Antworten, initialen Timeout und unmittelbare Klassifizierung eines Medienfehlers; die bestehenden Poll-/Popup-/Rechte-/Audio-Prüfungen wurden erweitert. Breiten 320–2560 px mit allen Statusbezeichnungen weiterhin ohne Scrollen oder Überlagerung.

Echter Cross-Origin-Aufruf des aktuellen eigenen Senders im Edge-Browser mit unverändertem Produktions-Frontend: Sendepause und gesperrter Button bestätigt, kein Audio verbunden. Bericht [anbindung-0.1.25.json](radioking-pruefung/anbindung-0.1.25.json), [echte Statusvorschau](radioking-pruefung/RadioKing-Sendepause-0.1.25.png), [volle Leiste](radioking-pruefung/MischWerk-RadioKing-0.1.25-Sendepause.png). Wiederanlauf/aktuelles Audio werden bei diesem gestoppten Sender nicht künstlich ausgelöst; sie sind lokal simuliert. Früherer tatsächlicher MP3-Nachweis: [0.1.17](radioking-pruefung/anbindung-0.1.17.json).

Keine neue Knuddels-/K3-Signatur: vorhandener HTMLUI-Browser, XMLHttpRequest und natives Audio; keine Backend-HTTP-Freigabe, kein API-Schlüssel, keine private K3-Methode. Sichtbarkeits-/STAPP-/Popup-Wege unverändert. Eine echte Knuddels-/K3-Abnahme nach gesonderter Uploadfreigabe bleibt offen; Browser-Mocks ersetzen diese nicht.

Quelle: [eigener öffentlicher RadioKing-Status](https://api.radioking.io/widget/radio/mischwerk). Aktuelle rohe Anbieterantwort und Browsernachweis liegen im verlinkten JSON-Bericht. Knuddels-Referenzen: [AppContent](https://developer.knuddels.de/docs/classes/AppContent.html), unveränderte lokale HTMLUI-API-Dateien.

Upload und ZIP enthalten weiterhin sechs Laufzeitdateien. Quelle/Upload/ZIP/Manifest stimmen überein, ZIP-SHA256 korrekt. Original-Logo unverändert und vorheriges Paket 0.1.24 unverändert archiviert. Alle 99 automatisierten Fälle und die echte Browser-Statusprüfung bestanden.
