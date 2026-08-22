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

    // ======================================
    // ATOMIC DATABASE DEDUCTION
    // ======================================

    const {
        data,
        error
    } =
        await supabase.rpc(
            "deduct_bingo_entry_fee",
            {
                p_user_id: userId,
                p_amount: amount
            }
        );

    if (error) {

        console.error(
            "ENTRY FEE ERROR:",
            error
        );

        let message =
            error.message ||
            "Could not deduct entry fee";

        if (
            message
                .toLowerCase()
                .includes("insufficient balance")
        ) {

            message =
                "Insufficient balance";
        }

        return {
            success: false,
            error: message
        };
    }

    if (
        !data ||
        data.success !== true
    ) {

        return {
            success: false,
            error:
                data?.error ||
                "Could not deduct entry fee"
        };
    }

    // ======================================
    // UPDATE LOCAL BALANCE
    // ======================================

    walletBalance =
        Number(data.balance || 0);

    updateWalletDisplay();

    console.log(
        "ENTRY FEE PAID:",
        amount,
        "NEW BALANCE:",
        walletBalance,
        "TRANSACTION:",
        data.transaction_id
    );

    return {
        success: true,
        balance: walletBalance,
        transactionId:
            data.transaction_id
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
