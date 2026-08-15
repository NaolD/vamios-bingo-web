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

  console.log("WAITING ROOM START:", roomId, gameId);

  // Stop previous countdown
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  // Remove previous realtime channel
  if (waitingChannel) {
    await supabase.removeChannel(waitingChannel);
    waitingChannel = null;
  }


  // ===============================
  // LOAD ROOM
  // ===============================

  const { data: room, error } =
    await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

  if (error) {
    console.error("WAITING ROOM ERROR:", error);
    return;
  }

  if (!room) {
    console.error("ROOM NOT FOUND");
    return;
  }


  console.log("ROOM:", room);


  // ===============================
  // SHOW ROOM INFORMATION
  // ===============================

  const roomName =
    document.getElementById("waitingRoomName");

  const prize =
    document.getElementById("waitingPrize");

  if (roomName) {
    roomName.textContent =
      room.name || `${room.entry_fee} ETB Room`;
  }

  if (prize) {

    // Prize = players × entry fee × 80%
    // Maximum 100 players

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

  await loadWaitingPlayers(gameId);


  // ===============================
  // START SHARED COUNTDOWN
  // ===============================

  if (room.next_game_time) {

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
      .channel(`waiting-room-${gameId}`)

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`
        },
        async (payload) => {

          console.log(
            "PLAYER JOINED:",
            payload.new
          );

          await loadWaitingPlayers(gameId);

        }
      )

      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`
        },
        async () => {

          console.log(
            "PLAYER LEFT"
          );

          await loadWaitingPlayers(gameId);

        }
      )

      .subscribe((status) => {

        console.log(
          "WAITING REALTIME:",
          status
        );

      });

}


// ===============================
// LOAD WAITING PLAYERS
// ===============================

async function loadWaitingPlayers(gameId) {

  const {
    data: players,
    error
  } =
    await supabase
      .from("game_players")
      .select("user_id")
      .eq("game_id", gameId);

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
        document.createElement("div");

      row.className =
        "player-item";

      row.innerHTML =
        `
        <span class="player-status">●</span>
        Player ${index + 1}
        `;

      list.appendChild(row);

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


  function updateCountdown() {

    const end =
      new Date(
        nextGameTime
      ).getTime();

    const now =
      Date.now();

    const difference =
      end - now;


    const seconds =
      Math.max(
        0,
        Math.ceil(
          difference / 1000
        )
      );


    if (countdown) {

      countdown.textContent =
        seconds;

    }


    console.log(
      "WAITING COUNTDOWN:",
      seconds
    );


    // ===============================
    // COUNTDOWN FINISHED
    // ===============================

    if (difference <= 0) {

      clearInterval(
        countdownTimer
      );

      countdownTimer =
        null;


      enterGame(
        roomId,
        gameId
      );

    }

  }


  updateCountdown();


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
    "ENTERING GAME:",
    roomId,
    gameId
  );


  // Prevent duplicate execution

  if (
    window.vamiosGameStarted
  ) {
    return;
  }

  window.vamiosGameStarted =
    true;


  // ===============================
  // STOP REALTIME
  // ===============================

  if (waitingChannel) {

    await supabase
      .removeChannel(
        waitingChannel
      );

    waitingChannel =
      null;
  }


  // ===============================
  // HIDE WAITING
  // ===============================

  document
    .getElementById(
      "waitingScreen"
    )
    ?.classList.add(
      "hidden"
    );


  // ===============================
  // SHOW GAME
  // ===============================

  document
    .getElementById(
      "gameScreen"
    )
    ?.classList.remove(
      "hidden"
    );


  // ===============================
  // INITIALIZE GAME
  // ===============================

  if (
    typeof initializeGame ===
    "function"
  ) {

    await initializeGame(
      gameId
    );

  } else {

    console.error(
      "initializeGame() NOT FOUND"
    );

  }

}