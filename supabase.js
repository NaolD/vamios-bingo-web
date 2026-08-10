// ===============================
// VAMIOS BINGO
// SUPABASE.JS
// ===============================

// Replace these with your real Supabase values
const SUPABASE_URL = "https://ymmeeppimzyiunscjheh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_d2mVCrvtCDs-JA6ShkYf1Q_FcJ26AhB";

// Create client
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Small helper for debugging
function logError(error) {
  if (!error) return;
  console.error(error);
  alert(error.message || "Unexpected error");
}