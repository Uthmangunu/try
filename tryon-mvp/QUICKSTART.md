# 🚀 QUICK START GUIDE

Your Firebase project is already configured: **trymeon-98a34**

## Step 1: Get Firebase Web App Config (2 min)

1. Go to: https://console.firebase.google.com/project/trymeon-98a34/settings/general
2. Scroll to "Your apps" → Click "Add app" → Choose Web (</>) icon
3. Register app (name: "AI Closet Web")
4. Copy the `firebaseConfig` object

It will look like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "trymeon-98a34.firebaseapp.com",
  projectId: "trymeon-98a34",
  storageBucket: "trymeon-98a34.appspot.com",
  messagingSenderId: "798950436115",
  appId: "1:798950436115:web:...",
  measurementId: "G-..."
};
```

## Step 2: Enable Firebase Services (3 min)

In Firebase Console (https://console.firebase.google.com/project/trymeon-98a34):

### Authentication
1. Go to **Build → Authentication**
2. Click "Get started"
3. Enable **Google** sign-in provider
4. Add your email as authorized domain if needed

### Firestore Database
1. Go to **Build → Firestore Database**
2. Click "Create database"
3. Choose **Production mode**
4. Select region (us-central1 recommended)

### Storage
1. Go to **Build → Storage**
2. Click "Get started"
3. Choose **Production mode**
4. Use same region as Firestore

### Functions
1. Go to **Build → Functions**
2. Click "Get started" (this enables the service)

## Step 3: Get SerpAPI Key (2 min)

1. Sign up: https://serpapi.com/users/sign_up
2. Get your API key from: https://serpapi.com/manage-api-key
3. Free tier: 100 searches/month

## Step 4: Get Banana.dev Credentials (5 min)

1. Sign up: https://www.banana.dev/
2. Go to dashboard
3. Find a **Virtual Try-On** model (or similar image generation model)
4. Copy:
   - API Key (from account settings)
   - Model Key (from model page)

## Step 5: Configure .env.local (2 min)

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your values:

```env
# From Firebase console (Step 1)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=trymeon-98a34.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=trymeon-98a34
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=trymeon-98a34.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=798950436115
NEXT_PUBLIC_FIREBASE_APP_ID=1:798950436115:web:...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-...

# From SerpAPI (Step 3)
SERPAPI_KEY=your_serpapi_key_here
```

## Step 6: Install Dependencies (2 min)

```bash
# Main app dependencies
npm install

# Function dependencies
cd functions
npm install
cd ..
```

## Step 7: Configure Firebase Functions (2 min)

```bash
# Login to Firebase
firebase login

# Set Banana.dev credentials
firebase functions:config:set banana.key="YOUR_BANANA_API_KEY"
firebase functions:config:set banana.model_key="YOUR_BANANA_MODEL_KEY"
```

## Step 8: Deploy Firebase (5 min)

```bash
# Deploy everything
firebase deploy
```

This will deploy:
- Firestore security rules
- Storage security rules
- Cloud Functions

## Step 9: Run Locally (1 min)

```bash
npm run dev
```

Open: http://localhost:3000

## Step 10: Test the Flow

1. Click "Start Virtual Try-On"
2. Sign in with Google
3. Upload a full-body photo
4. Browse outfits (AI will search automatically)
5. Select an outfit
6. Wait ~5-10 seconds
7. See your virtual try-on!

---

## ✅ Verification Checklist

- [ ] Firebase web app created
- [ ] Authentication enabled (Google provider)
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Functions enabled
- [ ] SerpAPI key obtained
- [ ] Banana.dev credentials obtained
- [ ] `.env.local` configured
- [ ] Dependencies installed
- [ ] Firebase Functions configured
- [ ] Firebase deployed
- [ ] App running on localhost:3000

---

## 🆘 Troubleshooting

**Can't find Firebase config?**
→ https://console.firebase.google.com/project/trymeon-98a34/settings/general

**Functions deployment fails?**
→ Make sure billing is enabled (Firebase requires Blaze plan for Functions)
→ Go to: https://console.firebase.google.com/project/trymeon-98a34/usage

**App crashes on load?**
→ Check browser console (F12)
→ Verify all env variables are set
→ Make sure Firebase services are enabled

**"Permission denied" errors?**
→ Deploy security rules: `firebase deploy --only firestore:rules,storage:rules`

**Outfit search returns nothing?**
→ Check SerpAPI quota
→ Verify SERPAPI_KEY in `.env.local`
→ Restart dev server after adding env vars

**Try-on fails?**
→ Check Firebase Functions logs: `firebase functions:log`
→ Verify Banana.dev credentials
→ Ensure Firebase is on Blaze (pay-as-you-go) plan

---

## 💰 Costs

- Firebase: Free tier covers development
- SerpAPI: 100 free searches/month
- Banana.dev: ~$0.02-0.10 per try-on

**Upgrade to Blaze plan for Functions (required):**
- Still free for low usage
- Only pay for what you use beyond free tier

---

## 🎯 Next Steps After It Works

1. Test on mobile
2. Try different outfits
3. Invite friends to test
4. Deploy to production (see DEPLOYMENT.md)

Need help? Check the full SETUP.md guide!
