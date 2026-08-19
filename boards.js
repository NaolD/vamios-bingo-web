// ==========================================
// VAMIOS BINGO
// BOARD SELECTION
// ==========================================

let boardsEntryFee = 0;
let selectedBoardNumber = null;
let selectedBoard = null;


// ==========================================
// INITIALIZE BOARD SCREEN
// ==========================================

async function initializeBoards(fee) {

    console.log("INITIALIZING BOARDS:", fee);

    boardsEntryFee = Number(fee);
    selectedBoardNumber = null;
    selectedBoard = null;

    const selectedFee =
        document.getElementById("selectedFee");

    if (selectedFee) {
        selectedFee.textContent =
            boardsEntryFee + " ETB";
    }

    const selectedNumber =
        document.getElementById("selectedBoardNumber");

    if (selectedNumber) {
        selectedNumber.textContent = "None";
    }

    const preview =
        document.getElementById("boardPreview");

    if (preview) {
        preview.classList.add("hidden");
    }

    const startButton =
        document.getElementById("startGameBtn");

    if (startButton) {
        startButton.disabled = true;
    }

    createBoardNumbers();

    console.log("BOARDS READY");
}


// ==========================================
// CREATE NUMBERS 1–100
// ==========================================

function createBoardNumbers() {

    const container =
        document.getElementById(
            "boardNumbers"
        );

    if (!container) {

        console.error(
            "boardNumbers element not found"
        );

        return;
    }

    container.innerHTML = "";


    for (let number = 1; number <= 100; number++) {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "board-number";

        button.textContent =
            number;

        button.dataset.number =
            number;

        button.addEventListener(
            "click",
            function () {

                selectBoard(number);

            }
        );

        container.appendChild(button);
    }

}


// ==========================================
// SELECT BOARD
// ==========================================

async function selectBoard(number) {

    selectedBoardNumber =
        Number(number);

    console.log(
        "SELECTED BOARD:",
        selectedBoardNumber
    );


    // Highlight selected number

    document
        .querySelectorAll(
            ".board-number"
        )
        .forEach(button => {

            button.classList.toggle(
                "selected",
                Number(button.dataset.number) ===
                selectedBoardNumber
            );

        });


    const selectedNumber =
        document.getElementById(
            "selectedBoardNumber"
        );

    if (selectedNumber) {

        selectedNumber.textContent =
            selectedBoardNumber;

    }


    // Create preview

    selectedBoard =
        generateBoard(
            selectedBoardNumber
        );


    displayBoardPreview(
        selectedBoard
    );


    // Enable START GAME

    const startButton =
        document.getElementById(
            "startGameBtn"
        );

    if (startButton) {

        startButton.disabled =
            false;

    }

}


// ==========================================
// GENERATE BINGO BOARD
// ==========================================

function generateBoard(seed) {

    const board = [];

    const ranges = [

        [1, 15],

        [16, 30],

        [31, 45],

        [46, 60],

        [61, 75]

    ];


    for (
        let column = 0;
        column < 5;
        column++
    ) {

        const numbers =
            createShuffledNumbers(
                ranges[column][0],
                ranges[column][1]
            );


        for (
            let row = 0;
            row < 5;
            row++
        ) {

            if (!board[row]) {
                board[row] = [];
            }


            if (
                row === 2 &&
                column === 2
            ) {

                board[row][column] =
                    "FREE";

            } else {

                board[row][column] =
                    numbers[row];

            }

        }

    }


    return board;
}


// ==========================================
// SHUFFLE NUMBERS
// ==========================================

function createShuffledNumbers(
    min,
    max
) {

    const numbers = [];


    for (
        let i = min;
        i <= max;
        i++
    ) {

        numbers.push(i);

    }


    // Fisher-Yates shuffle

    for (
        let i = numbers.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            numbers[i],
            numbers[j]
        ] =
        [
            numbers[j],
            numbers[i]
        ];

    }


    return numbers;
}


// ==========================================
// DISPLAY BOARD PREVIEW
// ==========================================

function displayBoardPreview(board) {

    const preview =
        document.getElementById(
            "boardPreview"
        );

    const grid =
        document.getElementById(
            "previewGrid"
        );


    if (!preview || !grid) {

        console.error(
            "BOARD PREVIEW ELEMENTS NOT FOUND"
        );

        return;
    }


    grid.innerHTML = "";


    board.forEach(row => {

        row.forEach(value => {

            const cell =
                document.createElement(
                    "div"
                );

            cell.className =
                "bingo-cell";


            if (value === "FREE") {

                cell.classList.add(
                    "free-cell"
                );

                cell.textContent =
                    "FREE";

            } else {

                cell.textContent =
                    value;

            }


            grid.appendChild(cell);

        });

    });


    preview.classList.remove(
        "hidden"
    );

}


// ==========================================
// START GAME BUTTON
// ==========================================

function setupBoardStartButton() {

    const button =
        document.getElementById(
            "startGameBtn"
        );


    if (!button) {

        console.error(
            "START GAME BUTTON NOT FOUND"
        );

        return;
    }


    button.onclick =
        async function () {

            if (
                !selectedBoardNumber ||
                !selectedBoard
            ) {

                alert(
                    "Please select a board first."
                );

                return;
            }


            console.log(
                "STARTING GAME WITH BOARD:",
                selectedBoardNumber
            );


            // For now, we only move to
            // the waiting room.
            //
            // Real game joining/payment
            // will be connected next.

            if (
                typeof showWaitingScreen ===
                "function"
            ) {

                await showWaitingScreen();

            } else {

                alert(
                    "Waiting room is not ready yet."
                );

            }

        };

}


// ==========================================
// BACK BUTTON
// ==========================================

function setupBoardBackButton() {

    const button =
        document.getElementById(
            "backToLobbyBtn"
        );


    if (!button) {
        return;
    }


    button.onclick =
        function () {

            if (
                typeof showLobbyScreen ===
                "function"
            ) {

                showLobbyScreen();

            }

        };

}


// ==========================================
// INITIAL SETUP
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupBoardStartButton();

        setupBoardBackButton();

    }
);


console.log(
    "BOARDS JS LOADED"
);
