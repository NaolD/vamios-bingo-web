// ===============================
// VAMIOS BINGO WAITING ROOM
// Realtime players + shared countdown
// ===============================

let waitingChannel = null;
let countdownTimer = null;


// ===============================
// START WAITING ROOM
// ===============================

async function startWaitingRoom(roomId, gameId) {

    console.log(
        "WAITING ROOM START:",
        roomId,
        gameId
    );


    // Stop old countdown

    if (countdownTimer) {

        clearInterval(
            countdownTimer
        );

        countdownTimer = null;

    }


    // Remove old realtime channel

    if (waitingChannel) {

        await supabase.removeChannel(
            waitingChannel
        );

        waitingChannel = null;

    }


    // ===============================
    // SAVE GAME INFORMATION
    // ===============================

    localStorage.setItem(
        "roomId",
        roomId
    );

    localStorage.setItem(
        "gameId",
        gameId
    );


    // ===============================
    // LOAD ROOM
    // ===============================

    const {
        data: room,
        error
    } =
        await supabase
            .from("rooms")
            .select("*")
            .eq(
                "id",
                roomId
            )
            .single();


    if (error) {

        console.error(
            "WAITING ROOM ERROR:",
            error
        );

        return;

    }


    if (!room) {

        console.error(
            "ROOM NOT FOUND"
        );

        return;

    }


    console.log(
        "ROOM:",
        room
    );


    // ===============================
    // ROOM INFORMATION
    // ===============================

    const roomName =
        document.getElementById(
            "waitingRoomName"
        );


    const prize =
        document.getElementById(
            "waitingPrize"
        );


    if (roomName) {

        roomName.textContent =
            room.name ||
            `${room.entry_fee} ETB Room`;

    }


    if (prize) {

        const maxPlayers =
            room.max_players || 100;


        const prizePool =
            room.entry_fee *
            maxPlayers *
            0.80;


        prize.textContent =
            prizePool.toFixed(2);

    }


    // ===============================
    // LOAD PLAYERS
    // ===============================

    await loadWaitingPlayers(
        gameId
    );


    // ===============================
    // SHARED COUNTDOWN
    // ===============================

    if (
        room.next_game_time
    ) {

        startSharedCountdown(
            room.next_game_time,
            roomId,
            gameId
        );

    } else {

        console.error(
            "ROOM HAS NO next_game_time"
        );

    }


    // ===============================
    // REALTIME PLAYERS
    // ===============================

    waitingChannel =
        supabase
            .channel(
                `waiting-room-${gameId}`
            )

            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "game_players",
                    filter:
                        `game_id=eq.${gameId}`
                },
                async payload => {

                    console.log(
                        "PLAYER JOINED:",
                        payload.new
                    );


                    await loadWaitingPlayers(
                        gameId
                    );

                }
            )

            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "game_players",
                    filter:
                        `game_id=eq.${gameId}`
                },
                async () => {

                    console.log(
                        "PLAYER LEFT"
                    );


                    await loadWaitingPlayers(
                        gameId
                    );

                }
            )

            .subscribe(
                status => {

                    console.log(
                        "WAITING REALTIME:",
                        status
                    );

                }
            );

}


// ===============================
// LOAD WAITING PLAYERS
// ===============================

async function loadWaitingPlayers(
    gameId
) {

    const {
        data: players,
        error
    } =
        await supabase
            .from("game_players")
            .select("user_id")
            .eq(
                "game_id",
                gameId
            );


    if (error) {

        console.error(
            "PLAYER LOAD ERROR:",
            error
        );

        return;

    }


    const list =
        document.getElementById(
            "waitingPlayerList"
        );


    const count =
        document.getElementById(
            "waitingPlayers"
        );


    if (!list || !count) {

        console.error(
            "WAITING PLAYER ELEMENTS NOT FOUND"
        );

        return;

    }


    list.innerHTML = "";


    const total =
        players?.length || 0;


    count.textContent =
        total;


    if (total === 0) {

        list.innerHTML =
            `
            <div class="player-item">
                <span class="player-status">●</span>
                Waiting for players...
            </div>
            `;

        return;

    }


    players.forEach(
        (player, index) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "player-item";


            row.innerHTML =
                `
                <span class="player-status">●</span>
                Player ${index + 1}
                `;


            list.appendChild(
                row
            );

        }
    );

}


