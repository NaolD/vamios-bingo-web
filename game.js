// ==========================================
// VAMIOS BINGO GAME
// ==========================================
// Player board + automatic number calling
// Calls every 5 seconds
// ==========================================

const CALL_INTERVAL = 5000;

let gameChannel = null;
let callTimer = null;

let calledNumbers = [];
let playerCard = [];


// ==========================================
// BINGO LETTER
// ==========================================

function bingoLetter(number) {

    number = Number(number);

    if (number <= 15) return "B";
    if (number <= 30) return "I";
    if (number <= 45) return "N";
    if (number <= 60) return "G";

    return "O";
}


// ==========================================
// LOAD PLAYER BOARD
// ==========================================

function loadPlayerBoard() {

    const grid =
        document.getElementById(
            "gameGrid"
        );

    if (!grid) {

        console.error(
            "GAME GRID NOT FOUND"
        );

        return false;
    }


    const saved =
        localStorage.getItem(
            "selectedBoard"
        );


    if (!saved) {

        console.error(
            "SELECTED BOARD NOT FOUND"
        );

        return false;
    }


    let board;


    try {

        board =
            JSON.parse(saved);

    } catch (error) {

        console.error(
            "BOARD JSON ERROR:",
            error
        );

        return false;
    }


    if (
        !Array.isArray(board) ||
        board.length !== 5
    ) {

        console.error(
            "INVALID BOARD:",
            board
        );

        return false;
    }


    grid.innerHTML = "";

    playerCard = [];


    // ======================================
    // CREATE 25 CELLS
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

            const cell =
                document.createElement(
                    "div"
                );


            cell.className =
                "bingo-cell";


            const value =
                board[row][col];


            // FREE CENTER

            if (
                row === 2 &&
                col === 2
            ) {

                cell.textContent =
                    "FREE";

                cell.classList.add(
                    "marked"
                );

                cell.dataset.number =
                    "FREE";

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


            grid.appendChild(
                cell
            );

        }

    }


    console.log(
        "PLAYER BOARD LOADED:",
        playerCard
    );


    return true;
}


// ==========================================
// SHOW CURRENT NUMBER
// ==========================================

function showCurrentNumber(number) {

    const element =
        document.getElementById(
            "currentNumber"
        );


    if (!element) {

        console.error(
            "CURRENT NUMBER ELEMENT NOT FOUND"
        );

        return;
    }


    element.textContent =
        `${bingoLetter(number)} ${number}`;
}


// ==========================================
// UPDATE CALLED COUNT
// ==========================================

function updateCalledCount() {

    const element =
        document.getElementById(
            "calledCount"
        );


    if (!element) return;


    element.textContent =
        `${calledNumbers.length} / 75`;
}


// ==========================================
// UPDATE CALLED NUMBERS
// ==========================================

function updateCalledNumbers(numbers) {

    calledNumbers =
        Array.isArray(numbers)
            ? numbers
            : [];


    // ======================================
    // MARK PLAYER BOARD
    // ======================================

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


    // ======================================
    // COUNT
    // ======================================

    updateCalledCount();


    // ======================================
    // HISTORY
    // ======================================

    const container =
        document.getElementById(
            "calledNumbers"
        );


    if (!container) {

        console.error(
            "CALLED NUMBERS ELEMENT NOT FOUND"
        );

        return;
    }


    container.innerHTML = "";


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


                container.appendChild(
                    item
                );

            }
        );

}


// ==========================================
// LOAD GAME FROM SUPABASE
// ==========================================

async function loadGame(gameId) {

    const {
        data,
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

        return null;
    }


    console.log(
        "GAME LOADED:",
        data
    );


    updateCalledNumbers(
        data.called_numbers
    );


    if (
        data.current_number
    ) {

        showCurrentNumber(
            data.current_number
        );

    }


    return data;
}


// ==========================================
// REALTIME GAME
// ==========================================

async function subscribeGame(gameId) {

    if (gameChannel) {

        await supabase.removeChannel(
            gameChannel
        );

        gameChannel = null;
    }


    console.log(
        "SUBSCRIBING TO GAME:",
        gameId
    );


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
                        "REALTIME GAME UPDATE:",
                        payload.new
                    );


                    const game =
                        payload.new;


                    updateCalledNumbers(
                        game.called_numbers
                    );


                    if (
                        game.current_number
                    ) {

                        showCurrentNumber(
                            game.current_number
                        );

                    }

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "GAME REALTIME STATUS:",
                        status
                    );

                }
            );

}


