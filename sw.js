/* Galaxy service worker: app werkt ook offline */
const C='galaxy-v20',SHELL=['./','index.html','places.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','contact.js','galaxy-map.js','avatar.js','theme.js','profile.js','backend.js','a11y.js','looks.js','welzijn.js','dateplan.js','myqr.js','dagbonus.js','account.js','push.js','feel.js','fonts/plus-jakarta-sans-latin-wght-normal.woff2','fonts/syne-latin-wght-normal.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))))});
/* pushmeldingen: geen inhoud van berichten op het vergrendelscherm */
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(x){}
 e.waitUntil(self.registration.showNotification(d.title||'Galaxy',{body:d.body||'💬 Je hebt een nieuw bericht',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:d.tag||'glx',renotify:true,vibrate:d.vibrate||[150,80,150],data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const u=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if('focus' in c){c.navigate&&c.navigate(u);return c.focus()}}return clients.openWindow(u)}))});
