// ======================================
// VAMIOS BINGO - LOBBY.JS
// ======================================

console.log("LOBBY.JS LOADED");


// ======================================
// LOAD LOBBY
// ======================================

async function loadLobby() {

    try {

        console.log("Loading lobby...");

        const user =
            await getCurrentUser();

        if (!user) {

            console.log(
                "No current user yet"
            );

            return;
        }


        const balance =
            await getBalance(user.id);


        const balanceInfo =
            document.getElementById(
                "balanceInfo"
            );

        if (balanceInfo) {

            balanceInfo.innerText =
                Number(balance).toFixed(2)
                + " ETB";

        }


        const walletBalance =
            document.getElementById(
                "walletBalance"
            );

        if (walletBalance) {

            walletBalance.innerText =
                "Balance: "
                + Number(balance).toFixed(2)
                + " ETB";

        }


        await loadRooms();

    }

    catch (err) {

        console.error(
            "Lobby load error:",
            err
        );

    }

}


// ======================================
// LOAD ROOMS
// ======================================

async function loadRooms() {

    try {

        const {
            data: rooms,
            error
        } =
            await supabase
                .from("rooms")
                .select("*")
                .order(
                    "entry_fee"
                );


        if (error) {

            console.error(
                "Load rooms error:",
                error
            );

            return;
        }


        if (!rooms) {

            console.log(
                "No rooms found"
            );

            return;
        }


        let totalPlayers = 0;


        rooms.forEach(
            room => {

                const players =
                    Number(
                        room.current_players || 0
                    );

                const fee =
                    Number(
                        room.entry_fee || 0
                    );


                totalPlayers +=
                    players;


                const playersEl =
                    document.getElementById(
                        "players" + fee
                    );


                if (playersEl) {

                    playersEl.innerText =
                        `${players}/${room.max_players || 100}`;

                }


                const prize =
                    players *
                    fee *
                    0.80;


                const prizeEl =
                    document.getElementById(
                        "prize" + fee
                    );


                if (prizeEl) {

                    prizeEl.innerText =
                        prize.toFixed(0)
                        + " ETB";

                }

            }
        );


        const livePlayers =
            document.getElementById(
                "livePlayers"
            );


        if (livePlayers) {

            livePlayers.innerText =
                totalPlayers;

        }


        console.log(
            "Rooms loaded:",
            rooms
        );

    }

    catch (err) {

        console.error(
            "loadRooms error:",
            err
        );

    }

}


// ======================================
// SELECT ROOM BY FEE
// ======================================

async function selectRoomByFee(
    entryFee
) {

    console.log(
        "ROOM CLICKED:",
        entryFee
    );


    try {

        const {
            data: room,
            error
        } =
            await supabase
                .from("rooms")
                .select("*")
                .eq(
                    "entry_fee",
                    Number(entryFee)
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Room lookup error:",
                error
            );

            alert(
                "Could not load this game room."
            );

            return;
        }


        if (!room) {

            console.error(
                "Room not found for:",
                entryFee
            );

            alert(
                "Room not found in Supabase."
            );

            return;
        }


        console.log(
            "Selected room:",
            room
        );


        // Save room information
        localStorage.setItem(
            "room_id",
            String(room.id)
        );


        localStorage.setItem(
            "room_name",
            room.name || ""
        );


        localStorage.setItem(
            "selectedFee",
            String(entryFee)
        );


        // Open board screen
        showScreen(
            "boardScreen"
        );


        // Initialize board selection
        if (
            typeof initializeBoardSelection
            === "function"
        ) {

            initializeBoardSelection();

        }

    }

    catch (err) {

        console.error(
            "selectRoomByFee error:",
            err
        );

        alert(
            "Could not open room."
        );

    }

}


// ======================================
// PLAY BINGO BUTTON
// ======================================

function goToBoards() {

    console.log(
        "Play Bingo clicked"
    );


    showScreen(
        "boardScreen"
    );


    if (
        typeof initializeBoardSelection
        === "function"
    ) {

        initializeBoardSelection();

    }

}


// ======================================
// BACK TO LOBBY
// ======================================

function goToLobby() {

    showScreen(
        "lobbyScreen"
    );

    loadLobby();

}


// ======================================
// AUTO LOAD
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Lobby DOM ready"
        );

        loadLobby();

    }
);