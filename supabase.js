// ===============================
// VAMIOS BINGO SUPABASE CONFIG
// ===============================

const SUPABASE_URL =
    "https://ymmeeppimzyiunscjheh.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_d2mVCrvtCDs-JA6ShkYf1Q_FcJ26AhB";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// Global aliases used by VAMIOS files
window.supabaseClient =
    supabaseClient;

window.vamiosSupabase =
    supabaseClient;


// Use this everywhere in new code
const supabase =
    supabaseClient;


// ===============================
// CONNECTION CHECK
// ===============================

async function checkConnection() {

    const status =
        document.getElementById(
            "connectionStatus"
        );


    if (!status) return;


    try {

        const {
            error
        } =
            await supabaseClient
                .from("rooms")
                .select("id")
                .limit(1);


        if (error) {

            throw error;

        }


        status.textContent =
            "Connected";


        status.style.color =
            "#22c55e";


        console.log(
            "Supabase connected"
        );

    }

    catch (err) {

        console.error(
            "Supabase connection error:",
            err
        );


        status.textContent =
            "Connection failed";


        status.style.color =
            "#ef4444";

    }

}


document.addEventListener(
    "DOMContentLoaded",
    checkConnection
);