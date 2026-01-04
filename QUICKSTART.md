# Memoir App - Quick Start Guide

## 🚀 Getting Started

### 1. Update Backend Configuration
Before running the app, configure your Spring Boot backend URL:

**File:** `src/config/api.ts`
```typescript
export const API_BASE_URL = 'http://YOUR_BACKEND_IP:8080/api';
```

For local development:
- iOS Simulator: `http://localhost:8080/api`
- Android Emulator: `http://10.0.2.2:8080/api`
- Physical Device: `http://YOUR_COMPUTER_IP:8080/api`

### 2. Run the App
```bash
# Install dependencies (already done)
npm install

# Start Expo dev server
npx expo start

# Options:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app on physical device
```

## 📝 Backend API Spec

Your Spring Boot backend must implement these endpoints:

### Authentication Endpoints
```
POST /api/auth/login
Body: { username: string, password: string }
Response: {
  success: true,
  data: {
    token: string,
    user: { id: string, username: string, email?: string }
  }
}

POST /api/auth/logout
Headers: Authorization: Bearer <token>
Response: { success: true }
```

### Credentials Endpoints (JWT Protected)
```
GET /api/credentials
Headers: Authorization: Bearer <token>
Response: {
  success: true,
  data: [
    {
      id: string,
      encryptedData: string,  // This is the encrypted blob from client
      createdAt: string,
      updatedAt: string
    }
  ]
}

POST /api/credentials
Headers: Authorization: Bearer <token>
Body: { encryptedData: string }
Response: {
  success: true,
  data: { id: string, encryptedData: string, createdAt: string }
}

PUT /api/credentials/:id
Headers: Authorization: Bearer <token>
Body: { encryptedData: string }
Response: { success: true, data: { ... } }

DELETE /api/credentials/:id
Headers: Authorization: Bearer <token>
Response: { success: true }
```

### Photos Endpoints (JWT Protected)
```
GET /api/photos?page=1&limit=9
Headers: Authorization: Bearer <token>
Response: {
  success: true,
  data: [
    {
      id: string,
      url: string,           // Full image URL
      thumbnailUrl: string,  // Thumbnail URL
      filename: string,
      uploadedAt: string
    }
  ]
}

POST /api/photos/upload
Headers: 
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
Body: FormData with 'photo' field
Response: {
  success: true,
  data: { id: string, url: string, thumbnailUrl: string, ... }
}

DELETE /api/photos/:id
Headers: Authorization: Bearer <token>
Response: { success: true }
```

## 🔒 How Encryption Works

### Zero-Knowledge Architecture
1. **Master Key File**: User selects any text file (`.txt`, `.key`, etc.)
2. **Key Derivation**: App uses PBKDF2 with 10,000 iterations to derive AES-256 key
3. **Encryption**: All credentials encrypted client-side before sending to server
4. **Backend Storage**: Backend only stores encrypted blobs (cannot decrypt)

### Example: Saving a Credential
```
Client Side:
1. User enters: organization="Gmail", password="mypassword123"
2. App encrypts: { organization, password } → "U2FsdGVkX1+..." (AES-256)
3. Sends to backend: { encryptedData: "U2FsdGVkX1+..." }

Backend:
4. Stores encrypted blob in database

Client Side (retrieval):
5. Fetches encrypted blob from backend
6. Decrypts using master key: "U2FsdGVkX1+..." → { organization, password }
7. Displays to user
```

## 🎯 Testing the App

### Test Flow
1. **Login Screen**
   - Enter credentials for your backend
   - Tap "Login"

2. **Master Key File Screen** (first time only)
   - Create a test file: `echo "my-secret-key-2024" > test-key.txt`
   - Tap "Select Master Key File"
   - Choose the file
   - App will store it encrypted

3. **Credentials Tab**
   - Should show empty state initially
   - Go to Settings → Add Credential
   - Add test credential: organization="Test", password="test123"
   - Return to Credentials tab to see it

4. **Photos Tab**
   - Should show empty state initially
   - Go to Settings → Add Photo
   - Select photo from gallery
   - Return to Photos tab to see it

5. **Test Auto-lock**
   - Settings → Auto-lock Timeout → Set to 1 minute
   - Wait 1 minute without interacting
   - App should lock and require re-login

## 🐛 Common Issues

### Issue: "Network Error" on Login
**Solution:** Check backend URL in `src/config/api.ts`
- Make sure backend is running
- Use correct IP address for physical devices
- Check firewall settings

### Issue: "Failed to read file" on Master Key Screen
**Solution:** 
- Ensure file is readable as text
- Try creating a simple `.txt` file
- Check file permissions

### Issue: "Failed to decrypt credential"
**Solution:**
- Master key file content changed
- Use "Change Master Key File" in Settings to update
- Or delete app data and start fresh

### Issue: Photos not loading
**Solution:**
- Check MinIO is configured and running
- Verify photo URLs are accessible
- Check JWT token is being sent in headers

## 📱 Testing on Physical Device

1. **Same WiFi Network:** Ensure phone and computer on same network
2. **Get Computer IP:** 
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` or `ip addr`
3. **Update API URL:** Use `http://YOUR_IP:8080/api`
4. **Scan QR Code:** In Expo Go app

## 🔧 Next Steps

### Backend Implementation
You need to implement:
- [ ] JWT authentication with login/logout
- [ ] Credentials CRUD endpoints (store encrypted blobs)
- [ ] Photos upload/fetch with MinIO integration
- [ ] Pagination for photos endpoint

### Optional Enhancements
- [ ] Add unit tests
- [ ] Implement biometric authentication
- [ ] Add credential categories/tags
- [ ] Export/import credentials
- [ ] Search functionality
- [ ] Photo deletion from app

## 📚 Project Structure Reference

```
src/
├── components/
│   ├── CredentialItem.tsx              # Individual credential display
│   └── CredentialItem.styles.ts
├── screens/
│   ├── LoginScreen.tsx                 # JWT login
│   ├── MasterKeyFileScreen.tsx         # Master key file selection
│   ├── CredentialsListScreen.tsx       # List of credentials
│   ├── CredentialFormScreen.tsx        # Add/Edit credential
│   ├── PhotosScreen.tsx                # Photo grid with pagination
│   ├── FullScreenPhotoScreen.tsx       # Full-screen photo viewer
│   ├── SettingsScreen.tsx              # App settings
│   └── *.styles.ts                     # Separate style files
├── navigation/
│   ├── AppNavigator.tsx                # Root navigation (login/unlock/main)
│   └── MainTabNavigator.tsx            # Tab navigation (Credentials/Photos/Settings)
├── contexts/
│   ├── AuthContext.tsx                 # JWT + master key + auto-lock
│   └── SettingsContext.tsx             # App preferences
├── services/
│   ├── authService.ts                  # JWT API calls
│   ├── credentialsService.ts           # Credentials CRUD with encryption
│   ├── photosService.ts                # Photos upload/fetch
│   └── cryptoService.ts                # AES-256 encryption/decryption
├── config/
│   └── api.ts                          # Backend URL configuration
├── constants/
│   └── index.ts                        # App constants
├── types/
│   └── index.ts                        # TypeScript interfaces
└── styles/
    └── colors.ts                       # Color palette
```

Happy coding! 🎉
