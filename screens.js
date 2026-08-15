// ===============================
// VAMIOS BINGO SCREEN MANAGER
// ===============================

const screens = [
'lobbyScreen',
'boardScreen',
'waitingScreen',
'gameScreen',
'walletScreen',
'depositScreen',
'withdrawScreen'
];

function showScreen(screenId) {
screens.forEach(id => {
const el = document.getElementById(id);
if (!el) return;

```
if (id === screenId) {
  el.classList.remove('hidden');
} else {
  el.classList.add('hidden');
}
```

});
}

// ===============================
// NAVIGATION FUNCTIONS
// ===============================

function goToLobby() {
showScreen('lobbyScreen');
}

function goToBoards() {
showScreen('boardScreen');
}

function goToWaiting() {
showScreen('waitingScreen');
}

function goToGame() {
showScreen('gameScreen');
}

function goToWallet() {
showScreen('walletScreen');
}

function goToDeposit() {
showScreen('depositScreen');
}

function goToWithdraw() {
showScreen('withdrawScreen');
}

// ===============================
// START ON LOBBY
// ===============================

document.addEventListener('DOMContentLoaded', () => {
showScreen('lobbyScreen');
});
