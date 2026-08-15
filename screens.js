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

function showScreen(id) {

  screens.forEach(screenId => {

    const el = document.getElementById(screenId);

    if (!el) return;

    if (screenId === id) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }

  });

}


// ===============================
// NAVIGATION
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
