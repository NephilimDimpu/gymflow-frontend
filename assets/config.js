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
// [ERROR-HELPERS] Globals for safely reading backend error responses
// and routing tier-gate prompts to the upgrade page.
//
// Backend mixes two `detail` shapes:
//   1. Plain string:  { detail: "Email already registered" }
//   2. Structured:    { detail: { error: "tier_required", message: "...",
//                                  current_tier: "starter", ... } }
//
// Pages doing `error.detail || 'Failed'` print "[object Object]" on
// case 2. These helpers normalize both so every page can call them
// the same way.
// ============================================

/**
 * Pull a human-readable message out of any backend error response.
 * @param {*} errorJson - the parsed JSON body (or {} if parse failed)
 * @param {string} fallback - shown if no message can be extracted
 */
window.getErrorMessage = function(errorJson, fallback) {
    fallback = fallback || 'Something went wrong. Please try again.';
    if (!errorJson) return fallback;
    const d = errorJson.detail;
    if (!d) return errorJson.message || fallback;
    if (typeof d === 'string') return d;
    if (typeof d === 'object') return d.message || d.error || fallback;
    return fallback;
};

/**
 * Detect the structured tier-gate error responses and route the user
 * to the upgrade page if they confirm. Returns true if the response
 * was a tier-gate (caller should `return` afterward), false otherwise.
 *
 * Usage:
 *   if (await window.handleTierError(res)) return;
 */
window.handleTierError = async function(res) {
    if (res.status !== 402 && res.status !== 403) return false;
    let body = {};
    try { body = await res.clone().json(); } catch (_) { /* not JSON */ }
    const d = body.detail;
    if (!d || typeof d !== 'object') return false;

    const tierGates = new Set([
        'tier_required', 'member_limit_reached', 'plan_limit_reached',
        'trial_expired',
    ]);
    if (!tierGates.has(d.error)) return false;

    const msg = d.message || 'This feature requires a plan upgrade.';
    if (confirm(msg + '\n\nGo to Upgrade page now?')) {
        window.location.href = 'upgrade-plan.html';
    }
    return true;
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
