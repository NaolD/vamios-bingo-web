// ===============================
// VAMIOS BINGO WINNER CHECK
// ===============================

function isMarked(value) {

  if (value === 'FREE') return true;

  return calledNumbers.includes(value);

}


// ===============================
// HORIZONTAL
// ===============================

function checkHorizontal() {

  for (let row = 0; row < 5; row++) {

    let ok = true;

    for (let col = 0; col < 5; col++) {

      const value =
        playerCard[row * 5 + col];

      if (!isMarked(value)) {
        ok = false;
      }

    }

    if (ok) return true;

  }

  return false;

}


// ===============================
// VERTICAL
// ===============================

function checkVertical() {

  for (let col = 0; col < 5; col++) {

    let ok = true;

    for (let row = 0; row < 5; row++) {

      const value =
        playerCard[row * 5 + col];

      if (!isMarked(value)) {
        ok = false;
      }

    }

    if (ok) return true;

  }

  return false;

}


// ===============================
// MAIN DIAGONAL
// ===============================

function checkDiagonal() {

  for (let i = 0; i < 5; i++) {

    const value =
      playerCard[i * 5 + i];

    if (!isMarked(value)) {
      return false;
    }

  }

  return true;

}


// ===============================
// REVERSE DIAGONAL
// ===============================

function checkReverseDiagonal() {

  for (let i = 0; i < 5; i++) {

    const value =
      playerCard[i * 5 + (4 - i)];

    if (!isMarked(value)) {
      return false;
    }

  }

  return true;

}


// ===============================
// FOUR CORNERS
// ===============================

function checkFourCorners() {

  const corners = [
    playerCard[0],
    playerCard[4],
    playerCard[20],
    playerCard[24]
  ];

  return corners.every(isMarked);

}


// ===============================
// SHOW WINNER
// ===============================

function showWinner(pattern, prize) {

  const box =
    document.getElementById('winnerBox');

  if (!box) return;

  box.classList.remove('hidden');

  document.getElementById('winnerPattern').textContent =
    `Winning Pattern: ${pattern}`;

  document.getElementById('winnerPrize').textContent =
    `Prize: ${prize.toFixed(2)} ETB`;

}


// ===============================
// SAVE WINNER TO SUPABASE
// ===============================

async function saveWinner(pattern) {

  const gameId =
    localStorage.getItem('gameId');

  const roomId =
    localStorage.getItem('roomId');

  const userId =
    localStorage.getItem('userId');

  if (!gameId || !roomId || !userId) return;

  // Check if winner already exists
  const { data: game } =
    await supabase

      .from('games')

      .select('winner_user_id')

      .eq('id', gameId)

      .single();

  if (game?.winner_user_id) {

    alert('Winner already declared');

    return;

  }

  // Get room for prize calculation
  const { data: room } =
    await supabase

      .from('rooms')

      .select('entry_fee')

      .eq('id', roomId)

      .single();

  const { data: players } =
    await supabase

      .from('game_players')

      .select('id')

      .eq('game_id', gameId);

  const totalPlayers =
    players?.length || 0;

  const prize =
    totalPlayers *
    room.entry_fee *
    0.8;

  // Save winner
  await supabase

    .from('games')

    .update({

      status: 'finished',

      winner_user_id: userId,

      winner_pattern: pattern,

      prize_amount: prize

    })

    .eq('id', gameId);

  showWinner(pattern, prize);

}


// ===============================
// MAIN CHECK
// ===============================

async function checkWinner() {

  let pattern = null;

  if (checkHorizontal()) {

    pattern = 'Horizontal';

  } else if (checkVertical()) {

    pattern = 'Vertical';

  } else if (checkDiagonal()) {

    pattern = 'Diagonal';

  } else if (checkReverseDiagonal()) {

    pattern = 'Reverse Diagonal';

  } else if (checkFourCorners()) {

    pattern = 'Four Corners';

  }

  if (!pattern) {

    alert('No Bingo yet!');

    return;

  }

  await saveWinner(pattern);

}
