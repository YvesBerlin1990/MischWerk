# MischWerk – Architektur

## Aufbau

| Bereich | Einstieg |
| --- | --- |
| Backendquellen | [src/backend](../../src/backend) |
| Laufzeit und Komposition | [app/main.js](../../app/main.js), [server/app.js](../../app/server/app.js), [core/composition.js](../../app/server/core/composition.js) |
| Native Ansichten und Sitzungen | [ui/content.js](../../src/backend/ui/content.js), [ui/sessions.js](../../src/backend/ui/sessions.js), [ui/overlays.js](../../src/backend/ui/overlays.js) |
| Firebase-Abgleich | [android/publisher.js](../../src/backend/android/publisher.js), [android/native-transport.js](../../src/backend/android/native-transport.js), [core/http-budget.js](../../src/backend/core/http-budget.js) |
| Sendeplan | [schedule/public.js](../../src/backend/schedule/public.js) |
| Wunschbestand und Migration | [android/native-state.js](../../src/backend/android/native-state.js), [wishes/migration.js](../../src/backend/wishes/migration.js) |
| Website | [Website-Einstieg](../../website/README.md) |

Das Backend-Buildwerkzeug erzeugt die Laufzeitkopien. Befehle und Auslieferungswerkzeuge stehen in der [technischen Übersicht](../../README.md).

[Projektregeln](../../../AGENTS.md) · [Frontend](ARCHITEKTUR-FRONTEND.md) · [API-Nachweis](../api/API-NACHWEIS.md) · [Prüfbericht](../pruefung/PRUEFBERICHT.md)
