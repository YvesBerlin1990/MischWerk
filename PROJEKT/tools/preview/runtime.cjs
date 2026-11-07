// Getrennte lokale Sitzungen: Appdemo ohne Netz und ausdrücklich gewähltes öffentliches Radio.
const { createHarness } = require('../../tests/support/knuddels.cjs');

function createPreviewRuntime(publicRadio, onEvent, startModeration = true) {
  const harness = createHarness(undefined, { onEvent });
  if (!publicRadio) { harness.config.streampanel.streamUrl = ''; }
  harness.config.ownerNick = 'Testleitung';
  harness.config.curtainExemptNicks = ['Testleitung'];
  const owner = harness.user(1, publicRadio ? harness.config.ownerNick : 'Testmoderation', 'owner');
  const ownerSession = harness.open(owner);
  if (publicRadio) {
    harness.app.chatCommands.vorhang(owner, 'öffnen');
    ownerSession.remove(); owner.online = false;
  } else if (startModeration) { harness.event(owner, ownerSession, 'mw:onAir'); }
  if (!publicRadio) {
    [['Testhörer 1', 'Beispielinterpret – Beispieltitel 1'], ['Testhörer 2', 'Beispielinterpret – Beispieltitel 2']].forEach((sample, index) => {
      const user = harness.user(index + 2, sample[0]);
      harness.event(user, harness.open(user), 'mw:wish.submit', { submissionId: 'preview-' + index, text: sample[1] });
    });
  }
  return { harness, publicRadio, clockAt: Date.now() };
}
module.exports = { createPreviewRuntime };
