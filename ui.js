// ═══════════════════════════════════════════════════════════
//  ui.js  —  Shared UI utilities
//  ► Edit this file for toast / UI helper changes only
// ═══════════════════════════════════════════════════════════
const UI = {

    showToast(msg, type = 'info', dur = 3000) {
        const c = document.getElementById('toast-container');
        if (!c) return;
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => t.remove(), dur);
    },

    // Format a date string to "10 Mar 2026"
    formatDate(str) {
        if (!str) return '—';
        try {
            return new Date(str).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch { return str; }
    },

    // Convert 24h time string to 12h format
    formatTime(str) {
        if (!str || !str.includes(':')) return str || '—';
        const [h, m] = str.split(':');
        const hr = parseInt(h);
        return `${hr % 12 || 12}:${m}${hr < 12 ? ' AM' : ' PM'}`;
    }
};