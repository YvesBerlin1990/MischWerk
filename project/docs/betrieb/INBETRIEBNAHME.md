# MischWerk – Installation und Betrieb

Die [technische Übersicht](../ENTWICKLUNG.md) enthält die Voraussetzungen und Befehle für die lokale Entwicklung. Der Appstand steht im [App-Paket](../../userapp/package.json), der geprüfte Auslieferungsstand im [Live-Manifest](../../userapp/deployment/manifests/manifest-live.json).

## Installation und Upload

1. Aus `project/userapp/` das lokale Paket mit `pnpm run prepare:upload` bauen und mit `pnpm run check:upload` prüfen. Den aufgelösten direkten Appordner zeigt der Paketbau. Einrichtung eines persönlichen Ziels und Erzeugung der MyChannel-Deploy-Freigabe sind in den [Bereitstellungsregeln](../../../agent-rules.json) beschrieben.
2. Nach freigegebenem Upload den Inhalt des geprüften Appordners per FileZilla mit explizitem TLS an das in der [Zielkonfiguration](../../userapp/deployment/live.json) dokumentierte Ziel übertragen. Die Installationskennung und das inventarisierte Paket stehen im [Live-Manifest](../../userapp/deployment/manifests/manifest-live.json). Das Passwort im FTP-Programm eingeben.
3. Für eine Erstinstallation in Knuddels `/apps` öffnen und die Installationskennung aus dem Manifest eintragen. Bei einem bestehenden Appstand nach vollständiger Übertragung den freigegebenen Wartungsweg `/update` verwenden. Meldet der Befehl „Kein Neustart“, die genannte Lücke im Paket bzw. im Ziel prüfen und anschließend erneut ausdrücklich aufrufen.
4. Tatsächliche Version und Buildnummer im App-Log mit App-Paket und Live-Manifest vergleichen. Für den lesenden Inhaltstest gibt es `pnpm run check:delivery --base-url URL/`. Offene native Prüfungen stehen in der [LIVE-Abnahme](LIVE-ABNAHME.md).

[Knuddels-Projektstruktur](https://github.com/knuddelsgmbh/UserApps/wiki/Projektstruktur) · [Knuddels-Entwicklerportal](https://developer.knuddels.de/)

## Im Channel

- Die Befehlsübersicht öffnet `/mw`. Einstieg in die lokalen Einstellungen ist `/mw admin`. Die Einstellungsbereiche und Rechte stehen unter [Rechte und Verwaltung](../../../agent-rules.json).
- `/settopic TEXT` setzt das Channel-Thema. `/settopic --buttons` wählt die Vorlage, `/settopic --pruefen` liest die gespeicherte Zeichen- und Buttonzahl. Die Vorgaben zu Rechten, KCode und Rücklesen stehen unter [Natives Channel-Thema](../../../agent-rules.json).
- Die Tagesübersicht öffnet die Sendeplan-Taste in der Radioleiste. [Sendeplan](SENDEPLAN.md)

## STREAMPANEL einrichten

Die Konfiguration ist in [src/backend/config.js](../../userapp/src/backend/config.js) unter `MischWerkConfig.streampanel` zu finden. `node tools/checks/streampanel.cjs` prüft die eingetragenen öffentlichen Quellen lesend.

[Quellen und Wiedergaberegeln](../../../agent-rules.json) · [Schnittstellen](../api/API-NACHWEIS.md)

## Verbindung zum Live Studio

Einstieg in Knuddels ist `/mw admin → Verbindung`: Schlüssel speichern, dann ausdrücklich aktivieren. Die Regeln für den Abgleich stehen im Abschnitt „Zentrale Anbindung“ der [Projektregeln](../../../agent-rules.json). Offene Schritte stehen in der [LIVE-Abnahme](LIVE-ABNAHME.md).
