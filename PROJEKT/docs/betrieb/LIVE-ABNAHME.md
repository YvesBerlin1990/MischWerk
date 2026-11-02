# MischWerk – LIVE-Abnahme 0.1.117

Lokaler Stand nicht veröffentlicht. Upload, Knuddels-Update und Neustart wurden nicht ausgeführt. Zuletzt tatsächlich beobachtet: LIVE 0.1.103, Backend gestartet, Radioleiste leer. Der damalige Parser-Ladefehler ist lokal korrigiert. Aktuelle lokale Prüfung: [PRUEFBERICHT.md](../pruefung/PRUEFBERICHT.md).

Bestätigtes Ziel: MischWerk / Otterchen, App-ID knuddelsDEV.30807196.MischWerk, Installations-ID 30807196.MischWerk, FTP appupload.knuddels.de:/ftp/MischWerk. Passwort ausschließlich im FTP-Programm. [Installation](INBETRIEBNAHME.md#installation-und-upload).

## Vor einem gesondert beauftragten Update

- Aktuelle 88 Laufzeitdateien in C:/Users/Yves/Desktop/MischWerk/UPLOAD/MischWerk mit Quellen und vier Dateimanifesten samt Hashes vergleichen; vollständiger server/- und www/-Inhalt erforderlich.
- AppPersistence sichern und flüchtige Wunschqueue berücksichtigen: Ein tatsächlicher App-Neustart leert offene Wünsche.
- Vollständige lokale Prüfungen gemäß aktuellem Prüfbericht erfolgreich. Erst nach eigenem Auftrag übertragen, Übertragungsende abwarten und /update verwenden; Version im echten App-Log bestätigen.

## Echte Abnahme der vier Änderungen

- Radio-Team: Erststart, drei lange Mitgliedernamen, Ernennung, Bestätigung/Abbruch des Entzugs, Seitenwechsel, Fehlermeldungen und Wechsel zur Statuszentrale. Native Höhe folgt Inhalt ohne normalen Scrollstapel; bei 320 px und echter Bildschirmgrenze bleiben alle Aktionen erreichbar. Neun Statuswerte, danach alle neun Detailseiten; Fokus und gewählte Seite bei Refresh erhalten. K3 und STAPP gesondert, inklusive tatsächlicher setSize-Reaktion und nativer Rahmenabstände.
- Höreranzeige: unter Play direkt auf Hintergrund, weiße 18-px-Schrift ohne Badge/Rahmen. Echte Null, große Zahl und nicht verfügbar bei 320–3840 px; kein Überlappen der Buttons.
- Wunschbox: natives Overlay oben rechts im Channel in K3 und STAPP prüfen. Headerhöhe und Channelbeginn bleiben beim Öffnen/Schließen gleich. Keine breite reservierte Leerfläche. 320/560/2290 px und lange Inhalte innerhalb der Overlayfläche; normale Eingabe/Senden vollständig erreichbar. Schließen-Button, Escape und native Schließaktion prüfen; letzte Eingabe, späte Quittung und Wiederöffnung erhalten. Radio-Audio läuft weiter, Studio bleibt getrennt. Zwei Hörer sehen nur eigene Positionen; Erledigt/Verwerfen rückt nach. Deaktivierte Annahme, Vorhang, Verbindungsverlust und fehlende Overlay-Unterstützung prüfen. Keine technischen Texte im Formular.
- STREAMPANEL: Nach Produktfreischaltung eigene öffentliche Direktstream-/JSON-Daten gemäß [Einrichtung](INBETRIEBNAHME.md#streampanel-einrichten) bestätigen. Ohne Anschluss bleibt Play inaktiv und Anbieterwerte unbekannt. Mit echtem Anschluss Codec, HTTPS, CORS, Metadaten, booleschen LIVE-Wert, echte Hörerzahl, Online/Offline sowie unbekannte/fehlerhafte Antworten prüfen. Statusfehler stoppen laufenden Ton nicht; bestätigter Stopp schon. Wiederanlauf ohne Autostart. Ausschließlich HLS/MSE benötigt gesonderte tatsächliche Zielclientprüfung.

## Bestehende Funktionen weiter abnehmen

- Parserstart bei Beitritt, erneutem Beitritt und /mischwerk; langsame Dateien und Logo, vollständige Oberfläche, keine mehrfachen Events oder automatische Audiowiedergabe.
- Vorhang mit zwei Accounts, authentifizierte Ausnahmen Otterchen/Polaroid, nur Otterchen mit Inhaberrecht schaltet global; Persistenz. Werbung nur nach eigenem Klick, eigene MP3, höchstens 10 %, kein automatisches Öffnen.
- Rollen: Hörer/Channelmoderator/Appmanager ohne automatische Studio- oder Teamrechte. Inhaber ernennt/entzieht Radiomoderatoren; manipulierte Events und fremde Sitzungen abweisen. Rechteverlust unmittelbar wirksam.
- Studio-An-/Abmeldung, sechs Stunden Ablauf, Verlängerung, Thema/Entwurf und parallele Änderungen. Ausdrückliche erfolgreiche Abmeldung entfernt Thema, fehlgeschlagene/automatische nicht. Wünsche bleiben erhalten.
- Übergabe mit zwei Accounts, Nachfolger bestätigt Thema/ON AIR gemeinsam; Ablehnen/Abbrechen und veraltete Anfrage ohne Wechsel. Bei Verlassen/Rechteverlust/Neustart endgültig verwerfen. Öffentliche Botmeldungen mit echtem Nick und genau einem Versandversuch.
- Audio: Play/Stop, Mute, Start höchstens 10 %, native Medienfehler, Unterbrechung und erneuter Klick, Hintergrund/Rückkehr; keine Audioanalyse. Popupwechsel erhalten Ton.
- Sendeplan: lesen für alle, schreiben nur Inhaber; Datum in späteren Wochen/Monaten, Revision, Überschneidung/Mitternacht, Fehler/Retry/Entwurf, tatsächlicher Eintrag nach Speichern sichtbar. Persistenz und schmale Ansichten.
- Datenschutz: Keine fremden Wünsche/Nicks an Hörer, keine internen User-IDs im öffentlichen Modell, keine Encodergeheimnisse oder Analysebibliotheken.

Lokale Browser- und Rhino-Nachweise ersetzen diese reale Abnahme nicht. Keinen aktuellen LIVE-Erfolg oder tatsächlichen STREAMPANEL-Anschluss aus dem vorbereiteten Paket ableiten.

Seit 0.1.114 weiter echt prüfen: STAPP-Wunschbox schließen bei 320/390/699 px ohne Leerfläche, beide Vorhangbeschriftungen bei 700–1099 px vollständig, Fokus nach Schließen bei zwischenzeitlich deaktivierter Annahme bzw. Verbindungsverlust und keine unsichtbaren Tabstopps.

Für 0.1.116 zuerst die beanstandete Geometrie echt abnehmen: Wunschbox über dem Channel, Radiohöhe unverändert, Channel links neben dem Overlay weiter sichtbar. Die genaue Position und native Overlaygrenze legt Knuddels fest. Anschließend Team-/Sendeplanöffnungen auf ruhige Größenanpassung und Moderation auf natürliche Inhaltshöhe seit 0.1.117 prüfen. Nach Monitorwechsel bei Bedarf Popup neu öffnen.

Für 0.1.117 Moderation bei 780 px Breite öffnen: keine untere Leerfläche, erster Größenabschluss vor sichtbarer Bedienung und keine Folgeschleife. Danach An-/Abmeldung, lange Wünsche, Themenentwurf/Fehler, Übergabe, kleine Bildschirmgrenze und schmale Reiter prüfen. K3 und STAPP getrennt, inklusive tatsächlich angewendeter Rahmenhöhe und unverändertem Fokus. Lokal 780 × 593 px für den unveränderten Standardinhalt; native Fensterdekoration kommt hinzu.
