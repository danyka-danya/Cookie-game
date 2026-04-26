// Service Worker — офлайн-кэш печеньки
// v12: 5М первый prestige, 5 prestige-only апгрейдов, прокачка комбо, питомец/мастерство сильнее
const CACHE = 'pechenko-v12';
const PRE_CACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './js/data.js',
  './js/canvas.js',
  './js/audio.js',
  './js/main.js',
  './assets/skins/classic.webp',
  './assets/skins/golden.webp',
  './assets/skins/gingerbread.webp',
  './assets/skins/pumpkin.webp',
  './assets/skins/snow.webp',
  './assets/skins/diamond.webp',
  './assets/skins/rainbow.webp',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRE_CACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // удаляем старые версии кэша
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(CACHE).then(c =>
      c.match(e.request).then(hit => {
        const fresh = fetch(e.request)
          .then(r => { c.put(e.request, r.clone()); return r; })
          .catch(() => hit);
        return hit || fresh;
      })
    )
  );
});