// ===============================
// SHARED COUNTDOWN
// ===============================

function startSharedCountdown(
    nextGameTime,
    roomId,
    gameId
) {

    console.log(
        "STARTING SHARED COUNTDOWN:",
        nextGameTime
    );


    if (countdownTimer) {

        clearInterval(
            countdownTimer
        );

        countdownTimer = null;

    }


    const countdown =
        document.getElementById(
            "countdown"
        );


    if (!countdown) {

        console.error(
            "COUNTDOWN ELEMENT NOT FOUND"
        );

        return;

    }


    // ===============================
    // CONVERT TIME
    // ===============================

    let endTime;


    if (
        typeof nextGameTime ===
        "string"
    ) {

        endTime =
            new Date(
                nextGameTime.replace(
                    " ",
                    "T"
                )
            ).getTime();

    } else {

        endTime =
            new Date(
                nextGameTime
            ).getTime();

    }


    if (
        !Number.isFinite(endTime)
    ) {

        console.error(
            "INVALID NEXT GAME TIME:",
            nextGameTime
        );

        return;

    }


    // ===============================
    // COUNTDOWN UPDATE
    // ===============================

    function updateCountdown() {

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


        countdown.textContent =
            remaining;


        console.log(
            "COUNTDOWN:",
            remaining
        );


        // ===============================
        // GAME START
        // ===============================

        if (
            remaining <= 0
        ) {

            clearInterval(
                countdownTimer
            );

            countdownTimer = null;


            console.log(
                "COUNTDOWN FINISHED"
            );


            enterGame(
                roomId,
                gameId
            );

        }

    }


    // Run immediately

    updateCountdown();


    // Then every second

    countdownTimer =
        setInterval(
            updateCountdown,
            1000
        );

}


// ===============================
// ENTER GAME
// ===============================

async function enterGame(
    roomId,
    gameId
) {

    console.log(
        "================================"
    );

    console.log(
        "ENTERING GAME:",
        roomId,
        gameId
    );

    console.log(
        "================================"
    );


    // Prevent duplicate execution

    if (
        window.vamiosGameStarted
    ) {

        console.log(
            "GAME ALREADY STARTED"
        );

        return;

    }


    window.vamiosGameStarted =
        true;


    // ===============================
    // STOP WAITING REALTIME
    // ===============================

    if (waitingChannel) {

        await supabase.removeChannel(
            waitingChannel
        );

        waitingChannel = null;

    }


    // ===============================
    // STOP COUNTDOWN
    // ===============================

    if (countdownTimer) {

        clearInterval(
            countdownTimer
        );

        countdownTimer = null;

    }


    // ===============================
    // SAVE GAME ID
    // ===============================

    localStorage.setItem(
        "roomId",
        roomId
    );

    localStorage.setItem(
        "gameId",
        gameId
    );


    // ===============================
    // SHOW GAME SCREEN
    // ===============================

    const waitingScreen =
        document.getElementById(
            "waitingScreen"
        );


    const gameScreen =
        document.getElementById(
            "gameScreen"
        );


    if (waitingScreen) {

        waitingScreen.classList.add(
            "hidden"
        );

    }


    if (gameScreen) {

        gameScreen.classList.remove(
            "hidden"
        );

    }


    // ===============================
    // INITIALIZE GAME
    // ===============================

    if (
        typeof initializeGame ===
        "function"
    ) {

        console.log(
            "CALLING initializeGame:",
            gameId
        );


        try {

            await initializeGame(
                gameId
            );

        } catch (error) {

            console.error(
                "GAME INITIALIZATION ERROR:",
                error
            );


            alert(
                "GAME INITIALIZATION ERROR:\n\n" +
                (
                    error.message ||
                    String(error)
                )
            );

        }

    } else {

        console.error(
            "initializeGame() NOT FOUND"
        );


        alert(
            "ERROR: game.js is not loaded."
        );

    }

}


// ===============================
// WAITING ROOM JS LOADED
// ===============================

console.log(
    "WAITING JS LOADED"
);
