// ===============================
// VAMIOS BINGO
// USER.JS
// ===============================

console.log("USER JS LOADED");

// ==========================================
// GET CURRENT TELEGRAM USER
// ==========================================

async function getCurrentUser() {

    console.log(
        "Checking Telegram user..."
    );

    const tg =
        window.Telegram?.WebApp;

    if (!tg) {

        console.log(
            "Telegram WebApp not detected"
        );

        return null;
    }

    tg.ready();

    const telegramUser =
        tg.initDataUnsafe?.user;

    if (!telegramUser) {

        console.log(
            "Telegram user missing"
        );

        return null;
    }

    console.log(
        "Telegram user:",
        telegramUser
    );

    const telegram_id =
        telegramUser.id;

    // ==========================================
    // FIND EXISTING USER
    // ==========================================

    let {
        data: user,
        error
    } = await supabaseClient
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

    // ==========================================
    // CREATE USER IF NEW
    // ==========================================

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
                .insert([
                    {
                        telegram_id:
                            telegram_id,

                        user_name:
                            telegramUser.username || "",

                        full_name:
                            fullName
                    }
                ])
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

        console.log(
            "New website user created:",
            user.id
        );
    }

    // ==========================================
    // MAKE SURE WALLET EXISTS
    // ==========================================

    const {
        data: wallet,
        error: walletError
    } = await supabaseClient
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
            data: newWallet,
            error: createWalletError
        } =
            await supabaseClient
                .from("wallets")
                .insert([
                    {
                        user_id:
                            user.id,

                        balance:
                            0
                    }
                ])
                .select()
                .single();

        if (createWalletError) {

            console.error(
                "Create wallet error:",
                createWalletError
            );

            return null;
        }

        console.log(
            "Wallet created:",
            newWallet.id
        );
    }

    return user;
}


// ==========================================
// GET TELEGRAM USER ID
// ==========================================

function getTelegramUserId() {

    const tg =
        window.Telegram?.WebApp;

    if (!tg) {
        return null;
    }

    return (
        tg.initDataUnsafe?.user?.id ||
        null
    );
}


// ==========================================
// GET TELEGRAM USER
// ==========================================

function getTelegramUser() {

    const tg =
        window.Telegram?.WebApp;

    if (!tg) {
        return null;
    }

    return (
        tg.initDataUnsafe?.user ||
        null
    );
}