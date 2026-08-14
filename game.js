// ===============================
// VAMIOS BINGO GAME
// Realtime synchronized number calling
// Call interval: 5 seconds
// ===============================

const CALL_INTERVAL = 5000;
let gameSubscription = null;
let calledNumbers = [];

function bingoLetter(number) {
  if (number <= 15) return 'B';
  if (number <= 30) return 'I';
  if (number <= 45) return 'N';
  if (number <= 60) return 'G';
  return 'O';
}

function showCurrentNumber(number) {
  const currentEl = document.getElementById('currentCall');
  if (!currentEl) return;

  currentEl.textContent = `${bingoLetter(number)} ${number}`;

  currentEl.classList.remove('call-pop');
  void currentEl.offsetWidth;
  currentEl.classList.add('call-pop');
}

function updateCalledBoard(numbers) {
  calledNumbers = numbers || [];

  calledNumbers.forEach((n) => {
    const cell = document.querySelector(`[data-number="${n}"]`);
    if (cell) cell.classList.add('called');
  });
}

async function subscribeToGame(gameId) {
  if (gameSubscription) {
    await supabase.removeChannel(gameSubscription);
  }

  gameSubscription = supabase
    .channel(`game-${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`,
      },
      (payload) => {
        const game = payload.new;

        if (game.current_number) {
          showCurrentNumber(game.current_number);
        }

        updateCalledBoard(game.called_numbers || []);
      }
    )
    .subscribe();
}

// Host only: start calling numbers every 5 seconds
async function startNumberCalling(gameId) {
  const { data } = await supabase
    .from('games')
    .select('called_numbers')
    .eq('id', gameId)
    .single();

  let called = data?.called_numbers || [];

  const available = [];
  for (let i = 1; i <= 75; i++) {
    if (!called.includes(i)) available.push(i);
  }

  setInterval(async () => {
    if (available.length === 0) return;

    const index = Math.floor(Math.random() * available.length);
    const next = available.splice(index, 1)[0];

    called.push(next);

    await supabase
      .from('games')
      .update({
        current_number: next,
        called_numbers: called,
      })
      .eq('id', gameId);
  }, CALL_INTERVAL);
}

// Initialize
(async () => {
  const gameId = localStorage.getItem('gameId');
  if (!gameId) return;

  await subscribeToGame(gameId);

  // Only the host should call numbers
  const isHost = localStorage.getItem('isHost') === 'true';
  if (isHost) {
    await startNumberCalling(gameId);
  }
})();
