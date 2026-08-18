// ==========================================
// VAMIOS BINGO
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL =
    "https://ymmeeppimzyiunscjheh.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_d2mVCrvtCDs-JA6ShYkYf1Q_FcJ26AhB";

// The Supabase CDN creates window.supabase.
// Save its createClient function first.
const createSupabaseClient =
    window.supabase.createClient;

// Replace the global Supabase namespace
// with the actual Supabase client.
// All VAMIOS files use:
//     supabase.from(...)
window.supabase =
    createSupabaseClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

console.log(
    "SUPABASE CLIENT READY"
);
