// ===============================
// VAMIOS BINGO GAME
// Realtime synchronized number calling
// Call interval: 5 seconds
// ===============================

const CALL_INTERVAL = 5000;

let gameSubscription = null;
let callInterval = null;
let calledNumbers = [];


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
// SHOW CURRENT NUMBER
// ===============================

function showCurrentNumber(number) {

  const currentEl =
    document.getElementById('calledNumber');

  if (!currentEl) return;

  currentEl.textContent =
    `${bingoLetter(number)} ${number}`;

  currentEl.classList.remove('call-pop');

  void currentEl.offsetWidth;

  currentEl.classList.add('call-pop');
}


// ===============================
// UPDATE CALLED NUMBERS
// ===============================

function updateCalledBoard(numbers) {

  calledNumbers = numbers || [];

  // Mark numbers on bingo card
  calledNumbers.forEach((number) => {

    const cell =
      document.querySelector(
        `[data-number="${number}"]`
      );

    if (cell) {
      cell.classList.add('called');
    }

  });


  // Update called history
  const history =
    document.getElementById('calledHistory');

  if (!history) return;

  history.innerHTML = '';

  calledNumbers
    .slice()
    .reverse()
    .forEach((number) => {

      const item =
        document.createElement('span');

      item.className = 'called-number';

      item.textContent =
        `${bingoLetter(number)} ${number}`;

      history.appendChild(item);

    });
}


// ===============================
// REALTIME GAME SUBSCRIPTION
// ===============================

async function subscribeToGame(gameId) {

  // Remove previous subscription
  if (gameSubscription) {

    await supabase.removeChannel(
      gameSubscription
    );

    gameSubscription = null;
  }


  gameSubscription =
    supabase

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

          console.log(
            'Realtime game update:',
            game
          );


          // Show current number
          if (game.current_number) {

            showCurrentNumber(
              game.current_number
            );

          }


          // Update called numbers
          updateCalledBoard(
            game.called_numbers || []
          );

        }
      )

      .subscribe((status) => {

        console.log(
          'Game realtime status:',
          status
        );

      });
}


// ===============================
// HOST: START NUMBER CALLING
// ===============================

async function startNumberCalling(gameId) {

  // Prevent duplicate interval
  if (callInterval) {

    clearInterval(callInterval);

    callInterval = null;

  }


  // Get current game state
  const { data, error } =
    await supabase

      .from('games')

      .select(
        'called_numbers,current_number,status'
      )

      .eq('id', gameId)

      .single();


  if (error) {

    console.error(
      'Could not load game:',
      error
    );

    return;

  }


  let called =
    data?.called_numbers || [];


  calledNumbers = called;


  updateCalledBoard(called);


  // Do not start if game is already finished
  if (
    data?.status === 'finished' ||
    data?.status === 'completed'
  ) {

    console.log(
      'Game already finished.'
    );

    return;

  }


  // ===============================
  // CALL FUNCTION
  // ===============================

  async function callNextNumber() {

    // Stop at 75 numbers
    if (called.length >= 75) {

      console.log(
        'All 75 Bingo numbers have been called.'
      );

      clearInterval(callInterval);

      callInterval = null;

      return;

    }


    // Create available numbers
    const available = [];

    for (
      let i = 1;
      i <= 75;
      i++
    ) {

      if (!called.includes(i)) {

        available.push(i);

      }

    }


    if (available.length === 0) {

      clearInterval(callInterval);

      callInterval = null;

      return;

    }


    // Random number
    const index =
      Math.floor(
        Math.random() *
        available.length
      );


    const next =
      available[index];


    // Add to called list
    called.push(next);


    // Save to Supabase
    const { error } =
      await supabase

        .from('games')

        .update({

          current_number: next,

          called_numbers: called

        })

        .eq('id', gameId);


    if (error) {

      console.error(
        'Number update failed:',
        error
      );

      // Remove it locally if save failed
      called.pop();

      return;

    }


    console.log(
      `Called: ${bingoLetter(next)} ${next}`
    );

  }


  // ===============================
  // FIRST CALL
  // ===============================

  await callNextNumber();


  // ===============================
  // NEXT CALLS EVERY 5 SECONDS
  // ===============================

  callInterval =
    setInterval(
      callNextNumber,
      CALL_INTERVAL
    );

}


// ===============================
// INITIALIZE GAME
// ===============================

(async () => {

  const gameId =
    localStorage.getItem('gameId');


  if (!gameId) {

    console.log(
      'No gameId found.'
    );

    return;

  }


  console.log(
    'Starting game:',
    gameId
  );


  // Connect realtime
  await subscribeToGame(
    gameId
  );


  // Only host calls numbers
  const isHost =
    localStorage.getItem('isHost') === 'true';


  console.log(
    'Is host:',
    isHost
  );


  if (isHost) {

    await startNumberCalling(
      gameId
    );

  }

})();
