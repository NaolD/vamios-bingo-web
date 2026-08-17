// ==========================================
// VAMIOS BINGO V1
// LOBBY
// ==========================================

let selectedEntryFee = null;


// ==========================================
// INITIALIZE LOBBY
// ==========================================

async function initializeLobby() {

    console.log("INITIALIZING LOBBY");

    setConnectionStatus("Connecting...", false);

    // --------------------------------------
    // Initialize Telegram
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

    }


    // --------------------------------------
    // Initialize user
    // --------------------------------------

    const user =
        await initializeUser();


    if (!user) {

        setConnectionStatus(
            "Telegram not detected",
            false
        );

        return false;
    }


    // --------------------------------------
    // Load wallet
    // --------------------------------------

    await initializeWallet();


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


        if (
            user.last_name
        ) {

            name +=
                " " +
                user.last_name;

        }


        playerName.textContent =
            name;
    }


    // --------------------------------------
    // Connection
    // --------------------------------------

    setConnectionStatus(
        "Connected",
        true
    );


    // --------------------------------------
    // Load room statistics
    // --------------------------------------

    await loadRoomStatistics();


    // --------------------------------------
    // Setup fee buttons
    // --------------------------------------

    setupFeeButtons();


    console.log(
        "LOBBY READY"
    );


    return true;
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
        (button) => {

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
        ![10, 15, 25, 50].includes(
            fee
        )
    ) {

        console.error(
            "INVALID ENTRY FEE:",
            fee
        );

        return;
    }


    // --------------------------------------
    // Check wallet
    // --------------------------------------

    if (
        !hasEnoughBalance(
            fee
        )
    ) {

        alert(
            "Insufficient balance."
        );

        return;
    }


    selectedEntryFee =
        fee;


    // --------------------------------------
    // Open board selection
    // --------------------------------------

    if (
        typeof initializeBoards ===
        "function"
    ) {

        await initializeBoards(
            fee
        );

    } else {

        console.error(
            "initializeBoards() NOT FOUND"
        );

        return;
    }


    showBoardScreen();

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


    // --------------------------------------
    // Total live players
    // --------------------------------------

    const livePlayers =
        document.getElementById(
            "livePlayers"
        );


    if (livePlayers) {

        // Player counts will be loaded
        // properly once games exist.

        livePlayers.textContent =
            "0";

    }


    // --------------------------------------
    // Jackpot
    // --------------------------------------

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
// GET SELECTED ENTRY FEE
// ==========================================

function getSelectedEntryFee() {

    return selectedEntryFee;

}


console.log(
    "LOBBY JS LOADED"
);
