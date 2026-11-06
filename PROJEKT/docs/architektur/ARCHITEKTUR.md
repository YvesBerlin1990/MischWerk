# MischWerk – Architektur 0.1.239 · Build 239

Stand 06.11.2026. Diese Übersicht beschreibt den aktuellen Aufbau; verbindliche Fach- und Entwicklungsregeln stehen ausschließlich in [AGENTS.md](../../AGENTS.md).

## Zusammensetzung und Start

`app/main.js` lädt `server/app.js` über `KnuddelsServer.execute` und übernimmt das globale `App`. 48 gepflegte ES5/Rhino-Module unter `src/backend/` werden bytegleich nach `app/server/` gebaut. Das Kompositionsmodul verdrahtet Komponenten und Hooks; Fachereignisse liegen in ihren zuständigen Modulen. `android/diagnostics` liefert dem anwesenden Channelinhaber eine rein lesende Server-/Domainprüfung. `android/settings` besitzt ausschließlich private Einrichtungssitzungen und den geschützten Speicheradapter. `ui/sessions` stellt für bisherige Ansichten und Betreiberansicht denselben nativen Erzeugungs-, Versand- und Schließweg bereit.

`index.html` fordert CSS und `js/start.js` während des Parsens über `Client.includeCSS/includeJS` an. Das berücksichtigt die `document.write`-Implementierung des SDK. `ui/composition` verdrahtet die benötigten Komponenten einmalig. Vollständiges Markup, registrierte Module und geladenes CSS geben das Anfangslayout frei. Ein langsames Logo blockiert die Radioleiste nicht; fehlende Pflichtressourcen erzeugen einen sichtbaren Fehler. Der einmalige 15-Sekunden-Wächter erkennt einen still fehlgeschlagenen Start.

49 bisherige Frontendkomponenten und 18 Stylesheets sind in ansichtsabhängigen Ladeplänen registriert. Dazu kommen zwei getrennt inventarisierte Betreiberdateien `relay-settings.html` und `js/operator/relay-settings.js`. Die 80 bisherigen Browser-/Mediendateien, zwei Betreiberdateien, 48 Backenddateien und zwei Einstieg-/Konfigurationsdateien ergeben 132 Laufzeitdateien. Private Betreiberdateien stehen im bestehenden Manifest der privaten Arbeitsflächen; sie werden nicht in öffentliche Ladepläne aufgenommen. [Frontendarchitektur](ARCHITEKTUR-FRONTEND.md).

## Audio, Anbieter und Aktivitätsbestätigung

`radio/connection` besitzt allein Audioquelle, nativen Play/Pause/Load-Zugriff, Hörwunsch, Medienereignisse und den einzelnen Beobachtungs-/Wiederverbindungstimer. `radio/player` bedient den Controller und stellt seinen Zustand dar. Kurze Lücken erhalten Quelle und Browserpuffer; ein bloßes `stalled` bedeutet keinen Audiostopp. Unerwartete Pause wird auf derselben Quelle fortgesetzt. Echte Fehler, Ende oder bestätigter Stillstand führen zu zeitlich gestaffelten neuen Versuchen, solange der Hörwunsch besteht.

Stop, Quellenwechsel, Werbung starten und Seitenende löschen den Hörwunsch. Verspätete Ereignisse/Promises dürfen ihn nicht wiederherstellen. Automatische Erholung erhält Lautstärke und Mute; nur ein bewusster neuer Play-Versuch verwendet die leise Startregel.

`radio/api` prüft die konfigurierte HTTPS-Audioadresse getrennt von den Datenquellen. `radio/provider` besitzt ausschließlich Metadaten, Status, Modus, Abfragegenerationen und Prüfzeiten. Datenfehler oder bestätigte Statuswerte steuern kein Audio. Titel/Interpret bleiben getrennte Originaltexte. Studioanmeldung und Anbieter-LIVE sind unabhängige Fakten, die `radio/presentation` gemeinsam darstellt.

