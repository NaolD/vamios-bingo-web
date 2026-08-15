// ===============================
// VAMIOS BINGO BOARDS.JS
// ===============================

let selectedBoard = null;
let selectedFee = null;

// Called from the lobby game cards
function selectRoomByFee(fee) {
selectedFee = fee;
goToBoards();
generateBoards();
}

window.selectRoomByFee = selectRoomByFee;

// Generate board buttons 1-100
function generateBoards() {
const container = document.getElementById('boardContainer');
if (!container) return;

container.innerHTML = '';

for (let i = 1; i <= 100; i++) {
const btn = document.createElement('button');
btn.className = 'board-btn';
btn.textContent = i;

```
btn.onclick = () => {
  selectedBoard = i;

  document.querySelectorAll('.board-btn').forEach(b => {
    b.classList.remove('selected');
  });

  btn.classList.add('selected');

  showBoardPreview(i);

  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.disabled = false;
};

container.appendChild(btn);
```

}
}

// Deterministic preview from board number
function showBoardPreview(seed) {
const preview = document.getElementById('cardPreview');
if (!preview) return;

preview.innerHTML = '';

const grid = document.createElement('div');
grid.className = 'bingo-preview-grid';

let value = seed;

for (let i = 0; i < 25; i++) {
const cell = document.createElement('div');
cell.className = 'preview-cell';

```
if (i === 12) {
  cell.textContent = 'FREE';
} else {
  value = (value * 17 + 23) % 75;
  cell.textContent = value + 1;
}

grid.appendChild(cell);
```

}

preview.appendChild(grid);
}

// Join or create room
async function joinRoom() {
const userId = localStorage.getItem('userId');

if (!userId) {
alert('User not loaded');
return;
}

if (!selectedBoard) {
alert('Select a board number');
return;
}

if (!selectedFee) {
alert('Select a room');
return;
}

// Check wallet balance
const balance = await getBalance(userId);

if (balance < selectedFee) {
alert('Insufficient balance');
return;
}

// Deduct entry fee
const paid = await deductBalance(userId, selectedFee);

if (!paid) return;

// Find room
let { data: room } = await supabaseClient
.from('rooms')
.select('*')
.eq('entry_fee', selectedFee)
.maybeSingle();

// Create room if missing
if (!room) {
const nextTime = new Date(Date.now() + 60000).toISOString();

```
const result = await supabaseClient
  .from('rooms')
  .insert([
    {
      name: selectedFee + ' ETB Room',
      entry_fee: selectedFee,
      max_players: 100,
      status: 'waiting',
      next_game_time: nextTime
    }
  ])
  .select()
  .single();

room = result.data;
```

}

// Find active game
let game = null;

if (room.current_game_id) {
const { data } = await supabaseClient
.from('games')
.select('*')
.eq('id', room.current_game_id)
.maybeSingle();

```
game = data;
```

}

// Create game if missing
if (!game) {
const result = await supabaseClient
.from('games')
.insert([
{
room_id: room.id,
status: 'waiting',
called_numbers: []
}
])
.select()
.single();

```
game = result.data;

await supabaseClient
  .from('rooms')
  .update({ current_game_id: game.id })
  .eq('id', room.id);
```

}

// Determine host
const { data: players } = await supabaseClient
.from('game_players')
.select('id')
.eq('game_id', game.id);

const isHost = (players?.length || 0) === 0;

// Join game
await supabaseClient
.from('game_players')
.insert([
{
game_id: game.id,
user_id: userId,
board_id: selectedBoard,
ready: true
}
]);

// Save local state
localStorage.setItem('roomId', room.id);
localStorage.setItem('gameId', game.id);
localStorage.setItem('boardId', selectedBoard);
localStorage.setItem('entryFee', selectedFee);
localStorage.setItem('isHost', isHost ? 'true' : 'false');

// Open waiting room
goToWaiting();

if (typeof startWaitingRoom === 'function') {
startWaitingRoom(room.id, game.id);
}
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
generateBoards();

const startBtn = document.getElementById('startBtn');

if (startBtn) {
startBtn.disabled = true;
startBtn.onclick = joinRoom;
}
});
