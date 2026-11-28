/* Nur geprüfte Knuddels-Bilder erhalten; gewöhnlichen Text weiterhin als Klartext senden. */
MischWerkModules.attachChannelTextFormat = function (runtime) {
    'use strict';
    runtime.channelSmileyCode = function (value) {
        return typeof value === 'string' && /^:\([a-z0-9][a-z0-9-]{0,70}\):$/.test(value);
    };
    runtime.channelSmileyImage = function (value) {
        if (typeof value !== 'string' || value.length > 700) { return null; }
        // Native Bildlinks besitzen unterschiedliche Trenner; das Klickziel nie übernehmen.
        var match = /^°>([^°<>|\s\\]+)(?:(?:<>--<>|<>)?\|\/tb-show [^°<>\r\n]{1,160})?<°$/.exec(value);
        // Native Bildmodifikatoren enthalten z.B. "happy...b.w_35". Nur Pfadsegmente sperren.
        if (!match || match[1].length > 400 || /(^|\/)\.\.?(\/|$)/.test(match[1])) { return null; }
        var path = match[1];
        var relative = /^(?:[a-zA-Z0-9_@-][a-zA-Z0-9_.@-]*\/)*[a-zA-Z0-9_@-][a-zA-Z0-9_.@-]*\.(gif|png)$/.test(path);
        var absolute = /^https?:\/\/(?:[a-z0-9-]+\.)*knuddels\.(de|biz)\/(?:[a-zA-Z0-9_@-][a-zA-Z0-9_.@-]*\/)*[a-zA-Z0-9_@-][a-zA-Z0-9_.@-]*\.(gif|png)(?:\?[a-zA-Z0-9_.~%=&+-]{1,120})?$/.test(path);
        return relative || absolute ? '°>' + path + '<°' : null;
    };
    runtime.nativeChannelSmileyImage = function (value) {
        if (typeof value !== 'string' || value.length > 2000) { return null; }
        // Nur außen stehende Textformatierung abnehmen, niemals Zeichen im Bildpfad ersetzen.
        var start = /^(?:[\s_]|°(?:r|#|[0-9]{1,2}|[A-Z]|\[[0-9]{1,3}(?:,[0-9]{1,3}){2}\])°)+/;
        var end = /(?:[\s_]|°(?:r|#|[0-9]{1,2}|[A-Z]|\[[0-9]{1,3}(?:,[0-9]{1,3}){2}\])°)+$/;
        var body = value.replace(start, '').replace(end, '').replace(/^smiley\s+/, '');
        return runtime.channelSmileyImage(body.replace(start, '').replace(end, ''));
    };
    runtime.formatChannelText = function (text, smileys) {
        var known = {}, result = '', offset = 0, size = text.escapeKCode().length, match;
        (smileys || []).forEach(function (item) { known[item.code] = item.image; });
        var tokens = /°>[^°\r\n]{1,700}<°|:\([a-z0-9][a-z0-9-]{0,70}\):/g;
        while ((match = tokens.exec(text)) !== null) {
            var token = match[0], escaped = token.escapeKCode();
            var image = known[token] || runtime.channelSmileyImage(token);
            result += text.slice(offset, match.index).escapeKCode();
            // Auch sehr viele große Smileys bleiben unter der öffentlichen Nachrichtengrenze.
            if (image && size + image.length - escaped.length < 9500) {
                size += image.length - escaped.length;
                result += image;
            } else { result += escaped; }
            offset = match.index + token.length;
        }
        return result + text.slice(offset).escapeKCode();
    };
};
