// يتيح تثبيت النظام كتطبيق ويسرّع فتحه. الصفحة تُعرض فورًا من النسخة المحفوظة على الجهاز،
// وفي الوقت نفسه تُجلب أحدث نسخة من الإنترنت، وإذا تغيّرت تُبلَّغ الصفحة لتعيد التحميل مرة واحدة.
// البيانات نفسها لا تُحفظ هنا أبدًا، فهي تُقرأ من خدمة جوجل في كل مرة
const CACHE = 'dw-crm-shell-v2';
const SHELL = ['./', './icon-192.png', './icon-512.png', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const stamp = res => res && (res.headers.get('etag') || res.headers.get('last-modified') || '');

self.addEventListener('fetch', e => {
  const req = e.request;
  // طلبات خدمة جوجل والخطوط وغيرها تمر كما هي دون تخزين
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode !== 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(req).then(r => r || Response.error())));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match('./');
    const fresh = fetch(req).then(async res => {
      if (res.ok) {
        await cache.put('./', res.clone());
        if (cached && stamp(cached) !== stamp(res)) {
          const clients = await self.clients.matchAll({ type: 'window' });
          clients.forEach(c => c.postMessage('dw-updated'));
        }
      }
      return res;
    });
    if (cached) {
      e.waitUntil(fresh.catch(() => {}));
      return cached;
    }
    return fresh.catch(() => Response.error());
  }));
});
