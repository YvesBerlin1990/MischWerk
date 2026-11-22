# MischWerk – Architektur 0.1.452 · Build 452

Die Knuddels-App empfängt zentrale Sendungsdaten und nimmt native Musikwünsche entgegen. Firebase führt Sendung, Thema, Wunschbox, Freigaben und Queue. MischWerk Live Studio steuert diese Daten. Native Studioanmeldung, PIN-Controller, Übergabe, vollständige Wunschregie und der zusätzliche Node-Arbeitsbereich sind entfernt.

## Zusammensetzung und Start

`src/backend/` enthält die gepflegten ES5-Module. `tools/build/backend.cjs` erzeugt 77 Laufzeitmodule unter `app/server/`; `app/main.js` bleibt der kurze Einstieg. `server/app.js` enthält den Dateivertrag und lädt die Module; `core/composition.js` verbindet die Fabriken. Der Dateiprüfzweig initialisiert keine Fachcontroller.

`ui/content` erzeugt die Radio-Headerbar sowie frische Overlays für Wunschbox, Verwaltung und Sendeplan. `ui/sessions` besitzt Zuordnung und Schließen, `ui/overlays` den Prepare-/Token-/Ready-Weg. Parserladepläne bleiben ansichtsbezogen; entfernte Studio-Dateien werden nicht geladen.

## Empfang und Transport

| Modul | Zuständigkeit |
| --- | --- |
| `core/http-budget.js` | Gemeinsame rollende HTTP-Reserven für Abgleich und Sendeplan ohne eigenen Timer |
| `android/connection.js`, `android/signing.js` | Bestehender postURL-Port, Vier-String-Hülle, HMAC und Antwortschutz |
| `android/native-transport.js` | Innere V2-Anfragen und begrenzte eigene Status-/Löschpakete |
| `android/broadcast.js` | Flüchtige zentrale Sendung und vollständige Nickliste mit eigenem Ablauf |
| `android/publisher.js` | Ein Timer für Abgleich, Backoff und Projektionsablauf |
| `android/native-state.js`, `android/incoming.js` | Persistente Outbox, Besitzerbindung, Einzelquittungen und eigene Status |
| `wishes/migration.js`, `wishes/migration-transport.js` | Originalpakete, Quellrevision/Digest, geschützter Start/Abbruch und Quittierung |
| `radio/display-settings.js`, `radio/ticker.js` | Lokale Konsolenanzeige, drei Iconoptionen und atomarer Lauftextspeicher |
| `radio/announcements.js` | Dauerhafter Vorabbeleg zentraler Ereignisse vor höchstens einem Botversuch |
| `users/nicklist.js`, `users/nicklist-storage.js` | Eigene Icons und vorgemerkte Bereinigung in UserPersistence |

Der einzige native Anschluss bleibt `https://radio-mischwerk.web.app/api/publishKnuddelsState`. Der gemeinsame V2-Vertrag enthält öffentliche Sendungsdaten; Studio-UID, Sitzung und private authorityEpoch verbleiben zentral. Die öffentliche Protokollepoche ist davon unabhängig. Legacyprojektionen können den Import vorbereiten, begründen jedoch keine Live-Sendung.

Lokale Konfiguration wird nicht zentral geschrieben. Neue Wünsche merken Dringlichkeit auch während eines laufenden Posts vor; nach dessen Erfolg verwendet der vorhandene Timer den nächsten zulässigen Versand mit mindestens zehn Sekunden Abstand zwischen POST-Starts. Der reguläre Abgleich wartet zehn Sekunden nach dem Callback. Appweite Reserven zählen höchstens 60 POSTs einschließlich privater Prüfaufrufe und 30 Sendeplan-GETs je zehn Minuten. Jeder Platz bleibt bis zehn Minuten nach dem echten Callback belegt; Stop, neue Adapter und Cacheinvalidierung umgehen diese Begrenzung nicht. Erschöpfte Sendeplanreserve meldet den vorhandenen Ladefehler, ohne einen bekannten Bestand zu löschen. Fehlerbackoff und genau ein physischer Aufruf bleiben verbindlich. Die private Quellenvorprüfung liest ausschließlich die schon gespeicherte Kennung und aggregierte Bestandszahlen, ohne Kennungerzeugung oder Export.

## Wunschbestand und Migration

Der vorhandene paginierte Speicher enthält private Legacyoriginale und die neue `nativeRelay`-Outbox. Ein lokaler Outboxcommit bedeutet ausstehende Übertragung. Erst Firebase bestätigt den einzelnen Wunsch und seinen globalen Platz. HTMLUI erhält ausschließlich eigene Texte und Status. Neue terminale Texte/Nicks werden entfernt, technische Wiederholungsbelege bleiben. Alte eigene terminale clientIds beantworten Original-Replays ohne neue globale ID; fehlende ursprüngliche Textdigests bleiben unbekannt.

Der Export liest alle Originalseiten ohne feste Gesamtzahlgrenze. Quellrevision und kanonischer SHA-256 binden Originale, externe Herkunft, Aliase, Empfangs-, Aktions-, Wiederholungs- und Endbelege. Transportmetadaten verändern diese Bindung nicht. Ein aktuell berechtigter Konsolennutzer startet einen zentral vorbereiteten Import; jeder Chunk wartet auf die exakte Inhaltsquittung. Letzter Chunk bedeutet bereit zur zentralen Verifikation, niemals automatische Umschaltung. Nutzerlöschung und dauerhafte zentrale Ownersperren haben Vorrang. Produktive Verifikation, Umschaltung und Bereinigung bleiben gesondert offen.

## Audio und Oberfläche

`radio/connection` besitzt weiterhin genau ein Audioelement und dessen Hörwunsch. Metadaten und zentrale Sendungsdaten steuern das Audio nicht. Bewusstes Play, Realm-Startvarianten, Startfrist, Fortschrittsnachweis, Fortsetzung, Stillstandsschutz, Mute/Stop, Backoff und Generationen bleiben erhalten; Nutzer-Wiedergabediagnose bleibt entfernt.

Zentrale Sendungsdaten laufen nach höchstens 45 Sekunden aus, die Channelverbindung getrennt nach 65 Sekunden. Das wirkt auf Thema, DJ und Wunschbox; das laufende Radioelement bleibt erhalten. Alle Rollen verwenden die bisherige Höreranordnung ohne Moderationstaste. `/mw admin` öffnet die Verwaltung für den echten Inhaber Otterchen und Polaroid. Der neue `canUseAdministration`-Nachweis erweitert weder den bestehenden `canAdminister`-Inhabernachweis noch `/settopic` oder `/update`.

## Auslieferung und Nachweise

`prepare:upload` bündelt ganze benachbarte Module bei gleicher Ladefolge und Fachordnerzuordnung. Das Ziel ist der aufgelöste Nutzerdesktop unter `MischWerk/UPLOAD/MischWerk`. Fünf Manifeste belegen Quellen, Bytes und Hashes. Arbeitsquellen bleiben lesbar, Laufzeittexte unter 9500 UTF-16-Zeichen.

[Projektregeln](../../../AGENTS.md) · [Frontend](ARCHITEKTUR-FRONTEND.md) · [API-Nachweis](../api/API-NACHWEIS.md) · [Prüfbericht](../pruefung/PRUEFBERICHT.md)
