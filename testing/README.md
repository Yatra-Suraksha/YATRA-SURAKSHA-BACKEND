# 🧪 Testing Documentation

This folder contains all testing utilities and documentation for the Yatra Suraksha Backend API.

## 📁 Files Overview

### Authentication Testing
- **`test-firebase-auth.html`** - Interactive web page to get Firebase ID tokens for API testing
- **`get-firebase-token-guide.sh`** - Shell script guide with instructions for obtaining Firebase tokens

### API Testing
- **`run-tests.js`** - Automated test runner for API endpoints
- **`test-realtime-tracking.js`** - Real-time tracking functionality tests

## 🚀 Quick Start

### 1. Get Firebase ID Token (For Authentication Testing)

```bash
# Method 1: Use the interactive HTML page
open testing/test-firebase-auth.html

# Method 2: Follow the guide
./testing/get-firebase-token-guide.sh
```

### 2. Test API Endpoints

```bash
# Run all automated tests
node testing/run-tests.js

# Test real-time tracking
node testing/test-realtime-tracking.js
```

### 3. Manual API Testing with curl

Once you have a Firebase ID token:

```bash
# Test token verification
curl -X POST 'http://localhost:3000/api/users/verify' \
  -H 'Authorization: Bearer YOUR_FIREBASE_ID_TOKEN' \
  -H 'Content-Type: application/json'

# Test user profile
curl -X GET 'http://localhost:3000/api/users/me' \
  -H 'Authorization: Bearer YOUR_FIREBASE_ID_TOKEN'

# Test location tracking
curl -X POST 'http://localhost:3000/api/tracking/location' \
  -H 'Authorization: Bearer YOUR_FIREBASE_ID_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "touristId": "TOURIST_ID_HERE",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "accuracy": 10
  }'
```

## 🔑 Firebase Authentication Setup

### Required Firebase Configuration

1. **Get Firebase Config**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project (`yatrasuraksha`)
   - Go to Project Settings > General
   - Copy the `firebaseConfig` object

2. **Create Test Users**:
   - Go to Authentication > Users
   - Add test users with email/password
   - Use these credentials in the HTML test page

3. **Enable Authentication Methods**:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication

## 📋 Token Types Reference

### ✅ Firebase ID Token (USE THIS)
```
eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4...
```
- Long JWT string (3 parts separated by dots)
- Contains user info and expires in 1 hour
- Used for API authentication

### ❌ Firebase UID (DON'T USE FOR AUTH)
```
abc123def456ghi789
```
- Short alphanumeric string
- Permanent user identifier
- Cannot be used for authentication

## 🛠️ Development Notes

- Ensure your backend server is running on `http://localhost:3000`
- All API endpoints require valid Firebase ID tokens
- Tokens expire every hour and need to be refreshed
- Use the HTML test page for quick token generation during development

## 📞 Support

If you encounter issues:
1. Check that Firebase is properly configured
2. Verify your server is running
3. Ensure you're using ID tokens, not UIDs
4. Check the browser console for detailed error messages