// ===============================
// VAMIOS BINGO
// BOARDS.JS
// ===============================

let selectedBoard = null;
let startGameBusy = false;
let boardSelectionTimer = null;
let boardTimeLeft = 30;


// ===============================
// LOAD BOARDS
// ===============================

async function loadBoards() {

    const container =
        document.getElementById("boardContainer");

    if (!container) {
        console.log("Board container not found");
        return;
    }

    container.innerHTML = "Loading boards...";

    try {

        // ===============================
        // LOAD ALL BOARDS
        // ===============================

        const {
            data: boards,
            error: boardsError
        } =
            await supabaseClient
                .from("boards")
                .select("*")
                .order("board_number");

        if (boardsError) {
            throw boardsError;
        }

        if (!boards || boards.length === 0) {
            container.innerHTML =
                "No boards available";
            return;
        }


        // ===============================
        // FIND CURRENT GAME
        // ===============================

        const roomId =
            Number(
                localStorage.getItem("room_id")
            );

        let currentGame = null;

        if (roomId) {

            const {
                data: game,
                error: gameError
            } =
                await supabaseClient
                    .from("games")
                    .select("*")
                    .eq("room_id", roomId)
                    .eq("status", "waiting")
                    .order("id", {
                        ascending: false
                    })
                    .limit(1)
                    .maybeSingle();

            if (gameError) {
                console.error(
                    "Load current game error:",
                    gameError
                );
            }

            currentGame = game;
        }


        // ===============================
        // FIND TAKEN BOARDS
        // ===============================

        let takenBoardIds = [];

        if (currentGame) {

            const {
                data: players,
                error: playersError
            } =
                await supabaseClient
                    .from("game_players")
                    .select("board_id")
                    .eq(
                        "game_id",
                        currentGame.id
                    );

            if (playersError) {
                console.error(
                    "Load taken boards error:",
                    playersError
                );
            } else {

                takenBoardIds =
                    (players || [])
                        .map(player =>
                            Number(player.board_id)
                        );
            }
        }


        // ===============================
        // CREATE GRID
        // ===============================

        container.innerHTML = "";

        boards.forEach(board => {

            const box =
                document.createElement("div");

            box.className = "board";

            box.innerText =
                board.board_number;


            const isTaken =
                takenBoardIds.includes(
                    Number(board.id)
                );


            // ===============================
            // TAKEN
            // ===============================

            if (isTaken) {

                box.classList.add("taken");

                box.innerText =
                    board.board_number;

                box.title =
                    "Already taken";

            } else {

                // ===============================
                // AVAILABLE
                // ===============================

                box.addEventListener(
                    "click",
                    function () {

                        selectBoard(
                            board,
                            box
                        );

                    }
                );
            }


            container.appendChild(box);

        });


        // ===============================
        // START TIMER
        // ===============================

        startBoardSelectionTimer();


        console.log(
            "Boards loaded:",
            boards.length
        );

        console.log(
            "Taken boards:",
            takenBoardIds
        );


    } catch (error) {

        console.error(
            "Load boards error:",
            error
        );

        container.innerHTML =
            "Cannot load boards";
    }
}


// ===============================
// SELECT BOARD
// ===============================

function selectBoard(board, box) {

    // Don't allow taken boards
    if (
        box.classList.contains("taken")
    ) {
        return;
    }


    // Remove previous selection
    document
        .querySelectorAll(".board")
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    // Select this board
    box.classList.add("selected");

    selectedBoard = board;


    // Save selected board
    localStorage.setItem(
        "selected_board_id",
        board.id
    );


    // Show selected number
    updateSelectedBoardDisplay(
        board.board_number
    );


    // Enable start button
    const startButton =
        document.getElementById(
            "startBtn"
        );


    if (startButton) {

        startButton.disabled = false;

        startButton.style.pointerEvents =
            "auto";

        startButton.style.opacity =
            "1";

        startButton.innerText =
            "START GAME";
    }


    // Show card preview
    showCardPreview(board);


    console.log(
        "Selected board:",
        board.board_number
    );
}


// ===============================
// SELECTED BOARD DISPLAY
// ===============================

function updateSelectedBoardDisplay(
    boardNumber
) {

    const elements = [

        document.getElementById(
            "selectedBoard"
        ),

        document.getElementById(
            "selectedNumber"
        ),

        document.getElementById(
            "selectedBoardNumber"
        )

    ];


    elements.forEach(element => {

        if (element) {

            element.innerText =
                "#" + boardNumber;
        }

    });
}


// ===============================
// CARD PREVIEW
// ===============================

