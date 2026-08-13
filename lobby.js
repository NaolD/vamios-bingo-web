// ======================================
// VAMIOS BINGO - LOBBY.JS
// ======================================

// Load wallet balance and room statistics
async function loadLobby() {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        const balance = await getBalance(user.id);

        const balanceInfo = document.getElementById("balanceInfo");
        if (balanceInfo) {
            balanceInfo.innerText = Number(balance).toFixed(2) + " ETB";
        }

        const walletBalance = document.getElementById("walletBalance");
        if (walletBalance) {
            walletBalance.innerText = "Balance: " + Number(balance).toFixed(2) + " ETB";
        }

        await loadRooms();
    } catch (err) {
        console.error("Lobby load error:", err);
    }
}

// ======================================
// LOAD ROOMS
// ======================================

async function loadRooms() {
    const { data: rooms, error } = await supabaseClient
        .from("rooms")
        .select("*")
        .order("entry_fee");

    if (error) {
        console.error("Load rooms error:", error);
        return;
    }

    let totalPlayers = 0;

    rooms.forEach(room => {
        totalPlayers += Number(room.current_players || 0);

        const fee = Number(room.entry_fee || 0);

        const playersEl = document.getElementById("players" + fee);
        if (playersEl) {
            playersEl.innerText = `${room.current_players || 0}/${room.max_players || 100}`;
        }

        const prize = (Number(room.current_players || 0) * fee) * 0.8;
        const prizeEl = document.getElementById("prize" + fee);
        if (prizeEl) {
            prizeEl.innerText = prize.toFixed(0) + " ETB";
        }
    });

    const livePlayers = document.getElementById("livePlayers");
    if (livePlayers) {
        livePlayers.innerText = totalPlayers;
    }

    const jackpot = rooms.reduce((sum, room) => {
        return sum + (Number(room.current_players || 0) * Number(room.entry_fee || 0) * 0.02);
    }, 0);

    const jackpotAmount = document.querySelector(".jackpot-amount");
    if (jackpotAmount) {
        jackpotAmount.innerText = jackpot.toFixed(0) + " ETB";
    }

    const jackpotFill = document.querySelector(".jackpot-fill");
    if (jackpotFill) {
        const percent = Math.min((jackpot / 1000) * 100, 100);
        jackpotFill.style.width = percent + "%";
    }
}

// ======================================
// SELECT ROOM BY BET
// ======================================

async function selectRoomByFee(entryFee) {
    try {
        const { data: room, error } = await supabaseClient
            .from("rooms")
            .select("*")
            .eq("entry_fee", entryFee)
            .single();

        if (error || !room) {
            alert("Room not found.");
            return;
        }

        localStorage.setItem("room_id", room.id);
        localStorage.setItem("room_name", room.name);

        showScreen("boardScreen");

        if (typeof loadBoards === "function") {
            loadBoards();
        }
    } catch (err) {
        console.error(err);
        alert("Could not open room.");
    }
}

// ======================================
// PLAY BINGO BUTTON
// ======================================

function goToBoards() {
    showScreen("boardScreen");

    if (typeof loadBoards === "function") {
        loadBoards();
    }
}

// ======================================
// BACK TO LOBBY
// ======================================

function goToLobby() {
    showScreen("lobbyScreen");
    loadLobby();
}

// ======================================
// AUTO LOAD
// ======================================

document.addEventListener("DOMContentLoaded", loadLobby);