`transport/lifecycle` nutzt den bestehenden Sekundentakt für den Wiedergabe-Heartbeat. Während desselben Hörwunschs bleibt der Drei-Minuten-Termin über Nachladephasen erhalten. `/confirm` setzt tatsächlichen Audiofortschritt, eine passende frische `mw:refresh`-Antwort und danach weiteren Fortschritt voraus. Stop/Seitenende löschen den Zeitplan. Kein zweiter Audio- oder Heartbeatweg bleibt aktiv. [Native Ursache und Tests](../pruefung/PRUEFBERICHT.md).

## Backendkomponenten

| Datei unter server/ | Verantwortung / öffentliche Funktionen |
| --- | --- |
| config.js | Öffentliche Sender-, Rollen- und Längenkonfiguration |
| core/runtime.js | Laufzeitkonstanten, now, copy, failure, jsonBytes |
| core/diagnostics.js | Datensparsame warn-Diagnose mit eigener Meldedrossel |
| core/changes.js | Interne Änderungssignale; Beobachterfehler verändern keine native Fachaktion |
| core/validation.js | Textnormalisierung und unveränderte Rhino-kompatible Linkprüfung |
| users/identity.js | Primitive Userwerte, Anwesenheit und serverseitige Rollen |
| state/persistence.js | initialState, readState, persist und Bereinigung historischer Marker |
| state/initialization.js | load: beim ersten Laden Speicher lesen, danach Studio-Anmeldung prüfen |
| radio/station.js | Geprüfte öffentliche Senderadressen |
| ui/administration.js | /MW Verwaltung prüfen und an den zentralen Overlayweg übergeben |
| radio/team.js | Ernennen, Entziehen und paginierte Radio-Team-Ansicht |
| radio/moderation.js | moderatorKey, invalidateModerator, moderatorIsActive, prune, changeModeration, transferModeration; ausdrückliche Abmeldung leert atomar das Thema |
| radio/announcements.js | initializeStudioAnnouncements, announceStudioStatus; öffentliche Bottexte und laufzeitinterner Vergleich der Moderator-ID |
| radio/handover.js | changeHandover, handoverSnapshot, pruneHandover, dropHandoverForUser; berechtigte Teilnehmer und flüchtige Anfrage |
| radio/show.js | Thema und Wunschboxstatus mit bestätigten Vorwerten ändern |
| radio/curtain.js | curtainState, changeCurtain; authentifizierte Ausnahmen, Otterchen als tatsächlicher Inhaber, globalen Vorhang über persist ändern |
| wishes/queue.js | Flüchtige Queue, Annahme, Deduplizierung, Empfang, Entfernen und private wishPositions aus authentifiziertem User |
| wishes/transport.js | Wunschprotokoll und sichtbaren Moderationsempfang prüfen |
| wishes/website.js | Anonyme Websiteherkunft, Inhalt und Wiederholung in derselben flüchtigen Queue |
| website/access.js | Einmalcode, authentifizierte Kopplung, Rollen-/Präsenzprüfung, Ablauf und Wiederholungsschutz |
| website/public.js | Öffentliche Radiodaten und Kalenderprojektion ohne interne Identitäten |
| website/commands.js | Bestätigte Webaufträge an bestehende Fachaktionen verteilen |
| website/transport.js | HTTP-Callback, begrenzte Antworten und Raten, bewusste Besitzerfreigabe |
| android/connection.js | Private Verbindungskonfiguration, Laufzeit-/Domainfreigabe und nativen postURL-Adapter kapseln |
| android/receipts.js | Begrenzte Annahme-/Endstatusmarker und ausstehende Statusübertragungen, ohne Texte/Namen |
| android/publisher.js | Firebase-Vertragsprojektion, Heartbeat, Antwortprüfung und Lebensdauer des injizierten HTTPS-Ports |
| android/webhook.js | Authentisierter POST-Wunschvertrag, Drosselung, Idempotenz und sichere Startsperre |
| channel-texts/storage.js | Persistente Bot-Einstellungen und Revisionsmodell |
| channel-texts/settings.js | Gemeinsame bestätigte Fachänderung für native und Websiteverwaltung |
| channel-texts/scheduler.js | Ein vorhandener Timer für öffentliche Bot-Ausgabe und Rotationszeiger |
| channel-texts/transport.js | Native Sitzungskontrolle vor gemeinsamen Bot-Einstellungen |
| ui/snapshot.js | Berechtigte Ansichtsmodelle und Wunschdarstellung |
| ui/wish-surface.js | Ausschließlich gepaarte Eingaben und Darstellung weiterreichen; kein Öffnen, Schließen oder Einreihen |
| ui/loading.js | Optionale native Ladefarben und leere Overlayabdeckung |
| ui/session-state.js | Aktuelle Sessionmitgliedschaft und Öffnungszeit prüfen |
| ui/sessions.js | Aktive Sitzung prüfen; openView / closeView und private prepareView; einziger nativer Lebenszyklus, authentifizierte Header-/Overlayzuordnung und Lebensdauer |
| ui/overlays.js | openOverlay / handleOverlayEvent / expireOverlays; bestätigter Wechsel, flüchtige private Entwürfe, Token und Wiederfreigabe |
| transport/views.js | send, refresh, broadcast und allgemeines result |
| transport/events.js | Authentifizierte Events prüfen und an Fachmodule verteilen; Vorhang-Chatbefehl privat beantworten und bestätigten Fachzustand verteilen |
| schedule/calendar.js | Validierte Kalenderdaten, deutsche Tagesgrenze, Wochen und Zeitintervalle |
| schedule/storage.js | Eigene Wochenpersistenz, Wochenindex und personenbezogene Bereinigung |
| schedule/programme.js | Besitzeraktionen, Revisions-/Zeitprüfung und öffentliche Lesepakete |
| schedule/transport.js | Sitzungsgeprüftes mw:schedule-Protokoll und Änderungsbenachrichtigung |
| maintenance.js | Appmanager-/update mit FTP-Dateiprüfung und eigener Auftragssperre |
| lifecycle.js | Appstart, Beitritt, Verlassen, Nutzerlöschung und Shutdown |
| app.js | Ausschließlich Komponenten laden, erzeugen und verdrahten |




