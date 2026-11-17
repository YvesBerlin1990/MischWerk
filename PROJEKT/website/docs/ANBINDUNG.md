# Öffentliche Website-Anbindung

Website 0.2.13 entfernt den zusätzlichen Node-Arbeitsbereich samt eigener Channelanmeldung/PIN und nativer Moderationsregie. `/arbeitsbereich` und `/api/workspace/*` liefern 410; zugehörige Controller/Styles werden nicht bereitgestellt.

Die reguläre redaktionelle Homepage unter www.radio-mischwerk.de bleibt im bisherigen Firebase-Betrieb. Knuddels empfängt zentrale Sendungs-/Freigabedaten und überträgt eigene Wünsche über den vorhandenen signierten postURL-Port. Der gemeinsame V2-Vertrag wird im Android-Projekt gepflegt. Dieses lokale Node-Projekt führt keine neue produktive Firebase-Verbindung ein.

Der optionale öffentliche App-WebHook liest weiterhin Radio und Kalender; POST-Schreib-/Anmeldeaktionen sind stillgelegt. Öffentliches Node-Radio, Navigation, Entwürfe, Formularvalidierung und Mailadapter sind unabhängig. Tests verwenden synthetische Antworten und eine Mailtransportattrappe.

[Projektregeln](../../../AGENTS.md) · [Betrieb](../../docs/betrieb/INBETRIEBNAHME.md) · [Websiteprüfung](PRUEFUNG.md)
