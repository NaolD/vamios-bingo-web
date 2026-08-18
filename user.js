// ==========================================
// VAMIOS BINGO
// USER MANAGEMENT
// ==========================================

let currentUser = null;


// ==========================================
// GET TELEGRAM USER
// ==========================================

function getTelegramUser() {

    if (
        !window.Telegram ||
        !window.Telegram.WebApp
    ) {
        return null;
    }

    const tgUser =
        window.Telegram.WebApp
            .initDataUnsafe
            ?.user;

    if (!tgUser) {
        return null;
    }

    return tgUser;
}


// ==========================================
// INITIALIZE USER
// ==========================================

async function initializeUser() {

    console.log(
        "INITIALIZING USER"
    );


    const telegramUser =
        getTelegramUser();


    if (!telegramUser) {

        console.error(
            "TELEGRAM USER NOT FOUND"
        );

        return null;
    }


    console.log(
        "TELEGRAM USER FOUND:",
        telegramUser
    );


    // --------------------------------------
    // Look for existing user
    // --------------------------------------

    const {
        data: existingUser,
        error: findError
    } =
        await supabase
            .from("users")
            .select("*")
            .eq(
                "telegram_id",
                String(telegramUser.id)
            )
            .maybeSingle();


    if (findError) {

        console.error(
            "USER LOOKUP ERROR:",
            findError
        );

        alert(
            "USER LOOKUP ERROR:\n\n" +
            (
                findError.message ||
                JSON.stringify(findError)
            )
        );

        return null;
    }


    // --------------------------------------
    // Existing user
    // --------------------------------------

    if (existingUser) {

        console.log(
            "EXISTING USER:",
            existingUser
        );

        currentUser =
            existingUser;

        return currentUser;
    }


    // --------------------------------------
    // Create new user
    // --------------------------------------

    const newUser = {

    telegram_id:
        String(telegramUser.id),

    username:
        telegramUser.username ||
        [
            telegramUser.first_name,
            telegramUser.last_name
        ]
            .filter(Boolean)
            .join(" ") ||
        "Player",

    phone:
        null
};
    console.log(
        "CREATING USER:",
        newUser
    );


    const {
        data: createdUser,
        error: createError
    } =
        await supabase
            .from("users")
            .insert(newUser)
            .select()
            .single();


    if (createError) {

        console.error(
            "USER CREATION ERROR:",
            createError
        );

        alert(
            "USER CREATION ERROR:\n\n" +
            (
                createError.message ||
                JSON.stringify(createError)
            )
        );

        return null;
    }


    currentUser =
        createdUser;


    console.log(
        "USER CREATED:",
        currentUser
    );


    return currentUser;

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

    if (!currentUser) {
        return null;
    }

    return currentUser.id;

}


console.log(
    "USER JS LOADED"
);
