// ===============================
// VAMIOS BINGO
// WAITING.JS
// ===============================

let waitingRoom = null;
let waitingGame = null;
let waitingTimer = null;


// ==========================================
// LOAD WAITING ROOM
// ==========================================

async function loadWaiting() {

    const roomId =
        Number(
            localStorage.getItem(
                "room_id"
            )
        );

    const gameId =
        Number(
            localStorage.getItem(
                "game_id"
            )
        );


    if (!roomId || !gameId) {

        alert(
            "Missing room or game."
        );

        showScreen(
            "lobbyScreen"
        );

        return;
    }


    // ==========================================
    // LOAD ROOM
    // ==========================================

    const {
        data: room,
        error: roomError
    } = await supabaseClient
        .from("rooms")
        .select("*")
        .eq(
            "id",
            roomId
        )
        .single();


    if (roomError) {

        console.error(
            "Waiting room error:",
            roomError
        );

        alert(
            roomError.message
        );

        return;
    }


    waitingRoom =
        room;


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
            "Waiting game error:",
            gameError
        );

        alert(
            gameError.message
        );

        return;
    }


    waitingGame =
        game;


    // ==========================================
    // UPDATE WAITING SCREEN
    // ==========================================

    const roomName =
        document.getElementById(
            "waitingRoomName"
        );

    const players =
        document.getElementById(
            "waitingPlayers"
        );

    const prize =
        document.getElementById(
            "waitingPrize"
        );


    if (roomName) {

        roomName.innerText =
            room.name ||
            "Bingo Room";
    }


    if (players) {

        players.innerText =
            Number(
                game.player_count || 0
            );
    }


    if (prize) {

        prize.innerText =
            Number(
                game.prize_pool || 0
            ).toFixed(2) +
            " ETB";
    }


    // ==========================================
    // GET SHARED GAME START TIME
    // ==========================================

    let endTime = 0;


    if (
        room.next_game_time
    ) {

        endTime =
            new Date(
                room.next_game_time
            ).getTime();
    }


    // ==========================================
    // CREATE SHARED 60 SECOND TIME
    // ==========================================

    if (
        !endTime ||
        endTime <= Date.now()
    ) {

        endTime =
            Date.now() +
            60000;


        const {
            error: updateError
        } =
            await supabaseClient
                .from("rooms")
                .update({
                    next_game_time:
                        new Date(
                            endTime
                        ).toISOString(),

                    phase:
                        "waiting",

                    status:
                        "waiting"
                })
                .eq(
                    "id",
                    room.id
                );


        if (updateError) {

            console.error(
                "Timer update error:",
                updateError
            );
        }
    }


    startWaitingCountdown(
        endTime
    );
}


// ==========================================
// SHARED WAITING COUNTDOWN
// ==========================================

function startWaitingCountdown(
    endTime
) {

    if (waitingTimer) {

        clearInterval(
            waitingTimer
        );
    }


    const countdown =
        document.getElementById(
            "countdown"
        );


    // ==========================================
    // UPDATE IMMEDIATELY
    // ==========================================

    updateWaitingTime(
        endTime,
        countdown
    );


    waitingTimer =
        setInterval(
            async () => {

                const remaining =
                    Math.max(
                        0,
                        Math.ceil(
                            (
                                endTime -
                                Date.now()
                            ) / 1000
                        )
                    );


                // Keep countdown available internally.
                if (countdown) {

                    countdown.innerText =
                        remaining;
                }


                if (
                    remaining <= 0
                ) {

                    clearInterval(
                        waitingTimer
                    );

                    waitingTimer =
                        null;


                    if (countdown) {

                        countdown.innerText =
                            "Starting...";
                    }


                    await startWaitingGame();

                }

            },
            1000
        );
}


// ==========================================
// UPDATE TIMER
// ==========================================

function updateWaitingTime(
    endTime,
    countdown
) {

    if (!countdown) {
        return;
    }


    const remaining =
        Math.max(
            0,
            Math.ceil(
                (
                    endTime -
                    Date.now()
                ) / 1000
            )
        );


    countdown.innerText =
        remaining;
}


// ==========================================
// START GAME
// ==========================================

async function startWaitingGame() {

    if (
        !waitingRoom ||
        !waitingGame
    ) {

        return;
    }


    // ==========================================
    // CHECK CURRENT ROOM STATE
    // ==========================================

    const {
        data: currentRoom,
        error: roomError
    } =
        await supabaseClient
            .from("rooms")
            .select(
                "status, phase, current_game_id"
            )
            .eq(
                "id",
                waitingRoom.id
            )
            .single();


    if (roomError) {

        console.error(
            "Room state error:",
            roomError
        );

        return;
    }


    // ==========================================
    // IF ANOTHER PLAYER ALREADY STARTED IT
    // ==========================================

    if (
        currentRoom.status ===
        "playing"
    ) {

        openGameScreen();

        return;
    }


    // ==========================================
    // START ROOM
    // ==========================================

    const {
        error: roomUpdateError
    } =
        await supabaseClient
            .from("rooms")
            .update({
                status:
                    "playing",

                phase:
                    "playing",

                current_game_id:
                    waitingGame.id
            })
            .eq(
                "id",
                waitingRoom.id
            );


    if (roomUpdateError) {

        console.error(
            "Room start error:",
            roomUpdateError
        );

        return;
    }


    // ==========================================
    // START GAME
    // ==========================================

    const {
        error: gameUpdateError
    } =
        await supabaseClient
            .from("games")
            .update({
                status:
                    "playing",

                started_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                waitingGame.id
            );


    if (gameUpdateError) {

        console.error(
            "Game start error:",
            gameUpdateError
        );

        return;
    }


    openGameScreen();
}


// ==========================================
// OPEN GAME SCREEN
// ==========================================

function openGameScreen() {

    showScreen(
        "gameScreen"
    );


    if (
        typeof startBingoGame ===
        "function"
    ) {

        startBingoGame();

    } else {

        console.error(
            "startBingoGame() not found"
        );
    }
}


// ==========================================
// CLEANUP
// ==========================================

function stopWaitingTimer() {

    if (waitingTimer) {

        clearInterval(
            waitingTimer
        );

        waitingTimer =
            null;
    }
}