// ============================================
// [SHAPE-SHIFTING THEME ENGINE]
// Applies the correct tier colors globally
// ============================================

(function applyGlobalTheme() {
    // Attempt to read the tier from local storage.
    // Default to 'starter' if not logged in or tier is missing.
    const userTier = localStorage.getItem('tier') || 'starter';
    const root = document.documentElement;

    // Set data attribute for hard CSS visual toggles once DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        document.body.setAttribute('data-tier', userTier);
        
        // [TIER-NAV-HIDING — Option A]
        const hideSelectors = (selectors) => {
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => { el.style.display = 'none'; });
            });
        };

        // Elite-only features: Branches + Staff management
        if (userTier !== 'elite') {
            hideSelectors([
                'a[href="branches.html"]',
                'a[href="staff.html"]'
            ]);
        }

        // Pro+Elite features: Attendance, Kiosk, QR check-in
        // Starter has no attendance at all
        if (userTier === 'starter' || !userTier) {
            hideSelectors([
                'a[href="attendance.html"]',
                'a[href="kiosk.html"]',
                'a[href="qr-checkin.html"]',
                'a[href="qr-poster.html"]'
            ]);
        }
    });

    if (userTier === 'pro') {
        // Purple Dark Mode Theme
        root.style.setProperty('--theme-bg', '#0f172a');
        root.style.setProperty('--theme-primary', '#8b5cf6');   // Neon Violet
        root.style.setProperty('--theme-navbar', '#1e293b');
        root.style.setProperty('--theme-nav-text', '#f8fafc');
        root.style.setProperty('--theme-card-bg', '#1e293b');
        root.style.setProperty('--theme-card-border', '#334155');
        root.style.setProperty('--theme-card-shadow', 'rgba(139, 92, 246, 0.2)');
        root.style.setProperty('--theme-text-main', '#f8fafc');
        root.style.setProperty('--theme-text-muted', '#94a3b8');
    }
    else if (userTier === 'elite') {
        // Rich Dark Gold Luxury Theme
        root.style.setProperty('--theme-bg', '#0c0a09');          // Warm near-black
        root.style.setProperty('--theme-primary', '#d97706');     // Amber Gold
        root.style.setProperty('--theme-navbar', '#1c1917');      // Dark stone
        root.style.setProperty('--theme-nav-text', '#fef3c7');    // Warm cream white
        root.style.setProperty('--theme-card-bg', '#1c1917');     // Dark stone cards
        root.style.setProperty('--theme-card-border', '#44403c'); // Warm gray border
        root.style.setProperty('--theme-card-shadow', 'rgba(217, 119, 6, 0.15)');
        root.style.setProperty('--theme-text-main', '#fef3c7');   // Warm cream text
        root.style.setProperty('--theme-text-muted', '#a8a29e');  // Stone muted
    }
    // Starter uses a clean dark theme as the baseline
    if (userTier === 'starter' || !userTier) {
        root.style.setProperty('--theme-bg', '#0f172a');
        root.style.setProperty('--theme-primary', '#2563eb');       // Blue
        root.style.setProperty('--theme-navbar', '#1e293b');
        root.style.setProperty('--theme-nav-text', '#cbd5e1');
        root.style.setProperty('--theme-card-bg', '#1e293b');
        root.style.setProperty('--theme-card-border', '#334155');
        root.style.setProperty('--theme-card-shadow', 'rgba(37, 99, 235, 0.15)');
        root.style.setProperty('--theme-text-main', '#f1f5f9');
        root.style.setProperty('--theme-text-muted', '#94a3b8');
    }
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
