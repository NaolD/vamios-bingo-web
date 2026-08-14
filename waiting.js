// ===============================
// VAMIOS BINGO
// WAITING.JS
// ===============================

let waitingRoom = null;
let waitingGame = null;
let waitingTimer = null;

let waitingRoomChannel = null;
let waitingGameChannel = null;


// ==========================================
// LOAD WAITING ROOM
// ==========================================

async function loadWaiting() {

    const roomId =
        Number(localStorage.getItem("room_id"));

    const gameId =
        Number(localStorage.getItem("game_id"));

    if (!roomId || !gameId) {

        alert("Missing room or game.");

        showScreen("lobbyScreen");

        return;
    }

    // -------------------------------
    // LOAD ROOM
    // -------------------------------

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

        console.error(roomError);

        alert(roomError.message);

        return;
    }

    waitingRoom = room;

    // -------------------------------
    // LOAD GAME
    // -------------------------------

    const {
        data: game,
        error: gameError
    } =
        await supabaseClient
            .from("games")
            .select("*")
            .eq("id", gameId)
            .single();

    if (gameError) {

        console.error(gameError);

        alert(gameError.message);

        return;
    }

    waitingGame = game;

    // -------------------------------
    // UPDATE UI
    // -------------------------------

    const roomName =
        document.getElementById("waitingRoomName");

    const players =
        document.getElementById("waitingPlayers");

    const prize =
        document.getElementById("waitingPrize");

    if (roomName) {
        roomName.innerText =
            room.name || "Bingo Room";
    }

    if (players) {
        players.innerText =
            Number(game.player_count || 0);
    }

    if (prize) {
        prize.innerText =
            Number(game.prize_pool || 0).toFixed(2);
    }

    // -------------------------------
    // SHARED TIMER
    // -------------------------------

    let endTime = 0;

    if (room.next_game_time) {
        endTime =
            new Date(room.next_game_time).getTime();
    }

    if (!endTime || endTime <= Date.now()) {

        endTime =
            Date.now() + 60000;

        await supabaseClient
            .from("rooms")
            .update({
                next_game_time:
                    new Date(endTime).toISOString(),
                phase: "waiting",
                status: "waiting"
            })
            .eq("id", room.id);
    }

    startWaitingCountdown(endTime);

    await loadWaitingPlayers();

    subscribeWaitingRealtime(room.id, game.id);
}


// ==========================================
// LOAD PLAYER LIST
// ==========================================

async function loadWaitingPlayers() {

    if (!waitingGame) return;

    const list =
        document.getElementById("waitingPlayerList");

    if (!list) return;

    const {
        data: players,
        error
    } =
        await supabaseClient
            .from("game_players")
            .select("user_id, ready")
            .eq("game_id", waitingGame.id);

    if (error) {
        console.error(error);
        return;
    }

    if (!players || players.length === 0) {

        list.innerHTML =
            '<div class="player-item"><span class="player-status">●</span>Waiting for players...</div>';

        return;
    }

    list.innerHTML = "";

    players.forEach((player, index) => {

        const item =
            document.createElement("div");

        item.className =
            "player-item";

        item.innerHTML =
            '<span class="player-status">●</span>Player ' +
            (index + 1) +
            (player.ready
                ? ' <span style="color:#22c55e">(Ready)</span>'
                : '');

        list.appendChild(item);

    });
}


// ==========================================
// SHARED WAITING COUNTDOWN
// ==========================================

function startWaitingCountdown(endTime) {

    if (waitingTimer) {
        clearInterval(waitingTimer);
    }

    const countdown =
        document.getElementById("countdown");

    updateWaitingTime(endTime, countdown);

    waitingTimer =
        setInterval(async () => {

            const remaining =
                Math.max(
                    0,
                    Math.ceil((endTime - Date.now()) / 1000)
                );

            if (countdown) {
                countdown.innerText = remaining;
            }

            if (remaining <= 0) {

                clearInterval(waitingTimer);

                waitingTimer = null;

                if (countdown) {
                    countdown.innerText = "Starting...";
                }

                await startWaitingGame();
            }

        }, 1000);
}


// ==========================================
// UPDATE TIMER
// ==========================================

function updateWaitingTime(endTime, countdown) {

    if (!countdown) return;

    const remaining =
        Math.max(
            0,
            Math.ceil((endTime - Date.now()) / 1000)
        );

    countdown.innerText = remaining;
}


// ==========================================
// REAL-TIME SUBSCRIPTIONS
// ==========================================

function subscribeWaitingRealtime(roomId, gameId) {

    if (waitingRoomChannel) {
        supabaseClient.removeChannel(waitingRoomChannel);
    }

    if (waitingGameChannel) {
        supabaseClient.removeChannel(waitingGameChannel);
    }

    // -------------------------------
    // ROOM UPDATES
    // -------------------------------

    waitingRoomChannel =
        supabaseClient
            .channel("room-" + roomId)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "rooms",
                    filter: "id=eq." + roomId
                },
                payload => {

                    waitingRoom = payload.new;

                    if (waitingRoom.status === "playing") {

                        stopWaitingTimer();

                        openGameScreen();

                        return;
                    }

                    if (waitingRoom.next_game_time) {

                        const endTime =
                            new Date(waitingRoom.next_game_time).getTime();

                        startWaitingCountdown(endTime);
                    }

                }
            )
            .subscribe();

    // -------------------------------
    // GAME UPDATES
    // -------------------------------

    waitingGameChannel =
        supabaseClient
            .channel("game-" + gameId)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "games",
                    filter: "id=eq." + gameId
                },
                payload => {

                    waitingGame = payload.new;

                    const players =
                        document.getElementById("waitingPlayers");

                    const prize =
                        document.getElementById("waitingPrize");

                    if (players) {
                        players.innerText =
                            Number(waitingGame.player_count || 0);
                    }

                    if (prize) {
                        prize.innerText =
                            Number(waitingGame.prize_pool || 0).toFixed(2);
                    }

                    loadWaitingPlayers();

                    if (waitingGame.status === "playing") {

                        stopWaitingTimer();

                        openGameScreen();
                    }

                }
            )
            .subscribe();
}


// ==========================================
// START GAME
// ==========================================

async function startWaitingGame() {

    if (!waitingRoom || !waitingGame) return;

    const {
        data: currentRoom
    } =
        await supabaseClient
            .from("rooms")
            .select("status")
            .eq("id", waitingRoom.id)
            .single();

    if (currentRoom && currentRoom.status === "playing") {

        openGameScreen();

        return;
    }

    await supabaseClient
        .from("rooms")
        .update({
            status: "playing",
            phase: "playing",
            current_game_id: waitingGame.id
        })
        .eq("id", waitingRoom.id);

    await supabaseClient
        .from("games")
        .update({
            status: "playing",
            started_at: new Date().toISOString()
        })
        .eq("id", waitingGame.id);

    openGameScreen();
}


// ==========================================
// OPEN GAME SCREEN
// ==========================================

function openGameScreen() {

    showScreen("gameScreen");

    if (typeof startBingoGame === "function") {
        startBingoGame();
    }

}


// ==========================================
// CLEANUP
// ==========================================

function stopWaitingTimer() {

    if (waitingTimer) {
        clearInterval(waitingTimer);
        waitingTimer = null;
    }

    if (waitingRoomChannel) {
        supabaseClient.removeChannel(waitingRoomChannel);
        waitingRoomChannel = null;
    }

    if (waitingGameChannel) {
        supabaseClient.removeChannel(waitingGameChannel);
        waitingGameChannel = null;
    }
}