// ==========================================
// CALL NEXT NUMBER
// ==========================================

async function callNextNumber(
    gameId
) {

    // ======================================
    // GET CURRENT GAME STATE
    // ======================================

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
            "CALL LOAD ERROR:",
            error
        );

        return;
    }


    let called =
        Array.isArray(
            game.called_numbers
        )
            ? game.called_numbers
            : [];


    if (
        called.length >= 75
    ) {

        console.log(
            "ALL NUMBERS CALLED"
        );

        stopCalling();

        return;
    }


    // ======================================
    // FIND AVAILABLE NUMBERS
    // ======================================

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

        stopCalling();

        return;
    }


    // ======================================
    // RANDOM NUMBER
    // ======================================

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


    // ======================================
    // SAVE TO SUPABASE
    // ======================================

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
            "CALL UPDATE ERROR:",
            updateError
        );

        return;
    }


    // ======================================
    // UPDATE SCREEN IMMEDIATELY
    // ======================================

    showCurrentNumber(
        next
    );

    updateCalledNumbers(
        called
    );

}


// ==========================================
// START CALLING
// ==========================================

async function startCalling(
    gameId
) {

    console.log(
        "STARTING CALLER:",
        gameId
    );


    stopCalling();


    // First call immediately

    await callNextNumber(
        gameId
    );


    // Then every 5 seconds

    callTimer =
        setInterval(
            () => {

                callNextNumber(
                    gameId
                );

            },
            CALL_INTERVAL
        );


    console.log(
        "CALL TIMER STARTED: 5 SECONDS"
    );

}


// ==========================================
// STOP CALLING
// ==========================================

function stopCalling() {

    if (callTimer) {

        clearInterval(
            callTimer
        );

        callTimer = null;

        console.log(
            "CALL TIMER STOPPED"
        );

    }

}


// ==========================================
// INITIALIZE GAME
// ==========================================

async function initializeGame(gameId) {
    console.log(
        "================================"
    );

    console.log(
        "INITIALIZING VAMIOS BINGO GAME"
    );

    console.log(
        "================================"
    );

    console.log(
        "GAME ID:",
        gameId
    );


    if (!gameId) {

        console.error(
            "NO GAME ID IN LOCAL STORAGE"
        );

        return;
    }


    // ======================================
    // LOAD PLAYER BOARD
    // ======================================

    const boardLoaded =
        loadPlayerBoard();


    if (!boardLoaded) {

        console.error(
            "PLAYER BOARD FAILED TO LOAD"
        );

        return;
    }


    // ======================================
    // LOAD CURRENT GAME
    // ======================================

    await loadGame(
        gameId
    );


    // ======================================
    // REALTIME
    // ======================================

    await subscribeGame(
        gameId
    );


    // ======================================
    // HOST CALLER
    // ======================================

    const isHost =
        localStorage.getItem(
            "isHost"
        ) === "true";


    console.log(
        "IS HOST:",
        isHost
    );


    console.log(
    "CALLER CHECK:",
    {
        gameId: gameId,
        isHost: isHost,
        isHostStorage:
            localStorage.getItem("isHost")
    }
);


if (isHost) {

    console.log(
        "HOST DETECTED - STARTING CALLER"
    );

    await startCalling(
        gameId
    );

} else {

    console.error(
        "HOST NOT DETECTED - CALLER WILL NOT START"
    );

}

    console.log(
        "GAME INITIALIZATION COMPLETE"
    );

}


// ==========================================
// BINGO BUTTON
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const bingoBtn =
            document.getElementById(
                "bingoBtn"
            );


        if (!bingoBtn) {

            console.error(
                "BINGO BUTTON NOT FOUND"
            );

            return;
        }


        bingoBtn.onclick =
            function () {

                console.log(
                    "BINGO BUTTON CLICKED"
                );


                if (
                    typeof checkWinner ===
                    "function"
                ) {

                    checkWinner();

                } else {

                    console.error(
                        "checkWinner() NOT FOUND"
                    );

                    alert(
                        "Winner checking is not ready yet."
                    );

                }

            };

    }
);


// ==========================================
// GAME JS LOADED
// ==========================================

console.log(
    "GAME JS LOADED"
);
