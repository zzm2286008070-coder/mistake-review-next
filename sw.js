const CACHE='shiti-v1.0.2';
const ASSETS=['./','./index.html','./style.css','./app.js','./core.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('shiti-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 // Cache-first within a version keeps HTML, CSS and modules consistent offline.
 // A new service worker waits for old tabs to close before activating.
 e.respondWith(caches.open(CACHE).then(async cache=>{
   const hit=await cache.match(e.request,{ignoreSearch:true});if(hit)return hit;
   try{return await fetch(e.request);}catch(error){if(e.request.mode==='navigate')return cache.match('./index.html');throw error;}
 }));
});
