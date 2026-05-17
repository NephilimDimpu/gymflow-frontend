// ============================================
// [PWA-INSTALL] Custom "Install App" prompt
//
// Browsers hide the native install option in the address bar where
// almost no gym owner finds it. This injects a clean, dismissible
// bottom bar that:
//   - Android / desktop Chromium → real one-tap install via the
//     captured beforeinstallprompt event.
//   - iOS Safari → manual "Share → Add to Home Screen" hint (Apple
//     blocks programmatic install; a button would be a dead end).
//   - Already installed (standalone) → shows nothing.
//   - Dismissed → stays quiet for 14 days (no nagging every visit).
//
// Scoped on purpose: only included on login.html + dashboard.html
// (the Admin PWA pages). NOT global — we're testing gym-owner
// reaction first before touching member-facing pages.
// ============================================

(function () {
  // Don't prompt if the app is already installed / running standalone.
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (isStandalone) return;

  const DISMISS_KEY = 'pwa_install_dismissed_at';
  const DISMISS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
  const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
  if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) return;

  let deferredPrompt = null;

  function isIOSSafari() {
    const ua = navigator.userAgent || '';
    const iOS = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
    // Chrome/Firefox on iOS report crios/fxios — those can't install either,
    // so we only show the hint for actual Safari.
    return iOS && /safari/i.test(ua) && !/crios|fxios/i.test(ua);
  }

  function snooze() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }

  const BTN = 'border:none;cursor:pointer;font-weight:700;font-size:13px;border-radius:9px;padding:9px 14px;';

  function buildBar(innerHTML) {
    if (document.getElementById('pwa-install-bar')) return null;
    const bar = document.createElement('div');
    bar.id = 'pwa-install-bar';
    bar.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:18px', 'transform:translateX(-50%)',
      'z-index:99999', 'max-width:92vw', 'display:flex', 'align-items:center',
      'gap:12px', 'background:#1e293b', 'border:1px solid rgba(99,102,241,0.4)',
      'color:#f1f5f9', 'padding:12px 16px', 'border-radius:14px',
      'box-shadow:0 12px 32px rgba(0,0,0,0.45)',
      'font-family:system-ui,-apple-system,sans-serif', 'font-size:14px',
      'line-height:1.3', 'animation:pwaBarUp .25s ease-out',
    ].join(';');
    bar.innerHTML = innerHTML;
    // Keyframe (injected once).
    if (!document.getElementById('pwa-install-style')) {
      const st = document.createElement('style');
      st.id = 'pwa-install-style';
      st.textContent =
        '@keyframes pwaBarUp{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}';
      document.head.appendChild(st);
    }
    document.body.appendChild(bar);
    return bar;
  }

  // ---- Android / desktop Chromium: capture the real install event ----
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const onReady = () => {
      const bar = buildBar(
        '<span style="flex:1;">📲 Install <strong>GymExec</strong> for one-tap access</span>' +
        `<button id="pwa-go" style="${BTN}background:#6366f1;color:#fff;">Install</button>` +
        `<button id="pwa-x" aria-label="Dismiss" style="${BTN}background:transparent;color:#94a3b8;padding:9px 8px;">✕</button>`
      );
      if (!bar) return;
      bar.querySelector('#pwa-go').addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        let outcome = 'dismissed';
        try { ({ outcome } = await deferredPrompt.userChoice); } catch (_) {}
        deferredPrompt = null;
        bar.remove();
        // If they declined, don't re-ask for 14 days.
        if (outcome !== 'accepted') snooze();
      });
      bar.querySelector('#pwa-x').addEventListener('click', () => { snooze(); bar.remove(); });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  });

  // ---- Clean up if it gets installed ----
  window.addEventListener('appinstalled', () => {
    const b = document.getElementById('pwa-install-bar');
    if (b) b.remove();
    snooze();
  });

  // ---- iOS Safari: no beforeinstallprompt — manual instructions ----
  if (isIOSSafari()) {
    const showHint = () => {
      const bar = buildBar(
        '<span style="flex:1;">📲 Install: tap <strong>Share</strong> → <strong>Add to Home Screen</strong></span>' +
        `<button id="pwa-x" aria-label="Dismiss" style="${BTN}background:transparent;color:#94a3b8;padding:9px 8px;">✕</button>`
      );
      if (!bar) return;
      bar.querySelector('#pwa-x').addEventListener('click', () => { snooze(); bar.remove(); });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showHint);
    } else {
      showHint();
    }
  }
})();
