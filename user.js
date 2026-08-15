// ===============================
// VAMIOS BINGO
// USER.JS
// ===============================

console.log(
    "USER JS LOADED"
);


let currentVamiosUser = null;


// ===============================
// GET CURRENT USER
// ===============================

async function getCurrentUser() {

    console.log(
        "Getting current VAMIOS user..."
    );


    // ---------------------------------
    // Telegram user
    // ---------------------------------

    const tg =
        window.Telegram?.WebApp;


    let telegramUser =
        tg?.initDataUnsafe?.user;


    // ---------------------------------
    // Browser development fallback
    // ---------------------------------

    if (!telegramUser) {

        console.log(
            "Telegram user unavailable."
        );


        // Use previously saved development user
        const savedUserId =
            localStorage.getItem(
                "vamios_test_user_id"
            );


        if (savedUserId) {

            const {
                data: savedUser,
                error
            } =
                await supabaseClient
                    .from("users")
                    .select("*")
                    .eq(
                        "id",
                        savedUserId
                    )
                    .maybeSingle();


            if (
                !error &&
                savedUser
            ) {

                currentVamiosUser =
                    savedUser;

                return savedUser;

            }

        }


        console.log(
            "Creating development user..."
        );


        // Find an existing user for development
        const {
            data: existingUser,
            error: findError
        } =
            await supabaseClient
                .from("users")
                .select("*")
                .limit(1)
                .maybeSingle();


        if (
            !findError &&
            existingUser
        ) {

            localStorage.setItem(
                "vamios_test_user_id",
                String(existingUser.id)
            );


            currentVamiosUser =
                existingUser;


            return existingUser;

        }


        console.log(
            "No development user found."
        );


        return null;
    }


    // ---------------------------------
    // Telegram is available
    // ---------------------------------

    tg.ready();


    const telegram_id =
        telegramUser.id;


    console.log(
        "Telegram user:",
        telegramUser
    );


    // ---------------------------------
    // Find user
    // ---------------------------------

    let {
        data: user,
        error
    } =
        await supabaseClient
            .from("users")
            .select("*")
            .eq(
                "telegram_id",
                telegram_id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Get user error:",
            error
        );

        return null;
    }


    // ---------------------------------
    // Create user
    // ---------------------------------

    if (!user) {

        const fullName = [

            telegramUser.first_name || "",

            telegramUser.last_name || ""

        ]
        .join(" ")
        .trim();


        const result =
            await supabaseClient
                .from("users")
                .insert({

                    telegram_id:
                        telegram_id,

                    user_name:
                        telegramUser.username || "",

                    full_name:
                        fullName

                })
                .select()
                .single();


        if (result.error) {

            console.error(
                "Create user error:",
                result.error
            );

            return null;
        }


        user =
            result.data;

    }


    // ---------------------------------
    // Ensure wallet exists
    // ---------------------------------

    const {
        data: wallet,
        error: walletError
    } =
        await supabaseClient
            .from("wallets")
            .select("*")
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();


    if (walletError) {

        console.error(
            "Wallet lookup error:",
            walletError
        );

        return null;
    }


    if (!wallet) {

        const {
            error:
                createWalletError
        } =
            await supabaseClient
                .from("wallets")
                .insert({

                    user_id:
                        user.id,

                    balance:
                        0

                });


        if (createWalletError) {

            console.error(
                "Create wallet error:",
                createWalletError
            );

            return null;
        }

    }


    currentVamiosUser =
        user;


    localStorage.setItem(
        "vamios_user_id",
        String(user.id)
    );


    return user;
}


// ===============================
// TELEGRAM USER ID
// ===============================

function getTelegramUserId() {

    return (
        window.Telegram
        ?.WebApp
        ?.initDataUnsafe
        ?.user
        ?.id
        || null
    );

}


// ===============================
// TELEGRAM USER
// ===============================

function getTelegramUser() {

    return (
        window.Telegram
        ?.WebApp
        ?.initDataUnsafe
        ?.user
        || null
    );

}


// ==========================================
// MAKE FUNCTIONS AVAILABLE TO OTHER FILES
// ==========================================

window.getCurrentUser =
    getCurrentUser;

window.getTelegramUserId =
    getTelegramUserId;

window.getTelegramUser =
    getTelegramUser;