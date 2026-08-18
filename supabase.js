// ==========================================
// VAMIOS BINGO
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL =
    "https://ymmeeppimzyiunscjheh.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_d2mVCrvtCDs-JA6ShYkYf1Q_FcJ26AhB";

// The CDN already provides window.supabase.
// Create the actual Supabase client without
// declaring another global variable named supabase.

window.vamiosSupabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

// Make all existing VAMIOS files use:
// supabase.from(...)
// supabase.auth(...)
// etc.

window.supabase =
    window.vamiosSupabase;

console.log(
    "VAMIOS SUPABASE CLIENT READY"
);
