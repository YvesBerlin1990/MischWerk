/* Ein serverseitiger Timeout; keine Nachholserie oder sofortige Wiederholung unsicherer Ausgaben. */
MischWerkModules.attachChannelTextScheduler = function (runtime) {
    'use strict';
    var started = false, timer = null, generation = 0;
    function cancel() {
        generation += 1;
        if (timer !== null) { clearTimeout(timer); timer = null; }
    }
    function arm(state) {
        if (!started || runtime.shuttingDown || !state.enabled) { return; }
        var token = generation, delay = state.nextAt - runtime.now();
        if (delay <= 0) { delay = state.interval * 60000; }
        delay = Math.min(delay, state.interval * 60000);
        timer = setTimeout(function () {
            if (token !== generation || !started || runtime.shuttingDown) { return; }
            timer = null;
            var next;
            try {
                next = runtime.readChannelTexts();
                if (!next.enabled) { return; }
                if (next.nextAt > runtime.now()) { arm(next); return; }
                var index = next.cursor, count = 0;
                while (!next.texts[index] && count < next.texts.length) { index = (index + 1) % next.texts.length; count += 1; }
                if (count === next.texts.length) { return; }
                var message = next.texts[index];
                next.cursor = (index + 1) % next.texts.length;
                next.nextAt = runtime.now() + next.interval * 60000;
                // Bei unsicherem Sendeergebnis darf ein Neustart denselben Termin nicht erneut ausgeben.
                runtime.storeChannelTexts(next);
                try { KnuddelsServer.getDefaultBotUser().sendPublicMessage(message.escapeKCode()); }
                catch (error) { runtime.warn('CHANNEL_TEXTS_SEND'); }
            } catch (error) {
                runtime.warn('CHANNEL_TEXTS_TICK');
                // Auch ein Speicherfehler löst frühestens nach einem vollen Abstand einen neuen Versuch aus.
                if (next) { next.nextAt = runtime.now() + next.interval * 60000; }
            }
            if (next) { arm(next); }
        }, delay);
    }
    runtime.startChannelTexts = function () {
        if (started || runtime.shuttingDown) { return; }
        started = true;
        try {
            var state = runtime.readChannelTexts();
            if (state.enabled && state.nextAt <= runtime.now()) {
                state.nextAt = runtime.now() + state.interval * 60000;
                runtime.storeChannelTexts(state);
            }
            arm(state);
        } catch (error) { runtime.warn('CHANNEL_TEXTS_START'); }
    };
    runtime.restartChannelTexts = function () {
        cancel();
        if (started) { arm(runtime.readChannelTexts()); }
    };
    runtime.stopChannelTexts = function () { started = false; cancel(); };
};
