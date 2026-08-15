// ===============================
// VAMIOS BINGO WAITING ROOM
// Shared countdown + realtime players
// ===============================

let waitingChannel = null;
let countdownTimer = null;


// ===============================
// START WAITING ROOM
// ===============================

async function startWaitingRoom(roomId, gameId) {

  // Clean previous channel
  if (waitingChannel) {
    await supabase.removeChannel(waitingChannel);
    waitingChannel = null;
  }

  // Load room information
  const { data: room } =
    await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

  if (!room) return;

  // Fill waiting screen
  document.getElementById('waitingRoomName').textContent =
    room.name || `${room.entry_fee} ETB Room`;

  document.getElementById('waitingPrize').textContent =
    ((room.entry_fee * 100) * 0.8).toFixed(2);

  // Load current players
  await loadWaitingPlayers(gameId);

  // Start shared countdown
  startSharedCountdown(room.next_game_time);

  // Realtime updates
  waitingChannel = supabase
    .channel(`waiting-${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${gameId}`
      },
      async () => {
        await loadWaitingPlayers(gameId);
      }
    )
    .subscribe();

}


// ===============================
// LOAD PLAYERS
// ===============================

async function loadWaitingPlayers(gameId) {

  const { data: players } =
    await supabase
      .from('game_players')
      .select('user_id')
      .eq('game_id', gameId);

  const list =
    document.getElementById('waitingPlayerList');

  const count =
    document.getElementById('waitingPlayers');

  if (!list || !count) return;

  list.innerHTML = '';

  const total =
    players?.length || 0;

  count.textContent = total;

  if (total === 0) {

    list.innerHTML =
      '<div class="player-item"><span class="player-status">●</span> Waiting for players...</div>';

    return;

  }

  players.forEach((player, index) => {

    const row =
      document.createElement('div');

    row.className = 'player-item';

    row.innerHTML =
      `<span class="player-status">●</span> Player ${index + 1}`;

    list.appendChild(row);

  });

}


// ===============================
// SHARED COUNTDOWN
// ===============================

function startSharedCountdown(nextGameTime) {

  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  const countdown =
    document.getElementById('countdown');

  function update() {

    const end =
      new Date(nextGameTime).getTime();

    const now =
      Date.now();

    let seconds =
      Math.max(
        0,
        Math.floor((end - now) / 1000)
      );

    if (countdown) {
      countdown.textContent = seconds;
    }

    if (seconds <= 0) {

      clearInterval(countdownTimer);

      // Hide waiting screen
      document
        .getElementById('waitingScreen')
        ?.classList.add('hidden');

      // Show game screen
      document
        .getElementById('gameScreen')
        ?.classList.remove('hidden');

      // Start game
      if (typeof initializeGame === 'function') {
        initializeGame();
      }

    }

  }

  update();

  countdownTimer =
    setInterval(update, 1000);

}