function showCardPreview(board) {

    const preview =
        document.getElementById(
            "cardPreview"
        );

    if (!preview) {
        return;
    }


    const card =
        board.card_data;


    if (!card) {

        preview.innerHTML = "";

        return;
    }


    const letters = [
        "B",
        "I",
        "N",
        "G",
        "O"
    ];


    let html = `
        <div class="preview-card">
    `;


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

            let value =
                card[
                    letters[col]
                ][row];


            if (
                row === 2 &&
                col === 2
            ) {

                value =
                    "FREE";
            }


            html += `
                <div class="preview-cell ${
                    value === "FREE"
                        ? "free"
                        : ""
                }">
                    ${value}
                </div>
            `;
        }
    }


    html += `
        </div>
    `;


    preview.innerHTML =
        html;
}


// ===============================
// BOARD SELECTION TIMER
// ===============================

function startBoardSelectionTimer() {

    // Clear old timer
    if (boardSelectionTimer) {

        clearInterval(
            boardSelectionTimer
        );
    }


    boardTimeLeft = 30;


    updateBoardTimer();


    boardSelectionTimer =
        setInterval(
            function () {

                boardTimeLeft--;


                updateBoardTimer();


                if (
                    boardTimeLeft <= 0
                ) {

                    clearInterval(
                        boardSelectionTimer
                    );

                    lockBoardSelection();
                }

            },
            1000
        );
}


// ===============================
// UPDATE TIMER
// ===============================

function updateBoardTimer() {

    const timerElements = [

        document.getElementById(
            "boardTimer"
        ),

        document.getElementById(
            "selectionTimer"
        ),

        document.getElementById(
            "timeLeft"
        )

    ];


    timerElements.forEach(element => {

        if (element) {

            element.innerText =
                "00:" +
                String(
                    boardTimeLeft
                ).padStart(2, "0");

        }

    });
}


// ===============================
// LOCK BOARD SELECTION
// ===============================

function lockBoardSelection() {

    console.log(
        "Board selection locked"
    );


    document
        .querySelectorAll(".board")
        .forEach(box => {

            box.style.pointerEvents =
                "none";

        });


    const startButton =
        document.getElementById(
            "startBtn"
        );


    // If player selected a board,
    // keep START GAME available.
    if (
        startButton &&
        !selectedBoard
    ) {

        startButton.disabled =
            true;

        startButton.style.opacity =
            "0.5";
    }
}


// ===============================
// ATTACH START BUTTON
// ===============================

function setupStartButton() {

    const startButton =
        document.getElementById(
            "startBtn"
        );


    if (!startButton) {

        console.log(
            "START BUTTON NOT FOUND"
        );

        return;
    }


    console.log(
        "START BUTTON FOUND"
    );


    // Prevent duplicate handlers
    startButton.onclick = null;


    startButton.onclick =
        async function(event) {

            event.preventDefault();


            console.log(
                "START BUTTON CLICKED"
            );


            await startSelectedGame();

        };


    // Initial state
    if (!selectedBoard) {

        startButton.disabled =
            true;

        startButton.style.opacity =
            "0.5";

    }
}


// ===============================
// START BUTTON SETUP
// ===============================

setupStartButton();


document.addEventListener(
    "DOMContentLoaded",
    setupStartButton
);


// ===============================
// START GAME
// ===============================

