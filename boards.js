// ==========================================
// VAMIOS BINGO
// BOARD SELECTION
// ==========================================

let boardsEntryFee = 0;
let selectedBoardNumber = null;
let selectedBoard = null;


// ==========================================
// INITIALIZE BOARD SCREEN
// ==========================================

async function initializeBoards(fee) {

    console.log(
        "INITIALIZING BOARDS:",
        fee
    );

    boardsEntryFee =
        Number(fee);

    selectedBoardNumber =
        null;

    selectedBoard =
        null;


    const selectedFee =
        document.getElementById(
            "selectedFee"
        );

    if (selectedFee) {

        selectedFee.textContent =
            boardsEntryFee + " ETB";

    }


    const selectedNumber =
        document.getElementById(
            "selectedBoardNumber"
        );

    if (selectedNumber) {

        selectedNumber.textContent =
            "None";

    }


    const preview =
        document.getElementById(
            "boardPreview"
        );

    if (preview) {

        preview.classList.add(
            "hidden"
        );

    }


    const startButton =
        document.getElementById(
            "startGameBtn"
        );

    if (startButton) {

        startButton.disabled =
            true;

    }


    createBoardNumbers();


    console.log(
        "BOARDS READY"
    );
}


// ==========================================
// CREATE NUMBERS 1–100
// ==========================================

function createBoardNumbers() {

    const container =
        document.getElementById(
            "boardNumbers"
        );

    if (!container) {

        console.error(
            "boardNumbers element not found"
        );

        return;
    }


    container.innerHTML = "";


    for (
        let number = 1;
        number <= 100;
        number++
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "board-number";

        button.textContent =
            number;

        button.dataset.number =
            number;


        button.addEventListener(
            "click",
            function () {

                selectBoard(
                    number
                );

            }
        );


        container.appendChild(
            button
        );

    }

}


// ==========================================
// SELECT BOARD
// ==========================================

async function selectBoard(number) {

    selectedBoardNumber =
        Number(number);


    console.log(
        "SELECTED BOARD:",
        selectedBoardNumber
    );


    document
        .querySelectorAll(
            ".board-number"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "selected",
                    Number(
                        button.dataset.number
                    ) ===
                    selectedBoardNumber
                );

            }
        );


    const selectedNumber =
        document.getElementById(
            "selectedBoardNumber"
        );

    if (selectedNumber) {

        selectedNumber.textContent =
            selectedBoardNumber;

    }


    selectedBoard =
        generateBoard(
            selectedBoardNumber
        );


    displayBoardPreview(
        selectedBoard
    );


    const startButton =
        document.getElementById(
            "startGameBtn"
        );

    if (startButton) {

        startButton.disabled =
            false;

    }

}


// ==========================================
// GENERATE BINGO BOARD
// ==========================================

function generateBoard(seed) {

    const board = [];


    const ranges = [

        [1, 15],

        [16, 30],

        [31, 45],

        [46, 60],

        [61, 75]

    ];


    for (
        let column = 0;
        column < 5;
        column++
    ) {

        const numbers =
            createShuffledNumbers(
                ranges[column][0],
                ranges[column][1]
            );


        for (
            let row = 0;
            row < 5;
            row++
        ) {

            if (!board[row]) {

                board[row] = [];

            }


            if (
                row === 2 &&
                column === 2
            ) {

                board[row][column] =
                    "FREE";

            } else {

                board[row][column] =
                    numbers[row];

            }

        }

    }


    return board;

}


// ==========================================
// SHUFFLE NUMBERS
// ==========================================

function createShuffledNumbers(
    min,
    max
) {

    const numbers = [];


    for (
        let i = min;
        i <= max;
        i++
    ) {

        numbers.push(i);

    }


    for (
        let i = numbers.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            numbers[i],
            numbers[j]
        ] =
        [
            numbers[j],
            numbers[i]
        ];

    }


    return numbers;

}


// ==========================================
// DISPLAY BOARD PREVIEW
// ==========================================

function displayBoardPreview(
    board
) {

    const preview =
        document.getElementById(
            "boardPreview"
        );

    const grid =
        document.getElementById(
            "previewGrid"
        );


    if (!preview || !grid) {

        console.error(
            "BOARD PREVIEW ELEMENTS NOT FOUND"
        );

        return;

    }


    grid.innerHTML = "";


    board.forEach(
        row => {

            row.forEach(
                value => {

                    const cell =
                        document.createElement(
                            "div"
                        );


                    cell.className =
                        "bingo-cell";


                    if (
                        value === "FREE"
                    ) {

                        cell.classList.add(
                            "free-cell"
                        );

                        cell.textContent =
                            "FREE";

                    } else {

                        cell.textContent =
                            value;

                    }


                    grid.appendChild(
                        cell
                    );

                }
            );

        }
    );


    preview.classList.remove(
        "hidden"
    );

}


// ==========================================
// START GAME BUTTON
// ==========================================

