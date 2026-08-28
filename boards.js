// ==========================================
// VAMIOS BINGO
// BOARD SELECTION
// ==========================================

let boardsEntryFee = 0;
let selectedBoardNumber = null;
let selectedBoard = null;

// ==========================================
// SHARED BOARD SYNCHRONIZATION
// ==========================================

let boardSyncChannel = null;
let takenBoardNumbers = new Set();


// ==========================================
// LOAD TAKEN BOARDS
// ==========================================

async function loadTakenBoards(gameId) {

    if (!gameId) {
        return;
    }

    const {
        data,
        error
    } =
        await supabase
            .from("game_players")
            .select("board_number")
            .eq(
                "game_id",
                gameId
            );

    if (error) {

        console.error(
            "TAKEN BOARDS LOAD ERROR:",
            error
        );

        return;
    }

    takenBoardNumbers =
        new Set(
            (data || [])
                .map(
                    player =>
                        Number(
                            player.board_number
                        )
                )
        );

    updateTakenBoardButtons();
}


// ==========================================
// UPDATE BOARD BUTTONS
// ==========================================

function updateTakenBoardButtons() {

    document
        .querySelectorAll(
            ".board-number"
        )
        .forEach(
            button => {

                const number =
                    Number(
                        button.dataset.number
                    );

                const taken =
                    takenBoardNumbers.has(
                        number
                    );

                const selected =
                    number ===
                    selectedBoardNumber;

                button.disabled =
                    taken &&
                    !selected;

                button.classList.toggle(
                    "taken",
                    taken
                );

            }
        );

}


// ==========================================
// START BOARD REALTIME
// ==========================================

async function startBoardRealtime(gameId) {

    if (!gameId) {
        return;
    }

    if (boardSyncChannel) {

        await supabase.removeChannel(
            boardSyncChannel
        );

        boardSyncChannel = null;
    }

    await loadTakenBoards(
        gameId
    );

    console.log(
        "STARTING BOARD REALTIME:",
        gameId
    );

    boardSyncChannel =
        supabase
            .channel(
                "board-sync-" +
                gameId +
                "-" +
                Date.now()
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "game_players",
                    filter:
                        "game_id=eq." +
                        gameId
                },
                async payload => {

                    console.log(
                        "GAME PLAYERS CHANGE:",
                        payload
                    );

                    await loadTakenBoards(
                        gameId
                    );

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "BOARD REALTIME STATUS:",
                        status
                    );

                }
            );

}


// ==========================================
// BOARD SELECTION REALTIME SYNCHRONIZATION
// ==========================================

