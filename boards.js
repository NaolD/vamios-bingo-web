// ===============================
// VAMIOS BINGO BOARDS
// Select board and join room
// ===============================

let selectedBoard = null;
let selectedFee = null;


// ===============================
// ROOM SELECTION
// ===============================

function selectRoomByFee(fee) {

  selectedFee = fee;

  goToBoards();

  generateBoards();

}

window.selectRoomByFee = selectRoomByFee;


// ===============================
// GENERATE BOARD NUMBERS
// ===============================

function generateBoards() {

  const container =
    document.getElementById('boardContainer');

  if (!container) return;

  container.innerHTML = '';

  for (let i = 1; i <= 100; i++) {

    const btn =
      document.createElement('button');

    btn.className = 'board-btn';

    btn.textContent = i;

    btn.onclick = () => selectBoard(i);

    container.appendChild(btn);

  }

}


// ===============================
// SELECT BOARD
// ===============================

function selectBoard(number) {

  selectedBoard = number;

  document
    .querySelectorAll('.board-btn')
    .forEach(btn => btn.classList.remove('selected'));

  const buttons =
    document.querySelectorAll('.board-btn');

  buttons[number - 1]?.classList.add('selected');

  const startBtn =
    document.getElementById('startBtn');

  if (startBtn) {
    startBtn.disabled = false;
  }

}


// ===============================
// CREATE SIMPLE BINGO CARD
// ===============================

function createCardPreview() {

  const preview =
    document.getElementById('cardPreview');

  if (!preview) return;

  preview.innerHTML = '';

  const card =
    document.createElement('div');

  card.className = 'bingo-preview-grid';

  for (let i = 1; i <= 25; i++) {

    const cell =
      document.createElement('div');

    cell.className = 'preview-cell';

    if (i === 13) {

      cell.textContent = 'FREE';

    } else {

      cell.textContent =
        Math.floor(Math.random() * 75) + 1;

    }

    card.appendChild(cell);

  }

  preview.appendChild(card);

}


// ===============================
// START GAME BUTTON
// ===============================

document.addEventListener('DOMContentLoaded', () => {

  createCardPreview();

  const startBtn =
    document.getElementById('startBtn');

  if (startBtn) {

    startBtn.onclick = joinRoom;

  }

});


// ===============================
// JOIN OR CREATE ROOM
// ===============================

async function joinRoom() {

  if (!selectedBoard || !selectedFee) {

    alert('Select a board first');

    return;

  }


  // Get current room by entry fee
  let { data: room } =
    await supabase

      .from('rooms')

      .select('*')

      .eq('entry_fee', selectedFee)

      .single();


  // Create room if missing
  if (!room) {

    const next =
      new Date(
        Date.now() + 60000
      ).toISOString();


    const { data: created } =
      await supabase

        .from('rooms')

        .insert({

          name: `${selectedFee} ETB Room`,

          entry_fee: selectedFee,

          max_players: 100,

          status: 'waiting',

          next_game_time: next

        })

        .select()

        .single();


    room = created;

  }


  // Get active game
  let game = null;

  if (room.current_game_id) {

    const { data } =
      await supabase

        .from('games')

        .select('*')

        .eq('id', room.current_game_id)

        .single();


    game = data;

  }


  // Create game if missing
  if (!game) {

    const { data: newGame } =
      await supabase

        .from('games')

        .insert({

          room_id: room.id,

          status: 'waiting',

          called_numbers: []

        })

        .select()

        .single();


    game = newGame;


    await supabase

      .from('rooms')

      .update({
        current_game_id: game.id
      })

      .eq('id', room.id);

  }


  // Check current players
  const { data: players } =
    await supabase

      .from('game_players')

      .select('id')

      .eq('game_id', game.id);


  const isHost =
    (players?.length || 0) === 0;


  // Temporary user id
  let userId =
    localStorage.getItem('userId');

  if (!userId) {

    userId =
      'user_' +
      Math.random()
        .toString(36)
        .substring(2, 10);

    localStorage.setItem(
      'userId',
      userId
    );

  }


  // Join game
  await supabase

    .from('game_players')

    .insert({

      game_id: game.id,

      user_id: userId,

      board_id: selectedBoard,

      ready: true

    });


  // Save local state
  localStorage.setItem(
    'roomId',
    room.id
  );

  localStorage.setItem(
    'gameId',
    game.id
  );

  localStorage.setItem(
    'boardId',
    selectedBoard
  );

  localStorage.setItem(
    'entryFee',
    selectedFee
  );

  localStorage.setItem(
    'isHost',
    isHost ? 'true' : 'false'
  );


  console.log(
    'Joined room',
    room.id,
    'Game',
    game.id,
    'Host:',
    isHost
  );


  goToWaiting();

  if (typeof startWaitingRoom === 'function') {

    startWaitingRoom(
      room.id,
      game.id
    );

  }

}
