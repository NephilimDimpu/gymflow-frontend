// ============================================
// [SHAPE-SHIFTING THEME ENGINE]
// Applies the correct tier colors globally.
// Exposes window.applyTierTheme(tier) so pages can
// re-apply after the API returns the real tier.
// ============================================

function applyTierTheme(tier) {
    const root = document.documentElement;
    tier = tier || localStorage.getItem('tier') || 'starter';

    // Update localStorage so other pages pick it up
    localStorage.setItem('tier', tier);

    // Data attribute for CSS toggles
    if (document.body) document.body.setAttribute('data-tier', tier);

    // ── CSS Custom Properties per tier ──
    if (tier === 'pro') {
        root.style.setProperty('--theme-bg', '#0f172a');
        root.style.setProperty('--theme-primary', '#8b5cf6');
        root.style.setProperty('--theme-navbar', '#1e293b');
        root.style.setProperty('--theme-nav-text', '#f8fafc');
        root.style.setProperty('--theme-card-bg', '#1e293b');
        root.style.setProperty('--theme-card-border', '#334155');
        root.style.setProperty('--theme-card-shadow', 'rgba(139, 92, 246, 0.2)');
        root.style.setProperty('--theme-text-main', '#f8fafc');
        root.style.setProperty('--theme-text-muted', '#94a3b8');
    } else if (tier === 'elite') {
        root.style.setProperty('--theme-bg', '#0c0a09');
        root.style.setProperty('--theme-primary', '#d97706');
        root.style.setProperty('--theme-navbar', '#1c1917');
        root.style.setProperty('--theme-nav-text', '#fef3c7');
        root.style.setProperty('--theme-card-bg', '#1c1917');
        root.style.setProperty('--theme-card-border', '#44403c');
        root.style.setProperty('--theme-card-shadow', 'rgba(217, 119, 6, 0.15)');
        root.style.setProperty('--theme-text-main', '#fef3c7');
        root.style.setProperty('--theme-text-muted', '#a8a29e');
    } else {
        // Starter baseline
        root.style.setProperty('--theme-bg', '#0f172a');
        root.style.setProperty('--theme-primary', '#2563eb');
        root.style.setProperty('--theme-navbar', '#1e293b');
        root.style.setProperty('--theme-nav-text', '#cbd5e1');
        root.style.setProperty('--theme-card-bg', '#1e293b');
        root.style.setProperty('--theme-card-border', '#334155');
        root.style.setProperty('--theme-card-shadow', 'rgba(37, 99, 235, 0.15)');
        root.style.setProperty('--theme-text-main', '#f1f5f9');
        root.style.setProperty('--theme-text-muted', '#94a3b8');
    }

    // ── Sidebar nav-link locking ──
    // First: UNLOCK everything (remove stale locks from a previous tier)
    const allLockable = [
        'a[href="branches.html"]', 'a[href="staff.html"]',
        'a[href="attendance.html"]', 'a[href="kiosk.html"]',
        'a[href="qr-checkin.html"]', 'a[href="qr-poster.html"]',
        'a[href="routines.html"]'
    ];
    allLockable.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            el.classList.remove('locked');
            el.title = '';
        });
    });

    // Then: re-lock based on actual tier
    const lockSelectors = (selectors, tooltip) => {
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.classList.add('locked');
                el.title = tooltip;
            });
        });
    };

    if (tier !== 'elite') {
        lockSelectors([
            'a[href="branches.html"]',
            'a[href="staff.html"]'
        ], "Elite Feature — Upgrade to manage multiple branches and staff");
    }
    if (tier === 'starter' || !tier) {
        lockSelectors([
            'a[href="attendance.html"]',
            'a[href="kiosk.html"]',
            'a[href="qr-checkin.html"]',
            'a[href="qr-poster.html"]',
            'a[href="routines.html"]'
        ], "Pro Feature — Upgrade to track attendance and manage class schedules");
    }
}

// Expose globally so dashboard.html (and any page) can call it after API fetch
window.applyTierTheme = applyTierTheme;

// ── Initial apply from localStorage on script load ──
(function() {
    const initialTier = localStorage.getItem('tier') || 'starter';
    // Apply CSS vars immediately (before DOMContentLoaded) to prevent flash
    applyTierTheme(initialTier);

    // Re-apply sidebar locks once DOM is ready (links exist now)
    document.addEventListener('DOMContentLoaded', () => {
        applyTierTheme(initialTier);

        // [LOGO-INJECTION]
        const logoUrl = localStorage.getItem('gym_logo');
        if (logoUrl) {
            document.querySelectorAll('.sidebar-logo').forEach(el => {
                el.innerHTML = `<img src="${logoUrl}" style="height: 32px; width: 32px; object-fit: contain; margin-right: 10px; border-radius: 4px;"> ${el.textContent.replace('💪', '').trim()}`;
                el.style.display = 'flex';
                el.style.alignItems = 'center';
            });
        }
    });
})();

// ============================================
// [MODAL-HELPERS] Shared open/close + Escape + click-outside.
//
// Two patterns existed across the app:
//   - .classList.add('active') on a .modal-backdrop wrapper
//   - .style.display = 'flex' / 'none' on the modal itself
// These helpers handle BOTH. Pages can keep their existing markup
// and just call window.openModal(el) / window.closeModal(el).
//
// Escape key + backdrop click are wired automatically. If a modal
// has [data-no-backdrop-close] the click-outside is suppressed
// (e.g. for confirm flows where accidental dismissal is bad).
// ============================================