## Zustand und Datenfluss

`state/persistence` besitzt den allgemeinen dauerhaften Zustand und Commit. Sendeplanwochen und Bot-Einstellungen besitzen getrennte Speicheradapter. `radio/moderation` verwaltet die Studioanmeldung einschließlich fester Endzeit oder explizitem Open End; `radio/handover` besitzt die flüchtige bestätigte Übergabe und private Notizen.

`wishes/queue` hält Wünsche ausschließlich im Arbeitsspeicher. Authentifizierte Hörer erhalten ihre eigenen offenen Wünsche; nur berechtigte Moderation sieht fremde Wünsche und Absender. Manuelle Stufen und Entfernen ändern keinen Audiostream. Ein tatsächlicher App-Neustart leert die Queue.

Der Wunschversandcontroller `wishes/wishbox` lebt in der Radioleiste. Das native Wunschfenster reicht Eingaben und Darstellung zwischen authentifizierten gepaarten Sitzungen weiter. Entwurfsabgleich ist gebündelt; Schlusszeichen werden vor Absenden/Schließen übernommen. `ui/overlays` sichert Wechsel mit Token, Frist und Revision. Rechteverlust löscht private Entwürfe; alte geschlossene Sitzungen dürfen keine neuen schließen oder überschreiben.

## Android-Vorbereitung

Die Android-Vorbereitung verwendet dieselbe flüchtige Wunschqueue. Herkunft und vorhandenes Absenderfeld tragen Android; keine Knuddels-Identität wird erzeugt. Der getrennte technische Markerbestand ist keine Queue: Er enthält keine Wunschtexte, Namen oder Reihenfolgeentscheidung. Endzustände werden vor dem Entfernen festgehalten; ein Neustart markiert offene Android-IDs als verworfen. Die Laufzeit behält höchstens 256 Marker, Endzustände sieben Tage. Schalter-/Studiowechsel und Queueänderungen informieren Beobachter über core/changes, ohne zyklische Fachabhängigkeit.

