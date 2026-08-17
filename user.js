// ==========================================
// VAMIOS BINGO V1
// USER MANAGEMENT
// ==========================================

let currentUser = null;


// ==========================================
// GET TELEGRAM USER
// ==========================================

function getTelegramUser() {

    if (
        window.Telegram &&
        window.Telegram.WebApp &&
        window.Telegram.WebApp.initDataUnsafe &&
        window.Telegram.WebApp.initDataUnsafe.user
    ) {

        return window.Telegram.WebApp.initDataUnsafe.user;

    }

    return null;
}


// ==========================================
// LOAD / CREATE USER
// ==========================================

async function loadCurrentUser() {

    const telegramUser = getTelegramUser();

    if (!telegramUser) {

        console.error("TELEGRAM USER NOT FOUND");

        return null;
    }


    console.log(
        "TELEGRAM USER:",
        telegramUser
    );


    // --------------------------------------
    // Find existing user
    // --------------------------------------

    const { data: existingUser, error } =
        await supabase
            .from("users")
            .select("*")
            .eq("telegram_id", telegramUser.id)
            .maybeSingle();


    if (error) {

        console.error(
            "USER LOOKUP ERROR:",
            error
        );

        return null;
    }


    // --------------------------------------
    // Existing user
    // --------------------------------------

    if (existingUser) {

        currentUser = existingUser;

        console.log(
            "EXISTING USER:",
            currentUser
        );

        await ensureWallet(
            currentUser.id
        );

        return currentUser;
    }


    // --------------------------------------
    // Create new user
    // --------------------------------------

    const { data: newUser, error: createError } =
        await supabase
            .from("users")
            .insert({

                telegram_id: telegramUser.id,

                username:
                    telegramUser.username || null,

                first_name:
                    telegramUser.first_name || null,

                last_name:
                    telegramUser.last_name || null

            })
            .select()
            .single();


    if (createError) {

        console.error(
            "USER CREATE ERROR:",
            createError
        );

        return null;
    }


    currentUser = newUser;


    console.log(
        "NEW USER CREATED:",
        currentUser
    );


    await ensureWallet(
        currentUser.id
    );


    return currentUser;
}


// ==========================================
// ENSURE WALLET EXISTS
// ==========================================

async function ensureWallet(userId) {

    const { data: wallet, error } =
        await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();


    if (error) {

        console.error(
            "WALLET LOOKUP ERROR:",
            error
        );

        return null;
    }


    if (wallet) {

        return wallet;
    }


    const { data: newWallet, error: createError } =
        await supabase
            .from("wallets")
            .insert({

                user_id: userId,

                balance: 0

            })
            .select()
            .single();


    if (createError) {

        console.error(
            "WALLET CREATE ERROR:",
            createError
        );

        return null;
    }


    console.log(
        "WALLET CREATED:",
        newWallet
    );


    return newWallet;
}


// ==========================================
// GET CURRENT USER
// ==========================================

function getCurrentUser() {

    return currentUser;
}


// ==========================================
// GET CURRENT USER ID
// ==========================================

function getCurrentUserId() {

    return currentUser
        ? currentUser.id
        : null;
}


// ==========================================
// GET WALLET
// ==========================================

async function getCurrentWallet() {

    const userId =
        getCurrentUserId();


    if (!userId) {

        return null;
    }


    const { data: wallet, error } =
        await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", userId)
            .single();


    if (error) {

        console.error(
            "GET WALLET ERROR:",
            error
        );

        return null;
    }


    return wallet;
}


// ==========================================
// INITIALIZE USER SYSTEM
// ==========================================

async function initializeUser() {

    console.log(
        "INITIALIZING USER..."
    );


    const user =
        await loadCurrentUser();


    if (!user) {

        console.error(
            "USER INITIALIZATION FAILED"
        );

        return null;
    }


    console.log(
        "USER INITIALIZED:",
        user.id
    );


    return user;
}


console.log("USER JS LOADED");
