// ===============================
// VAMIOS BINGO WALLET.JS
// ===============================

// Get wallet
async function getWallet(userId) {
const { data, error } = await supabaseClient
.from('wallets')
.select('*')
.eq('user_id', userId)
.single();

if (error) {
console.log('Wallet error:', error.message);
return null;
}

return data;
}

// Create wallet if missing
async function createWallet(userId) {
let wallet = await getWallet(userId);

if (wallet) return wallet;

const { data, error } = await supabaseClient
.from('wallets')
.insert([
{
user_id: userId,
balance: 0
}
])
.select()
.single();

if (error) {
console.log(error);
return null;
}

return data;
}

// Get balance
async function getBalance(userId) {
const wallet = await createWallet(userId);
if (!wallet) return 0;
return Number(wallet.balance);
}

// Refresh balance on screen
async function refreshBalance() {
const userId = localStorage.getItem('userId');
if (!userId) return;

const balance = await getBalance(userId);

const lobby = document.getElementById('balanceInfo');
if (lobby) lobby.textContent = balance.toFixed(2) + ' ETB';

const wallet = document.getElementById('walletBalance');
if (wallet) wallet.textContent = 'Balance: ' + balance.toFixed(2) + ' ETB';
}

// Deduct game entry fee
async function deductBalance(userId, amount) {
const wallet = await createWallet(userId);

if (!wallet) {
alert('Wallet not found');
return false;
}

if (Number(wallet.balance) < Number(amount)) {
alert('Insufficient balance');
return false;
}

const newBalance =
Number(wallet.balance) - Number(amount);

const { error } = await supabaseClient
.from('wallets')
.update({
balance: newBalance,
updated_at: new Date()
})
.eq('user_id', userId);

if (error) {
console.log(error);
return false;
}

await supabaseClient
.from('transactions')
.insert([
{
user_id: userId,
type: 'game_entry',
amount: -Number(amount),
description: 'Bingo entry fee',
status: 'completed'
}
]);

await refreshBalance();

return true;
}

// Add prize to winner wallet
async function addPrize(userId, amount) {
const wallet = await createWallet(userId);

if (!wallet) return false;

const newBalance =
Number(wallet.balance) + Number(amount);

await supabaseClient
.from('wallets')
.update({
balance: newBalance,
updated_at: new Date()
})
.eq('user_id', userId);

await supabaseClient
.from('transactions')
.insert([
{
user_id: userId,
type: 'prize',
amount: Number(amount),
description: 'Bingo winner prize',
status: 'completed'
}
]);

await refreshBalance();

return true;
}

// Auto refresh when page loads
document.addEventListener('DOMContentLoaded', () => {
setTimeout(refreshBalance, 500);
});
