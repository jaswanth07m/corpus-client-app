// Quick Fix for 401 Unauthorized Error
// Copy and paste this entire script into your browser console

console.log('🔧 Starting Quick Fix for 401 Error...');

// Step 1: Check current tokens
console.log('\n📋 Current Storage:');
const allStorage = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  allStorage[key] = localStorage.getItem(key);
}
console.table(allStorage);

// Step 2: Clear all authentication data
console.log('\n🧹 Clearing all storage...');
localStorage.clear();
sessionStorage.clear();

// Step 3: Clear any cookies
console.log('🍪 Clearing cookies...');
document.cookie.split(';').forEach(function (c) {
  document.cookie = c
    .replace(/^ +/, '')
    .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
});

console.log('\n✅ Storage cleared successfully!');
console.log('🔄 Reloading page in 2 seconds...');
console.log('👉 Please log in again after the page reloads.');

setTimeout(() => {
  location.reload();
}, 2000);
