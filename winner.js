// ==========================================
// VAMIOS BINGO WINNER SYSTEM
// ==========================================


// ==========================================
// CHECK MARKED NUMBER
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

    for (
        let row = 0;
        row < 5;
        row++
    ) {

        let complete = true;

        for (
            let col = 0;
            col < 5;
            col++
        ) {

            const value =
                playerCard[
                    row * 5 + col
                ];

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

    for (
        let col = 0;
        col < 5;
        col++
    ) {

        let complete = true;

        for (
            let row = 0;
            row < 5;
            row++
        ) {

            const value =
                playerCard[
                    row * 5 + col
                ];

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

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const value =
            playerCard[
                i * 5 + i
            ];

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

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const value =
            playerCard[
                i * 5 + (4 - i)
            ];

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

    return corners.every(
        value => isMarked(value)
    );

}


// ==========================================
// SHOW WINNER
// ==========================================

function showWinner(
    pattern,
    prize
) {

    console.log(
        "SHOW WINNER:",
        pattern,
        prize
    );


    const winnerBox =
        document.getElementById(
            "winnerBox"
        );


    if (!winnerBox) {

        console.error(
            "WINNER BOX NOT FOUND"
        );

        return;

    }


    winnerBox.classList.remove(
        "hidden"
    );


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
            "Prize: " +
            Number(prize).toFixed(2) +
            " ETB";

    }


    if (
        typeof showWinnerScreen ===
        "function"
    ) {

        showWinnerScreen();

    }

}


// ==========================================
// SAVE WINNER
// ==========================================

async function saveWinner(
    pattern
) {

    console.log(
        "SAVING WINNER:",
        pattern
    );


    const gameId =
        localStorage.getItem(
            "gameId"
        );


    const roomId =
        localStorage.getItem(
            "roomId"
        );


    let userId =
        localStorage.getItem(
            "userId"
        );


    // ======================================
    // GET USER ID IF NOT IN LOCAL STORAGE
    // ======================================

    if (!userId) {

        if (
            typeof getCurrentUserId ===
            "function"
        ) {

            userId =
                getCurrentUserId();

        }

    }


    if (
        !gameId ||
        !roomId ||
        !userId
    ) {

        console.error(
            "WINNER INFORMATION IS MISSING:",
            {
                gameId,
                roomId,
                userId
            }
        );

        alert(
            "Winner information is missing."
        );

        return;

    }


    // ======================================
    // CHECK CURRENT GAME
    // ======================================

    const {
        data: game,
        error: gameError
    } =
        await supabase
            .from("games")
            .select(
                "id,status,winner_user_id"
            )
            .eq(
                "id",
                gameId
            )
            .single();


    if (gameError) {

        console.error(
            "GAME LOAD ERROR:",
            gameError
        );

        alert(
            "Could not load game."
        );

        return;

    }


    // ======================================
    // CHECK EXISTING WINNER
    // ======================================

    if (game.winner_user_id) {

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


    if (roomError) {

        console.error(
            "ROOM LOAD ERROR:",
            roomError
        );

        alert(
            "Could not load room."
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
            .select("id")
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
            "Could not load players."
        );

        return;

    }


    const totalPlayers =
        players
            ? players.length
            : 0;


    // ======================================
    // CALCULATE PRIZE
    // ======================================

    const prize =
        totalPlayers *
        Number(room.entry_fee) *
        0.80;


    console.log(
        "PRIZE:",
        prize
    );


    // ======================================
    // SAVE WINNER
    // ======================================

    const {
        error: updateError
    } =
        await supabase
            .from("games")
            .update({

                status:
                    "finished",

                winner_user_id:
                    Number(userId)

            })
            .eq(
                "id",
                gameId
            );


    if (updateError) {

        console.error(
            "WINNER SAVE ERROR:",
            updateError
        );

        alert(
            "Could not save winner:\n\n" +
            updateError.message
        );

        return;

    }

// Stop number calling immediately
if (
    typeof stopCalling === "function"
) {

    stopCalling();

    console.log(
        "CALLING STOPPED - WINNER DECLARED"
    );

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


    // ======================================
    // MAKE SURE BOARD EXISTS
    // ======================================

    if (
        !Array.isArray(playerCard) ||
        playerCard.length !== 25
    ) {

        console.error(
            "PLAYER CARD NOT READY:",
            playerCard
        );

        alert(
            "Your Bingo board is not ready."
        );

        return;

    }


    // ======================================
    // CHECK HORIZONTAL
    // ======================================

    if (checkHorizontal()) {

        await saveWinner(
            "Horizontal"
        );

        return;

    }


    // ======================================
    // CHECK VERTICAL
    // ======================================

    if (checkVertical()) {

        await saveWinner(
            "Vertical"
        );

        return;

    }


    // ======================================
    // CHECK DIAGONAL
    // ======================================

    if (checkDiagonal()) {

        await saveWinner(
            "Diagonal"
        );

        return;

    }


    // ======================================
    // CHECK REVERSE DIAGONAL
    // ======================================

    if (checkReverseDiagonal()) {

        await saveWinner(
            "Reverse Diagonal"
        );

        return;

    }


    // ======================================
    // CHECK FOUR CORNERS
    // ======================================

    if (checkFourCorners()) {

        await saveWinner(
            "Four Corners"
        );

        return;

    }


    // ======================================
    // NO BINGO
    // ======================================

    alert(
        "No Bingo yet!"
    );

}


console.log(
    "WINNER JS LOADED"
);
