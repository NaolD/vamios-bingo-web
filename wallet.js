// ==========================================
// VAMIOS BINGO V1
// WALLET MANAGEMENT
// ==========================================


let walletBalance = 0;


// ==========================================
// LOAD WALLET
// ==========================================

async function loadWallet() {

    const userId =
        getCurrentUserId();


    if (!userId) {

        console.error(
            "WALLET: USER ID NOT AVAILABLE"
        );

        return null;
    }


    const {
        data: wallet,
        error
    } =
        await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();


    if (error) {

        console.error(
            "WALLET LOAD ERROR:",
            error
        );

        return null;
    }


    if (!wallet) {

        console.error(
            "WALLET NOT FOUND"
        );

        return null;
    }


    walletBalance =
        Number(wallet.balance || 0);


    updateWalletDisplay();


    return wallet;
}


// ==========================================
// UPDATE WALLET DISPLAY
// ==========================================

function updateWalletDisplay() {

    const element =
        document.getElementById(
            "walletBalance"
        );


    if (!element) {
        return;
    }


    element.textContent =
        walletBalance.toFixed(2) +
        " ETB";
}


// ==========================================
// GET BALANCE
// ==========================================

function getWalletBalance() {

    return walletBalance;
}


// ==========================================
// CHECK BALANCE
// ==========================================

function hasEnoughBalance(
    amount
) {

    return (
        walletBalance >=
        Number(amount)
    );

}


// ==========================================
// DEDUCT ENTRY FEE
// ==========================================
//
// We will use this later when a player
// actually joins a game.
//
// For now this function is prepared,
// but the lobby will not call it yet.
//

async function deductEntryFee(
    amount
) {

    const userId =
        getCurrentUserId();


    if (!userId) {

        console.error(
            "DEDUCT: USER NOT FOUND"
        );

        return {
            success: false,
            error: "User not found"
        };
    }


    amount =
        Number(amount);


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        return {
            success: false,
            error: "Invalid amount"
        };
    }


    // --------------------------------------
    // Read current wallet
    // --------------------------------------

    const {
        data: wallet,
        error: walletError
    } =
        await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", userId)
            .single();


    if (walletError) {

        console.error(
            "WALLET READ ERROR:",
            walletError
        );

        return {
            success: false,
            error: "Wallet error"
        };
    }


    if (
        Number(wallet.balance) <
        amount
    ) {

        return {
            success: false,
            error: "Insufficient balance"
        };
    }


    // --------------------------------------
    // Deduct
    // --------------------------------------

    const newBalance =
        Number(wallet.balance) -
        amount;


    const {
        data: updatedWallet,
        error: updateError
    } =
        await supabase
            .from("wallets")
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq("user_id", userId)
            .select()
            .single();


    if (updateError) {

        console.error(
            "WALLET UPDATE ERROR:",
            updateError
        );

        return {
            success: false,
            error: "Could not update wallet"
        };
    }


    // --------------------------------------
    // Record transaction
    // --------------------------------------

    const {
        error: transactionError
    } =
        await supabase
            .from("transactions")
            .insert({

                user_id: userId,

                type: "entry_fee",

                amount: amount,

                status: "completed",

                description:
                    "Bingo entry fee"

            });


    if (transactionError) {

        console.error(
            "TRANSACTION ERROR:",
            transactionError
        );

        // The wallet has already been deducted.
        // We will replace this with an atomic
        // database transaction later.
    }


    walletBalance =
        newBalance;


    updateWalletDisplay();


    return {
        success: true,
        balance: newBalance
    };

}


// ==========================================
// INITIALIZE WALLET
// ==========================================

async function initializeWallet() {

    console.log(
        "INITIALIZING WALLET"
    );


    return await loadWallet();

}


console.log(
    "WALLET JS LOADED"
);
