// ===============================
// VAMIOS BINGO
// SCREENS.JS
// ===============================

// Screens currently used by the Bingo website.
// Deposit and withdrawal are handled by Telegram,
// so those screens are intentionally removed.

const SCREENS = [
    "lobbyScreen",
    "boardScreen",
    "waitingScreen",
    "gameScreen",
    "walletScreen",
    "withdrawScreen",
    "phoneScreen"
];


// ==========================================
// SHOW SCREEN
// ==========================================

function showScreen(screenId) {

    SCREENS.forEach(
        (id) => {

            const screen =
                document.getElementById(id);

            if (screen) {

                screen.classList.toggle(
                    "hidden",
                    id !== screenId
                );

            }
        }
    );
}


// ==========================================
// GO TO LOBBY
// ==========================================

function goToLobby() {

    showScreen(
        "lobbyScreen"
    );
}


// ==========================================
// GO TO BOARDS
// ==========================================

function goToBoards() {

    showScreen(
        "boardScreen"
    );
}


// ==========================================
// GO TO WAITING
// ==========================================

function goToWaiting() {

    showScreen(
        "waitingScreen"
    );
}


// ==========================================
// GO TO GAME
// ==========================================

function goToGame() {

    showScreen(
        "gameScreen"
    );
}


// ==========================================
// GO TO WALLET
// ==========================================

function goToWallet() {

    showScreen(
        "walletScreen"
    );
}


// ==========================================
// BACK TO LOBBY
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const backBtn =
            document.getElementById(
                "backToLobbyBtn"
            );

        if (backBtn) {

            backBtn.onclick =
                () => {

                    goToLobby();

                };
        }

        // Start on lobby
        showScreen(
            "lobbyScreen"
        );
    }
);
function goToWithdraw() {
    showScreen("withdrawScreen");
}