android/connection erzeugt den nativen HTTPS-Port nur nach privatem enabled=true, explizitem runtimeVerified=true und bestätigter Domainfreigabe. postURL erhält data.payload als JSON-String und header.Authorization; Firebase Hosting soll den Wrapper an publishKnuddelsState weiterreichen. Der Publisher enthält keine native HTTP-Kodierung. Ein logisch abgebrochener nativer Request hält den tatsächlichen Port bis zum Callback belegt. Ohne Konfiguration bleibt die Auslieferung ausgeschaltet. Reale Laufzeit-, Kodierungs-, Domain- und Secret-Provisionierungsprüfung stehen weiterhin aus. [Vertrag und Grenzen](../api/API-NACHWEIS.md#android-wunschbox--lokale-vorbereitung-225).

## Native Ansichten

`ui/administration` registriert den über `App.chatCommands.mw` verdrahteten Chat-Einstieg. `users/identity.canAdminister` prüft tatsächliches Inhaberrecht, Anwesenheit und den authentifizierten Nick Otterchen. Der Befehl verwendet `ui/overlays`; `ui/sessions` prüft vor der verzögerten Öffnung erneut. Der runde Moderationsbutton benötigt die serverseitigen booleschen Freigaben `showModerationButton` und `canModerate` aus demselben bestätigten Zustand. Der echte Inhaber Otterchen erhält beide automatisch; andere Nutzer benötigen ihren gespeicherten Radio-Team-Eintrag.

`ui/sessions` ist alleiniger Ort für HTMLFile, AppContent, Versand und Schließen. Radio ist eine Headerbar; Wunschbox, Moderation, Verwaltung und Sendeplan sind getrennte native Overlays. `sendAppContent` übernimmt die native Ersetzung. Wiederholte Aufträge mit gleicher Anfrage-ID werden dedupliziert. Die bestehende Headerbar bleibt bei Menüwechseln erhalten.

| Ansicht | Anfangsmaß | Inhaltsanpassung |
| --- | --- | --- |
| Radio | 176 px hoch | Eigene Höhenlogik in `radio/viewport`; kompakter Fallback bei Clientgrenzen |
| Wunschbox | 560 × 340 px | `wishes/window` passt die benötigte Inhaltshöhe an |
| Moderation | 780 × 730 px | `studio/window`, Gruppen-/Textseiten; stabile Geometrie während Themenbearbeitung |
| Verwaltung | 560 × 630 px | Fester Rahmen, Radio-Team-Pagination und ein Inhalts-Scrollbereich für Bot-Texte |
| Sendeplan | 820 × 630 px | Fester Rahmen, Kalenderpagination und natürlich erreichbare Inhalte |

Native Overlays erhalten eine aktive leere Ladeabdeckung in #0f1114. Früher HTML-Untergrund passt dazu. Die SDK-Readiness bleibt unverändert; ein verbleibender nativer Erstöffnungsblitz ist nicht als vollständig behoben abgenommen.

## Website und Auslieferung

Die Website besitzt einen eigenen Node-Server. Der standardmäßig ausgeschaltete App-WebHook verwendet dieselben Fachaktionen, Rollen und Revisionen. Einmalcode und Bestätigung im Channel koppeln die Identität; private Tokens bleiben auf dem Websiteserver. Es entsteht keine zweite Plan-/Wunschdatenbank. [Anbindung](../../website/docs/ANBINDUNG.md).

Fünf Manifeste unter `deployment/manifests/` belegen Server, Browsercode, Studio und Medien. `prepare-upload` bündelt vollständige Quellmodule ausschließlich zur Auslieferung, ohne Minifizierung. `check:upload` prüft Inventar, Zeichenlängen, Bytezahlen und SHA-256. Alle Texte und Manifeste bleiben unter 9500 Zeichen. Der feste Desktop-UPLOAD ist lokal; GitHub-Push, FTP-Übertragung und Knuddels-Update sind getrennte Schritte.

[API-Nachweis](../api/API-NACHWEIS.md) · [Betrieb](../betrieb/INBETRIEBNAHME.md) · [Prüfbericht](../pruefung/PRUEFBERICHT.md).
