// ==========================================
// VAMIOS BINGO
// SCREEN MANAGEMENT
// ==========================================

const SCREEN_IDS = [
    "lobbyScreen",
    "boardScreen",
    "waitingScreen",
    "gameScreen",
    "winnerScreen"
];


// ==========================================
// SHOW SCREEN
// ==========================================

function showScreen(screenId) {

    console.log(
        "SHOW SCREEN:",
        screenId
    );


    SCREEN_IDS.forEach((id) => {

        const screen =
            document.getElementById(id);

        if (!screen) {
            return;
        }


        if (id === screenId) {

            screen.classList.remove(
                "hidden"
            );

        } else {

            screen.classList.add(
                "hidden"
            );

        }

    });

}


// ==========================================
// HIDE SCREEN
// ==========================================

function hideScreen(screenId) {

    const screen =
        document.getElementById(
            screenId
        );

    if (screen) {

        screen.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// LOBBY
// ==========================================

function showLobby() {

    showScreen(
        "lobbyScreen"
    );

}


// ==========================================
// BOARD
// ==========================================

function showBoardScreen() {

    showScreen(
        "boardScreen"
    );

}


// ==========================================
// WAITING ROOM
// ==========================================

function showWaitingScreen() {

    showScreen(
        "waitingScreen"
    );

}


// ==========================================
// GAME
// ==========================================

async function showGameScreen() {

    console.log(
        "================================"
    );

    console.log(
        "OPENING GAME SCREEN"
    );

    console.log(
        "================================"
    );


    showScreen(
        "gameScreen"
    );


    // Give the browser one moment
    // to display the game screen.

    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                100
            )
    );


    // ======================================
    // START GAME
    // ======================================

    if (
        typeof initializeGame ===
        "function"
    ) {

        console.log(
            "STARTING GAME INITIALIZATION"
        );


        try {

            await initializeGame();


            console.log(
                "GAME INITIALIZATION COMPLETE"
            );

        } catch (error) {

            console.error(
                "GAME INITIALIZATION ERROR:",
                error
            );


            alert(
                "GAME INITIALIZATION ERROR:\n\n" +
                (
                    error.message ||
                    String(error)
                )
            );

        }

    } else {

        console.error(
            "initializeGame() NOT FOUND"
        );


        alert(
            "ERROR: game.js is not loaded."
        );

    }

}


// ==========================================
// WINNER
// ==========================================

function showWinnerScreen() {

    showScreen(
        "winnerScreen"
    );

}


// ==========================================
// CONNECTION STATUS
// ==========================================

function setConnectionStatus(
    message,
    connected = false
) {

    const element =
        document.getElementById(
            "connectionStatus"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    if (connected) {

        element.style.color =
            "#22c55e";

    } else {

        element.style.color =
            "#94a3b8";

    }

}


// ==========================================
// INITIALIZE SCREENS
// ==========================================

function initializeScreens() {

    console.log(
        "INITIALIZING SCREENS"
    );


    showLobby();

}


console.log(
    "SCREENS JS LOADED"
);
