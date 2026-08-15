// ===============================
// VAMIOS BINGO USER.JS
// ===============================

console.log('USER JS LOADED');

// ==========================================
// GET CURRENT TELEGRAM USER
// ==========================================

async function getCurrentUser() {

const tg = window.Telegram?.WebApp;

if (!tg) {
console.log('Telegram WebApp not detected');
return null;
}

tg.ready();

const telegramUser = tg.initDataUnsafe?.user;

if (!telegramUser) {
console.log('Telegram user missing');
return null;
}

const telegram_id = telegramUser.id;

// ==========================================
// FIND EXISTING USER
// ==========================================

let { data: user, error } = await supabaseClient
.from('users')
.select('*')
.eq('telegram_id', telegram_id)
.maybeSingle();

if (error) {
console.error('Get user error:', error);
return null;
}

// ==========================================
// CREATE USER IF NEW
// ==========================================

if (!user) {

```
const fullName = [
  telegramUser.first_name || '',
  telegramUser.last_name || ''
].join(' ').trim();

const result = await supabaseClient
  .from('users')
  .insert([
    {
      telegram_id,
      user_name: telegramUser.username || '',
      full_name: fullName
    }
  ])
  .select()
  .single();

if (result.error) {
  console.error('Create user error:', result.error);
  return null;
}

user = result.data;
```

}

// ==========================================
// ENSURE WALLET EXISTS
// ==========================================

const { data: wallet } = await supabaseClient
.from('wallets')
.select('*')
.eq('user_id', user.id)
.maybeSingle();

if (!wallet) {

```
await supabaseClient
  .from('wallets')
  .insert([
    {
      user_id: user.id,
      balance: 0
    }
  ]);
```

}

// ==========================================
// SAVE USER LOCALLY
// ==========================================

localStorage.setItem('userId', user.id);
localStorage.setItem('telegramId', telegram_id);

const info = document.getElementById('playerInfo');
if (info) {
info.textContent = user.full_name || user.user_name || 'Player';
}

return user;

}

// ==========================================
// TELEGRAM HELPERS
// ==========================================

function getTelegramUserId() {
return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || null;
}

function getTelegramUser() {
return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

// ==========================================
// AUTO LOAD USER
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
getCurrentUser();
});
