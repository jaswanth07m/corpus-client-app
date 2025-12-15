# Fix 401 Unauthorized Error

## Problem

Your authentication token has expired or is invalid, causing all API calls to fail with 401 errors.

## Quick Solutions

### Option 1: Clear Storage and Re-login (Recommended)

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run this command:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
4. Log in again with your credentials

### Option 2: Manual Clear

1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Expand "Local Storage" in the left sidebar
4. Click on your domain
5. Delete the `token` or `authToken` entry
6. Refresh the page and log in again

### Option 3: Use the Auth Checker

1. Open `http://localhost:8080/check-auth.html` in your browser
2. Click "Check Authentication" to see your current token status
3. Click "Clear All Storage" to remove expired tokens
4. Go back to the main app and log in again

## What Changed

I've updated the UserProfile component to:

- ✅ Remove trailing slash from API URLs (was causing CORS redirects)
- ✅ Add better token validation and error messages
- ✅ Automatically clear expired tokens and redirect to login
- ✅ Show toast notifications when session expires

## Prevention

The app will now automatically:

- Detect when your token expires
- Clear the invalid token
- Show a notification
- Redirect you to the login page after 2 seconds

## Testing

After logging in again, check the console for these messages:

- `🔑 Found token in localStorage.token` - Token found successfully
- `📡 Fetching profile from: ...` - API calls being made
- If you see `❌ Unauthorized: Token expired or invalid` - The token is still invalid

## Still Having Issues?

1. Check if you're using the correct API URL in `.env`:

   ```
   VITE_API_SERVER_URL='https://dev.api.corpus.swecha.org/api/v1'
   ```

2. Verify the API server is running and accessible

3. Check your network tab in DevTools to see the actual request/response

4. Make sure you're logging in successfully and the token is being saved
