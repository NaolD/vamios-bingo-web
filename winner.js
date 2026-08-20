```javascript
// ===============================
// VAMIOS BINGO WINNER CHECK
// ===============================


// ===============================
// CHECK MARKED
// ===============================

function isMarked(value) {

    if (value === "FREE") {
        return true;
    }

    return calledNumbers.includes(
        Number(value)
    );

}


// ===============================
// HORIZONTAL
// ===============================

function checkHorizontal() {

    for (
        let row = 0;
        row < 5;
        row++
    ) {

        let ok = true;

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

                ok = false;
                break;

            }

        }

        if (ok) {
            return true;
        }

    }

    return false;

}


// ===============================
// VERTICAL
// ===============================

function checkVertical() {

    for (
        let col = 0;
        col < 5;
        col++
    ) {

        let ok = true;

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

                ok = false;
                break;

            }

        }

        if (ok) {
            return true;
        }

    }

    return false;

}


// ===============================
// MAIN DIAGONAL
// ===============================

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


// ===============================
// REVERSE DIAGONAL
// ===============================

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


// ===============================
// FOUR CORNERS
// ===============================

function checkFourCorners() {

    const corners = [

        playerCard[0],
        playerCard[4],
        playerCard[20],
        playerCard[24]

    ];

    return corners.every(
        isMarked
    );

}


// ===============================
// SHOW WINNER
// ===============================

function showWinner(
    pattern,
    prize
) {

    const box =
        document.getElementById(
            "winnerBox"
        );

    if (!box) {

        console.error(
            "WINNER BOX NOT FOUND"
        );

        return;

    }


    box.classList.remove(
        "hidden"
    );


    const patternElement =
        document.getElementById(
            "winnerPattern"
        );


    if (patternElement) {

        patternElement.textContent =
            `Winning Pattern: ${pattern}`;

    }


    const prizeElement =
        document.getElementById(
            "winnerPrize"
        );


    if (prizeElement) {

        prizeElement.textContent =
            `Prize: ${prize.toFixed(2)} ETB`;

    }


}


// ===============================
// SAVE WINNER
// ===============================

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
        getCurrentUserId();


    console.log(
        "SAVING WINNER:",
        {
            gameId,
            roomId,
            userId,
            pattern
        }
    );


    if (
        !gameId ||
        !roomId ||
        !userId
    ) {

        alert(
            "Winner error: player information is missing."
        );

        return;

    }


    // ===============================
    // LOAD GAME
    // ===============================

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
            "WINNER GAME LOAD ERROR:",
            gameError
        );

        alert(
            "WINNER ERROR:\n\n" +
            gameError.message
        );

        return;

    }


    // ===============================
    // CHECK IF ALREADY FINISHED
    // ===============================

    if (
        game.winner_user_id
    ) {

        alert(
            "A winner has already been declared."
        );

        return;

    }


    // ===============================
    // LOAD ROOM
    // ===============================

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
            "WINNER ERROR:\n\n" +
            roomError.message
        );

        return;

    }


    // ===============================
    // COUNT PLAYERS
    // ===============================

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
            "PLAYER COUNT ERROR:",
            playersError
        );

        alert(
            "WINNER ERROR:\n\n" +
            playersError.message
        );

        return;

    }


    const totalPlayers =
        players?.length || 0;


    // ===============================
    // PRIZE
    // ===============================

    const prize =
        totalPlayers *
        Number(room.entry_fee) *
        0.80;


    console.log(
        "WINNER PRIZE:",
        prize
    );


    // ===============================
    // FINISH GAME
    // ===============================

    const {
        data: updatedGame,
        error: updateError
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
            )
            .is(
                "winner_user_id",
                null
            )
            .select()
            .maybeSingle();


    if (updateError) {

        console.error(
            "WINNER UPDATE ERROR:",
            updateError
        );

        alert(
            "WINNER UPDATE ERROR:\n\n" +
            updateError.message
        );

        return;

    }


    // Another player may have won
    if (!updatedGame) {

        alert(
            "Another player has already won this game."
        );

        return;

    }


    // ===============================
    // STOP NUMBER CALLING
    // ===============================

    if (
        typeof stopCalling ===
        "function"
    ) {

        stopCalling();

    }


    // ===============================
    // SHOW WINNER
    // ===============================

    showWinner(
        pattern,
        prize
    );


    // ===============================
    // SHOW WINNER SCREEN
    // ===============================

    if (
        typeof showWinnerScreen ===
        "function"
    ) {

        showWinnerScreen();

    }


    console.log(
        "WINNER DECLARED:",
        userId,
        pattern,
        prize
    );

}


// ===============================
// MAIN BINGO CHECK
// ===============================

async function checkWinner() {

    console.log(
        "CHECKING BINGO..."
    );


    let pattern = null;


    // ===============================
    // HORIZONTAL
    // ===============================

    if (
        checkHorizontal()
    ) {

        pattern =
            "Horizontal";

    }


    // ===============================
    // VERTICAL
    // ===============================

    else if (
        checkVertical()
    ) {

        pattern =
            "Vertical";

    }


    // ===============================
    // DIAGONAL
    // ===============================

    else if (
        checkDiagonal()
    ) {

        pattern =
            "Diagonal";

    }


    // ===============================
    // REVERSE DIAGONAL
    // ===============================

    else if (
        checkReverseDiagonal()
    ) {

        pattern =
            "Reverse Diagonal";

    }


    // ===============================
    // FOUR CORNERS
    // ===============================

    else if (
        checkFourCorners()
    ) {

        pattern =
            "Four Corners";

    }


    // ===============================
    // NO BINGO
    // ===============================

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


console.log(
    "WINNER JS LOADED"
);
```
