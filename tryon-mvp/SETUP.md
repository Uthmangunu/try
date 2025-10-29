# AI Closet MVP - Setup Guide

Complete guide to set up and run the AI Closet virtual try-on application.

## Architecture Overview

```
User Photo → Gemini Nano (local AI) → Search API → User selects outfit
    ↓
Firebase Functions → Banana.dev (cloud GPU) → Try-on result
```

## Prerequisites

- Node.js 18+ and npm
- Firebase account
- SerpAPI account (for outfit search)
- Banana.dev account (for AI try-on generation)
- Chrome browser with Gemini Nano enabled (optional but recommended)

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable the following services:
   - **Authentication** → Enable Google Sign-In
   - **Firestore** → Create database in production mode
   - **Storage** → Enable Firebase Storage
   - **Functions** → Set up Cloud Functions

### 1.2 Get Firebase Configuration

1. In Project Settings → General → Your apps
2. Add a Web App
3. Copy the config object - you'll need these values:
   ```
   apiKey
   authDomain
   projectId
   storageBucket
   messagingSenderId
   appId
   measurementId
   ```

### 1.3 Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

## Step 2: SerpAPI Setup

1. Sign up at [SerpAPI](https://serpapi.com/)
2. Get your API key from the dashboard
3. Note: Free tier provides 100 searches/month

## Step 3: Banana.dev Setup

1. Sign up at [Banana.dev](https://www.banana.dev/)
2. Choose a virtual try-on model (e.g., "Virtual Try-On Diffusion")
3. Note your:
   - API Key
   - Model Key

## Step 4: Local Environment Configuration

### 4.1 Clone and Install Dependencies

```bash
cd tryon-mvp
npm install
```

### 4.2 Configure Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# SerpAPI for outfit search
SERPAPI_KEY=your_serpapi_key_here
```

## Step 5: Firebase Functions Configuration

Configure Banana.dev credentials for Firebase Functions:

```bash
cd tryon-mvp
firebase functions:config:set banana.key="your_banana_api_key"
firebase functions:config:set banana.model_key="your_banana_model_key"
```

Install function dependencies:

```bash
cd functions
npm install
cd ..
```

## Step 6: Firestore Security Rules

The project includes default rules. Deploy them:

```bash
firebase deploy --only firestore:rules
```

Or manually set in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /try_on_jobs/{jobId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

## Step 7: Storage Security Rules

Deploy storage rules:

```bash
firebase deploy --only storage:rules
```

Or set manually:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /user_uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 8: Deploy Firebase Functions

```bash
firebase deploy --only functions
```

## Step 9: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 10: Enable Gemini Nano (Optional but Recommended)

Gemini Nano provides local AI analysis for better privacy and speed.

### For Chrome Canary/Dev:

1. Download [Chrome Canary](https://www.google.com/chrome/canary/)
2. Navigate to `chrome://flags`
3. Enable:
   - `#optimization-guide-on-device-model`
   - `#prompt-api-for-gemini-nano`
4. Restart browser
5. Open DevTools Console and run:
   ```javascript
   await ai.languageModel.create();
   ```

If successful, you'll see local AI analysis working in the app.

## Testing the Application

### Basic Flow Test

1. Open app at `http://localhost:3000`
2. Click "Start Virtual Try-On"
3. Sign in with Google
4. Upload a full-body photo
5. Wait for AI analysis and outfit search
6. Select an outfit from the grid
7. Click "Try On This Outfit"
8. Wait 5-10 seconds for the result

### Expected Behavior

- ✅ Photo upload works
- ✅ Gemini Nano indicator shows if available
- ✅ Outfit search returns 12 results
- ✅ Try-on job processes successfully
- ✅ Side-by-side comparison displays

## Troubleshooting

### "SERPAPI_KEY not configured"
- Verify `.env.local` exists and contains `SERPAPI_KEY`
- Restart dev server after adding env variables

### "Banana API credentials not configured"
- Run: `firebase functions:config:get` to verify
- Re-run: `firebase functions:config:set banana.key="..." banana.model_key="..."`
- Redeploy functions: `firebase deploy --only functions`

### No outfits found
- Check SerpAPI quota (100 searches/month on free tier)
- Try a different search query
- Verify API key is valid

### Try-on job fails
- Check Firebase Functions logs: `firebase functions:log`
- Verify Banana.dev API key is correct
- Ensure model key matches a valid try-on model
- Check Banana.dev dashboard for errors

### Gemini Nano not working
- Only works in Chrome Canary/Dev with flags enabled
- Fallback mode will work without it (less accurate analysis)
- Check browser console for errors

### Camera not working
- Grant camera permissions when prompted
- Use file upload as fallback
- Works best on HTTPS (not localhost)

## Production Deployment

### Option 1: Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard.

### Option 2: Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## Cost Estimates (Monthly)

- Firebase (Free tier): $0 for ~1000 users
- SerpAPI (Free tier): $0 for 100 searches
- Banana.dev: ~$0.02-0.10 per try-on (pay-as-you-go)
- Estimated for 100 try-ons/month: **~$2-10**

## Next Steps

- [ ] Add user authentication persistence
- [ ] Implement outfit favorites/history
- [ ] Add more outfit sources
- [ ] Improve fit scoring algorithm
- [ ] Add share functionality
- [ ] Mobile app wrapper (React Native)

## Support

For issues, check:
1. Firebase Console logs
2. Browser DevTools console
3. `firebase functions:log`

## License

MIT
