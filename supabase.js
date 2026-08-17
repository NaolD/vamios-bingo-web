// ==========================================
// VAMIOS BINGO V1
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL = "https://ymmeeppimzyiunscjheh.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_d2mVCrvtCDs-JA6ShkYf1Q_FcJ26AhB";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("SUPABASE JS LOADED");
