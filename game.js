// ===============================
// VAMIOS BINGO GAME
// Realtime synchronized number calling
// Call interval: 5 seconds
// ===============================

const CALL_INTERVAL = 5000;

let gameChannel = null;
let callTimer = null;
let calledNumbers = [];
let playerCard = [];


// ===============================
// BINGO LETTER
// ===============================

function bingoLetter(number) {
  if (number <= 15) return 'B';
  if (number <= 30) return 'I';
  if (number <= 45) return 'N';
  if (number <= 60) return 'G';
  return 'O';
}


// ===============================
// CREATE PLAYER CARD
// ===============================

function createPlayerCard() {

  const container =
    document.getElementById('bingoCard');

  if (!container) return;

  container.innerHTML = '';
  playerCard = [];

  const numbers = [];

  while (numbers.length < 24) {

    const n =
      Math.floor(Math.random() * 75) + 1;

    if (!numbers.includes(n)) {
      numbers.push(n);
    }

  }

  let index = 0;

  for (let row = 0; row < 5; row++) {

    for (let col = 0; col < 5; col++) {

      const cell =
        document.createElement('div');

      cell.className = 'bingo-cell';

      if (row === 2 && col === 2) {

        cell.textContent = 'FREE';
        cell.classList.add('marked');

        playerCard.push('FREE');

      } else {

        const value =
          numbers[index++];

        cell.textContent = value;
        cell.dataset.number = value;

        playerCard.push(value);

      }

      container.appendChild(cell);

    }

  }

}


// ===============================
// SHOW CURRENT NUMBER
// ===============================

function showCurrentNumber(number) {

  const el =
    document.getElementById('calledNumber');

  if (!el) return;

  el.textContent =
    `${bingoLetter(number)} ${number}`;

}


// ===============================
// UPDATE CALLED NUMBERS
// ===============================

function updateCalledNumbers(numbers) {

  calledNumbers = numbers || [];

  // Mark board cells
  calledNumbers.forEach(number => {

    const cell =
      document.querySelector(
        `[data-number="${number}"]`
      );

    if (cell) {
      cell.classList.add('marked');
    }

  });

  // Update history
  const history =
    document.getElementById('calledHistory');

  if (!history) return;

  history.innerHTML = '';

  calledNumbers
    .slice()
    .reverse()
    .forEach(number => {

      const item =
        document.createElement('span');

      item.className = 'called-item';

      item.textContent =
        `${bingoLetter(number)} ${number}`;

      history.appendChild(item);

    });

}


// ===============================
// SUBSCRIBE TO GAME
// ===============================

async function subscribeGame(gameId) {

  if (gameChannel) {

    await supabase.removeChannel(
      gameChannel
    );

  }

  gameChannel =
    supabase

      .channel(`game-${gameId}`)

      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        payload => {

          const game = payload.new;

          if (game.current_number) {

            showCurrentNumber(
              game.current_number
            );

          }

          updateCalledNumbers(
            game.called_numbers || []
          );

        }
      )

      .subscribe();

}


// ===============================
// HOST NUMBER CALLER
// ===============================

async function startCalling(gameId) {

  if (callTimer) {
    clearInterval(callTimer);
  }

  const { data } =
    await supabase

      .from('games')

      .select('called_numbers')

      .eq('id', gameId)

      .single();

  let called =
    data?.called_numbers || [];

  async function callNext() {

    if (called.length >= 75) {

      clearInterval(callTimer);

      return;

    }

    const available = [];

    for (let i = 1; i <= 75; i++) {

      if (!called.includes(i)) {
        available.push(i);
      }

    }

    const next =
      available[
        Math.floor(
          Math.random() *
          available.length
        )
      ];

    called.push(next);

    await supabase

      .from('games')

      .update({

        current_number: next,

        called_numbers: called

      })

      .eq('id', gameId);

  }

  // First number immediately
  await callNext();

  // Then every 5 seconds
  callTimer =
    setInterval(
      callNext,
      CALL_INTERVAL
    );

}


// ===============================
// INITIALIZE GAME
// Called from waiting.js
// ===============================

async function initializeGame() {

  const gameId =
    localStorage.getItem('gameId');

  if (!gameId) return;

  createPlayerCard();

  await subscribeGame(gameId);

  const isHost =
    localStorage.getItem('isHost') === 'true';

  if (isHost) {

    await startCalling(gameId);

  }

}


// ===============================
// BINGO BUTTON
// ===============================

document.addEventListener('DOMContentLoaded', () => {

  const bingoBtn =
    document.getElementById('bingoBtn');

  if (bingoBtn) {

    bingoBtn.onclick = () => {

      if (typeof checkWinner === 'function') {

        checkWinner();

      }

    };

  }

});
