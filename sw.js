const CACHE='mistake-next-v2.2.10';
const ASSETS=['./','./index.html','./style.css','./app.js','./core.js','./analytics.js','./appearance.js','./color-controls.js','./cloud.js','./calendar.js','./book-actions.js','./manifest.webmanifest','./star-icon.png','./star-icon-192.png','./star-icon-512.png'];
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());});
// Version every precache request: a new worker must not reuse stale HTTP assets.
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(path=>`${path}?v=${CACHE}`))));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const key of await caches.keys())if((key.startsWith('shiti-')||key.startsWith('mistake-next-'))&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 // Cache-first within a version keeps HTML, CSS and modules consistent offline.
 // A new service worker waits for old tabs to close before activating.
 e.respondWith(caches.open(CACHE).then(async cache=>{
   const hit=await cache.match(e.request,{ignoreSearch:true});if(hit)return hit;
   try{return await fetch(e.request);}catch(error){if(e.request.mode==='navigate')return cache.match('./index.html',{ignoreSearch:true});throw error;}
 }));
});
self.addEventListener('push',event=>event.waitUntil((async()=>{
 let data={};try{data=event.data?.json()||{};}catch{}
 if('setAppBadge' in navigator)try{const n=Number(data.badge)||0;if(n>0)await navigator.setAppBadge(n);else await navigator.clearAppBadge();}catch{}
 await self.registration.showNotification(data.title||'错题回顾',{body:data.body||'该复习了。',icon:'star-icon-192.png',badge:'star-icon-192.png',tag:'review-next-reminder',data:{url:data.url||'./#review'}});
})()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
 let url=new URL('./#review',self.registration.scope);
 try{const requested=new URL(event.notification.data?.url,self.registration.scope);if(requested.href.startsWith(self.registration.scope))url=requested;}catch{}
 for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))if(client.url.startsWith(self.registration.scope)){await client.navigate(url.href);return client.focus();}
 return self.clients.openWindow(url.href);
})());});
