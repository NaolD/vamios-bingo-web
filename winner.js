```javascript
// ==========================================
// VAMIOS BINGO WINNER
// ==========================================
// Winner checking + winner board display
// ==========================================

let winnerAlreadyDeclared = false;


// ==========================================
// CHECK MARKED VALUE
// ==========================================

function isMarked(value) {

    if (value === "FREE") {
        return true;
    }

    return calledNumbers.includes(
        Number(value)
    );

}


// ==========================================
// HORIZONTAL
// ==========================================

function checkHorizontal() {

    for (let row = 0; row < 5; row++) {

        let complete = true;

        for (let col = 0; col < 5; col++) {

            const value =
                playerCard[row * 5 + col];

            if (!isMarked(value)) {
                complete = false;
                break;
            }

        }

        if (complete) {
            return true;
        }

    }

    return false;
}


// ==========================================
// VERTICAL
// ==========================================

function checkVertical() {

    for (let col = 0; col < 5; col++) {

        let complete = true;

        for (let row = 0; row < 5; row++) {

            const value =
                playerCard[row * 5 + col];

            if (!isMarked(value)) {
                complete = false;
                break;
            }

        }

        if (complete) {
            return true;
        }

    }

    return false;
}


// ==========================================
// MAIN DIAGONAL
// ==========================================

function checkDiagonal() {

    for (let i = 0; i < 5; i++) {

        const value =
            playerCard[i * 5 + i];

        if (!isMarked(value)) {
            return false;
        }

    }

    return true;
}


// ==========================================
// REVERSE DIAGONAL
// ==========================================

function checkReverseDiagonal() {

    for (let i = 0; i < 5; i++) {

        const value =
            playerCard[i * 5 + (4 - i)];

        if (!isMarked(value)) {
            return false;
        }

    }

    return true;
}


// ==========================================
// FOUR CORNERS
// ==========================================

function checkFourCorners() {

    const corners = [

        playerCard[0],
        playerCard[4],
        playerCard[20],
        playerCard[24]

    ];

    for (let i = 0; i < corners.length; i++) {

        if (!isMarked(corners[i])) {
            return false;
        }

    }

    return true;
}


// ==========================================
// CREATE WINNER BOARD
// ==========================================

function displayWinnerBoard() {

    const boardContainer =
        document.getElementById(
            "winnerBoard"
        );

    if (!boardContainer) {

        console.error(
            "WINNER BOARD NOT FOUND"
        );

        return;
    }


    boardContainer.innerHTML = "";


    if (
        !Array.isArray(playerCard) ||
        playerCard.length !== 25
    ) {

        console.error(
            "INVALID PLAYER CARD:",
            playerCard
        );

        return;
    }


    for (let i = 0; i < 25; i++) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "bingo-cell";


        const value =
            playerCard[i];


        if (value === "FREE") {

            cell.textContent =
                "FREE";

            cell.classList.add(
                "marked"
            );

        } else {

            cell.textContent =
                value;


            if (
                calledNumbers.includes(
                    Number(value)
                )
            ) {

                cell.classList.add(
                    "marked"
                );

            }

        }


        boardContainer.appendChild(
            cell
        );

    }

}


// ==========================================
// SHOW WINNER
// ==========================================

function showWinner(
    pattern,
    prize
) {

    const winnerScreen =
        document.getElementById(
            "winnerScreen"
        );


    if (!winnerScreen) {

        console.error(
            "WINNER SCREEN NOT FOUND"
        );

        return;
    }


    const patternElement =
        document.getElementById(
            "winnerPattern"
        );


    if (patternElement) {

        patternElement.textContent =
            "Winning Pattern: " +
            pattern;

    }


    const prizeElement =
        document.getElementById(
            "winnerPrize"
        );


    if (prizeElement) {

        prizeElement.textContent =
            Number(prize).toFixed(2) +
            " ETB";

    }


    const messageElement =
        document.getElementById(
            "winnerMessage"
        );


    if (messageElement) {

        messageElement.textContent =
            "Congratulations! You are the winner.";

    }


    const boardNumberElement =
        document.getElementById(
            "winnerBoardNumber"
        );


    const boardNumber =
        localStorage.getItem(
            "selectedBoardNumber"
        );


    if (boardNumberElement) {

        if (boardNumber) {

            boardNumberElement.textContent =
                "Board #" +
                boardNumber;

        } else {

            boardNumberElement.textContent =
                "Winning Board";

        }

    }


    // Display the actual winning board

    displayWinnerBoard();


    // Show winner screen

    if (
        typeof showWinnerScreen ===
        "function"
    ) {

        showWinnerScreen();

    } else {

        winnerScreen.classList.remove(
            "hidden"
        );

    }


    console.log(
        "WINNER DISPLAYED:",
        pattern,
        prize
    );

}


// ==========================================
// SAVE WINNER
// ==========================================

async function saveWinner(
    pattern
) {

    const gameId =
        localStorage.getItem(
            "gameId"
        );


    const roomId =
        localStorage.getItem(
            "roomId"
        );


    const userId =
        localStorage.getItem(
            "userId"
        );


    if (
        !gameId ||
        !roomId ||
        !userId
    ) {

        console.error(
            "WINNER INFORMATION MISSING",
            {
                gameId: gameId,
                roomId: roomId,
                userId: userId
            }
        );

        alert(
            "Winner information is missing."
        );

        return;

    }


    // ======================================
    // CHECK EXISTING WINNER
    // ======================================

    const {
        data: existingGame,
        error: gameLoadError
    } =
        await supabase
            .from("games")
            .select(
                "winner_user_id"
            )
            .eq(
                "id",
                gameId
            )
            .single();


    if (gameLoadError) {

        console.error(
            "WINNER GAME LOAD ERROR:",
            gameLoadError
        );

        alert(
            "Unable to check winner."
        );

        return;

    }


    if (
        existingGame &&
        existingGame.winner_user_id
    ) {

        winnerAlreadyDeclared =
            true;

        alert(
            "Winner already declared."
        );

        return;

    }


    // ======================================
    // LOAD ROOM
    // ======================================

    const {
        data: room,
        error: roomError
    } =
        await supabase
            .from("rooms")
            .select(
                "entry_fee"
            )
            .eq(
                "id",
                roomId
            )
            .single();


    if (roomError || !room) {

        console.error(
            "ROOM LOAD ERROR:",
            roomError
        );

        alert(
            "Unable to calculate prize."
        );

        return;

    }


    // ======================================
    // LOAD PLAYERS
    // ======================================

    const {
        data: players,
        error: playersError
    } =
        await supabase
            .from("game_players")
            .select(
                "id"
            )
            .eq(
                "game_id",
                gameId
            );


    if (playersError) {

        console.error(
            "PLAYERS LOAD ERROR:",
            playersError
        );

        alert(
            "Unable to calculate prize."
        );

        return;

    }


    const totalPlayers =
        players
            ? players.length
            : 0;


    const prize =
        totalPlayers *
        Number(room.entry_fee) *
        0.80;


    // ======================================
    // SAVE WINNER
    // ======================================

    const {
        error: saveError
    } =
        await supabase
            .from("games")
            .update({

                status:
                    "finished",

                winner_user_id:
                    userId,

                finished_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                gameId
            );


    if (saveError) {

        console.error(
            "SAVE WINNER ERROR:",
            saveError
        );

        alert(
            "Could not save winner."
        );

        return;

    }


    // ======================================
    // STOP NUMBER CALLING
    // ======================================

    if (
        typeof stopCalling ===
        "function"
    ) {

        stopCalling();

    }


    // ======================================
    // SHOW WINNER
    // ======================================

    showWinner(
        pattern,
        prize
    );


    console.log(
        "WINNER DECLARED:",
        userId,
        pattern,
        prize
    );

}


// ==========================================
// MAIN BINGO CHECK
// ==========================================

async function checkWinner() {

    console.log(
        "CHECKING BINGO..."
    );


    if (winnerAlreadyDeclared) {

        alert(
            "Winner already declared."
        );

        return;

    }


    if (
        !Array.isArray(playerCard) ||
        playerCard.length !== 25
    ) {

        alert(
            "Your Bingo board is not ready."
        );

        return;

    }


    let pattern = null;


    if (checkHorizontal()) {

        pattern =
            "Horizontal";

    }

    else if (checkVertical()) {

        pattern =
            "Vertical";

    }

    else if (checkDiagonal()) {

        pattern =
            "Diagonal";

    }

    else if (checkReverseDiagonal()) {

        pattern =
            "Reverse Diagonal";

    }

    else if (checkFourCorners()) {

        pattern =
            "Four Corners";

    }


    if (!pattern) {

        alert(
            "No Bingo yet!"
        );

        return;

    }


    console.log(
        "BINGO FOUND:",
        pattern
    );


    await saveWinner(
        pattern
    );

}


// ==========================================
// RETURN TO LOBBY
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const button =
            document.getElementById(
                "returnLobbyBtn"
            );


        if (!button) {
            return;
        }


        button.onclick =
            function () {

                if (
                    typeof stopCalling ===
                    "function"
                ) {

                    stopCalling();

                }


                if (
                    typeof showLobby ===
                    "function"
                ) {

                    showLobby();

                }

            };

    }
);


console.log(
    "WINNER JS LOADED"
);
