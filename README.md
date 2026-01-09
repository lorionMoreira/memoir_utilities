# Memoir Utilities - React Native App

## Project Structure

```
memoir_utilities/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx
│   │   └── HomeScreen.tsx
│   ├── navigation/       # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── contexts/         # React Context providers
│   │   └── AuthContext.tsx
│   ├── services/         # API services
│   │   └── authService.ts
│   ├── helpers/          # Utility functions
│   │   └── storage.ts
│   ├── config/           # App configuration
│   │   └── api.ts
│   ├── constants/        # App constants
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   └── data/            # Static data
├── assets/              # Images and other assets
├── App.tsx              # Root component
└── package.json
```

## Authentication Flow

### 1. **Login Process**
- User enters username and password on [LoginScreen.tsx](src/screens/LoginScreen.tsx)
- Credentials sent to `/api/auth/login` endpoint
- Backend validates and returns:
  - JWT token (24-hour expiry)
  - Username
  - User salt
- Token, salt, and calculated expiry stored in `expo-secure-store`
- User redirected to [HomeScreen.tsx](src/screens/HomeScreen.tsx)

### 2. **Automatic Token Refresh**
The app implements automatic JWT refresh using multiple strategies:

#### Request Interceptor (Proactive)
- Before each API call, checks if token expires within 5 minutes
- Automatically refreshes token if needed
- Prevents multiple simultaneous refresh calls using a promise queue

#### Response Interceptor (Reactive)
- Catches 401 (Unauthorized) responses
- Automatically refreshes token
- Retries the original failed request with new token

#### App State Listener
- Monitors when app comes to foreground from background
- Checks token expiry and refreshes if needed
- Ensures fresh token when user returns to app

### 3. **Token Storage**
All sensitive data stored in `expo-secure-store`:
- `auth_token` - JWT token
- `auth_salt` - User salt
- `token_expiry` - Unix timestamp (milliseconds)

### 4. **Environment Configuration**
API base URL automatically selected based on environment:
- **Development** (`__DEV__ === true`): `http://localhost:8080`
- **Production** (`__DEV__ === false`): `https://raspberrypi.tail6b11e4.ts.net`

## Backend Endpoints

### Login
```
POST /api/auth/login
Request: { "username": "user", "password": "pass" }
Response: { "token": "...", "username": "user", "salt": "..." }

Error Responses:
- 401: Invalid credentials with attempts remaining
- 403: Account locked (shows minutes remaining)
```

### Token Refresh
```
POST /api/auth/refresh-token
Request: { "refreshToken": "expired_jwt_token" }
Response: { "token": "new_token", "username": "user", "salt": "..." }
```

## Error Handling

### Login Errors
1. **Invalid Credentials (401)**
   - Shows error message with remaining attempts
   - Example: "Invalid username or password. 3 attempts remaining."

2. **Account Locked (403)**
   - Shows alert with lock duration
   - Example: "Account temporarily locked. Try again in 28 minutes."

3. **Network Errors**
   - Shows user-friendly network error message

### Token Refresh Errors
- If refresh fails (expired refresh token), user is automatically logged out
- All stored tokens cleared
- Redirected to login screen

## Key Features

✅ **Secure Storage** - All tokens stored in expo-secure-store  
✅ **Auto Token Refresh** - Transparent 24-hour JWT renewal  
✅ **Environment Detection** - Auto-selects dev/prod API URL  
✅ **Concurrent Request Handling** - Prevents multiple refresh calls  
✅ **App State Awareness** - Refreshes token on app foreground  
✅ **Failed Login Protection** - Displays attempts and lock information  
✅ **Loading States** - Smooth UX with activity indicators  
✅ **TypeScript** - Full type safety throughout the app  

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## Testing Authentication

### Test Login Flow
1. Ensure backend is running on `localhost:8080` (dev) or production URL
2. Open app - should show login screen
3. Enter valid credentials
4. Should redirect to home screen
5. Close and reopen app - should stay logged in

### Test Token Refresh
1. Login successfully
2. Wait until token is near expiry (or modify expiry time for testing)
3. Make an API call or bring app to foreground
4. Token should refresh automatically in background

### Test Failed Login Attempts
1. Enter wrong password 5 times
2. Account should lock for 30 minutes
3. Error message should show remaining time

## Next Steps

To extend this authentication foundation:

1. **Add Registration Screen** - Connect to `/api/auth/register` endpoint
2. **Password Reset** - Implement forgot password flow
3. **Biometric Auth** - Add fingerprint/Face ID for quick login
4. **Remember Me** - Optional persistent login
5. **Profile Management** - User profile screen with settings
6. **API Integration** - Connect authenticated requests to other endpoints

## Security Notes

⚠️ **Important Security Practices:**
- Never log tokens or salt in production
- Always use HTTPS for production API calls
- expo-secure-store is encrypted on device
- Tokens automatically cleared on logout
- Expired tokens handled gracefully
