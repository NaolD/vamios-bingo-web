cat > winner.js <<'EOF'
function isMarked(value) {
    if (value === "FREE") return true;
    return calledNumbers.includes(Number(value));
}

function checkHorizontal() {
    for (let row = 0; row < 5; row++) {
        let complete = true;

        for (let col = 0; col < 5; col++) {
            if (!isMarked(playerCard[row * 5 + col])) {
                complete = false;
                break;
            }
        }

        if (complete) return true;
    }

    return false;
}

function checkVertical() {
    for (let col = 0; col < 5; col++) {
        let complete = true;

        for (let row = 0; row < 5; row++) {
            if (!isMarked(playerCard[row * 5 + col])) {
                complete = false;
                break;
            }
        }

        if (complete) return true;
    }

    return false;
}

function checkDiagonal() {
    for (let i = 0; i < 5; i++) {
        if (!isMarked(playerCard[i * 5 + i])) {
            return false;
        }
    }

    return true;
}

function checkReverseDiagonal() {
    for (let i = 0; i < 5; i++) {
        if (!isMarked(playerCard[i * 5 + (4 - i)])) {
            return false;
        }
    }

    return true;
}

function checkFourCorners() {
    return [
        playerCard[0],
        playerCard[4],
        playerCard[20],
        playerCard[24]
    ].every(value => isMarked(value));
}

function showWinner(pattern, prize) {

    const box =
        document.getElementById("winnerBox");

    if (!box) {
        console.error("WINNER BOX NOT FOUND");
        return;
    }

    box.classList.remove("hidden");

    const patternElement =
        document.getElementById("winnerPattern");

    if (patternElement) {
        patternElement.textContent =
            "Winning Pattern: " + pattern;
    }

    const prizeElement =
        document.getElementById("winnerPrize");

    if (prizeElement) {
        prizeElement.textContent =
            "Prize: " + Number(prize).toFixed(2) + " ETB";
    }
}

async function saveWinner(pattern) {

    const gameId =
        localStorage.getItem("gameId");

    const roomId =
        localStorage.getItem("roomId");

    const userId =
        localStorage.getItem("userId");

    if (!gameId || !roomId || !userId) {
        alert("Winner information is missing.");
        return;
    }

    const {
        data: game,
        error: gameError
    } = await supabase
        .from("games")
        .select("winner_user_id,status")
        .eq("id", gameId)
        .single();

    if (gameError) {
        console.error("GAME LOAD ERROR:", gameError);
        alert(gameError.message);
        return;
    }

    if (game?.winner_user_id) {
        alert("Winner already declared.");
        return;
    }

    const {
        data: room,
        error: roomError
    } = await supabase
        .from("rooms")
        .select("entry_fee")
        .eq("id", roomId)
        .single();

    if (roomError) {
        console.error("ROOM LOAD ERROR:", roomError);
        alert(roomError.message);
        return;
    }

    const {
        data: players,
        error: playersError
    } = await supabase
        .from("game_players")
        .select("id")
        .eq("game_id", gameId);

    if (playersError) {
        console.error("PLAYERS LOAD ERROR:", playersError);
        alert(playersError.message);
        return;
    }

    const totalPlayers =
        players?.length || 0;

    const prize =
        totalPlayers *
        Number(room.entry_fee) *
        0.80;

    const {
        error: updateError
    } = await supabase
        .from("games")
        .update({
            status: "finished",
            winner_user_id: Number(userId),
            winner_pattern: pattern,
            prize_amount: prize
        })
        .eq("id", gameId)
        .is("winner_user_id", null);

    if (updateError) {
        console.error("WINNER SAVE ERROR:", updateError);
        alert(updateError.message);
        return;
    }

    if (typeof stopCalling === "function") {
        stopCalling();
    }

    showWinner(pattern, prize);

    console.log(
        "WINNER DECLARED:",
        userId,
        pattern,
        prize
    );
}

async function checkWinner() {

    console.log("CHECKING BINGO...");
    console.log("PLAYER CARD:", playerCard);
    console.log("CALLED NUMBERS:", calledNumbers);

    if (
        !Array.isArray(playerCard) ||
        playerCard.length !== 25
    ) {
        alert("Your Bingo board is not ready.");
        return;
    }

    let pattern = null;

    if (checkHorizontal()) {
        pattern = "Horizontal";
    }
    else if (checkVertical()) {
        pattern = "Vertical";
    }
    else if (checkDiagonal()) {
        pattern = "Diagonal";
    }
    else if (checkReverseDiagonal()) {
        pattern = "Reverse Diagonal";
    }
    else if (checkFourCorners()) {
        pattern = "Four Corners";
    }

    if (!pattern) {
        alert("No Bingo yet!");
        return;
    }

    console.log("BINGO FOUND:", pattern);

    await saveWinner(pattern);
}

console.log("WINNER JS LOADED");
EOF
