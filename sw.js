// ============================================
// [SERVICE WORKER] Network-first PWA cache
//
// PREVIOUS BUG: this was cache-first with a fixed cache name
// ('gymexec-v1') and no activate/cleanup. Once a browser ran it,
// it served the FIRST cached copy of status.html/css/js FOREVER —
// every deploy became invisible to that browser until the user
// manually cleared site data. That caused weeks of "I deployed
// but nothing changed" confusion.
//
// NOW: network-first. We always hit the live server so deploys
// propagate instantly. The cache is only a fallback for offline.
// Bumping CACHE_NAME + the activate cleanup guarantees old caches
// from the broken v1 SW are purged on next load.
// ============================================

// Bump this whenever you want to force-drop all old caches.
const CACHE_NAME = 'gymexec-v3';

// Minimal offline shell — member status page + customer dashboard.
const ASSETS = [
  'status.html',
  'customer-dashboard.html',
  'assets/style.css',
  'assets/config.js',
  'assets/theme.js',
  'assets/toast.js'
];

self.addEventListener('install', (e) => {
  // Take over immediately instead of waiting for every tab to close.
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => { /* offline at install time — non-fatal */ })
  );
});

self.addEventListener('activate', (e) => {
  // Delete every cache that isn't the current version. This is what
  // finally evicts the stale 'gymexec-v1' cache from old clients.
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Only GETs. Never intercept POST/PUT/etc (logins, member edits…).
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Same-origin = our frontend files. Cross-origin = the backend API
  // on a different host — we never cache those (always live, network
  // handles them; if offline they simply fail like any fetch).
  const sameOrigin = url.origin === self.location.origin;

  e.respondWith(
    fetch(req)
      .then((res) => {
        // Refresh the cached copy of same-origin static files in the
        // background so the offline fallback stays reasonably fresh.
        if (sameOrigin && res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(req, copy))
            .catch(() => {});
        }
        return res;
      })
      // Network failed (offline) → serve last cached copy if we have one.
      .catch(() => caches.match(req))
  );
});
