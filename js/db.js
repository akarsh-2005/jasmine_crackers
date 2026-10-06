// Creates the Supabase client (anon key only; permissions are enforced by database rules). Null = not configured.
window.sb=(window.supabase&&JC_CONFIG.SUPABASE_URL&&JC_CONFIG.SUPABASE_ANON_KEY)?supabase.createClient(JC_CONFIG.SUPABASE_URL,JC_CONFIG.SUPABASE_ANON_KEY):null;
