const VERSION=__VERSION__;
const CORE=__CACHE__,FILES=__FILES__;
self.addEventListener('message',event=>{
 if(event.data?.type==='GET_VERSION')event.ports[0]?.postMessage({version:VERSION});
 if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
});
const BASE=new URL('./',self.location.href),SURVEY='https://alasky.cds.unistra.fr/DSS/DSSColor/',IMAGES='skypatch-survey-v1-'+BASE.pathname;
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CORE);try{await cache.addAll(FILES.map(p=>new URL(p,BASE).href));}catch(e){await caches.delete(CORE);throw e;}})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('skypatch-core-'+BASE.pathname+'-')&&key!==CORE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET')return;
 if(url.origin===BASE.origin&&url.pathname.startsWith(BASE.pathname)){
  event.respondWith((async()=>{const cache=await caches.open(CORE);const key=event.request.mode==='navigate'?new URL('index.html',BASE).href:event.request;return await cache.match(key,{ignoreSearch:true,ignoreVary:true})||fetch(event.request);})());return;
 }
 if(url.href.startsWith(SURVEY))event.respondWith((async()=>{
  const cache=await caches.open(IMAGES),saved=await cache.match(url.href,{ignoreSearch:true,ignoreVary:true});
  if(url.href.split('?')[0]===SURVEY+'properties'){
   try{return await fetch(event.request,{cache:'no-store'});}catch{if(saved){const text=(await saved.text()).replace(/hips_order\s*=\s*9/,'hips_order = 3');return new Response(text,{headers:{'Content-Type':'text/plain','Access-Control-Allow-Origin':'*'}});}return Response.error();}
  }
  if(saved)return saved;
  try{return await fetch(event.request);}catch{return new Response('',{status:404});}
 })());
});
