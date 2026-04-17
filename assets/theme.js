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
        
        // Hide Branches navigation link for non-Elite users to avoid UI clutter
        if (userTier !== 'elite') {
            const branchLinks = document.querySelectorAll('a[href="branches.html"]');
            branchLinks.forEach(link => {
                link.style.display = 'none';
            });
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
