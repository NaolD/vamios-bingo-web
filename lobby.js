// ==========================================
// VAMIOS BINGO
// LOBBY
// ==========================================

let selectedEntryFee = null;


// ==========================================
// INITIALIZE LOBBY
// ==========================================

async function initializeLobby() {

    console.log("INITIALIZING LOBBY");

    setConnectionStatus(
        "Connecting...",
        false
    );


    // --------------------------------------
    // Telegram
    // --------------------------------------

    if (
        window.Telegram &&
        window.Telegram.WebApp
    ) {

        try {

            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();

        } catch (error) {

            console.error(
                "TELEGRAM INIT ERROR:",
                error
            );

        }

    } else {

        alert(
            "ERROR: Telegram WebApp not available"
        );

        return false;

    }


    // --------------------------------------
    // Initialize user
    // --------------------------------------

    try {

        const telegramUser =
            getTelegramUser();

        if (!telegramUser) {

            alert(
                "ERROR: Telegram user not detected.\n\nOpen VAMIOS Bingo using the Telegram bot."
            );

            return false;
        }


        console.log(
            "TELEGRAM USER:",
            telegramUser
        );


        const user =
            await initializeUser();


        if (!user) {

            alert(
                "ERROR: Telegram user was detected, but Supabase user initialization failed.\n\nCheck the users table or Supabase permissions."
            );

            return false;
        }


        // --------------------------------------
        // Wallet
        // --------------------------------------

        try {

            await initializeWallet();

        } catch (error) {

            console.error(
                "WALLET ERROR:",
                error
            );

        }


        // --------------------------------------
        // Display user
        // --------------------------------------

        const playerName =
            document.getElementById(
                "playerName"
            );


        if (playerName) {

            let name =
                user.first_name ||
                user.username ||
                "Player";


            if (user.last_name) {

                name +=
                    " " +
                    user.last_name;

            }


            playerName.textContent =
                name;

        }


        // --------------------------------------
        // Connected
        // --------------------------------------

        setConnectionStatus(
            "Connected",
            true
        );


        // --------------------------------------
        // Room statistics
        // --------------------------------------

        try {

            await loadRoomStatistics();

        } catch (error) {

            console.error(
                "ROOM STATISTICS ERROR:",
                error
            );

        }


        // --------------------------------------
        // Fee buttons
        // --------------------------------------

        setupFeeButtons();


        console.log(
            "LOBBY READY"
        );


        return true;

    }

    catch (error) {

        console.error(
            "LOBBY INITIALIZATION ERROR:",
            error
        );


        alert(
            "LOBBY ERROR:\n\n" +
            (
                error.message ||
                String(error)
            )
        );


        return false;

    }

}


// ==========================================
// FEE BUTTONS
// ==========================================

function setupFeeButtons() {

    const buttons =
        document.querySelectorAll(
            ".fee-button"
        );


    console.log(
        "FEE BUTTONS:",
        buttons.length
    );


    buttons.forEach(
        button => {

            button.onclick =
                async function () {

                    const fee =
                        Number(
                            button.dataset.fee
                        );


                    await selectEntryFee(
                        fee
                    );

                };

        }
    );

}


// ==========================================
// SELECT ENTRY FEE
// ==========================================

async function selectEntryFee(
    fee
) {

    console.log(
        "SELECTED FEE:",
        fee
    );


    if (
        ![10, 15, 25, 50]
            .includes(fee)
    ) {

        alert(
            "Invalid entry fee."
        );

        return;

    }


    // TEMPORARY TEST MODE
// Balance/payment will be enforced later.
console.log(
    "TEST MODE: allowing entry fee",
    fee
);

    selectedEntryFee =
        fee;


    if (
        typeof initializeBoards ===
        "function"
    ) {

        await initializeBoards(
            fee
        );

    } else {

        alert(
            "ERROR: boards.js is not loaded."
        );

        return;

    }


    if (
        typeof showBoardScreen ===
        "function"
    ) {

        showBoardScreen();

    } else {

        alert(
            "ERROR: showBoardScreen() not found."
        );

    }

}


// ==========================================
// LOAD ROOM STATISTICS
// ==========================================

async function loadRoomStatistics() {

    const {
        data: rooms,
        error
    } =
        await supabase
            .from("rooms")
            .select(
                "entry_fee, max_players, status"
            )
            .in(
                "entry_fee",
                [10, 15, 25, 50]
            );


    if (error) {

        console.error(
            "ROOM STATISTICS ERROR:",
            error
        );

        return;

    }


    const livePlayers =
        document.getElementById(
            "livePlayers"
        );


    if (livePlayers) {

        livePlayers.textContent =
            "0";

    }


    const jackpot =
        document.getElementById(
            "jackpot"
        );


    if (jackpot) {

        jackpot.textContent =
            "0.00 ETB";

    }


    console.log(
        "ROOMS:",
        rooms
    );

}


// ==========================================
// GET SELECTED FEE
// ==========================================

function getSelectedEntryFee() {

    return selectedEntryFee;

}


console.log(
    "LOBBY JS LOADED"
);
