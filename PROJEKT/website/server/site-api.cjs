// Öffentliche Websiteformulare und lesender Sendeplan. Die App-Testrollen sind hiervon getrennt.
const { randomBytes } = require('node:crypto');
const { createApplicationMail } = require('./site-mail.cjs');
const { createSiteBridge } = require('./site-bridge.cjs');
const content = require('./site-content.cjs');
function createSiteApi({ env = process.env, mail = createApplicationMail(env), bridge = createSiteBridge(env) } = {}) {
  const rates = new Map(), sent = new Map(), pending = new Set();
  function respond(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(data));
  }
  function text(value, min, max) {
    if (typeof value !== 'string' || value.length > max || value.trim().length < min || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw Error('validation');
    return value.trim();
  }
  function limited(key, max) {
    const now = Date.now();
    for (const [id, row] of rates) if (row.until < now) rates.delete(id);
    const row = rates.get(key) || { count: 0, until: now + 10 * 60000 };
    row.count++; rates.set(key, row); return row.count > max;
  }
  return async function siteApi(req, res, url) {
    if (!url.pathname.startsWith('/api/site/')) return false;
    if (req.method === 'GET' && url.pathname === '/api/site/content') {
      respond(res, 200, { ...content, applicationsAvailable: mail.configured, appConnected: bridge.configured }); return true;
    }
    if (req.method === 'GET' && url.pathname === '/api/site/schedule') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('week') || '') || !/^\d{1,4}$/.test(url.searchParams.get('page') || '0')) {
        respond(res, 400, { message: 'Bitte wähle eine Kalenderwoche.' }); return true;
      }
      try { respond(res, 200, await bridge.schedule(url.searchParams.get('week'), Number(url.searchParams.get('page') || 0))); }
      catch { respond(res, 503, { message: 'Der Sendeplan ist gerade nicht verfügbar. Bitte versuche es später noch einmal.' }); }
      return true;
    }
    if (req.method !== 'POST' || !['/api/site/applications', '/api/site/wishes'].includes(url.pathname)) {
      respond(res, 405, { message: 'Dieser Aufruf ist nicht verfügbar.' }); return true;
    }
    if (req.headers.origin !== (env.MISCHWERK_PUBLIC_ORIGIN || 'http://' + req.headers.host) || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
      respond(res, 403, { message: 'Bitte öffne das Formular auf dieser Website.' }); return true;
    }
    const parts = []; let size = 0;
    for await (const part of req) {
      size += part.length;
      if (size > 12000) { respond(res, 413, { message: 'Die Eingabe ist zu lang.' }); return true; }
      parts.push(part);
    }
    const raw = Buffer.concat(parts, size).toString('utf8');
    let data;
    try { data = JSON.parse(raw); if (!data || typeof data !== 'object' || Array.isArray(data) || data.website) throw Error('validation'); }
    catch { respond(res, 400, { message: 'Bitte prüfe deine Eingaben.' }); return true; }
    const application = url.pathname.endsWith('/applications');
    try {
      if (!/^[a-zA-Z0-9_-]{12,80}$/.test(data.submissionId || '')) throw Error('validation');
      if (application) {
        data = { submissionId: data.submissionId, name: text(data.name, 1, 80), email: text(data.email, 3, 254),
          availability: text(data.availability, 1, 1000), message: text(data.message, 10, 3000) };
        if (/[\r\n]/.test(data.name + data.email) || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)) throw Error('validation');
      } else { data.text = text(data.text, 1, 300); }
    } catch { respond(res, 400, { message: 'Bitte prüfe deine Eingaben und die Textlänge.' }); return true; }
    const key = (application ? 'a:' : 'w:') + data.submissionId;
    if (sent.has(key)) { respond(res, 200, { ok: true, message: application ? 'Deine Bewerbung wurde bereits übermittelt.' : 'Dein Musikwunsch wurde bereits übermittelt.' }); return true; }
    if (pending.has(key)) { respond(res, 409, { message: 'Die Übermittlung läuft noch. Bitte warte kurz.' }); return true; }
    if (limited(url.pathname + ':' + req.socket.remoteAddress, application ? 5 : 30)) {
      respond(res, 429, { message: 'Bitte warte kurz, bevor du erneut sendest.' }); return true;
    }
    pending.add(key);
    try {
      if (application) { await mail.send(data); }
      else {
        const cookie = /(?:^|;\s*)mw_visitor=([a-f0-9]{32})(?:;|$)/.exec(req.headers.cookie || '');
        const visitorId = cookie ? cookie[1] : randomBytes(16).toString('hex');
        if (!cookie) res.setHeader('Set-Cookie', 'mw_visitor=' + visitorId + '; HttpOnly; SameSite=Strict; Path=/api/site/; Max-Age=86400'+(String(env.MISCHWERK_PUBLIC_ORIGIN||'').startsWith('https:')?'; Secure':''));
        await bridge.wish({ ...data, visitorId });
      }
      sent.set(key, Date.now());
      for (const [id, at] of sent) if (Date.now() - at > 86400000) sent.delete(id);
      respond(res, 200, { ok: true, message: application ? 'Danke! Deine Bewerbung wurde per E-Mail übermittelt.' : 'Dein Musikwunsch ist bei der Moderation angekommen.' });
    } catch {
      respond(res, 503, { message: application ? 'Deine Bewerbung konnte gerade nicht gesendet werden. Deine Eingaben bleiben erhalten.' :
        'Dein Musikwunsch konnte gerade nicht übermittelt werden. Deine Eingabe bleibt erhalten.' });
    }
    finally { pending.delete(key); }
    return true;
  };
}
module.exports = { createSiteApi };
