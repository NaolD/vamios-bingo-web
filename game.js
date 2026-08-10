// ===============================
// VAMIOS BINGO
// GAME.JS
// ===============================

let currentGame = null;
let playerBoard = null;
let calledNumbers = [];

window.callTimer = null;
window.gameStopped = false;


// ===============================
// START GAME
// ===============================

async function startBingoGame() {

    const gameId =
        Number(
            localStorage.getItem(
                "game_id"
            )
        );

    const boardId =
        Number(
            localStorage.getItem(
                "selected_board_id"
            )
        );


    if (!gameId || !boardId) {

        alert(
            "Missing game or board."
        );

        return;
    }


    window.gameStopped = false;


    // ==========================================
    // LOAD GAME
    // ==========================================

    const {
        data: game,
        error: gameError
    } = await supabaseClient
        .from("games")
        .select("*")
        .eq(
            "id",
            gameId
        )
        .single();


    if (gameError) {

        console.error(
            "Game loading error:",
            gameError
        );

        alert(
            gameError.message
        );

        return;
    }


    currentGame =
        game;


    calledNumbers =
        Array.isArray(
            game.called_numbers
        )
            ? game.called_numbers
            : [];


    // ==========================================
    // LOAD PLAYER BOARD
    // ==========================================

    const {
        data: board,
        error: boardError
    } = await supabaseClient
        .from("boards")
        .select("*")
        .eq(
            "id",
            boardId
        )
        .single();


    if (boardError) {

        console.error(
            "Board loading error:",
            boardError
        );

        alert(
            boardError.message
        );

        return;
    }


    playerBoard =
        board.card_data;


    renderCard();
    renderHistory();


    // ==========================================
    // SHOW CURRENT LAST NUMBER
    // ==========================================

    if (
        calledNumbers.length > 0
    ) {

        showCalledNumber(
            calledNumbers[
                calledNumbers.length - 1
            ]
        );
    }


    // ==========================================
    // START SHARED CALLING
    // ==========================================

    startCalling();
}


// ===============================
// RENDER BINGO CARD
// ===============================

function renderCard() {

    const cardElement =
        document.getElementById(
            "bingoCard"
        );


    if (!cardElement) {

        console.log(
            "bingoCard not found"
        );

        return;
    }


    const letters = [
        "B",
        "I",
        "N",
        "G",
        "O"
    ];


    let html = "";


    // ==========================================
    // HEADERS
    // ==========================================

    letters.forEach(
        (letter) => {

            html += `
                <div class="header">
                    ${letter}
                </div>
            `;
        }
    );


    // ==========================================
    // CELLS
    // ==========================================

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

            const letter =
                letters[col];


            let value =
                "";


            if (
                playerBoard &&
                Array.isArray(
                    playerBoard[letter]
                )
            ) {

                value =
                    playerBoard[
                        letter
                    ][row];
            }


            const isFree =
                row === 2 &&
                col === 2;


            const isCalled =
                isFree ||
                calledNumbers.includes(
                    Number(value)
                );


            html += `
                <div
                    class="cell ${
                        isCalled
                            ? "marked"
                            : ""
                    }"
                    data-number="${value}"
                >
                    ${
                        isFree
                            ? "FREE"
                            : value
                    }
                </div>
            `;
        }
    }


    cardElement.innerHTML =
        html;


    // ==========================================
    // PLAYER MARKING
    // ==========================================

    cardElement
        .querySelectorAll(
            ".cell"
        )
        .forEach(
            (cell) => {

                cell.onclick =
                    () => {

                        const value =
                            cell.dataset.number;


                        if (
                            value ===
                            "FREE"
                        ) {

                            cell.classList.add(
                                "marked"
                            );

                            return;
                        }


                        const number =
                            Number(
                                value
                            );


                        if (
                            calledNumbers.includes(
                                number
                            )
                        ) {

                            cell.classList.add(
                                "marked"
                            );
                        }
                    };
            }
        );
}


// ===============================
// START CALLING
// ===============================

function startCalling() {

    if (
        window.callTimer
    ) {

        clearInterval(
            window.callTimer
        );
    }


    // ==========================================
    // IMPORTANT:
    // Only one browser should act as caller.
    //
    // We use the first player in game_players
    // as the temporary caller.
    // ==========================================

    startSharedCalling();


    // ==========================================
    // Refresh game state for everyone
    // ==========================================

    window.callTimer =
        setInterval(
            refreshGame,
            1000
        );
}


// ===============================
// SHARED CALLING
// ===============================

async function startSharedCalling() {

    if (
        !currentGame
    ) {

        return;
    }


    const {
        data: players,
        error
    } = await supabaseClient
        .from("game_players")
        .select(
            "user_id"
        )
        .eq(
            "game_id",
            currentGame.id
        )
        .order(
            "id"
        );


    if (error) {

        console.error(
            "Player loading error:",
            error
        );

        return;
    }


    if (
        !players ||
        players.length === 0
    ) {

        return;
    }


    const currentUser =
        await getCurrentUser();


    if (!currentUser) {

        return;
    }


    const callerUserId =
        players[0].user_id;


    // Only the first player calls numbers.
    if (
        Number(
            currentUser.id
        ) !==
        Number(
            callerUserId
        )
    ) {

        return;
    }


    // Call immediately if there are no numbers.
    if (
        calledNumbers.length === 0
    ) {

        await callNumber();
    }


    // Then call every 7 seconds.
    if (
        window.realCallTimer
    ) {

        clearInterval(
            window.realCallTimer
        );
    }


    window.realCallTimer =
        setInterval(
            callNumber,
            7000
        );
}


