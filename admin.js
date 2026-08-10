// ===============================
// VAMIOS BINGO
// ADMIN.JS
// ===============================

const ADMIN_PASSWORD = "12345";

// ===============================
// LOGIN
// ===============================

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.onclick = () => {
    const password = document.getElementById("adminPassword").value;

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_logged", "true");

      document.getElementById("loginScreen").classList.add("hidden");
      document.getElementById("adminScreen").classList.remove("hidden");

      loadAdminData();
    } else {
      alert("Wrong password");
    }
  };
}

// ===============================
// LOGOUT
// ===============================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("admin_logged");
    location.reload();
  };
}

// ===============================
// LOAD DASHBOARD
// ===============================

async function loadAdminData() {
  const usersResult = await supabaseClient
    .from("users")
    .select("id", { count: "exact", head: true });

  document.getElementById("totalUsers").innerText =
    usersResult.count || 0;

  const gamesResult = await supabaseClient
    .from("games")
    .select("id", { count: "exact", head: true })
    .eq("status", "playing");

  document.getElementById("activeGames").innerText =
    gamesResult.count || 0;

  const { data: requests, error } = await supabaseClient
    .from("transactions")
    .select("*")
    .in("type", ["deposit", "withdraw"])
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
    return;
  }

  document.getElementById("pendingDeposits").innerText =
    requests.length;

  const list = document.getElementById("depositList");
  list.innerHTML = "";

  if (requests.length === 0) {
    list.innerHTML = "No pending requests";
    return;
  }

  requests.forEach(req => {
    const div = document.createElement("div");
    div.className = "transaction";

    div.innerHTML = `
      <p><b>${req.type.toUpperCase()}</b></p>
      <p>User: ${req.user_id}</p>
      <p>Amount: ${req.amount} ETB</p>
      <p>${req.description}</p>
      <button>Approve</button>
    `;

    div.querySelector("button").onclick = () => approveRequest(req);

    list.appendChild(div);
  });
}

// ===============================
// APPROVE DEPOSIT OR WITHDRAWAL
// ===============================

async function approveRequest(req) {
  const { data: wallet, error: walletError } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("user_id", req.user_id)
    .single();

  if (walletError) {
    alert("Wallet not found");
    return;
  }

  let newBalance = Number(wallet.balance);

  if (req.type === "deposit") {
    newBalance += Number(req.amount);
  }

  if (req.type === "withdraw") {
    if (newBalance < Number(req.amount)) {
      alert("User has insufficient balance");
      return;
    }

    newBalance -= Number(req.amount);
  }

  const { error: walletUpdateError } = await supabaseClient
    .from("wallets")
    .update({
      balance: newBalance,
      updated_at: new Date()
    })
    .eq("user_id", req.user_id);

  if (walletUpdateError) {
    console.log(walletUpdateError);
    alert("Wallet update failed");
    return;
  }

  const { error: txError } = await supabaseClient
    .from("transactions")
    .update({
      status: "completed"
    })
    .eq("id", req.id);

  if (txError) {
    console.log(txError);
    alert("Transaction update failed");
    return;
  }

  alert(req.type + " approved");

  loadAdminData();
}

// ===============================
// AUTO LOGIN
// ===============================

if (localStorage.getItem("admin_logged") === "true") {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("adminScreen").classList.remove("hidden");
  loadAdminData();
}