// ==========================================
// VAMIOS BINGO
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL =
    "https://ymmeeppimzyiunscjheh.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_d2mVCrvtCDs-JA6ShkYf1Q_FcJ26AhB";


// Keep the CDN object before replacing it
const supabaseCreateClient =
    window.supabase.createClient;


// Create VAMIOS Supabase client
const supabaseClient =
    supabaseCreateClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// Make it available to all VAMIOS files
window.supabase =
    supabaseClient;


console.log(
    "VAMIOS SUPABASE CLIENT READY"
);
