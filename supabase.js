// ===============================
// VAMIOS BINGO SUPABASE
// ===============================

console.log("SUPABASE.JS LOADED");

const SUPABASE_URL =
    "https://ymmeeppimzyiunscjheh.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_d2mVCrvtCDs-JA6ShkYf1Q_FcJ26AhB";


let supabaseClient;


// ===============================
// INITIALIZE SUPABASE
// ===============================

function initializeSupabase() {

    console.log(
        "Supabase library:",
        window.supabase
    );


    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "Supabase library did not load."
        );

        return false;
    }


    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    // Make available to all VAMIOS files
    window.supabaseClient =
        supabaseClient;


    window.vamiosSupabase =
        supabaseClient;


    console.log(
        "Supabase client initialized"
    );


    return true;
}


const supabaseReady =
    initializeSupabase();


// ===============================
// CONNECTION CHECK
// ===============================

async function checkConnection() {

    const status =
        document.getElementById(
            "connectionStatus"
        );


    if (!status) return;


    if (!supabaseReady) {

        status.textContent =
            "Supabase unavailable";

        status.style.color =
            "#ef4444";

        return;
    }


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
            "Supabase connection OK"
        );

    }

    catch (error) {

        console.error(
            "Supabase connection error:",
            error
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