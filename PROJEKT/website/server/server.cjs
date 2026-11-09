// Eigenständiger Website-Server. Keine Testrollen, Appsimulation oder automatisch aktivierten Dienste.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {createSiteBridge}=require('./site-bridge.cjs');
const {createSiteApi}=require('./site-api.cjs');
const {createWorkspaceApi}=require('./workspace-api.cjs');
const {createPublicPlayer}=require('./public-player.cjs');
const root=path.resolve(__dirname,'../..'),assets=path.resolve(__dirname,'../public');
function createSiteServer({env=process.env,bridge=createSiteBridge(env),clock=Date.now}={}){
 let workspace,siteApi,origin;const player=createPublicPlayer(root,bridge);
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.mp3':'audio/mpeg'};
 const files={'/':'index.html','/arbeitsbereich':'workspace.html','/preview.css':'css/preview.css','/sections.css':'css/sections.css','/sections.js':'js/site/sections.js','/site-components.js':'js/site/site-components.js','/calendar.js':'js/site/calendar.js','/site-navigation.js':'js/site/site-navigation.js','/channel.js':'js/site/public-home.js','/radio-site.css':'css/radio-site.css','/public-player.js':'js/site/public-player.js'};
 for(const name of ['workspace.css','workspace.js','workspace-studio.js','workspace-team.js','workspace-schedule.js','workspace-history.js'])files['/'+name]=name.endsWith('.css')?'css/'+name:'js/workspace/'+name;
 const pages={'/':'radio','/sendeplan':'schedule','/team':'team','/mitmachen':'applications','/wunschbox':'wishes'};
 for(const route of Object.keys(pages))files[route]='index.html';
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','SAMEORIGIN');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https:; media-src https: blob:; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
  if(req.url.split('?')[0]==='/arbeitsbereich')res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self' https:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
  const send=(status,type,body)=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);};
  try{
   if(!origin){origin=env.MISCHWERK_PUBLIC_ORIGIN||'http://127.0.0.1:'+server.address().port;const url=new URL(origin);if(url.origin!==origin||(!origin.startsWith('https:')&&!['127.0.0.1','localhost'].includes(url.hostname)))throw Error('Ungültiger Websiteursprung');workspace=createWorkspaceApi({bridge,origin,clock});siteApi=createSiteApi({env:{...env,MISCHWERK_PUBLIC_ORIGIN:origin},bridge,mail:{configured:false}});}
   const url=new URL(req.url,origin);
   if(await workspace(req,res,url)||await siteApi(req,res,url))return;
   if(req.method!=='GET'){send(405,'text/plain','Nicht verfügbar.');return;}
   if(url.pathname==='/player'){send(200,types['.html'],await player.html());return;}
   if(url.pathname==='/api/public/radio'){send(200,'application/json',JSON.stringify(await player.data()));return;}
   let file;
   if(files[url.pathname])file=path.join(assets,files[url.pathname]);
   else if(url.pathname.startsWith('/app/www/')){const publicRoot=path.join(root,'app/www'),relative=decodeURIComponent(url.pathname.slice(9));file=path.resolve(publicRoot,relative);if(relative.includes('\0')||!file.startsWith(publicRoot+path.sep)){send(404,'text/plain','Nicht gefunden.');return;}}
   else{send(404,'text/plain','Nicht gefunden.');return;}
   if(!fs.existsSync(file)||!fs.statSync(file).isFile()){send(404,'text/plain','Nicht gefunden.');return;}
   let body=fs.readFileSync(file);if(pages[url.pathname])body=body.toString().replace('data-site-current="radio"','data-site-current="'+pages[url.pathname]+'"').replace('/preview?embedded=1&amp;radio=public','/player').replace('<a href="/channel.html?role=listener">Testansichten</a>','').replace('Lokaler Website-Entwurf','Radio MischWerk');
   send(200,types[path.extname(file)]||'application/octet-stream',body);
  }catch{if(!res.headersSent)send(503,'application/json',JSON.stringify({message:'Die Websiteanfrage ist gerade nicht verfügbar.'}));else res.end();}
 });
 return server;
}
if(require.main===module){const local=path.resolve(__dirname,'../.env');if(fs.existsSync(local))process.loadEnvFile(local);const server=createSiteServer();server.on('error',()=>{console.error('Website konnte nicht starten. Bitte Port und Konfiguration prüfen.');process.exitCode=1;});server.listen(Number(process.env.MISCHWERK_PREVIEW_PORT||process.env.PORT||8766),process.env.MISCHWERK_BIND_ADDRESS||'127.0.0.1',()=>console.log('MischWerk Homepage: http://127.0.0.1:'+server.address().port));}
module.exports={createSiteServer};
