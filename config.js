// ═══════════════════════════════════════════════════════════
//  config.js  —  Supabase credentials
//  ► Only edit this file when credentials change
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL      = 'https://pdmcykghinfxrpdqocoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbWN5a2doaW5meHJwZHFvY29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDkwMDMsImV4cCI6MjA4ODUyNTAwM30.9fbjjWj7r8hjiqhyp2Yf3j86KBlJIo9idysSIRqMWxE';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);