/* Dateiprüfung und Backend-Ladeplan. */
if (typeof MischWerkUpdateProbe === 'function') {
    MischWerkUpdateProbe(/* update-files:start */ {
  "schema": 1,
  "version": "0.1.392",
  "buildNumber": 392,
  "directories": {
    "": [
      "main.js",
      "app.config"
    ],
    "server": [
      "config.js",
      "maintenance.js",
      "lifecycle.js",
      "app.js"
    ],
    "server/core": [
      "runtime.js",
      "diagnostics.js",
      "changes.js",
      "relay-results.js",
      "validation.js",
      "pin-constants-1.js",
      "pin-constants-2.js",
      "pin-bcrypt.js",
      "composition.js"
    ],
    "server/users": [
      "identity.js",
      "greetings.js",
      "nicklist-storage.js",
      "nicklist.js"
    ],
    "server/state": [
      "persistence.js",
      "initialization.js"
    ],
    "server/radio": [
      "station.js",
      "team.js",
      "pin-work.js",
      "pin.js",
      "moderation.js",
      "announcements.js",
      "ticker.js",
      "ticker-command.js",
      "handover.js",
      "show.js"
    ],
    "server/channel-texts": [
      "format.js",
      "storage.js",
      "smileys.js",
      "scheduler.js",
      "transport.js",
      "settings.js"
    ],
    "server/wishes": [
      "export-state.js",
      "control-state.js",
      "storage.js",
      "queue.js",
      "transport.js",
      "website.js"
    ],
    "server/schedule": [
      "calendar.js",
      "storage.js",
      "programme.js",
      "commands.js",
      "relay.js",
      "overview.js",
      "public-data.js",
      "public.js",
      "day.js",
      "broadcasts.js",
      "transport.js"
    ],
    "server/ui": [
      "snapshot.js",
      "session-state.js",
      "loading.js",
      "content.js",
      "sessions.js",
      "wish-surface.js",
      "overlays.js",
      "administration.js",
      "commands.js"
    ],
    "server/transport": [
      "views.js",
      "events.js"
    ],
    "server/website": [
      "access.js",
      "public.js",
      "commands.js",
      "transport.js"
    ],
    "server/android": [
      "signing.js",
      "failures.js",
      "connection.js",
      "diagnostics.js",
      "settings-access.js",
      "settings.js",
      "receipts.js",
      "incoming.js",
      "studio-wishes.js",
      "wish-control.js",
      "wish-commands.js",
      "projection.js",
      "commands.js",
      "publisher.js",
      "verification.js",
      "relay.js",
      "operation.js"
    ],
    "www": [
      "index.html",
      "relay-settings.html"
    ],
    "www/js": [
      "start.js"
    ],
    "www/js/ui": [
      "composition.js",
      "layout.js",
      "overlays.js",
      "updates.js"
    ],
    "www/js/core": [
      "dom.js",
      "signals.js",
      "model.js"
    ],
    "www/js/radio": [
      "markup.js",
      "viewport.js",
      "metadata.js",
      "requests.js",
      "api.js",
      "presentation.js",
      "provider.js",
      "volume.js",
      "connection.js",
      "player.js",
      "listener.js",
      "ticker.js"
    ],
    "www/js/wishes": [
      "markup.js",
      "wishbox.js",
      "feedback.js",
      "relay.js",
      "drawer.js",
      "window.js"
    ],
    "www/js/studio": [
      "markup.js",
      "handover-markup.js",
      "controls.js",
      "handover.js",
      "workspace.js",
      "window.js",
      "reader.js",
      "queue.js"
    ],
    "www/js/team": [
      "markup.js",
      "channel-texts-markup.js",
      "layout.js",
      "management.js",
      "channel-texts.js",
      "navigation.js"
    ],
    "www/js/transport": [
      "commands.js",
      "lifecycle.js"
    ],
    "www/js/operator": [
      "relay-settings.js"
    ],
    "www/js/schedule": [
      "markup.js",
      "view.js",
      "controller.js"
    ],
    "www/css/radio": [
      "ticker.css",
      "radio.css",
      "radio-actions.css",
      "radio-surface.css",
      "metadata-layout.css",
      "radio-responsive.css"
    ],
    "www/css/shared": [
      "foundation.css",
      "dialogs.css",
      "feedback.css",
      "dialogs-responsive.css"
    ],
    "www/css/studio": [
      "studio.css",
      "responsive.css",
      "studio-queue.css",
      "handover.css"
    ],
    "www/css/team": [
      "team.css",
      "connection.css"
    ],
    "www/css/wishes": [
      "wishbox.css"
    ],
    "www/css/schedule": [
      "day.css"
    ],
    "www/img": [
      "mischwerk-logo.png",
      "mischwerk-radio.png"
    ],
    "www/img/nicklist": [
      "team.png",
      "listener.png",
      "moderator.png"
    ],
    "www/img/welcome": [
      "banner.png",
      "lieblingschannel.png",
      "mitmachen.png",
      "channelinfo.png"
    ],
    "www/fonts": [
      "inter-latin.woff2",
      "OFL.txt",
      "bcrypt-LICENSE.txt",
      "outfit-latin.woff2",
      "fraunces-latin.woff2",
      "outfit-OFL.txt",
      "fraunces-OFL.txt",
      "rajdhani-medium-latin.woff2",
      "rajdhani-OFL.txt"
    ]
  }
} /* update-files:end */);
} else {
var MischWerkModules = {};
KnuddelsServer.execute('server/config.js');
KnuddelsServer.execute('server/core/runtime.js');
KnuddelsServer.execute('server/core/diagnostics.js');
KnuddelsServer.execute('server/core/changes.js');
KnuddelsServer.execute('server/core/relay-results.js');
KnuddelsServer.execute('server/users/identity.js');
KnuddelsServer.execute('server/core/validation.js');
KnuddelsServer.execute('server/state/persistence.js');
KnuddelsServer.execute('server/radio/station.js');
KnuddelsServer.execute('server/radio/team.js');
KnuddelsServer.execute('server/core/pin-constants-1.js');
KnuddelsServer.execute('server/core/pin-constants-2.js');
KnuddelsServer.execute('server/core/pin-bcrypt.js');
KnuddelsServer.execute('server/radio/pin-work.js');
KnuddelsServer.execute('server/radio/pin.js');
KnuddelsServer.execute('server/radio/moderation.js');
KnuddelsServer.execute('server/radio/announcements.js');
KnuddelsServer.execute('server/radio/ticker.js');
KnuddelsServer.execute('server/radio/ticker-command.js');
KnuddelsServer.execute('server/users/greetings.js');
KnuddelsServer.execute('server/channel-texts/format.js');
KnuddelsServer.execute('server/channel-texts/storage.js');
KnuddelsServer.execute('server/channel-texts/smileys.js');
KnuddelsServer.execute('server/channel-texts/scheduler.js');
KnuddelsServer.execute('server/channel-texts/transport.js');
KnuddelsServer.execute('server/radio/handover.js');
KnuddelsServer.execute('server/state/initialization.js');
KnuddelsServer.execute('server/radio/show.js');
KnuddelsServer.execute('server/wishes/export-state.js');
KnuddelsServer.execute('server/wishes/control-state.js');
KnuddelsServer.execute('server/wishes/storage.js');
KnuddelsServer.execute('server/wishes/queue.js');
KnuddelsServer.execute('server/wishes/transport.js');
KnuddelsServer.execute('server/schedule/calendar.js');
KnuddelsServer.execute('server/schedule/storage.js');
KnuddelsServer.execute('server/schedule/programme.js');
KnuddelsServer.execute('server/schedule/commands.js');
KnuddelsServer.execute('server/schedule/relay.js');
KnuddelsServer.execute('server/schedule/overview.js');
KnuddelsServer.execute('server/schedule/public-data.js');
KnuddelsServer.execute('server/schedule/public.js');
KnuddelsServer.execute('server/schedule/day.js');
KnuddelsServer.execute('server/schedule/broadcasts.js');
KnuddelsServer.execute('server/schedule/transport.js');
KnuddelsServer.execute('server/ui/snapshot.js');
KnuddelsServer.execute('server/ui/session-state.js');
KnuddelsServer.execute('server/transport/views.js');
KnuddelsServer.execute('server/ui/loading.js');
KnuddelsServer.execute('server/ui/content.js');
KnuddelsServer.execute('server/ui/sessions.js');
KnuddelsServer.execute('server/users/nicklist-storage.js');
KnuddelsServer.execute('server/users/nicklist.js');
KnuddelsServer.execute('server/ui/wish-surface.js');
KnuddelsServer.execute('server/ui/overlays.js');
KnuddelsServer.execute('server/ui/administration.js');
KnuddelsServer.execute('server/ui/commands.js');
KnuddelsServer.execute('server/maintenance.js');
KnuddelsServer.execute('server/channel-texts/settings.js');
KnuddelsServer.execute('server/wishes/website.js');
KnuddelsServer.execute('server/website/access.js');
KnuddelsServer.execute('server/website/public.js');
KnuddelsServer.execute('server/website/commands.js');
KnuddelsServer.execute('server/website/transport.js');
KnuddelsServer.execute('server/android/signing.js');
KnuddelsServer.execute('server/android/failures.js');
KnuddelsServer.execute('server/android/connection.js');
KnuddelsServer.execute('server/android/diagnostics.js');
KnuddelsServer.execute('server/android/settings-access.js');
KnuddelsServer.execute('server/android/settings.js');
KnuddelsServer.execute('server/android/receipts.js');
KnuddelsServer.execute('server/android/incoming.js');
KnuddelsServer.execute('server/android/studio-wishes.js');
KnuddelsServer.execute('server/android/wish-control.js');
KnuddelsServer.execute('server/android/wish-commands.js');
KnuddelsServer.execute('server/android/projection.js');
KnuddelsServer.execute('server/android/commands.js');
KnuddelsServer.execute('server/android/publisher.js');
KnuddelsServer.execute('server/android/verification.js');
KnuddelsServer.execute('server/android/relay.js');
KnuddelsServer.execute('server/android/operation.js');
KnuddelsServer.execute('server/lifecycle.js');
KnuddelsServer.execute('server/transport/events.js');
KnuddelsServer.execute('server/core/composition.js');
}
