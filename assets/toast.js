// ============================================
// [UTILITY] Toast Notifications
// Copy this to: frontend/assets/toast.js
// Replaces standard browser alerts with modern toasts
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Inject the toast container into the body if it doesn't exist
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
});

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info', 'warning' (defaults to 'info')
 * @param {number} duration - Time in ms before auto-dismiss (defaults to 3000)
 */
window.showToast = function (message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return; // Fallback if not loaded yet

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Add icon based on type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 10);

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300); // Wait for fade out
    }, duration);
};

// Also polyfill the native window.alert to use toasts nicely for untouched code
// (Optional, but good for sweeping changes)
const originalAlert = window.alert;
window.alert = function (message) {
    // Guess type based on common keywords
    let type = 'info';
    const msgLower = String(message).toLowerCase();

    // Check if it's the exact success message from plans.html and format better
    if (message.startsWith('✅')) {
        type = 'success';
        message = message.substring(2).trim(); // Remove the emoji
    } else if (message.startsWith('❌')) {
        type = 'error';
        message = message.substring(2).trim();
    } else if (msgLower.includes('success')) {
        type = 'success';
    } else if (msgLower.includes('fail') || msgLower.includes('error')) {
        type = 'error';
    }

    if (document.getElementById('toast-container')) {
        window.showToast(message, type);
    } else {
        originalAlert(message); // Fallback if DOM not ready
    }
};