// ===============================
// REFRESH GAME
// ===============================

async function refreshGame() {

    if (
        !currentGame ||
        window.gameStopped
    ) {

        return;
    }


    const {
        data: game,
        error
    } = await supabaseClient
        .from("games")
        .select(
            "called_numbers,status"
        )
        .eq(
            "id",
            currentGame.id
        )
        .single();


    if (error) {

        console.error(
            "Game refresh error:",
            error
        );

        return;
    }


    if (!game) {

        return;
    }


    const latestNumbers =
        Array.isArray(
            game.called_numbers
        )
            ? game.called_numbers
            : [];


    // ==========================================
    // Detect a new called number
    // ==========================================

    if (
        latestNumbers.length >
        calledNumbers.length
    ) {

        const newNumber =
            latestNumbers[
                latestNumbers.length - 1
            ];


        calledNumbers =
            latestNumbers;


        currentGame.status =
            game.status;


        showCalledNumber(
            newNumber
        );

        renderHistory();
        renderCard();
    }


    // ==========================================
    // Stop game
    // ==========================================

    if (
        game.status ===
        "finished"
    ) {

        stopBingoGame();
    }
}


// ===============================
// CALL NUMBER
// ===============================

async function callNumber() {

    if (
        window.gameStopped ||
        !currentGame
    ) {

        return;
    }


    // Reload latest game state first.
    const {
        data: latestGame,
        error: loadError
    } = await supabaseClient
        .from("games")
        .select(
            "called_numbers,status"
        )
        .eq(
            "id",
            currentGame.id
        )
        .single();


    if (loadError) {

        console.error(
            "Call loading error:",
            loadError
        );

        return;
    }


    if (
        latestGame.status !==
            "playing"
    ) {

        return;
    }


    const latestCalled =
        Array.isArray(
            latestGame.called_numbers
        )
            ? latestGame.called_numbers
            : [];


    if (
        latestCalled.length >=
        75
    ) {

        stopBingoGame();

        return;
    }


    // ==========================================
    // CREATE RANDOM NUMBER
    // ==========================================

    let number;


    do {

        number =
            Math.floor(
                Math.random() * 75
            ) + 1;

    } while (
        latestCalled.includes(
            number
        )
    );


    const newCalledNumbers =
        [
            ...latestCalled,
            number
        ];


    // ==========================================
    // SAVE TO SUPABASE
    // ==========================================

    const {
        error: updateError
    } = await supabaseClient
        .from("games")
        .update({
            called_numbers:
                newCalledNumbers
        })
        .eq(
            "id",
            currentGame.id
        )
        .eq(
            "status",
            "playing"
        );


    if (updateError) {

        console.error(
            "Call number update error:",
            updateError
        );

        return;
    }


    // ==========================================
    // UPDATE LOCAL SCREEN
    // ==========================================

    calledNumbers =
        newCalledNumbers;


    showCalledNumber(
        number
    );

    renderHistory();
    renderCard();
}


// ===============================
// DISPLAY CALLED NUMBER
// ===============================

function showCalledNumber(
    number
) {

    let letter;


    if (
        number >= 1 &&
        number <= 15
    ) {

        letter =
            "B";

    } else if (
        number >= 16 &&
        number <= 30
    ) {

        letter =
            "I";

    } else if (
        number >= 31 &&
        number <= 45
    ) {

        letter =
            "N";

    } else if (
        number >= 46 &&
        number <= 60
    ) {

        letter =
            "G";

    } else {

        letter =
            "O";
    }


    const display =
        document.getElementById(
            "calledNumber"
        );


    if (display) {

        display.innerText =
            `${letter} ${number}`;
    }
}


// ===============================
// HISTORY
// ===============================

function renderHistory() {

    const history =
        document.getElementById(
            "calledHistory"
        );


    if (!history) {

        return;
    }


    history.innerHTML =
        "";


    calledNumbers.forEach(
        (number) => {

            let letter;


            if (
                number <= 15
            ) {

                letter =
                    "B";

            } else if (
                number <= 30
            ) {

                letter =
                    "I";

            } else if (
                number <= 45
            ) {

                letter =
                    "N";

            } else if (
                number <= 60
            ) {

                letter =
                    "G";

            } else {

                letter =
                    "O";
            }


            const item =
                document.createElement(
                    "div"
                );


            item.innerText =
                `${letter} ${number}`;


            history.appendChild(
                item
            );
        }
    );
}


// ===============================
// STOP GAME
// ===============================

function stopBingoGame() {

    window.gameStopped =
        true;


    if (
        window.callTimer
    ) {

        clearInterval(
            window.callTimer
        );

        window.callTimer =
            null;
    }


    if (
        window.realCallTimer
    ) {

        clearInterval(
            window.realCallTimer
        );

        window.realCallTimer =
            null;
    }
}


// ===============================
// CLEANUP
// ===============================

window.addEventListener(
    "beforeunload",
    () => {

        stopBingoGame();

    }
);