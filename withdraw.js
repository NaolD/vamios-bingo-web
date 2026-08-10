// ===============================
// VAMIOS BINGO
// WITHDRAW.JS
// ===============================

const withdrawBtn = document.getElementById("withdrawBtn");

if (withdrawBtn) {
  withdrawBtn.onclick = async () => {
    const user = await getCurrentUser();

    if (!user) {
      alert("User not found");
      return;
    }

    const amount = Number(
      document.getElementById("withdrawAmount").value
    );

    const phone =
      document.getElementById("withdrawTelebirr").value;

    if (!amount || !phone) {
      alert("Enter amount and Telebirr number");
      return;
    }

    const balance = await getBalance(user.id);

    if (balance < amount) {
      alert("Insufficient balance");
      return;
    }

    const { error } = await supabaseClient
      .from("transactions")
      .insert([
        {
          user_id: user.id,
          type: "withdraw",
          amount: amount,
          description: "Telebirr: " + phone,
          status: "pending"
        }
      ]);

    if (error) {
      console.log(error);
      alert("Withdrawal request failed");
      return;
    }

    alert("Withdrawal request submitted");

    document.getElementById("withdrawAmount").value = "";
    document.getElementById("withdrawTelebirr").value = "";
  };
}