function setupBoardStartButton() {

    const button =
        document.getElementById(
            "startGameBtn"
        );

    if (!button) {

        console.error(
            "START GAME BUTTON NOT FOUND"
        );

        return;
    }

    button.onclick =
        async function () {

            if (
                !selectedBoardNumber ||
                !selectedBoard
            ) {

                alert(
                    "Please select a board first."
                );

                return;
            }

            const fee =
                Number(boardsEntryFee);

            if (
                !Number.isFinite(fee) ||
                fee <= 0
            ) {

                alert(
                    "Invalid entry fee."
                );

                return;
            }

            const userId =
                getCurrentUserId();

            if (!userId) {

                alert(
                    "❌ Player account not found. Please open VAMIOS Bingo from Telegram again."
                );

                return;
            }

            button.disabled =
                true;

            button.textContent =
                "PAYING...";

            let payment = null;

            let game = null;

            try {

                // =========================
                // PAY ENTRY FEE
                // =========================

                payment =
                    await deductEntryFee(
                        fee
                    );

                if (
                    !payment ||
                    !payment.success
                ) {

                    throw new Error(
                        payment?.error ||
                        "Could not pay entry fee"
                    );
                }

                console.log(
                    "ENTRY FEE PAID:",
                    fee,
                    "Transaction:",
                    payment.transactionId
                );

                button.textContent =
                    "JOINING...";

                // =========================
                // LOAD ROOM
                // =========================

                const {
                    data: room,
                    error: roomError
                } =
                    await supabase
                        .from("rooms")
                        .select("*")
                        .eq(
                            "entry_fee",
                            fee
                        )
                        .single();

                if (
                    roomError ||
                    !room
                ) {

                    throw new Error(
                        roomError?.message ||
                        "Room not found"
                    );
                }

                // =========================
                // SET 60 SECOND TIMER
                // =========================

                const nextGameTime =
                    new Date(
                        Date.now() +
                        60000
                    ).toISOString();

                const {
                    error: updateError
                } =
                    await supabase
                        .from("rooms")
                        .update({

                            next_game_time:
                                nextGameTime

                        })
                        .eq(
                            "id",
                            room.id
                        );

                if (updateError) {

                    throw updateError;

                }

                // =========================
                // CREATE GAME
                // =========================

                const {
                    data: createdGame,
                    error: gameError
                } =
                    await supabase
                        .from("games")
                        .insert({

                            room_id:
                                room.id,

                            status:
                                "waiting"

                        })
                        .select()
                        .single();

                if (gameError) {

                    throw gameError;

                }

                game =
                    createdGame;

                // =========================
                // ADD PLAYER
                // =========================

                const {
                    error: playerError
                } =
                    await supabase
                        .from(
                            "game_players"
                        )
                        .insert({

                            game_id:
                                game.id,

                            user_id:
                                userId,

                            board_number:
                                selectedBoardNumber,

                            board:
                                selectedBoard

                        });

                if (playerError) {

                    throw playerError;

                }

                // =========================
                // SAVE GAME INFORMATION
                // =========================

                localStorage.setItem(
                    "gameId",
                    String(game.id)
                );

                localStorage.setItem(
                    "selectedBoard",
                    JSON.stringify(
                        selectedBoard
                    )
                );

                localStorage.setItem(
                    "selectedBoardNumber",
                    String(
                        selectedBoardNumber
                    )
                );

                localStorage.setItem(
                    "isHost",
                    "true"
                );

                console.log(
                    "GAME CREATED:",
                    game.id
                );

                console.log(
                    "BOARD SAVED:",
                    selectedBoardNumber
                );

                // =========================
                // OPEN WAITING ROOM
                // =========================

                showWaitingScreen();

                await startWaitingRoom(
                    room.id,
                    game.id
                );

            } catch (error) {

                console.error(
                    "JOIN GAME ERROR:",
                    error
                );

                // =========================
                // REFUND IF PAYMENT SUCCEEDED
                // BUT JOINING FAILED
                // =========================

                if (
                    payment &&
                    payment.success &&
                    payment.transactionId
                ) {

                    console.log(
                        "REFUNDING ENTRY FEE:",
                        payment.transactionId
                    );

                    const {
                        data: refundData,
                        error: refundError
                    } =
                        await supabase.rpc(
                            "refund_bingo_entry_fee",
                            {
                                p_user_id:
                                    userId,

                                p_amount:
                                    fee,

                                p_transaction_id:
                                    payment.transactionId
                            }
                        );

                    if (refundError) {

                        console.error(
                            "REFUND ERROR:",
                            refundError
                        );

                        alert(
                            "⚠️ Game joining failed AND automatic refund failed.\n\n" +
                            "Please contact the administrator immediately.\n\n" +
                            "Transaction: " +
                            payment.transactionId
                        );

                        return;
                    }

                    if (
                        refundData &&
                        refundData.success === true
                    ) {

                        walletBalance =
                            Number(
                                refundData.balance ||
                                0
                            );

                        updateWalletDisplay();

                        console.log(
                            "ENTRY FEE REFUNDED:",
                            fee
                        );
                    }
                }

                alert(
                    "❌ Could not join the game.\n\n" +
                    (
                        error.message ||
                        String(error)
                    )
                );

            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "START GAME";

            }

        };

}

// ==========================================
// BACK BUTTON
// ==========================================

function setupBoardBackButton() {

    const button =
        document.getElementById(
            "backToLobbyBtn"
        );

    if (!button) {
        return;
    }

    button.onclick =
        function () {

            if (
                typeof showLobbyScreen ===
                "function"
            ) {

                showLobbyScreen();

            }

        };
}


// ==========================================
// INITIAL SETUP
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupBoardStartButton();

        setupBoardBackButton();

    }
);


console.log(
    "BOARDS JS LOADED"
);
