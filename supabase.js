// ===============================
// VAMIOS BINGO SUPABASE CONFIG
// ===============================

const SUPABASE_URL = "https://ymmeeppimzyiunscjheh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_d2mVCrvtCDs-JA6ShkYf1Q_FcJ26AhB";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Make it available globally
window.supabase = supabase;


// ===============================
// CONNECTION CHECK
// ===============================

async function checkConnection() {

  const status =
    document.getElementById('connectionStatus');

  if (!status) return;

  try {

    const { error } =
      await supabase
        .from('rooms')
        .select('id')
        .limit(1);

    if (error) throw error;

    status.textContent = 'Connected';
    status.style.color = '#22c55e';

  } catch (err) {

    console.error(err);

    status.textContent = 'Connection failed';
    status.style.color = '#ef4444';

  }

}


// ===============================
// START
// ===============================

checkConnection();
