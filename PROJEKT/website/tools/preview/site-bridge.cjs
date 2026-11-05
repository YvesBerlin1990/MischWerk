// Serverseitiger Zugriff auf genau den eingerichteten App-WebHook; kein öffentliches Proxyziel.
function createSiteBridge(env = process.env, request = fetch) {
  let endpoint;
  try {
    endpoint = new URL(env.MISCHWERK_APP_WEBHOOK || '');
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.hash || endpoint.search ||
        (endpoint.port && endpoint.port !== '443')) { endpoint = null; }
  } catch { endpoint = null; }
  async function call(values, method = 'GET') {
    if (!endpoint) { throw Error('bridge unavailable'); }
    const url = new URL(endpoint);
    const options = { method, redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(10000) };
    if (method === 'GET') { for (const [key, value] of Object.entries(values)) url.searchParams.set(key, String(value)); }
    else { options.headers = { 'Content-Type': 'application/json' }; options.body = JSON.stringify(values); }
    const response = await request(url, options);
    const body = await response.text();
    if (body.length > 20000) { throw Error('bridge response'); }
    const data = JSON.parse(body);
    if (!response.ok || !data || data.version !== 1 || data.ok !== true) { const error=Error(typeof data?.message==='string'?data.message:'Die Appanfrage konnte nicht bestätigt werden.');error.status=response.status;throw error; }
    return data;
  }
  return { configured: !!endpoint, publicRadio:()=>call({radio:1}),
    schedule: (week, page) => call({ week, page }),
    wish: data => call({ text: data.text, submissionId: data.submissionId, visitorId: data.visitorId }, 'POST'),
    control:(token,operation,values={})=>call({...values,token,operation},'POST') };
}
module.exports = { createSiteBridge };
