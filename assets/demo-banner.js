// ============================================
// [DEMO BANNER] Shown on every owner page while the session is a demo sandbox.
//
// Purpose: a visitor who started a demo has no account. They need to always
// know (a) this is a sandbox that will be deleted, and (b) that one click
// converts it into a real account WITHOUT losing anything they just typed.
//
// Self-contained on purpose: injects its own styles and markup, touches no
// existing page element, and does nothing at all unless localStorage says the
// session is a demo. If anything in here throws, the host page is unaffected.
// ============================================

(function () {
  'use strict';

  function isDemoSession() {
    try { return localStorage.getItem('is_demo') === '1'; } catch (_) { return false; }
  }

  if (!isDemoSession()) return;

  // Resolved LAZILY, and via the bare `CONFIG` identifier.
  //
  // assets/config.js declares `const CONFIG = {...}` at top level. A top-level
  // `const` creates a lexical binding, NOT a property on window — so
  // `window.CONFIG` is undefined even after config.js has loaded. Capturing it
  // at script-load time therefore fell back to '' and posted /api/demo/claim to
  // the FRONTEND origin, which 404'd. Reading it on each call also removes any
  // dependence on script order within the host page.
  function apiBase() {
    try {
      if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.API_BASE_URL) return CONFIG.API_BASE_URL;
    } catch (_) { /* config.js not loaded on this page */ }
    return '';
  }

  function token() {
    try { return localStorage.getItem('auth_token') || ''; } catch (_) { return ''; }
  }

  // ---------------------------------------------------------------- styles
  //
  // DEFENSIVE ON PURPOSE. This widget is injected into 16 different app pages,
  // each with its own stylesheet, and assets/style.css already sets
  // `h1,h2,h3 { color: ... !important }` globally. Without !important here the
  // modal heading inherits the host page's colour and renders (verified) as
  // pale cream on a white card — invisible. Every property that decides
  // legibility is therefore forced; layout-only properties are left soft.
  var css = document.createElement('style');
  css.textContent = [
    '#gx-demo-bar{position:fixed!important;left:0!important;right:0!important;bottom:0!important;',
    '  z-index:2147483000!important;display:flex!important;align-items:center;gap:12px;',
    '  flex-wrap:wrap;justify-content:center;padding:10px 16px!important;',
    '  background:#111827!important;color:#f9fafb!important;',
    '  font:600 13px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif!important;',
    '  box-shadow:0 -2px 12px rgba(0,0,0,.25)}',
    '#gx-demo-bar .gx-dot{width:8px;height:8px;border-radius:50%;background:#34d399!important;flex:none}',
    '#gx-demo-bar .gx-msg{opacity:.92;font-weight:500!important;color:#f9fafb!important}',
    '#gx-demo-bar button{font:700 13px/1 system-ui,sans-serif!important;border:0!important;',
    '  border-radius:8px!important;padding:9px 16px!important;cursor:pointer;text-transform:none!important}',
    '#gx-demo-save{background:#34d399!important;color:#06281c!important}',
    '#gx-demo-save:hover{background:#6ee7b7!important}',
    '#gx-demo-exit{background:transparent!important;color:#9ca3af!important;',
    '  text-decoration:underline!important;padding:9px 4px!important}',
    // Reserved space for the fixed bar. The value is a fallback only — the real
    // height is measured at runtime (see reserveSpace) because the bar wraps to
    // two or three lines on narrow screens.
    'body{padding-bottom:var(--gx-demo-bar-h,64px)!important}',
    // Body padding alone is not enough: the app shell is viewport-locked
    // (.main-layout min-height:100vh, .sidebar height:100vh in style.css, and
    // assistant.html's .chat-wrap height:calc(100vh - 120px)). Those ignore body
    // padding, so the bar sat on top of the assistant's composer — verified
    // covering it at scroll-top on a 375px viewport. Shrink the viewport-height
    // containers by the same amount. These rules only exist in demo mode,
    // because this whole script returns early otherwise.
    '.main-layout{min-height:calc(100vh - var(--gx-demo-bar-h,64px))!important}',
    '.sidebar{height:calc(100vh - var(--gx-demo-bar-h,64px))!important}',
    '.chat-wrap{height:calc(100vh - 120px - var(--gx-demo-bar-h,64px))!important}',
    '#gx-demo-modal{position:fixed!important;inset:0!important;z-index:2147483001!important;',
    '  display:none;align-items:center;justify-content:center;',
    '  background:rgba(15,23,42,.72)!important;padding:16px!important}',
    '#gx-demo-modal.gx-open{display:flex!important}',
    '#gx-demo-card{background:#fff!important;color:#111827!important;border-radius:16px!important;',
    '  width:100%;max-width:440px;padding:26px!important;text-align:left!important;',
    '  box-shadow:0 24px 60px rgba(0,0,0,.35);max-height:92vh;overflow:auto;',
    '  font:400 14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif!important}',
    '#gx-demo-card h2{margin:0 0 6px!important;font-size:21px!important;font-weight:800!important;',
    '  color:#111827!important;text-transform:none!important;letter-spacing:normal!important}',
    '#gx-demo-card p.gx-sub{margin:0 0 18px!important;color:#4b5563!important;',
    '  font-size:14px!important;line-height:1.5!important}',
    '#gx-demo-card label{display:block!important;font-size:12px!important;font-weight:700!important;',
    '  color:#374151!important;margin:12px 0 5px!important;text-transform:uppercase!important;',
    '  letter-spacing:.4px!important}',
    '#gx-demo-card input{width:100%!important;box-sizing:border-box!important;',
    '  padding:11px 12px!important;border:1px solid #d1d5db!important;border-radius:9px!important;',
    '  font-size:15px!important;background:#fff!important;color:#111827!important;margin:0!important}',
    '#gx-demo-card input:focus{outline:2px solid #34d399!important;outline-offset:1px;',
    '  border-color:#34d399!important}',
    '#gx-demo-err{display:none;margin:14px 0 0!important;padding:10px 12px!important;',
    '  border-radius:9px!important;background:#fef2f2!important;color:#991b1b!important;',
    '  font-size:13px!important;line-height:1.45!important}',
    '#gx-demo-actions{display:flex!important;gap:10px!important;margin-top:20px!important}',
    '#gx-demo-actions button{flex:1 1 0!important;padding:12px!important;border-radius:9px!important;',
    '  border:0!important;cursor:pointer;font:700 14px/1 system-ui,sans-serif!important;',
    '  text-transform:none!important;width:auto!important}',
    '#gx-demo-submit{background:#111827!important;color:#fff!important}',
    '#gx-demo-submit:disabled{opacity:.6;cursor:default}',
    '#gx-demo-cancel{background:#f3f4f6!important;color:#374151!important}',
    '@media(max-width:520px){#gx-demo-bar .gx-msg{width:100%;text-align:center}}',
    // On a short viewport the explanatory sentence wraps to three lines and the
    // bar eats ~160px of a ~690px screen, squeezing the page it sits under.
    // Drop the prose and keep the two controls — the buttons already say what
    // this is. Measured: bar 162px -> ~55px.
    '@media(max-height:700px){#gx-demo-bar .gx-msg{display:none!important}',
    '  #gx-demo-bar{padding:8px 12px!important;gap:10px}}'
  ].join('');
  document.head.appendChild(css);

  // ------------------------------------------------------------------ bar
  var bar = document.createElement('div');
  bar.id = 'gx-demo-bar';
  bar.innerHTML =
    '<span class="gx-dot"></span>' +
    '<span class="gx-msg">You\'re in a free demo &mdash; explore anything, nothing here is real.</span>' +
    '<button id="gx-demo-save" type="button">Save this as my gym</button>' +
    '<button id="gx-demo-exit" type="button">Exit demo</button>';
  document.body.appendChild(bar);

  // ---------------------------------------------------------------- modal
  var modal = document.createElement('div');
  modal.id = 'gx-demo-modal';
  modal.innerHTML =
    '<div id="gx-demo-card" role="dialog" aria-modal="true" aria-labelledby="gx-demo-title">' +
      '<h2 id="gx-demo-title">Keep this gym</h2>' +
      '<p class="gx-sub">Everything you\'ve added stays exactly as it is &mdash; members, plans and payments all carry over. You get 14 days of full access, then a free plan. No card needed.</p>' +
      '<form id="gx-demo-form" novalidate>' +
        '<label for="gx-f-name">Gym name</label>' +
        '<input id="gx-f-name" name="name" autocomplete="organization" required>' +
        '<label for="gx-f-owner">Your name</label>' +
        '<input id="gx-f-owner" name="owner_name" autocomplete="name" required>' +
        '<label for="gx-f-email">Email</label>' +
        '<input id="gx-f-email" name="email" type="email" autocomplete="email" required>' +
        '<label for="gx-f-phone">Phone</label>' +
        '<input id="gx-f-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" required>' +
        '<label for="gx-f-pass">Create a password</label>' +
        '<input id="gx-f-pass" name="password" type="password" autocomplete="new-password" required>' +
        '<div id="gx-demo-err" role="alert"></div>' +
        '<div id="gx-demo-actions">' +
          '<button type="button" id="gx-demo-cancel">Not yet</button>' +
          '<button type="submit" id="gx-demo-submit">Save my gym</button>' +
        '</div>' +
      '</form>' +
    '</div>';
  document.body.appendChild(modal);

  // ------------------------------------------------- keep the bar clear of UI
  // The bar is fixed to the bottom and wraps to two or three lines on a phone,
  // so a hardcoded body padding is wrong. Measured: 119px on a 375px viewport
  // vs the 64px fallback, which left the assistant's composer UNREACHABLE —
  // the most important thing a demo visitor does. Measure it for real, and
  // again whenever the viewport changes.
  function reserveSpace() {
    try {
      var h = bar.getBoundingClientRect().height;
      if (h > 0) document.documentElement.style.setProperty('--gx-demo-bar-h', Math.ceil(h) + 'px');
    } catch (_) {}
  }
  reserveSpace();
  window.addEventListener('resize', reserveSpace);
  window.addEventListener('orientationchange', reserveSpace);
  // Fonts landing late can change the wrap; re-measure once things settle.
  setTimeout(reserveSpace, 400);
  if (window.ResizeObserver) {
    try { new ResizeObserver(reserveSpace).observe(bar); } catch (_) {}
  }

  var errBox = modal.querySelector('#gx-demo-err');
  var submitBtn = modal.querySelector('#gx-demo-submit');

  function openModal() {
    // Pre-fill the gym name with whatever the sandbox is already called.
    try {
      var n = localStorage.getItem('gym_name');
      if (n) modal.querySelector('#gx-f-name').value = n;
    } catch (_) {}
    modal.classList.add('gx-open');
    setTimeout(function () { modal.querySelector('#gx-f-name').focus(); }, 30);
  }

  function closeModal() {
    modal.classList.remove('gx-open');
    errBox.style.display = 'none';
  }

  function showError(msg) {
    errBox.textContent = msg;
    errBox.style.display = 'block';
  }

  bar.querySelector('#gx-demo-save').addEventListener('click', openModal);
  modal.querySelector('#gx-demo-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('gx-open')) closeModal();
  });

  bar.querySelector('#gx-demo-exit').addEventListener('click', function () {
    if (!confirm('Leave the demo? This sandbox and everything in it will be discarded.')) return;
    try { localStorage.clear(); } catch (_) {}
    window.location.href = 'index.html';
  });

  // --------------------------------------------------------------- submit
  modal.querySelector('#gx-demo-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    errBox.style.display = 'none';

    var body = {
      name: modal.querySelector('#gx-f-name').value.trim(),
      owner_name: modal.querySelector('#gx-f-owner').value.trim(),
      email: modal.querySelector('#gx-f-email').value.trim(),
      phone: modal.querySelector('#gx-f-phone').value.trim(),
      password: modal.querySelector('#gx-f-pass').value
    };
    if (!body.name || !body.owner_name || !body.email || !body.phone || !body.password) {
      showError('Please fill in every field.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      var res = await fetch(apiBase() + '/api/demo/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
        body: JSON.stringify(body)
      });
      var data = {};
      try { data = await res.json(); } catch (_) {}

      if (!res.ok) {
        showError((window.getErrorMessage ? window.getErrorMessage(data) : null) ||
                  'Could not save your gym. Please try again.');
        return;
      }

      // Promoted to a real account — swap in the fresh token and drop the demo flag.
      try {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('gym_id', data.gym_id);
        localStorage.setItem('user_type', data.user_type || 'gym');
        localStorage.setItem('role', data.role || 'owner');
        if (data.tier) localStorage.setItem('tier', data.tier);
        localStorage.setItem('gym_name', body.name);
        localStorage.removeItem('is_demo');
      } catch (_) {}

      alert('Saved. ' + body.name + ' is now your account — everything you added is still here.');
      window.location.reload();
    } catch (err) {
      showError('Network problem. Please check your connection and try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save my gym';
    }
  });
})();