(function setupModalHelpers() {
    // Track currently-open modals so Escape closes the topmost one
    const openStack = [];

    window.openModal = function(modalEl) {
        if (!modalEl) return;
        // Detect existing pattern: prefer classList.active if the page
        // already styles it that way; fall back to display:flex.
        const usesActiveClass =
            modalEl.classList.contains('modal-backdrop') ||
            modalEl.classList.contains('modal') ||
            modalEl.dataset.modalStyle === 'active';
        if (usesActiveClass) {
            modalEl.classList.add('active');
        } else {
            modalEl.style.display = 'flex';
        }
        modalEl.dataset.openedAt = String(Date.now());
        openStack.push(modalEl);
        // Focus the first focusable element so keyboard users land
        // inside the modal (a11y polish).
        setTimeout(() => {
            const focusable = modalEl.querySelector(
                'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
            );
            if (focusable) focusable.focus();
        }, 50);
    };

    window.closeModal = function(modalEl) {
        if (!modalEl) return;
        const usesActiveClass =
            modalEl.classList.contains('active') ||
            modalEl.dataset.modalStyle === 'active';
        if (usesActiveClass) {
            modalEl.classList.remove('active');
        } else {
            modalEl.style.display = 'none';
        }
        const idx = openStack.indexOf(modalEl);
        if (idx >= 0) openStack.splice(idx, 1);
    };

    // ----- Escape and click-outside listeners -----
    // Two layers:
    //   1. Stack-tracked modals (opened via window.openModal)
    //   2. DOM-tracked: any `.modal-backdrop.active` element. Pages that
    //      use the standard `.classList.add('active')` pattern (branches,
    //      routines, staff, customer-dashboard) automatically get
    //      Escape + click-outside without calling openModal at all.
    //   Pages can opt out by setting [data-no-backdrop-close="true"]
    //   on the modal root.

    function _findActiveBackdrop() {
        const all = document.querySelectorAll('.modal-backdrop.active');
        return all.length ? all[all.length - 1] : null;
    }

    function _closeAny(el) {
        if (!el) return;
        if (el.dataset.noBackdropClose === 'true') return;
        // Same close behaviour for stack-tracked vs DOM-tracked.
        if (el.classList.contains('active')) {
            el.classList.remove('active');
        } else {
            el.style.display = 'none';
        }
        const idx = openStack.indexOf(el);
        if (idx >= 0) openStack.splice(idx, 1);
    }

    // Escape closes the topmost open modal.
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        // Don't hijack Escape inside select/textarea — those use it themselves.
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'select' || tag === 'textarea') return;

        const top = openStack.length ? openStack[openStack.length - 1] : _findActiveBackdrop();
        if (top) _closeAny(top);
    });

    // Click-outside-to-close. Click is on the backdrop iff target IS the
    // modal root itself, not a child. The form/buttons inside the modal
    // bubble up with target=that-child, never the backdrop wrapper.
    document.addEventListener('click', (e) => {
        const stackTop = openStack.length ? openStack[openStack.length - 1] : null;
        const domTop = _findActiveBackdrop();
        const top = stackTop || domTop;
        if (!top) return;
        if (top.dataset.noBackdropClose === 'true') return;
        if (e.target !== top) return;
        // 200ms grace so the click that opened the modal can't immediately close it.
        const openedAt = parseInt(top.dataset.openedAt || '0', 10);
        if (openedAt && Date.now() - openedAt < 200) return;
        _closeAny(top);
    });
})();

// ============================================
// [MOBILE-NAV] Auto-inject hamburger drawer toggle
// Runs on every page that includes theme.js. If the page has a
// `.sidebar` element, we inject a hamburger button + backdrop and
// wire up open/close. Pages without a sidebar (login, kiosk, etc.)
// are no-ops.
// ============================================
(function setupMobileNav() {
    function init() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        // Skip if already wired (e.g. theme.js loaded twice)
        if (document.querySelector('.mobile-nav-toggle')) return;

        // Hamburger button
        const btn = document.createElement('button');
        btn.className = 'mobile-nav-toggle';
        btn.setAttribute('aria-label', 'Open menu');
        btn.innerHTML = '☰'; // ☰
        document.body.appendChild(btn);

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'mobile-nav-backdrop';
        document.body.appendChild(backdrop);

        function open() {
            sidebar.classList.add('mobile-open');
            backdrop.classList.add('active');
            btn.innerHTML = '✕'; // ✕
            btn.setAttribute('aria-label', 'Close menu');
        }
        function close() {
            sidebar.classList.remove('mobile-open');
            backdrop.classList.remove('active');
            btn.innerHTML = '☰'; // ☰
            btn.setAttribute('aria-label', 'Open menu');
        }
        function toggle() {
            sidebar.classList.contains('mobile-open') ? close() : open();
        }

        btn.addEventListener('click', toggle);
        backdrop.addEventListener('click', close);

        // Close drawer when a nav link inside the sidebar is tapped
        sidebar.addEventListener('click', (e) => {
            const link = e.target.closest('a.nav-link, a[href]');
            if (link) close();
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });

        // Close when resizing back to desktop, so state is sane
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) close();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