async function startSelectedGame() {

    console.log(
        "START GAME FUNCTION RUNNING"
    );


    if (startGameBusy) {

        console.log(
            "Start game already running"
        );

        return;
    }


    // ===============================
    // CHECK BOARD
    // ===============================

    if (!selectedBoard) {

        alert(
            "Please select your number first."
        );

        return;
    }


    startGameBusy = true;


    const startButton =
        document.getElementById(
            "startBtn"
        );


    if (startButton) {

        startButton.disabled =
            true;

        startButton.innerText =
            "JOINING...";

    }


    try {

        // ===============================
        // ROOM
        // ===============================

        const roomId =
            Number(
                localStorage.getItem(
                    "room_id"
                )
            );


        if (!roomId) {

            throw new Error(
                "No room selected."
            );
        }


        // ===============================
        // USER
        // ===============================

        const user =
            await getCurrentUser();


        if (!user) {

            throw new Error(
                "User not found."
            );
        }


        console.log(
            "User:",
            user.id
        );


        // ===============================
        // ROOM
        // ===============================

        const {
            data: room,
            error: roomError
        } =
            await supabaseClient
                .from("rooms")
                .select("*")
                .eq(
                    "id",
                    roomId
                )
                .single();


        if (roomError) {
            throw roomError;
        }


        const entryFee =
            Number(
                room.entry_fee
            );


        // ===============================
        // BALANCE
        // ===============================

        const balance =
            await getBalance(
                user.id
            );


        console.log(
            "Balance:",
            balance
        );


        console.log(
            "Entry fee:",
            entryFee
        );


        if (
            Number(balance) <
            entryFee
        ) {

            alert(
                "Insufficient balance.\n\n" +
                "Entry fee: " +
                entryFee +
                " ETB"
            );

            return;
        }


        // ===============================
        // FIND WAITING GAME
        // ===============================

        let {
            data: game,
            error: gameError
        } =
            await supabaseClient
                .from("games")
                .select("*")
                .eq(
                    "room_id",
                    roomId
                )
                .eq(
                    "status",
                    "waiting"
                )
                .order(
                    "id",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();


        if (gameError) {
            throw gameError;
        }


        // ===============================
        // CREATE GAME
        // ===============================

        if (!game) {

            console.log(
                "Creating new game..."
            );


            const {
                data: newGame,
                error: newGameError
            } =
                await supabaseClient
                    .from("games")
                    .insert([{

                        game_code:
                            "VAM-" +
                            Date.now(),

                        room_id:
                            roomId,

                        status:
                            "waiting",

                        player_count:
                            0,

                        prize_pool:
                            0,

                        commission:
                            0,

                        called_numbers:
                            []

                    }])
                    .select()
                    .single();


            if (newGameError) {
                throw newGameError;
            }


            game =
                newGame;
        }


        console.log(
            "Game:",
            game.id
        );


        // ===============================
        // CHECK BOARD
        // ===============================

        const {
            data: taken,
            error: takenError
        } =
            await supabaseClient
                .from("game_players")
                .select("id")
                .eq(
                    "game_id",
                    game.id
                )
                .eq(
                    "board_id",
                    selectedBoard.id
                );


        if (takenError) {
            throw takenError;
        }


        if (
            taken &&
            taken.length > 0
        ) {

            alert(
                "This number is already taken."
            );

            // Reload board grid
            await loadBoards();

            return;
        }


        // ===============================
        // PAY
        // ===============================

        console.log(
            "Deducting entry fee..."
        );


        const paid =
            await deductBalance(
                user.id,
                entryFee
            );


        if (!paid) {

            return;
        }


        // ===============================
        // JOIN
        // ===============================

        console.log(
            "Joining game..."
        );


        const {
            error: joinError
        } =
            await supabaseClient
                .from("game_players")
                .insert([{

                    game_id:
                        game.id,

                    user_id:
                        user.id,

                    board_id:
                        selectedBoard.id,

                    ready:
                        true

                }]);


        if (joinError) {

            console.error(
                "Join error:",
                joinError
            );


            // Refund
            await supabaseClient
                .from("wallets")
                .update({

                    balance:
                        Number(balance)

                })
                .eq(
                    "user_id",
                    user.id
                );


            throw joinError;
        }


        // ===============================
        // UPDATE GAME
        // ===============================

        const newCount =
            Number(
                game.player_count || 0
            ) + 1;


        const totalPool =
            newCount *
            entryFee;


        const commission =
            totalPool *
            0.20;


        const prizePool =
            totalPool -
            commission;


        const {
            error: updateError
        } =
            await supabaseClient
                .from("games")
                .update({

                    player_count:
                        newCount,

                    prize_pool:
                        prizePool,

                    commission:
                        commission

                })
                .eq(
                    "id",
                    game.id
                );


        if (updateError) {
            throw updateError;
        }


        // ===============================
        // SAVE
        // ===============================

        localStorage.setItem(
            "game_id",
            game.id
        );


        localStorage.setItem(
            "selected_board_id",
            selectedBoard.id
        );


        console.log(
            "GAME JOINED SUCCESSFULLY"
        );


        // Stop board timer
        if (boardSelectionTimer) {

            clearInterval(
                boardSelectionTimer
            );

            boardSelectionTimer =
                null;
        }


        // ===============================
        // OPEN WAITING
        // ===============================

        showScreen(
            "waitingScreen"
        );


        if (
            typeof loadWaiting ===
            "function"
        ) {

            await loadWaiting();
        }


    } catch (error) {

        console.error(
            "START GAME ERROR:",
            error
        );


        alert(
            error.message ||
            "Could not start game."
        );


    } finally {

        startGameBusy =
            false;


        if (startButton) {

            startButton.disabled =
                false;

            startButton.innerText =
                "START GAME";

            startButton.style.pointerEvents =
                "auto";

            startButton.style.opacity =
                "1";
        }
    }
}
