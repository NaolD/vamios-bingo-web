// ===============================
// VAMIOS BINGO GAME
// ===============================
// Selected player board
// Realtime synchronized calling
// Automatic call every 5 seconds
// ===============================

const CALL_INTERVAL = 5000;

let gameChannel = null;
let callTimer = null;

let calledNumbers = [];
let playerCard = [];


// ===============================
// BINGO LETTER
// ===============================

function bingoLetter(number) {

    number = Number(number);

    if (number <= 15) return "B";
    if (number <= 30) return "I";
    if (number <= 45) return "N";
    if (number <= 60) return "G";

    return "O";
}


// ===============================
// LOAD SELECTED BOARD
// ===============================

function loadSelectedBoard() {

    const container =
        document.getElementById("bingoCard");

    if (!container) {

        console.error(
            "BINGO CARD ELEMENT NOT FOUND"
        );

        return false;
    }

    container.innerHTML = "";

    playerCard = [];


    const savedBoard =
        localStorage.getItem(
            "selectedBoard"
        );

    if (!savedBoard) {

        console.error(
            "NO SELECTED BOARD FOUND"
        );

        return false;
    }


    let board;

    try {

        board =
            JSON.parse(savedBoard);

    } catch (error) {

        console.error(
            "INVALID SELECTED BOARD:",
            error
        );

        return false;
    }


    if (
        !Array.isArray(board) ||
        board.length !== 5
    ) {

        console.error(
            "INVALID BOARD FORMAT:",
            board
        );

        return false;
    }


    // ===============================
    // DRAW PLAYER BOARD
    // ===============================

    board.forEach(
        (row, rowIndex) => {

            row.forEach(
                (value, colIndex) => {

                    const cell =
                        document.createElement(
                            "div"
                        );

                    cell.className =
                        "bingo-cell";


                    if (
                        rowIndex === 2 &&
                        colIndex === 2
                    ) {

                        cell.textContent =
                            "FREE";

                        cell.classList.add(
                            "marked"
                        );

                        playerCard.push(
                            "FREE"
                        );

                    } else {

                        const number =
                            Number(value);

                        cell.textContent =
                            number;

                        cell.dataset.number =
                            number;

                        playerCard.push(
                            number
                        );

                    }


                    container.appendChild(
                        cell
                    );

                }
            );

        }
    );


    console.log(
        "PLAYER BOARD LOADED:",
        playerCard
    );


    return true;
}


// ===============================
// SHOW CURRENT NUMBER
// ===============================

function showCurrentNumber(number) {

    const element =
        document.getElementById(
            "calledNumber"
        );

    if (!element) {

        console.error(
            "CALLED NUMBER ELEMENT NOT FOUND"
        );

        return;
    }


    element.textContent =
        `${bingoLetter(number)} ${number}`;
}


// ===============================
// UPDATE CALLED NUMBERS
// ===============================

function updateCalledNumbers(numbers) {

    calledNumbers =
        Array.isArray(numbers)
            ? numbers
            : [];


    // ===============================
    // MARK PLAYER BOARD
    // ===============================

    calledNumbers.forEach(
        number => {

            const cell =
                document.querySelector(
                    `[data-number="${number}"]`
                );

            if (cell) {

                cell.classList.add(
                    "marked"
                );

            }

        }
    );


    // ===============================
    // CALLED NUMBER HISTORY
    // ===============================

    const history =
        document.getElementById(
            "calledHistory"
        );

    if (!history) {
        return;
    }


    history.innerHTML = "";


    calledNumbers
        .slice()
        .reverse()
        .forEach(
            number => {

                const item =
                    document.createElement(
                        "span"
                    );

                item.className =
                    "called-item";

                item.textContent =
                    `${bingoLetter(number)} ${number}`;

                history.appendChild(
                    item
                );

            }
        );
}


// ===============================
// SUBSCRIBE TO GAME
// ===============================

