/* Galaxy service worker: app werkt ook offline */
const C='galaxy-v13',SHELL=['./','index.html','places.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','contact.js','galaxy-map.js','avatar.js','theme.js','profile.js','backend.js','a11y.js','looks.js','welzijn.js','dateplan.js','fonts/plus-jakarta-sans-latin-wght-normal.woff2','fonts/syne-latin-wght-normal.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))))});
