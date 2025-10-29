# Deployment Guide - AI Closet MVP

Quick reference for deploying the AI Closet application to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Firebase project set up
- [ ] SerpAPI key obtained
- [ ] Banana.dev account ready
- [ ] Firebase Functions deployed and tested locally
- [ ] Application tested end-to-end locally

## Option 1: Vercel (Recommended for Frontend)

### Why Vercel?
- Fast global CDN
- Automatic SSL
- Easy environment variable management
- Integrated with Next.js
- Free hobby tier

### Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd tryon-mvp
   vercel
   ```

4. **Configure Environment Variables**

   In Vercel Dashboard → Your Project → Settings → Environment Variables:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
   SERPAPI_KEY=...
   ```

5. **Redeploy**
   ```bash
   vercel --prod
   ```

### Update Domain in Firebase

1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to authorized domains
3. Update `.env.local` with production Firebase config if needed

## Option 2: Firebase Hosting

### Why Firebase Hosting?
- Same ecosystem as backend
- Free tier includes SSL
- Easy integration with Functions
- Good for simple deployments

### Steps

1. **Build the application**
   ```bash
   cd tryon-mvp
   npm run build
   ```

2. **Update firebase.json**

   Ensure hosting configuration exists:
   ```json
   {
     "hosting": {
       "public": "out",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

3. **Export static site** (if needed)

   Update `next.config.ts`:
   ```typescript
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true
     }
   };
   ```

4. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

## Firebase Functions Deployment

**Required for both hosting options!**

```bash
cd tryon-mvp

# Configure Banana credentials (if not done)
firebase functions:config:set banana.key="YOUR_BANANA_KEY"
firebase functions:config:set banana.model_key="YOUR_MODEL_KEY"

# Deploy functions
firebase deploy --only functions
```

## Post-Deployment Steps

### 1. Update Firebase Security Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

### 2. Test Production Endpoints

```bash
# Test outfit search
curl -X POST https://your-domain.com/api/search-outfits \
  -H "Content-Type: application/json" \
  -d '{"query":"casual outfit"}'
```

### 3. Monitor Firebase Functions

```bash
firebase functions:log --only createTryOnJob
```

### 4. Set up Monitoring

- Enable Firebase Performance Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor Banana.dev usage
- Track SerpAPI quota

## Environment-Specific Configuration

### Development
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-closet-dev
```

### Production
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-closet-prod
```

## Scaling Considerations

### Firebase Limits (Free Tier)

| Resource | Limit | Upgrade At |
|----------|-------|------------|
| Firestore reads | 50K/day | ~1K users |
| Storage downloads | 1GB/day | ~200 try-ons |
| Functions invocations | 2M/month | ~10K try-ons |

### Banana.dev

- Pay-as-you-go
- ~$0.02-0.10 per inference
- Set up billing alerts

### SerpAPI

- Free: 100 searches/month
- Starter: $50/month (5K searches)
- Monitor usage in dashboard

## Cost Optimization

1. **Cache outfit searches** in Firestore
   ```javascript
   // Store popular searches for 24 hours
   const cacheKey = `search_${query}`;
   const cached = await db.collection('search_cache').doc(cacheKey).get();
   if (cached.exists) return cached.data();
   ```

2. **Limit Banana.dev calls**
   - Add rate limiting
   - Require user confirmation before processing

3. **Optimize SerpAPI usage**
   - Cache results per query
   - Deduplicate searches

## Monitoring & Analytics

### Firebase Analytics

```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();

// Track key events
logEvent(analytics, 'photo_uploaded');
logEvent(analytics, 'outfit_selected');
logEvent(analytics, 'tryon_completed');
```

### Error Tracking

Add to `src/app/layout.tsx`:

```typescript
window.onerror = (message, source, lineno, colno, error) => {
  // Send to error tracking service
  console.error('Error:', { message, source, lineno, colno, error });
};
```

## Rollback Plan

### Vercel Rollback
```bash
vercel rollback
```

### Firebase Functions Rollback
```bash
# List deployments
firebase functions:releases:list

# Rollback to specific version
firebase functions:releases:rollback <release-id>
```

## Performance Optimization

### 1. Enable Image Optimization

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'serpapi.com'],
    formats: ['image/webp'],
  },
};
```

### 2. Add Loading States

Already implemented in try-on page.

### 3. Implement Code Splitting

Next.js handles this automatically.

## Security Hardening

### 1. Content Security Policy

Add to `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};
```

### 2. Rate Limiting

Add to Firebase Functions:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
});

exports.createTryOnJob = functions
  .runWith({ memory: '1GB', timeoutSeconds: 120 })
  .https.onCall(limiter, async (data, context) => {
    // ... existing code
  });
```

### 3. Validate Inputs

Already implemented in functions.

## Production Checklist

- [ ] Environment variables set in Vercel/Firebase
- [ ] Firebase Functions deployed
- [ ] Security rules deployed
- [ ] Domain added to Firebase authorized domains
- [ ] SSL certificate active
- [ ] Error tracking configured
- [ ] Analytics enabled
- [ ] Monitoring dashboards set up
- [ ] Billing alerts configured
- [ ] Backup strategy defined
- [ ] Documentation updated with production URLs

## Troubleshooting Production Issues

### Functions timing out

Update `functions/index.js`:
```javascript
exports.createTryOnJob = functions
  .runWith({
    memory: '2GB',
    timeoutSeconds: 300
  })
  .https.onCall(async (data, context) => {
    // ... code
  });
```

### CORS errors

Add to API route:
```typescript
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  // ... rest of code
  return NextResponse.json(data, { headers });
}
```

### High Banana.dev costs

- Implement request queuing
- Add cooldown periods
- Show cost estimate to users before processing

## Support

For production issues:
- Firebase Console → Logs
- Vercel Dashboard → Deployments → Logs
- Banana.dev Dashboard → Usage
- SerpAPI Dashboard → API Calls

## Next Steps

After successful deployment:
1. Monitor for 24 hours
2. Gather user feedback
3. Check cost metrics
4. Plan feature roadmap
5. Set up automated backups

---

Happy deploying! 🚀
