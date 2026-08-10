// ===============================
// VAMIOS BINGO
// BOARDS.JS
// ===============================

let selectedBoard = null;
let startGameBusy = false;


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

    const { data, error } =
        await supabaseClient
            .from("boards")
            .select("*")
            .order("board_number");

    if (error) {
        console.error("Load boards error:", error);
        container.innerHTML = "Cannot load boards";
        return;
    }

    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = "No boards available";
        return;
    }

    data.forEach(board => {

        const box =
            document.createElement("div");

        box.className = "board";

        box.innerText =
            board.board_number;

        box.addEventListener(
            "click",
            function () {
                selectBoard(board, box);
            }
        );

        container.appendChild(box);
    });
}


// ===============================
// SELECT BOARD
// ===============================

function selectBoard(board, box) {

    document
        .querySelectorAll(".board")
        .forEach(item => {
            item.classList.remove("selected");
        });

    box.classList.add("selected");

    selectedBoard = board;

    localStorage.setItem(
        "selected_board_id",
        board.id
    );

    showCardPreview(board);

    const startButton =
        document.getElementById("startBtn");

    if (startButton) {

        startButton.disabled = false;

        startButton.style.pointerEvents = "auto";

        startButton.style.opacity = "1";

        startButton.innerText = "START GAME";
    }

    console.log(
        "Selected board:",
        board.board_number
    );
}


// ===============================
// CARD PREVIEW
// ===============================

function showCardPreview(board) {

    const preview =
        document.getElementById("cardPreview");

    if (!preview) {
        return;
    }

    const card = board.card_data;

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

    for (let row = 0; row < 5; row++) {

        for (let col = 0; col < 5; col++) {

            let value =
                card[letters[col]][row];

            if (row === 2 && col === 2) {
                value = "FREE";
            }

            html += `
                <div class="preview-cell">
                    ${value}
                </div>
            `;
        }
    }

    html += `
        </div>
    `;

    preview.innerHTML = html;
}


// ===============================
// ATTACH START BUTTON
// ===============================

function setupStartButton() {

    const startButton =
        document.getElementById("startBtn");

    if (!startButton) {

        console.log(
            "START BUTTON NOT FOUND"
        );

        return;
    }

    console.log(
        "START BUTTON FOUND"
    );

    // Remove old onclick/listener behavior
    startButton.onclick = null;

    // Use onclick directly
    startButton.onclick =
        async function (event) {

            event.preventDefault();

            console.log(
                "START BUTTON CLICKED"
            );

            await startSelectedGame();
        };

    // Initial state
    if (!selectedBoard) {
        startButton.disabled = true;
    }
}


// ===============================
// START BUTTON SETUP
// ===============================

// Run immediately
setupStartButton();

// Run again after DOM is ready
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
        document.getElementById("startBtn");


    if (startButton) {

        startButton.disabled = true;

        startButton.innerText =
            "Joining...";
    }


    try {

        // ===============================
        // ROOM
        // ===============================

        const roomId =
            Number(
                localStorage.getItem("room_id")
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
                .eq("id", roomId)
                .single();

        if (roomError) {
            throw roomError;
        }


        const entryFee =
            Number(room.entry_fee);


        // ===============================
        // BALANCE
        // ===============================

        const balance =
            await getBalance(user.id);

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
                .eq("room_id", roomId)
                .eq("status", "waiting")
                .order("id", {
                    ascending: false
                })
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

            game = newGame;
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

            // Refund if joining failed
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
            newCount * entryFee;


        const commission =
            totalPool * 0.20;


        const prizePool =
            totalPool - commission;


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

        startGameBusy = false;

        if (startButton) {

            startButton.disabled = false;

            startButton.innerText =
                "START GAME";

            startButton.style.pointerEvents =
                "auto";

            startButton.style.opacity =
                "1";
        }
    }
}