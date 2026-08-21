// ==========================================
// VAMIOS BINGO WINNER SYSTEM
// ==========================================
// Checks Bingo patterns
// Saves winner to Supabase
// Stops number calling
// Displays winner information and board
// ==========================================


// ==========================================
// CHECK IF VALUE IS MARKED
// ==========================================

function isMarked(value) {

    if (value === "FREE") {
        return true;
    }

    const number = Number(value);

    return calledNumbers.some(
        n => Number(n) === number
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

    for (let col = 0; col < 5; col++) {

        let complete = true;

        for (let row = 0; row < 5; row++) {

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

    for (let i = 0; i < 5; i++) {

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

    for (let i = 0; i < 5; i++) {

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
// GET WINNING BOARD NUMBER
// ==========================================

function getBoardNumber() {

    const boardNumber =
        localStorage.getItem(
            "selectedBoardNumber"
        );

    if (boardNumber) {
        return boardNumber;
    }

    return "?";
}


// ==========================================
// CALCULATE PRIZE
// ==========================================

async function calculatePrize() {

    const roomId =
        localStorage.getItem(
            "roomId"
        );

    if (!roomId) {
        return 0;
    }


    const {
        data: room,
        error: roomError
    } =
        await supabase
            .from("rooms")
            .select("entry_fee")
            .eq("id", roomId)
            .single();


    if (roomError) {

        console.error(
            "PRIZE ROOM ERROR:",
            roomError
        );

        return 0;
    }


    const gameId =
        localStorage.getItem(
            "gameId"
        );

    if (!gameId) {
        return 0;
    }


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
            "PRIZE PLAYER ERROR:",
            playersError
        );

        return 0;
    }


    const playerCount =
        players?.length || 0;


    const entryFee =
        Number(room.entry_fee) || 0;


    // 80% goes to winner
    const prize =
        playerCount *
        entryFee *
        0.80;


    return prize;
}


// ==========================================
// DISPLAY WINNER BOARD
// ==========================================

function showWinnerBoard() {

    const winnerCard =
        document.querySelector(
            ".winner-card"
        );

    if (!winnerCard) {

        console.error(
            "WINNER CARD NOT FOUND"
        );

        return;
    }


    // Remove old board if it exists

    const oldBoard =
        document.getElementById(
            "winnerBoard"
        );

    if (oldBoard) {
        oldBoard.remove();
    }


    const savedBoard =
        localStorage.getItem(
            "selectedBoard"
        );


    if (!savedBoard) {

        console.error(
            "WINNER BOARD NOT FOUND"
        );

        return;
    }


    let board;

    try {

        board =
            JSON.parse(
                savedBoard
            );

    } catch (error) {

        console.error(
            "WINNER BOARD JSON ERROR:",
            error
        );

        return;
    }


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


    // ======================================
    // BOARD CONTAINER
    // ======================================

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.id =
        "winnerBoard";

    wrapper.style.marginTop =
        "20px";


    // ======================================
    // BINGO HEADER
    // ======================================

    const header =
        document.createElement(
            "div"
        );

    header.style.display =
        "grid";

    header.style.gridTemplateColumns =
        "repeat(5, 1fr)";

    header.style.gap =
        "4px";

    header.style.maxWidth =
        "320px";

    header.style.margin =
        "0 auto 5px";


    [
        "B",
        "I",
        "N",
        "G",
        "O"
    ].forEach(letter => {

        const cell =
            document.createElement(
                "div"
            );

        cell.textContent =
            letter;

        cell.style.textAlign =
            "center";

        cell.style.fontWeight =
            "bold";

        cell.style.padding =
            "6px";

        header.appendChild(
            cell
        );

    });


    wrapper.appendChild(
        header
    );


    // ======================================
    // BOARD GRID
    // ======================================

    const grid =
        document.createElement(
            "div"
        );

    grid.style.display =
        "grid";

    grid.style.gridTemplateColumns =
        "repeat(5, 1fr)";

    grid.style.gap =
        "4px";

    grid.style.maxWidth =
        "320px";

    grid.style.margin =
        "0 auto";


    // ======================================
    // CREATE BOARD CELLS
    // ======================================

    for (
        let row = 0;
        row < 5;
        row++
    ) {

        for (
            let col = 0;
            col < 5;
            col++
        ) {

            const value =
                board[row][col];


            const cell =
                document.createElement(
                    "div"
                );


            const isFree =
                row === 2 &&
                col === 2;


            const number =
                Number(value);


            const marked =
                isFree ||
                (
                    calledNumbers &&
                    calledNumbers.some(
                        n =>
                            Number(n) ===
                            number
                    )
                );


            cell.textContent =
                isFree
                    ? "FREE"
                    : number;


            cell.style.border =
                "1px solid #ccc";

            cell.style.borderRadius =
                "6px";

            cell.style.padding =
                "10px 4px";

            cell.style.textAlign =
                "center";

            cell.style.fontWeight =
                "bold";

            cell.style.minHeight =
                "20px";


            if (marked) {

                cell.style.background =
                    "#22c55e";

                cell.style.color =
                    "white";

            } else {

                cell.style.background =
                    "#f1f5f9";

                cell.style.color =
                    "#111827";

            }


            grid.appendChild(
                cell
            );

        }

    }


    wrapper.appendChild(
        grid
    );


    // ======================================
    // INSERT AFTER WINNER MESSAGE
    // ======================================

    const prizeElement =
        document.getElementById(
            "winnerPrize"
        );


    if (
        prizeElement &&
        prizeElement.parentNode
    ) {

        prizeElement.parentNode.insertBefore(
            wrapper,
            prizeElement.nextSibling
        );

    } else {

        winnerCard.appendChild(
            wrapper
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

    // ======================================
    // STOP CALLING
    // ======================================

    if (
        typeof stopCalling ===
        "function"
    ) {

        stopCalling();

        console.log(
            "NUMBER CALLING STOPPED - WINNER"
        );

    }


    // ======================================
    // BOARD NUMBER
    // ======================================

    const boardNumber =
        getBoardNumber();


    // ======================================
    // WINNER MESSAGE
    // ======================================

    const message =
        document.getElementById(
            "winnerMessage"
        );


    if (message) {

        message.textContent =
            `Board #${boardNumber} wins with ${pattern}!`;

    }


    // ======================================
    // PRIZE
    // ======================================

    const prizeElement =
        document.getElementById(
            "winnerPrize"
        );


    if (prizeElement) {

        prizeElement.textContent =
            `${Number(prize).toFixed(2)} ETB`;

    }


    // ======================================
    // SHOW WINNER BOARD
    // ======================================

    showWinnerBoard();


    // ======================================
    // SHOW WINNER SCREEN
    // ======================================

    if (
        typeof showWinnerScreen ===
        "function"
    ) {

        showWinnerScreen();

    } else {

        const gameScreen =
            document.getElementById(
                "gameScreen"
            );

        const winnerScreen =
            document.getElementById(
                "winnerScreen"
            );


        if (gameScreen) {

            gameScreen.classList.add(
                "hidden"
            );

        }


        if (winnerScreen) {

            winnerScreen.classList.remove(
                "hidden"
            );

        }

    }


    console.log(
        "WINNER DISPLAYED:",
        {
            boardNumber,
            pattern,
            prize
        }
    );

}


// ==========================================
// SAVE WINNER TO SUPABASE
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


    let currentUser = null;

if (typeof getCurrentUser === "function") {

    currentUser =
        await getCurrentUser();

}

const userId =
    currentUser?.id || null;

    if (!gameId) {

        alert(
            "Game ID is missing."
        );

        return;

    }


    if (!userId) {

        alert(
            "User information is missing."
        );

        console.error(
            "USER ID MISSING"
        );

        return;

    }


    // ======================================
    // CHECK EXISTING WINNER
    // ======================================

    const {
        data: existingGame,
        error: existingError
    } =
        await supabase
            .from("games")
            .select(
                "winner_user_id,status"
            )
            .eq(
                "id",
                gameId
            )
            .single();


    if (existingError) {

        console.error(
            "WINNER CHECK ERROR:",
            existingError
        );

        alert(
            "Could not check winner."
        );

        return;

    }


    if (
        existingGame &&
        existingGame.winner_user_id
    ) {

        // Stop caller even if another player
        // already won.

        if (
            typeof stopCalling ===
            "function"
        ) {

            stopCalling();

        }


        alert(
            "Winner already declared."
        );

        return;

    }


    // ======================================
    // CALCULATE PRIZE
    // ======================================

    let prize =
        await calculatePrize();


    // ======================================
    // DECLARE WINNER
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
                    Number(userId),

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
            );


    if (updateError) {

        console.error(
            "WINNER SAVE ERROR:",
            updateError
        );


        alert(
            "Could not declare winner:\n\n" +
            updateError.message
        );

        return;

    }


    // ======================================
    // STOP CALLER
    // ======================================

    if (
        typeof stopCalling ===
        "function"
    ) {

        stopCalling();

    }


    // ======================================
    // DISPLAY WINNER
    // ======================================

    showWinner(
        pattern,
        prize
    );


    console.log(
        "WINNER DECLARED:",
        {
            userId,
            pattern,
            prize
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


    // ======================================
    // MAKE SURE GAME IS ACTIVE
    // ======================================

    const gameId =
        localStorage.getItem(
            "gameId"
        );


    if (!gameId) {

        alert(
            "Game information is missing."
        );

        return;

    }


    // ======================================
    // CHECK PATTERNS
    // ======================================

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


    // ======================================
    // NO BINGO
    // ======================================

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


    // ======================================
    // SAVE WINNER
    // ======================================

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

                // Stop caller

                if (
                    typeof stopCalling ===
                    "function"
                ) {

                    stopCalling();

                }


                // Remove game state

                localStorage.removeItem(
                    "gameId"
                );

                localStorage.removeItem(
                    "roomId"
                );

                localStorage.removeItem(
                    "selectedBoard"
                );

                localStorage.removeItem(
                    "selectedBoardNumber"
                );

                localStorage.removeItem(
                    "isHost"
                );


                window.vamiosGameStarted =
                    false;


                // Return lobby

                if (
                    typeof showLobby ===
                    "function"
                ) {

                    showLobby();

                } else {

                    location.reload();

                }

            };

    }
);


// ==========================================
// WINNER JS LOADED
// ==========================================

console.log(
    "WINNER JS LOADED"
);

// ==========================================
// WINNER SYNCHRONIZATION
// ==========================================

let winnerSyncTimer = null;
let winnerSyncShowing = false;

function startWinnerSynchronization() {

    if (winnerSyncTimer) {

        clearInterval(
            winnerSyncTimer
        );

    }


    winnerSyncTimer =
        setInterval(
            async function () {

                const gameId =
                    localStorage.getItem(
                        "gameId"
                    );


                if (!gameId) {
                    return;
                }


                if (winnerSyncShowing) {
                    return;
                }


                // ==================================
                // CHECK GAME
                // ==================================

                const {
                    data: game,
                    error
                } =
                    await supabase
                        .from("games")
                        .select(
                            "status,winner_user_id"
                        )
                        .eq(
                            "id",
                            gameId
                        )
                        .single();


                if (error) {

                    console.error(
                        "WINNER SYNC ERROR:",
                        error
                    );

                    return;

                }


                // ==================================
                // NO WINNER YET
                // ==================================

                if (
                    !game ||
                    (
                        game.status !==
                            "finished" &&
                        !game.winner_user_id
                    )
                ) {

                    return;

                }


                // ==================================
                // WINNER FOUND
                // ==================================

                winnerSyncShowing =
                    true;


                console.log(
                    "WINNER DETECTED:",
                    game.winner_user_id
                );


                // ==================================
                // STOP NUMBER CALLING
                // ==================================

                if (
                    typeof stopCalling ===
                    "function"
                ) {

                    stopCalling();

                }


                // ==================================
                // GET WINNER BOARD
                // ==================================

                const {
                    data: winnerPlayer,
                    error: winnerError
                } =
                    await supabase
                        .from("game_players")
                        .select(
                            "board_number,board"
                        )
                        .eq(
                            "game_id",
                            gameId
                        )
                        .eq(
                            "user_id",
                            game.winner_user_id
                        )
                        .single();


                if (winnerError) {

                    console.error(
                        "WINNER BOARD LOAD ERROR:",
                        winnerError
                    );

                    return;

                }


                if (
                    !winnerPlayer ||
                    !winnerPlayer.board
                ) {

                    console.error(
                        "WINNER BOARD NOT FOUND"
                    );

                    return;

                }


                // ==================================
                // SAVE WINNER BOARD LOCALLY
                // ==================================

                localStorage.setItem(
                    "selectedBoard",
                    typeof winnerPlayer.board ===
                        "string"
                        ? winnerPlayer.board
                        : JSON.stringify(
                            winnerPlayer.board
                        )
                );


                localStorage.setItem(
                    "selectedBoardNumber",
                    String(
                        winnerPlayer.board_number
                    )
                );


                // ==================================
                // SHOW WINNER BOARD
                // ==================================

                showWinnerBoard();


                // ==================================
                // SHOW WINNER SCREEN
                // ==================================

                if (
                    typeof showWinnerScreen ===
                    "function"
                ) {

                    showWinnerScreen();

                } else {

                    const gameScreen =
                        document.getElementById(
                            "gameScreen"
                        );

                    const winnerScreen =
                        document.getElementById(
                            "winnerScreen"
                        );


                    if (gameScreen) {

                        gameScreen.classList.add(
                            "hidden"
                        );

                    }


                    if (winnerScreen) {

                        winnerScreen.classList.remove(
                            "hidden"
                        );

                    }

                }


                console.log(
                    "WINNER SCREEN SYNCHRONIZED"
                );


                clearInterval(
                    winnerSyncTimer
                );

                winnerSyncTimer =
                    null;

            },
            1000
        );


    console.log(
        "WINNER SYNCHRONIZATION STARTED"
    );

}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        startWinnerSynchronization();

    }
);