async function startBoardSelectionSync(fee) {

    console.log(
        "STARTING BOARD SELECTION SYNC:",
        fee
    );

    const {
        data: room,
        error: roomError
    } =
        await supabase
            .from("rooms")
            .select("id")
            .eq(
                "entry_fee",
                Number(fee)
            )
            .single();

    if (roomError || !room) {

        console.error(
            "BOARD SYNC ROOM ERROR:",
            roomError
        );

        return;
    }

    const roomId =
        room.id;

    // --------------------------------------
    // Find current waiting game
    // --------------------------------------

    const {
        data: existingGame,
        error: gameError
    } =
        await supabase
            .from("games")
            .select("id")
            .eq(
                "room_id",
                roomId
            )
            .eq(
                "status",
                "waiting"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(1)
            .maybeSingle();

    if (gameError) {

        console.error(
            "BOARD SYNC GAME ERROR:",
            gameError
        );

        return;
    }

    // --------------------------------------
    // Attach to waiting game
    // --------------------------------------

    async function attachToGame(gameId) {

        if (!gameId) {
            return;
        }

        console.log(
            "BOARD SYNC ATTACHED TO GAME:",
            gameId
        );

        await loadTakenBoards(
            gameId
        );

        if (boardSyncChannel) {

            await supabase.removeChannel(
                boardSyncChannel
            );

            boardSyncChannel =
                null;
        }

        boardSyncChannel =
            supabase
                .channel(
                    "board-selection-sync-" +
                    gameId
                )
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "game_players",
                        filter:
                            "game_id=eq." +
                            gameId
                    },
                    payload => {

                        console.log(
                            "BOARD TAKEN:",
                            payload.new
                        );

                        if (
                            payload.new &&
                            payload.new.board_number
                        ) {

                            takenBoardNumbers.add(
                                Number(
                                    payload.new.board_number
                                )
                            );

                            updateTakenBoardButtons();

                        }

                    }
                )
                .subscribe(
                    status => {

                        console.log(
                            "BOARD SELECTION REALTIME:",
                            status
                        );

                    }
                );
    }

    if (existingGame) {

        await attachToGame(
            existingGame.id
        );

        return;
    }

    // --------------------------------------
    // No waiting game yet.
    // Listen for one to be created.
    // --------------------------------------

    console.log(
        "NO WAITING GAME YET - LISTENING FOR GAME CREATION"
    );

    if (boardSyncChannel) {

        await supabase.removeChannel(
            boardSyncChannel
        );

        boardSyncChannel =
            null;
    }

    boardSyncChannel =
        supabase
            .channel(
                "board-game-sync-" +
                roomId
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "games",
                    filter:
                        "room_id=eq." +
                        roomId
                },
                async payload => {

                    if (
                        payload.new &&
                        payload.new.status ===
                        "waiting"
                    ) {

                        console.log(
                            "NEW WAITING GAME CREATED:",
                            payload.new.id
                        );

                        await attachToGame(
                            payload.new.id
                        );

                    }

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "BOARD GAME REALTIME:",
                        status
                    );

                }
            );

}


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

    await startBoardSelectionSync(
        boardsEntryFee
    );

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

    number =
        Number(number);

    if (
        takenBoardNumbers.has(number)
    ) {

        alert(
            "❌ Board " +
            number +
            " is already taken."
        );

        return;
    }

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
                "CHECKING...";

            let payment = null;
            let game = null;
            let room = null;
            let playerInserted = false;

            // ==========================================
            // NEW:
            // Track whether THIS player actually
            // created the waiting game.
            // ==========================================

            let gameCreatedByThisPlayer =
                false;

            try {

                // =========================
                // LOAD ROOM
                // =========================

                const {
                    data: loadedRoom,
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
                    !loadedRoom
                ) {

                    throw new Error(
                        roomError?.message ||
                        "Room not found"
                    );
                }

                room =
                    loadedRoom;

                // =========================
                // FIND WAITING GAME
                // =========================

                const {
                    data: existingGame,
                    error: existingGameError
                } =
                    await supabase
                        .from("games")
                        .select("*")
                        .eq(
                            "room_id",
                            room.id
                        )
                        .eq(
                            "status",
                            "waiting"
                        )
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        )
                        .limit(1)
                        .maybeSingle();

                if (existingGameError) {

                    throw existingGameError;

                }

                // =========================
                // USE EXISTING GAME
                // =========================

                if (existingGame) {

                    game =
                        existingGame;

                    console.log(
                        "JOINING EXISTING SHARED GAME:",
                        game.id
                    );

                }

                // =========================
                // CREATE NEW SHARED GAME
                // =========================

                else {

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

                        // ==================================
                        // ANOTHER PLAYER WON THE RACE
                        // ==================================

                        if (
                            gameError.code ===
                            "23505"
                        ) {

                            console.log(
                                "WAITING GAME ALREADY CREATED BY ANOTHER PLAYER."
                            );

                            const {
                                data: concurrentGame,
                                error:
                                    concurrentGameError
                            } =
                                await supabase
                                    .from("games")
                                    .select("*")
                                    .eq(
                                        "room_id",
                                        room.id
                                    )
                                    .eq(
                                        "status",
                                        "waiting"
                                    )
                                    .order(
                                        "created_at",
                                        {
                                            ascending: false
                                        }
                                    )
                                    .limit(1)
                                    .maybeSingle();

                            if (
                                concurrentGameError ||
                                !concurrentGame
                            ) {

                                throw new Error(
                                    concurrentGameError?.message ||
                                    "Could not find the shared waiting game."
                                );

                            }

                            game =
                                concurrentGame;

                            console.log(
                                "JOINED SHARED GAME AFTER RACE:",
                                game.id
                            );

                        } else {

                            throw gameError;

                        }

                    } else {

                        game =
                            createdGame;

                        // ==================================
                        // IMPORTANT:
                        // THIS PLAYER REALLY CREATED GAME
                        // ==================================

                        gameCreatedByThisPlayer =
                            true;

                        console.log(
                            "CREATED NEW SHARED GAME:",
                            game.id
                        );

                    }

                }

                // ==========================================
                // SHARED 60 SECOND TIMER
                //
                // Only the player who actually CREATED
                // the new game starts a fresh timer.
                //
                // Players joining an existing game,
                // including players who lost the creation
                // race, use the shared room timer.
                // ==========================================

                if (
                    gameCreatedByThisPlayer &&
                    game
                ) {

                    const nextGameTime =
                        new Date(
                            Date.now() +
                            60000
                        ).toISOString();

                    const {
                        data: updatedRoom,
                        error: timerError
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
                            )
                            .select(
                                "next_game_time"
                            )
                            .single();

                    if (timerError) {

                        throw timerError;

                    }

                    room.next_game_time =
                        updatedRoom.next_game_time;

                    console.log(
                        "STARTED NEW SHARED 60 SECOND TIMER:",
                        room.next_game_time
                    );

                }

                // ==========================================
                // EXISTING WAITING GAME
                // ==========================================

                else {

                    // =========================
                    // ENSURE SHARED TIMER EXISTS
                    // =========================

                    if (
                        !room.next_game_time
                    ) {

                        const nextGameTime =
                            new Date(
                                Date.now() +
                                60000
                            ).toISOString();

                        const {
                            data: updatedRoom,
                            error: timerError
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
                                )
                                .is(
                                    "next_game_time",
                                    null
                                )
                                .select(
                                    "next_game_time"
                                )
                                .maybeSingle();

                        if (timerError) {

                            throw timerError;

                        }

                        if (updatedRoom) {

                            room.next_game_time =
                                updatedRoom.next_game_time;

                            console.log(
                                "STARTED MISSING SHARED 60 SECOND TIMER:",
                                room.next_game_time
                            );

                        } else {

                            // Another player may have created
                            // the timer at the same time.

                            const {
                                data: currentRoom,
                                error:
                                    currentRoomError
                            } =
                                await supabase
                                    .from("rooms")
                                    .select(
                                        "next_game_time"
                                    )
                                    .eq(
                                        "id",
                                        room.id
                                    )
                                    .single();

                            if (currentRoomError) {

                                throw currentRoomError;

                            }

                            room.next_game_time =
                                currentRoom.next_game_time;

                            console.log(
                                "USING SHARED TIMER CREATED BY ANOTHER PLAYER:",
                                room.next_game_time
                            );

                        }

                    }

                    if (
                        !room.next_game_time
                    ) {

                        throw new Error(
                            "Could not create or find the shared game timer."
                        );

                    }

                    console.log(
                        "USING EXISTING SHARED TIMER:",
                        room.next_game_time
                    );

                }

                // =========================
                // LOAD TAKEN BOARDS
                // =========================

                await loadTakenBoards(
                    game.id
                );

                await startBoardRealtime(
                    game.id
                );

                // =========================
                // CHECK BOARD AVAILABILITY
                // =========================

                if (
                    takenBoardNumbers.has(
                        Number(
                            selectedBoardNumber
                        )
                    )
                ) {

                    throw new Error(
                        "Board " +
                        selectedBoardNumber +
                        " has already been taken. Please select another board."
                    );

                }

                // =========================
                // CHECK IF PLAYER ALREADY JOINED
                // =========================

                const {
                    data: existingPlayer,
                    error: existingPlayerError
                } =
                    await supabase
                        .from("game_players")
                        .select(
                            "id, board_number, board"
                        )
                        .eq(
                            "game_id",
                            game.id
                        )
                        .eq(
                            "user_id",
                            userId
                        )
                        .maybeSingle();

                if (existingPlayerError) {

                    throw existingPlayerError;

                }

                // =========================
                // PLAYER ALREADY JOINED
                // =========================

                if (existingPlayer) {

                    console.log(
                        "PLAYER ALREADY JOINED:",
                        game.id,
                        existingPlayer.board_number
                    );

                    localStorage.setItem(
                        "gameId",
                        String(game.id)
                    );

                    localStorage.setItem(
                        "selectedBoard",
                        JSON.stringify(
                            existingPlayer.board ||
                            selectedBoard
                        )
                    );

                    localStorage.setItem(
                        "selectedBoardNumber",
                        String(
                            existingPlayer.board_number
                        )
                    );

                    localStorage.setItem(
                        "isHost",
                        "false"
                    );

                    showWaitingScreen();

                    await startWaitingRoom(
                        room.id,
                        game.id
                    );

                    return;

                }

                // =========================
                // PAY ENTRY FEE
                // =========================

                button.textContent =
                    "PAYING...";

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
                // FINAL BOARD CHECK
                // =========================

                await loadTakenBoards(
                    game.id
                );

                if (
                    takenBoardNumbers.has(
                        Number(
                            selectedBoardNumber
                        )
                    )
                ) {

                    throw new Error(
                        "Board " +
                        selectedBoardNumber +
                        " was taken by another player. Your entry fee will be refunded."
                    );

                }

                // =========================
                // ADD NEW PLAYER
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

                playerInserted =
                    true;

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
                    "false"
                );

                console.log(
                    "JOINED GAME:",
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
                // AND PLAYER WAS NOT INSERTED
                // =========================

                if (
                    payment &&
                    payment.success &&
                    payment.transactionId &&
                    !playerInserted
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
