// ===============================
// VAMIOS BINGO
// DEPOSIT.JS
// ===============================
// Deposits are handled ONLY
// through the Telegram bot.
// ===============================


// ==========================================
// DEPOSIT BUTTON
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const depositBtn =
            document.getElementById(
                "depositBtn"
            );


        if (!depositBtn) {
            return;
        }


        depositBtn.onclick =
            async () => {

                // ==================================
                // Telegram Web App
                // ==================================

                const tg =
                    window.Telegram &&
                    window.Telegram.WebApp;


                if (tg) {

                    tg.showAlert(
                        "💰 Deposits are handled through the VAMIOS Bingo Telegram bot.\n\nPlease return to Telegram and tap Deposit."
                    );

                } else {

                    alert(
                        "💰 Deposits are handled through the VAMIOS Bingo Telegram bot.\n\nPlease open the VAMIOS Bingo bot in Telegram and tap Deposit."
                    );
                }
            };
    }
);


// ==========================================
// OPEN TELEGRAM BOT
// ==========================================

function openTelegramDeposit() {

    const botUsername =
        "YOUR_BOT_USERNAME";


    const telegramUrl =
        "https://t.me/" +
        botUsername;


    window.location.href =
        telegramUrl;
}


// ==========================================
// HIDE OLD DEPOSIT INPUTS
// ==========================================

function disableWebsiteDepositForm() {

    const amountInput =
        document.getElementById(
            "depositAmount"
        );


    const phoneInput =
        document.getElementById(
            "telebirrNumber"
        );


    if (amountInput) {

        amountInput.style.display =
            "none";
    }


    if (phoneInput) {

        phoneInput.style.display =
            "none";
    }
}


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        disableWebsiteDepositForm();

    }
);