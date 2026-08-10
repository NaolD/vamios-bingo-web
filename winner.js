// ===============================
// VAMIOS BINGO
// BOARDS.JS
// ===============================

let selectedBoard = null;


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

        box.onclick = () => {
            selectBoard(board, box);
        };

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

    const start =
        document.getElementById("startBtn");

    if (start) {
        start.disabled = false;
        start.classList.remove("disabled");
    }
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
// START GAME
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const startButton =
            document.getElementById("startBtn");

        if (!startButton) {
            console.log("START BUTTON NOT FOUND");
            return;
        }

        startButton.disabled = true;

        startButton.addEventListener(
            "click",
            startSelectedGame
        );
    }
);


// ===============================
// START SELECTED GAME
// ===============================

async function startSelectedGame() {

    const startButton =
        document.getElementById("startBtn");

    if (!selectedBoard) {

        alert("Select your number first.");

        return;
    }

    if (
        startButton &&
        startButton.disabled
    ) {
        return;
    }

    // Prevent repeated taps
    if (startButton) {
        startButton.disabled = true;
        startButton.innerText = "Joining...";
    }

    try {

        const roomId =
            Number(
                localStorage.getItem("room_id")
            );

        if (!roomId) {
            throw new Error("No room selected.");
        }


        // ===============================
        // GET USER
        // ===============================

        const user =
            await getCurrentUser();

        if (!user) {
            throw new Error("User not found.");
        }


        // ===============================
        // GET ROOM
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


        // ===============================
        // CHECK BALANCE FIRST
        // ===============================

        const balance =
            await getBalance(user.id);

        const entryFee =
            Number(room.entry_fee);

        if (Number(balance) < entryFee) {

            alert(
                "Insufficient balance.\n\n" +
                "Entry fee: " +
                entryFee.toFixed(2) +
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
                .order("id", { ascending: false })
                .limit(1)
                .maybeSingle();

        if (gameError) {
            throw gameError;
        }


        // ===============================
        // CREATE GAME
        // ===============================

        if (!game) {

            const gameCode =
                "VAM-" + Date.now();

            const {
                data: newGame,
                error: newGameError
            } =
                await supabaseClient
                    .from("games")
                    .insert([{
                        game_code: gameCode,
                        room_id: roomId,
                        status: "waiting",
                        player_count: 0,
                        prize_pool: 0,
                        commission: 0,
                        called_numbers: []
                    }])
                    .select()
                    .single();

            if (newGameError) {
                throw newGameError;
            }

            game = newGame;
        }


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
                .eq("game_id", game.id)
                .eq("board_id", selectedBoard.id);

        if (takenError) {
            throw takenError;
        }

        if (taken && taken.length > 0) {

            alert(
                "This number is already taken."
            );

            return;
        }


        // ===============================
        // DEDUCT BALANCE
        // ===============================

        const paid =
            await deductBalance(
                user.id,
                entryFee
            );

        if (!paid) {
            return;
        }


        // ===============================
        // JOIN GAME
        // ===============================

        const {
            error: joinError
        } =
            await supabaseClient
                .from("game_players")
                .insert([{
                    game_id: game.id,
                    user_id: user.id,
                    board_id: selectedBoard.id,
                    ready: true
                }]);

        if (joinError) {

            // IMPORTANT:
            // Return the entry fee if joining failed.

            await supabaseClient
                .from("wallets")
                .update({
                    balance: Number(balance)
                })
                .eq("user_id", user.id);

            throw joinError;
        }


        // ===============================
        // UPDATE GAME
        // ===============================

        const newCount =
            Number(game.player_count || 0) + 1;

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
                    player_count: newCount,
                    prize_pool: prizePool,
                    commission: commission
                })
                .eq("id", game.id);

        if (updateError) {
            throw updateError;
        }


        // ===============================
        // SAVE GAME
        // ===============================

        localStorage.setItem(
            "game_id",
            game.id
        );

        localStorage.setItem(
            "selected_board_id",
            selectedBoard.id
        );


        // ===============================
        // OPEN WAITING
        // ===============================

        showScreen("waitingScreen");

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
            "Could not start the game."
        );

    } finally {

        if (startButton) {
            startButton.disabled = false;
            startButton.innerText = "START GAME";
        }
    }
}