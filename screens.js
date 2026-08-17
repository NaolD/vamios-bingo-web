// ==========================================
// VAMIOS BINGO V1
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
// INITIAL SCREEN
// ==========================================

function showLobby() {

    showScreen(
        "lobbyScreen"
    );

}


// ==========================================
// BOARD SCREEN
// ==========================================

function showBoardScreen() {

    showScreen(
        "boardScreen"
    );

}


// ==========================================
// WAITING SCREEN
// ==========================================

function showWaitingScreen() {

    showScreen(
        "waitingScreen"
    );

}


// ==========================================
// GAME SCREEN
// ==========================================

function showGameScreen() {

    showScreen(
        "gameScreen"
    );

}


// ==========================================
// WINNER SCREEN
// ==========================================

function showWinnerScreen() {

    showScreen(
        "winnerScreen"
    );

}


// ==========================================
// UPDATE CONNECTION STATUS
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
