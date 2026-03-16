// ═══════════════════════════════════════════════════════════
//  core/db.js  —  All Supabase database queries
//  ► Add/edit any DB query here. Never write db.from() in HTML files.
//  Requires: config.js
// ═══════════════════════════════════════════════════════════
const DB = {

    // ── Submissions ──────────────────────────────────────────

    async getSubmission(id) {
        const { data, error } = await db.from('submissions')
            .select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },

    async getUserSubmissions(userId) {
        const { data, error } = await db.from('submissions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getAllSubmissions(statusFilter = 'all') {
        let query = db.from('submissions')
            .select('*')
            .order('updated_at', { ascending: false });
        if (statusFilter !== 'all') query = query.eq('status', statusFilter);
        const { data, error } = await query;
        if (error) throw error;

        // Enrich with profile data
        const userIds = [...new Set(data.map(s => s.user_id).filter(Boolean))];
        let profileMap = {};
        if (userIds.length > 0) {
            const { data: profiles } = await db.from('profiles')
                .select('id, full_name, email').in('id', userIds);
            if (profiles) profiles.forEach(p => { profileMap[p.id] = p; });
        }
        return data.map(s => ({ ...s, _profile: profileMap[s.user_id] || null }));
    },

    async saveDraft(userId, formData, existingId = null) {
        const payload = {
            user_id:    userId,
            form_data:  formData,
            form_type:  formData._formType || 'vehicle-valuation',
            status:     'draft',
            updated_at: new Date().toISOString()
        };
        if (existingId) {
            const { data, error } = await db.from('submissions')
                .update(payload).eq('id', existingId).select().single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await db.from('submissions')
                .insert(payload).select().single();
            if (error) throw error;
            return data;
        }
    },

    async submitReport(userId, formData, existingId = null) {
        const payload = {
            user_id:    userId,
            form_data:  { ...formData, _submittedAt: new Date().toISOString() },
            form_type:  formData._formType || 'vehicle-valuation',
            status:     'submitted',
            updated_at: new Date().toISOString()
        };
        if (existingId) {
            const { data, error } = await db.from('submissions')
                .update(payload).eq('id', existingId).select().single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await db.from('submissions')
                .insert(payload).select().single();
            if (error) throw error;
            return data;
        }
    },

    async markReviewed(id) {
        const { error } = await db.from('submissions')
            .update({ status: 'reviewed', updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteSubmission(id) {
        const { error } = await db.from('submissions').delete().eq('id', id);
        if (error) throw error;
    },

    // ── Stats ─────────────────────────────────────────────────

    async getStats() {
        const { data } = await db.from('submissions').select('status, form_type');
        const stats = { total: 0, draft: 0, submitted: 0, reviewed: 0, byType: {} };
        (data || []).forEach(s => {
            stats.total++;
            if (stats[s.status] !== undefined) stats[s.status]++;
            stats.byType[s.form_type] = (stats.byType[s.form_type] || 0) + 1;
        });
        return stats;
    }
};