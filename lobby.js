// ===============================
// VAMIOS BINGO
// LOBBY.JS
// ===============================


// ==========================================
// LOAD AVAILABLE ROOMS
// ==========================================

async function loadRooms() {

    const container =
        document.getElementById(
            "roomsContainer"
        );

    if (!container) {

        console.log(
            "roomsContainer not found"
        );

        return;
    }

    container.innerHTML =
        "Loading rooms...";


    // ==========================================
    // GET WAITING ROOMS
    // ==========================================

    const {
        data,
        error
    } = await supabaseClient
        .from("rooms")
        .select("*")
        .eq(
            "status",
            "waiting"
        )
        .order(
            "id"
        );


    if (error) {

        console.error(
            "Room loading error:",
            error
        );

        container.innerHTML =
            "❌ Room loading error";

        return;
    }


    container.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            "No rooms available";

        return;
    }


    // ==========================================
    // CREATE ROOM CARDS
    // ==========================================

    data.forEach(
        (room) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "room-card";


            const entryFee =
                Number(
                    room.entry_fee || 0
                );


            card.innerHTML = `
                <div class="room-name">
                    🎱 ${room.name || "Bingo Room"}
                </div>

                <div class="room-info">
                    💰 Entry: ${entryFee.toFixed(2)} ETB
                </div>

                <div class="room-info">
                    👥 Maximum players:
                    ${room.max_players || 100}
                </div>

                <button
                    class="room-button"
                    type="button"
                >
                    🎱 Enter Room
                </button>
            `;


            const button =
                card.querySelector(
                    "button"
                );


            if (button) {

                button.onclick =
                    () => {

                        // ==================================
                        // SAVE ROOM INFORMATION
                        // ==================================

                        localStorage.setItem(
                            "room_id",
                            room.id
                        );

                        localStorage.setItem(
                            "room_name",
                            room.name || ""
                        );

                        localStorage.setItem(
                            "entry_fee",
                            entryFee
                        );


                        // ==================================
                        // OPEN BOARD SELECTION
                        // ==================================

                        showScreen(
                            "boardScreen"
                        );


                        if (
                            typeof loadBoards ===
                            "function"
                        ) {

                            loadBoards();

                        } else {

                            console.error(
                                "loadBoards() not found"
                            );
                        }

                    };
            }


            container.appendChild(
                card
            );
        }
    );
}


// ==========================================
// START LOBBY
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadRooms();

    }
);