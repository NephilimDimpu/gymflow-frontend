// ============================================
// [PWA] Service Worker registration + "New version available" banner
//
// Drop-in replacement for the old inline `navigator.serviceWorker.register`
// snippets. Besides registering sw.js, it watches for a freshly-installed
// service worker and shows a small, dismissible banner prompting the user
// to refresh — so PWA users get code updates without manually closing and
// reopening the app.
//
// Works with the current sw.js (which calls skipWaiting + clients.claim):
// on deploy, the new worker installs, and once it reaches the "installed"
// state while an old worker still controls the page, we surface the banner.
// Clicking Refresh simply reloads to pick up the new cached pages.
// ============================================
(function () {
  if (!('serviceWorker' in navigator)) return;

  function showUpdateBanner() {
    if (document.getElementById('ge-update-banner')) return; // already shown

    var bar = document.createElement('div');
    bar.id = 'ge-update-banner';
    bar.setAttribute('role', 'status');
    bar.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:20px', 'transform:translateX(-50%)',
      'z-index:99999', 'display:flex', 'align-items:center', 'gap:14px',
      'background:#1e293b', 'color:#f1f5f9', 'border:1px solid rgba(255,255,255,0.12)',
      'box-shadow:0 10px 30px rgba(0,0,0,0.45)', 'border-radius:14px',
      'padding:12px 16px', 'font-family:system-ui,-apple-system,Segoe UI,sans-serif',
      'font-size:14px', 'max-width:92vw'
    ].join(';');

    var msg = document.createElement('span');
    msg.textContent = '✨ A new version of GymExec is available.';
    msg.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';

    var refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh';
    refreshBtn.style.cssText = [
      'background:#6366f1', 'color:#fff', 'border:none', 'cursor:pointer',
      'font-weight:700', 'font-size:14px', 'padding:8px 16px', 'border-radius:9px',
      'flex:0 0 auto'
    ].join(';');
    refreshBtn.onclick = function () {
      // The new worker is already active (sw.js uses skipWaiting), so a plain
      // reload fetches the fresh pages it now serves.
      window.location.reload();
    };

    var dismissBtn = document.createElement('button');
    dismissBtn.setAttribute('aria-label', 'Dismiss');
    dismissBtn.textContent = '✕';
    dismissBtn.style.cssText = [
      'background:transparent', 'color:#94a3b8', 'border:none', 'cursor:pointer',
      'font-size:16px', 'padding:4px 6px', 'flex:0 0 auto'
    ].join(';');
    dismissBtn.onclick = function () { bar.remove(); };

    bar.appendChild(msg);
    bar.appendChild(refreshBtn);
    bar.appendChild(dismissBtn);
    document.body.appendChild(bar);
  }

  function watchForUpdate(reg) {
    // An update may already be waiting from a previous page load.
    if (reg.waiting && navigator.serviceWorker.controller) {
      showUpdateBanner();
    }
    // Or one might arrive while this page is open.
    reg.addEventListener('updatefound', function () {
      var newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', function () {
        // "installed" + an existing controller => this is an UPDATE, not the
        // first-ever install, so it's safe to prompt a refresh.
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner();
        }
      });
    });
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      watchForUpdate(reg);
      // Proactively check for a new worker on each load (covers the PWA being
      // left open for long stretches between deploys).
      reg.update().catch(function () {});
    }).catch(function () { /* registration failed — non-fatal */ });
  });
})();