async function subscribeGame(gameId) {

    if (gameChannel) {

        await supabase.removeChannel(
            gameChannel
        );

        gameChannel = null;
    }


    gameChannel =
        supabase
            .channel(
                `game-${gameId}`
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "games",
                    filter:
                        `id=eq.${gameId}`
                },
                payload => {

                    console.log(
                        "GAME UPDATE:",
                        payload.new
                    );


                    const game =
                        payload.new;


                    if (
                        game.current_number
                    ) {

                        showCurrentNumber(
                            game.current_number
                        );

                    }


                    updateCalledNumbers(
                        game.called_numbers
                    );

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "GAME CHANNEL STATUS:",
                        status
                    );

                }
            );
}


// ===============================
// START NUMBER CALLING
// ===============================

async function startCalling(gameId) {

    console.log(
        "STARTING NUMBER CALLER:",
        gameId
    );


    if (callTimer) {

        clearInterval(
            callTimer
        );

        callTimer = null;
    }


    // ===============================
    // LOAD CURRENT GAME
    // ===============================

    const {
        data: game,
        error
    } =
        await supabase
            .from("games")
            .select(
                "called_numbers,current_number,status"
            )
            .eq(
                "id",
                gameId
            )
            .single();


    if (error) {

        console.error(
            "GAME LOAD ERROR:",
            error
        );

        return;
    }


    let called =
        Array.isArray(
            game?.called_numbers
        )
            ? game.called_numbers
            : [];


    calledNumbers =
        called;


    updateCalledNumbers(
        called
    );


    // ===============================
    // CALL NEXT NUMBER
    // ===============================

    async function callNext() {

        if (
            called.length >= 75
        ) {

            console.log(
                "ALL 75 NUMBERS CALLED"
            );

            clearInterval(
                callTimer
            );

            callTimer = null;

            return;
        }


        const available = [];


        for (
            let number = 1;
            number <= 75;
            number++
        ) {

            if (
                !called.includes(number)
            ) {

                available.push(
                    number
                );

            }

        }


        if (
            available.length === 0
        ) {

            return;
        }


        const next =
            available[
                Math.floor(
                    Math.random() *
                    available.length
                )
            ];


        called = [
            ...called,
            next
        ];


        console.log(
            "CALLING:",
            bingoLetter(next),
            next
        );


        const {
            error: updateError
        } =
            await supabase
                .from("games")
                .update({

                    current_number:
                        next,

                    called_numbers:
                        called,

                    status:
                        "playing"

                })
                .eq(
                    "id",
                    gameId
                );


        if (updateError) {

            console.error(
                "NUMBER UPDATE ERROR:",
                updateError
            );

            return;
        }


        // Update this screen immediately
        showCurrentNumber(
            next
        );

        updateCalledNumbers(
            called
        );

    }


    // ===============================
    // FIRST CALL
    // ===============================

    await callNext();


    // ===============================
    // EVERY 5 SECONDS
    // ===============================

    callTimer =
        setInterval(
            callNext,
            CALL_INTERVAL
        );

}


// ===============================
// INITIALIZE GAME
// ===============================

async function initializeGame() {

    console.log(
        "INITIALIZING GAME"
    );


    const gameId =
        localStorage.getItem(
            "gameId"
        );


    if (!gameId) {

        console.error(
            "NO GAME ID FOUND"
        );

        return;
    }


    console.log(
        "GAME ID:",
        gameId
    );


    // ===============================
    // LOAD SELECTED BOARD
    // ===============================

    const boardLoaded =
        loadSelectedBoard();


    if (!boardLoaded) {

        console.error(
            "PLAYER BOARD COULD NOT BE LOADED"
        );

        return;
    }


    // ===============================
    // REALTIME GAME
    // ===============================

    await subscribeGame(
        gameId
    );


    // ===============================
    // START CALLER
    // ===============================

    const isHost =
        localStorage.getItem(
            "isHost"
        ) === "true";


    console.log(
        "IS HOST:",
        isHost
    );


    if (isHost) {

        await startCalling(
            gameId
        );

    }

}


// ===============================
// BINGO BUTTON
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const bingoBtn =
            document.getElementById(
                "bingoBtn"
            );


        if (bingoBtn) {

            bingoBtn.onclick =
                () => {

                    if (
                        typeof checkWinner ===
                        "function"
                    ) {

                        checkWinner();

                    } else {

                        console.error(
                            "checkWinner() NOT FOUND"
                        );

                    }

                };

        }

    }
);


console.log(
    "GAME JS LOADED"
);
