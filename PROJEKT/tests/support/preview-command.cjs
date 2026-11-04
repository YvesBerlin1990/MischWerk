// Lokale Vorschau: denselben authentifizierten Backend-Chatbefehl wie im Emulator aufrufen.
async function previewCurtain(surface, params='öffnen') {
  await surface.locator('html').evaluate(async (_, params) => {
    const response=await fetch('/api/command',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({sessionId:window.MischWerkDemoData.sessionId,command:'vorhang',params})});
    if(!response.ok)throw new Error('Lokaler Chatbefehl fehlgeschlagen: '+response.status);
    Client.sendEvent('mw:refresh',{});
  },params);
}
module.exports={previewCurtain};
