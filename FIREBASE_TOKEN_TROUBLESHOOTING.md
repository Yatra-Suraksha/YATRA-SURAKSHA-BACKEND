# Firebase Token Troubleshooting Guide

## Common Issue: Google OAuth Tokens vs Email/Password Tokens

### Problem Description
- Tokens generated via Firebase Test HTML with email/password work in Swagger
- Tokens generated via "Continue with Google" don't work in Swagger
- Backend returns authentication errors for Google OAuth tokens

### Root Causes & Solutions

#### 1. **Project ID Mismatch** (Most Common)
**Symptoms:**
- Error: `Token was issued for a different Firebase project`
- Error code: `auth/argument-error`

**Solution:**
Ensure both authentication methods use the same Firebase project:

```bash
# Check your .env file
FIREBASE_PROJECT_ID=your-correct-project-id

# Verify in Firebase Console that both auth methods are configured for the same project
```

#### 2. **Token Audience Validation**
**Symptoms:**
- Error: `Invalid audience`
- Different `aud` claims in token payload

**Debug Steps:**
1. Use the new debug endpoint: `POST /api/users/debug-token`
2. Compare token payloads between working and non-working tokens:

```bash
# Test with working token
curl -X POST http://localhost:3000/api/users/debug-token \
  -H "Authorization: Bearer YOUR_WORKING_TOKEN"

# Test with Google OAuth token
curl -X POST http://localhost:3000/api/users/debug-token \
  -H "Authorization: Bearer YOUR_GOOGLE_OAUTH_TOKEN"
```

#### 3. **Sign-in Provider Differences**
**Expected Values:**
- Email/Password: `firebase.sign_in_provider = "password"`
- Google OAuth: `firebase.sign_in_provider = "google.com"`

Both should be accepted, but verify the provider is correctly identified.

#### 4. **Token Generation Environment**
**Common Issues:**
- Different Firebase config on frontend vs test environment
- Using development vs production Firebase projects
- Cached authentication state

**Solutions:**
```javascript
// Ensure frontend uses same project ID
const firebaseConfig = {
  projectId: "your-correct-project-id", // Must match backend .env
  // ... other config
};

// Clear auth state when switching between methods
await firebase.auth().signOut();
```

### Quick Debugging Steps

#### Step 1: Verify Project Configuration
```bash
# Check backend .env
echo $FIREBASE_PROJECT_ID

# Check if service account matches
cat config/your-firebase-adminsdk.json | jq '.project_id'
```

#### Step 2: Use Debug Endpoint
```bash
# Replace YOUR_TOKEN with the failing Google OAuth token
curl -X POST http://localhost:3000/api/users/debug-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" | jq
```

#### Step 3: Compare Token Payloads
Look for differences in:
- `iss` (issuer) - should be `https://securetoken.google.com/YOUR_PROJECT_ID`
- `aud` (audience) - should match your project ID
- `firebase.sign_in_provider` - should be valid provider

#### Step 4: Check Firebase Console
1. Go to Firebase Console → Authentication → Sign-in methods
2. Verify Google OAuth is enabled for the correct project
3. Check if the same project is used for both auth methods

### Enhanced Error Messages

The backend now provides detailed error information in development mode:

```json
{
  "success": false,
  "message": "Authentication failed",
  "error": "PROJECT_MISMATCH",
  "debug": {
    "errorCode": "auth/argument-error",
    "message": "Token was issued for different project",
    "expectedProject": "your-project-id",
    "tokenLength": 1234
  }
}
```

### Testing Different Token Types

#### Generate Test Tokens:

1. **Email/Password Token:**
```javascript
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const token = await userCredential.user.getIdToken();
```

2. **Google OAuth Token:**
```javascript
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
const token = await result.user.getIdToken();
```

#### Verify Both Work:
```bash
# Test endpoint that requires authentication
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Common Solutions

#### Solution 1: Project ID Fix
```bash
# Update .env with correct project ID
FIREBASE_PROJECT_ID=your-actual-project-id

# Restart backend server
npm run dev
```

#### Solution 2: Service Account Update
```bash
# Download new service account JSON from Firebase Console
# Replace config/your-firebase-adminsdk.json
# Ensure project_id matches .env
```

#### Solution 3: Frontend Configuration
```javascript
// Ensure frontend Firebase config matches backend
const firebaseConfig = {
  projectId: "same-as-backend-env", // Critical!
  // ... other config
};
```

### Prevention Tips

1. **Always use the same Firebase project** for all authentication methods
2. **Verify service account project ID** matches environment variable
3. **Test both auth methods** during development
4. **Use the debug endpoint** to troubleshoot token issues
5. **Check Firebase Console** for consistent project configuration

### Contact Support

If the issue persists after following this guide:
1. Use the debug endpoint to collect token analysis
2. Check server logs for detailed error messages
3. Verify Firebase project settings in console
4. Ensure frontend and backend use identical project configurations