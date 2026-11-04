// يتيح تثبيت النظام كتطبيق. الصفحة تُجلب من الإنترنت أولًا حتى يصل كل تحديث فورًا،
// والنسخة المحفوظة تُعرض فقط عند انقطاع الاتصال. البيانات نفسها لا تُحفظ هنا أبدًا
const CACHE = 'dw-crm-shell-v1';
const SHELL = ['./', './icon-192.png', './icon-512.png', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // طلبات خدمة جوجل والخطوط وغيرها تمر كما هي دون تخزين
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && req.mode === 'navigate') { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)); }
      return res;
    }).catch(() => caches.match(req.mode === 'navigate' ? './' : req).then(r => r || Response.error()))
  );
});
