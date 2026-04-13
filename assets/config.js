// ============================================
// [CONFIG] Global Configuration
// Copy this to: frontend/assets/config.js
// Centralized configuration for the frontend
// ============================================

const CONFIG = {
    // API backend base URL — PRODUCTION (Vercel)
    API_BASE_URL: 'https://gymflow-backend-rho.vercel.app',

    // Frontend port (for references like payment links)
    FRONTEND_URL: 'https://gymflow-frontend-six.vercel.app'
};

// ============================================
// [AUTH-INTERCEPTOR] Global 401 Handler
// If any API request returns 401 Unauthorized (e.g., token expired),
// cleanly log the user out to prevent broken dashboard states.
// ============================================
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    try {
        const response = await originalFetch(...args);
        
        // Check if this is an API request that returned 401
        if (response.status === 401 && args[0] && typeof args[0] === 'string' && args[0].includes('/api/')) {
            // Ignore 401s on login/signup routes to prevent loops
            if (!args[0].includes('/login') && !args[0].includes('/signup')) {
                console.warn('[AUTH] Session expired or invalid token. Redirecting to login.');
                
                // Clear state
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_type');
                localStorage.removeItem('role');
                localStorage.removeItem('gym_id');
                localStorage.removeItem('branch_id');
                
                // Redirect if not already on an auth page
                const currentPath = window.location.pathname;
                if (!currentPath.includes('login.html') && !currentPath.includes('signup.html')) {
                    window.location.href = 'login.html';
                }
            }
        }
        return response;
    } catch (error) {
        throw error;
    }
};
