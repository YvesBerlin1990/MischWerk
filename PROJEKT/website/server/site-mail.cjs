// SMTP bleibt vollständig auf dem Server. Zugangsdaten werden nie an den Browser ausgegeben.
const nodemailer = require('nodemailer');
function createApplicationMail(env = process.env, transport) {
  const recipient = env.MISCHWERK_APPLICATION_TO || '';
  const sender = env.MISCHWERK_SMTP_FROM || env.MISCHWERK_SMTP_USER || '';
  const configured = env.MISCHWERK_APPLICATIONS_ENABLED === 'true' && !!(recipient && sender && (transport || (env.MISCHWERK_SMTP_USER && env.MISCHWERK_SMTP_PASSWORD)));
  let client = transport;
  if (configured && !client) {
    const port = Number(env.MISCHWERK_SMTP_PORT || 465);
    client = nodemailer.createTransport({ host: env.MISCHWERK_SMTP_HOST || 'smtp.mailbox.org', port,
      secure: port === 465, requireTLS: true,
      auth: { user: env.MISCHWERK_SMTP_USER, pass: env.MISCHWERK_SMTP_PASSWORD },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false });
  }
  return {
    configured,
    async send(data) {
      if (!configured) { throw Error('mail unavailable'); }
      const result = await client.sendMail({ from: { name: 'Radio MischWerk', address: sender },
        to: recipient, replyTo: { name: data.name, address: data.email },
        subject: 'Bewerbung als Moderator bei Radio MischWerk',
        text: 'Name: ' + data.name + '\nAntwortadresse: ' + data.email + '\n\nZeit und Erfahrung:\n' + data.availability +
          '\n\nVorstellung:\n' + data.message });
      if (!result.accepted || !result.accepted.length || result.rejected?.length) { throw Error('mail rejected'); }
    }
  };
}
module.exports = { createApplicationMail };
