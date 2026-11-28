# MischWerk – Architektur

## Aufbau

| Bereich | Einstieg |
| --- | --- |
| Backendquellen | [src/backend](../../userapp/src/backend) |
| Laufzeit und Komposition | [app/main.js](../../userapp/app/main.js), [server/app.js](../../userapp/app/server/app.js), [core/composition.js](../../userapp/app/server/core/composition.js) |
| Native Ansichten und Sitzungen | [ui/content.js](../../userapp/src/backend/ui/content.js), [ui/sessions.js](../../userapp/src/backend/ui/sessions.js), [ui/overlays.js](../../userapp/src/backend/ui/overlays.js) |
| Firebase-Abgleich | [android/publisher.js](../../userapp/src/backend/android/publisher.js), [android/native-transport.js](../../userapp/src/backend/android/native-transport.js), [core/http-budget.js](../../userapp/src/backend/core/http-budget.js) |
| Sendeplan | [schedule/public.js](../../userapp/src/backend/schedule/public.js) |
| Wunschbestand | [android/native-state.js](../../userapp/src/backend/android/native-state.js), [wishes/storage.js](../../userapp/src/backend/wishes/storage.js) |

Das Backend-Buildwerkzeug erzeugt die Laufzeitkopien. Befehle und Auslieferungswerkzeuge stehen in der [technischen Übersicht](../ENTWICKLUNG.md).

[Projektregeln](../../../agent-rules.json) · [Frontend](ARCHITEKTUR-FRONTEND.md) · [Schnittstellen](../api/API-NACHWEIS.md) · [Prüfbericht](../pruefung/PRUEFBERICHT.md)
