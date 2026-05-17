const CACHE_NAME = 'gymexec-v1';
const ASSETS = [
  'status.html',
  'assets/style.css',
  'assets/config.js',
  'assets/theme.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
