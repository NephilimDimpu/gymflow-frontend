/**
 * GymExec UX Utilities
 * - Global Top Loading Bar
 * - Locked Feature Upsell Handling
 */

// [UX-PROGRESS-BAR]
const UX = {
    loader: null,

    init() {
        // Create loader element
        if (!document.querySelector('.top-loader')) {
            this.loader = document.createElement('div');
            this.loader.className = 'top-loader';
            document.body.appendChild(this.loader);
        }

        // Bind locked feature clicks
        document.addEventListener('click', (e) => {
            const lockedLink = e.target.closest('.nav-link.locked');
            if (lockedLink) {
                e.preventDefault();
                this.showUpsell();
            }
        });

        // Trigger start on load
        this.startLoading();
        window.addEventListener('load', () => this.stopLoading());
    },

    startLoading() {
        if (!this.loader) return;
        this.loader.style.width = '30%';
        this.loader.style.opacity = '1';
        
        // Randomly advance to make it feel real
        setTimeout(() => { if(this.loader.style.width === '30%') this.loader.style.width = '60%'; }, 500);
        setTimeout(() => { if(this.loader.style.width === '60%') this.loader.style.width = '85%'; }, 1200);
    },

    stopLoading() {
        if (!this.loader) return;
        this.loader.style.width = '100%';
        setTimeout(() => {
            this.loader.style.opacity = '0';
            setTimeout(() => { this.loader.style.width = '0%'; }, 300);
        }, 300);
    },

    showUpsell() {
        const tier = localStorage.getItem('tier') || 'starter';
        const msg = tier === 'starter' 
            ? "Upgrade to Pro to unlock advanced management, attendance, and routines!"
            : "Upgrade to Elite to unlock Staff Management, Multi-branch, and AI features!";
            
        if (confirm(`🔒 This is a premium feature.\n\n${msg}\n\nWould you like to see the upgrade options?`)) {
            window.location.href = 'upgrade-plan.html';
        }
    }
};

// Auto-init on script load
document.addEventListener('DOMContentLoaded', () => UX.init());
window.UX = UX;
