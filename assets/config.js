// ============================================
// [CONFIG] Global Configuration
// Copy this to: frontend/assets/config.js
// Centralized configuration for the frontend
// ============================================

const CONFIG = {
    // API backend base URL — PRODUCTION (Vercel)
    API_BASE_URL: 'https://gymflow-backend-rho.vercel.app',

    // Frontend base URL — PRODUCTION (used for share links, QR posters, payment links, etc.)
    FRONTEND_URL: 'https://gymexec.com'
};

// ============================================
// [AUTH-INTERCEPTOR] Global handler for 401 / 402
//
// 401 Unauthorized → token expired, clear local auth state and bounce
//                    to login (skipped on /login + /signup routes to
//                    avoid loops).
// 402 Payment Required → trial+grace expired (backend returns this for
//                    every authenticated route except the upgrade flow).
//                    Bounce to upgrade-plan.html with the reason hint.
//                    This used to be implemented only on dashboard.html;
//                    moving it here makes every page handle it the same
//                    way without per-page boilerplate.
// ============================================
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    try {
        const response = await originalFetch(...args);
        const url = (args[0] && typeof args[0] === 'string') ? args[0] : '';
        const isApiCall = url.includes('/api/');

        // 401 — session expired
        if (response.status === 401 && isApiCall) {
            // Skip login/signup routes to prevent infinite loops
            if (!url.includes('/login') && !url.includes('/signup')) {
                console.warn('[AUTH] Session expired or invalid token. Redirecting to login.');

                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_type');
                localStorage.removeItem('role');
                localStorage.removeItem('gym_id');
                localStorage.removeItem('branch_id');
                localStorage.removeItem('tier');

                const currentPath = window.location.pathname;
                if (!currentPath.includes('login.html') && !currentPath.includes('signup.html')) {
                    window.location.href = 'login.html';
                }
            }
        }

        // 402 — trial/grace expired. Backend whitelists the upgrade flow,
        // so any other 402 means "this gym needs to pay to keep using
        // this." Routing the user straight to upgrade is the right move.
        if (response.status === 402 && isApiCall) {
            const currentPath = window.location.pathname;
            // Skip if we're already on the upgrade page (avoid loop)
            if (!currentPath.includes('upgrade-plan.html') && !currentPath.includes('login.html')) {
                console.warn('[AUTH] HTTP 402 — trial expired. Redirecting to upgrade.');
                window.location.href = 'upgrade-plan.html?reason=trial_expired';
            }
        }

        return response;
    } catch (error) {
        throw error;
    }
};
