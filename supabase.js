// ==========================================
// VAMIOS BINGO
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL =
    "https://ymmeeppimzyiunscjheh.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_d2mVCrvtCDs-JA6ShkYf1Q_FcJ26AhB";


window.supabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


console.log(
    "VAMIOS SUPABASE CLIENT READY"
);
