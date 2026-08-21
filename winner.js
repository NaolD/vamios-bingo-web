```javascript
// ==========================================
// VAMIOS BINGO WINNER SYSTEM
// ==========================================


// ==========================================
// CHECK IF A VALUE IS MARKED
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

        let ok = true;

        for (let col = 0; col < 5; col++) {

            const value =
                playerCard[row * 5 + col];

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


// ==========================================
// VERTICAL
// ==========================================

function checkVertical() {

    for (let col = 0; col < 5; col++) {

        let ok = true;

        for (let row = 0; row < 5; row++) {

            const value =
                playerCard[row * 5 + col];

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

    return corners.every(
        value => isMarked(value)
    );
}


// ==========================================
// GET WINNING CELLS
// ==========================================

function getWinningCells(pattern) {

    const cells = [];

    if (pattern === "Horizontal") {

        for (let row = 0; row < 5; row++) {

            let ok = true;

            for (let col = 0; col < 5; col++) {

                if (
                    !isMarked(
                        playerCard[row * 5 + col]
                    )
                ) {
                    ok = false;
                    break;
                }
            }

            if (ok) {

                for (let col = 0; col < 5; col++) {

                    cells.push(
                        row * 5 + col
                    );

                }

                return cells;
            }
        }
    }


    if (pattern === "Vertical") {

        for (let col = 0; col < 5; col++) {

            let ok = true;

            for (let row = 0; row < 5; row++) {

                if (
                    !isMarked(
                        playerCard[row * 5 + col]
                    )
                ) {
                    ok = false;
                    break;
                }
            }

            if (ok) {

                for (let row = 0; row < 5; row++) {

                    cells.push(
                        row * 5 + col
                    );

                }

                return cells;
            }
        }
    }


    if (pattern === "Diagonal") {

        for (let i = 0; i < 5; i++) {

            cells.push(
                i * 5 + i
            );

        }

        return cells;
    }


    if (pattern === "Reverse Diagonal") {

        for (let i = 0; i < 5; i++) {

            cells.push(
                i * 5 + (4 - i)
            );

        }

        return cells;
    }


    if (pattern === "Four Corners") {

        return [
            0,
            4,
            20,
            24
        ];
    }


    return cells;
}


// ==========================================
// SHOW WINNER BOARD
// ==========================================

function showWinnerBoard(
    board,
    boardNumber,
    pattern
) {

    const container =
        document.getElementById(
            "winnerBoard"
        );

    if (!container) {

        console.error(
            "WINNER BOARD ELEMENT NOT FOUND"
        );

        return;
    }


    container.innerHTML = "";


    if (
        !Array.isArray(board) ||
        board.length !== 5
    ) {

        console.error(
            "INVALID WINNER BOARD:",
            board
        );

        return;
    }


    const winningCells =
        getWinningCells(pattern);


    for (let row = 0; row < 5; row++) {

        for (let col = 0; col < 5; col++) {

            const cell =
                document.createElement(
                    "div"
                );


            cell.className =
                "bingo-cell";


            const index =
                row * 5 + col;


            const value =
                board[row][col];


            if (
                row === 2 &&
                col === 2
            ) {

                cell.textContent =
                    "FREE";

                cell.classList.add(
                    "marked"
                );

            } else {

                cell.textContent =
                    value;

            }


            if (
                winningCells.includes(index)
            ) {

                cell.classList.add(
                    "winner-cell"
                );

            }


            container.appendChild(
                cell
            );

        }
    }


    const boardNumberElement =
        document.getElementById(
            "winnerBoardNumber"
        );


    if (boardNumberElement) {

        boardNumberElement.textContent =
            `Board #${boardNumber}`;

    }

}


// ==========================================
// SHOW WINNER INFORMATION
// ==========================================

function showWinner(
    pattern,
    prize,
    board,
    boardNumber
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
            `Prize: ${Number(prize).toFixed(2)} ETB`;

    }


    showWinnerBoard(
        board,
        boardNumber,
        pattern
    );


    box.classList.remove(
        "hidden"
    );


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

async function saveWinner(pattern) {

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


    if (!gameId || !roomId || !userId) {

        console.error(
            "WINNER INFORMATION MISSING:",
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
    // CHECK WHETHER WINNER ALREADY EXISTS
    // ======================================

    const {
        data: game,
        error: gameError
    } =
        await supabase
            .from("games")
            .select(
                "winner_user_id,prize_amount"
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
            gameError.message
        );

        return;
    }


    if (game?.winner_user_id) {

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
            "Unable to load room information."
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
                "id,user_id,board_number,board"
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
            playersError.message
        );

        return;
    }


    const totalPlayers =
        players?.length || 0;


    // ======================================
    // CALCULATE PRIZE
    // ======================================

    const prize =
        totalPlayers *
        Number(room.entry_fee) *
        0.80;


    // ======================================
    // FIND WINNER BOARD
    // ======================================

    const winnerPlayer =
        players?.find(
            player =>
                String(player.user_id) ===
                String(userId)
        );


    if (!winnerPlayer) {

        console.error(
            "WINNER PLAYER NOT FOUND"
        );

        alert(
            "Winner board could not be found."
        );

        return;
    }


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
                    userId,

                winner_pattern:
                    pattern,

                prize_amount:
                    prize,

                finished_at:
                    new Date().toISOString()

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
            updateError.message
        );

        return;
    }


    // ======================================
    // STOP CALLING
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
        prize,
        winnerPlayer.board,
        winnerPlayer.board_number
    );


    console.log(
        "WINNER DECLARED:",
        {
            userId,
            pattern,
            prize,
            boardNumber:
                winnerPlayer.board_number
        }
    );

}


// ==========================================
// MAIN BINGO CHECK
// ==========================================

async function checkWinner() {

    console.log(
        "CHECKING BINGO..."
    );


    let pattern = null;


    if (
        checkHorizontal()
    ) {

        pattern =
            "Horizontal";

    }

    else if (
        checkVertical()
    ) {

        pattern =
            "Vertical";

    }

    else if (
        checkDiagonal()
    ) {

        pattern =
            "Diagonal";

    }

    else if (
        checkReverseDiagonal()
    ) {

        pattern =
            "Reverse Diagonal";

    }

    else if (
        checkFourCorners()
    ) {

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


console.log(
    "WINNER JS LOADED"
);
```
