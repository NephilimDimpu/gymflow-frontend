// ============================================
// [SERVICE WORKER] Hybrid cache for fast navigation on slow networks
//
// Strategy per request type:
//   - HTML pages        → NETWORK-FIRST (deploys show instantly; cache is
//                         only an offline fallback). This preserves the fix
//                         for the old "deployed but nothing changed" bug.
//   - Static assets     → STALE-WHILE-REVALIDATE (CSS, JS, fonts, images).
//                         Served INSTANTLY from cache, refreshed in the
//                         background. This is what makes tab switches fast
//                         on weak WiFi — the shell no longer waits on the
//                         network. At most one navigation behind after a
//                         deploy, never stale-forever.
//   - Trusted CDN libs  → STALE-WHILE-REVALIDATE (Chart.js, QR lib, fonts).
//                         Previously re-downloaded every page load.
//   - Backend API       → NOT intercepted. Always live network.
// ============================================

// Bump to force-drop old caches on next load.
const CACHE_NAME = 'gymexec-v48';

// Precache the minimal offline shell.
const ASSETS = [
  'status.html',
  'customer-dashboard.html',
  'assets/style.css',
  'assets/config.js',
  'assets/theme.js',
  'assets/toast.js',
  'assets/sw-register.js',
];

// CDN origins whose libraries/fonts are stable enough to cache.
const CDN_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

function isStaticAsset(url) {
  return /\.(css|js|mjs|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|otf)$/i.test(url.pathname);
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => { /* offline at install — non-fatal */ })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Serve from cache immediately (if present) and refresh in the background.
function staleWhileRevalidate(req) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          // Cache successful (200) or opaque (cross-origin no-cors CDN) responses.
          if (res && (res.status === 200 || res.type === 'opaque')) {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);  // offline → fall back to whatever we have
      // Instant cache hit if we have it; otherwise wait for the network.
      return cached || networkFetch;
    })
  );
}

// Always try the network first; fall back to cache only if offline.
function networkFirst(req, sameOrigin) {
  return fetch(req)
    .then((res) => {
      if (sameOrigin && res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
      }
      return res;
    })
    .catch(() => caches.match(req));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;  // never touch POST/PUT (logins, edits…)

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCDN = CDN_HOSTS.includes(url.hostname);

  // Backend API (cross-origin, non-CDN) → leave it to the browser, always live.
  if (!sameOrigin && !isCDN) return;

  // Static assets + trusted CDN libs → stale-while-revalidate (instant).
  if (isCDN || (sameOrigin && isStaticAsset(url))) {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Everything else same-origin (HTML documents) → network-first.
  e.respondWith(networkFirst(req, sameOrigin));
});
