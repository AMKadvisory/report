// ═══════════════════════════════════════════════════════════
//  auth.js  —  Authentication helpers
//  ► Edit this file for auth logic changes only
//  Requires: config.js
// ═══════════════════════════════════════════════════════════
const Auth = {

    async getSession() {
        const { data: { session } } = await db.auth.getSession();
        return session;
    },

    async getProfile(userId) {
        const { data, error } = await db.from('profiles').select('*').eq('id', userId).single();
        if (error) throw error;
        return data;
    },

    // Syncs full_name from Supabase auth user_metadata → profiles table on every login
    // This ensures admin dashboard always sees the latest display name
    async syncProfile(session) {
        const metaName = session.user?.user_metadata?.full_name;
        if (metaName) {
            await db.from('profiles').upsert(
                { id: session.user.id, full_name: metaName },
                { onConflict: 'id' }
            );
        }
    },

    // Use for regular user pages (form, dashboard)
    async requireAuth(redirectTo = 'index.html') {
        const session = await this.getSession();
        if (!session) { window.location.href = redirectTo; return null; }
        await this.syncProfile(session);
        return session;
    },

    // Use for admin-only pages
    async requireAdmin() {
        const { data: { session } } = await db.auth.getSession();
        if (!session) { window.location.href = 'index.html'; return null; }
        await this.syncProfile(session);
        const { data: profile, error } = await db.from('profiles')
            .select('*').eq('id', session.user.id).single();
        if (error || profile?.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return null;
        }
        return { session, profile };
    },

    async logout() {
        await db.auth.signOut();
        window.location.href = 'index.html';
    }
};