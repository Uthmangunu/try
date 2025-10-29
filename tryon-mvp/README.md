# AI Closet MVP

**Virtual try-on powered by AI** - Upload your photo, browse outfits from the web, and see how they look on you instantly using AI-powered virtual fitting.

![AI Closet](https://img.shields.io/badge/Status-MVP-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Firebase](https://img.shields.io/badge/Firebase-12-orange)

## 🌟 Features

- **📸 Smart Photo Analysis** - Local AI processing with Gemini Nano for privacy-first body measurement
- **👕 Outfit Discovery** - Search and browse outfits from across the web using SerpAPI
- **✨ AI Virtual Try-On** - Cloud-powered realistic try-on generation via Banana.dev
- **📱 Mobile-First** - Responsive design with camera integration
- **🔒 Privacy-First** - Local analysis, minimal data retention
- **⚡ Real-Time Updates** - Live job status via Firestore

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Device                          │
│  ┌─────────────┐      ┌──────────────┐     ┌────────────┐ │
│  │   Next.js   │ ───> │ Gemini Nano  │ ──> │  Firebase  │ │
│  │   Frontend  │      │ (Local AI)   │     │   Auth     │ │
│  └─────────────┘      └──────────────┘     └────────────┘ │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│                    Cloud Services                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  SerpAPI    │  │   Firebase   │  │   Banana.dev     │ │
│  │ (Search)    │  │  Functions   │  │ (Try-On Model)   │ │
│  └─────────────┘  └──────────────┘  └──────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Firebase account
- SerpAPI key ([get one here](https://serpapi.com/))
- Banana.dev account ([sign up](https://www.banana.dev/))

### Installation

```bash
# Clone and install
cd tryon-mvp
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Configure Firebase Functions
firebase functions:config:set banana.key="YOUR_BANANA_KEY"
firebase functions:config:set banana.model_key="YOUR_MODEL_KEY"

# Deploy Firebase
firebase deploy

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)**

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4 |
| **Backend** | Firebase (Functions, Firestore, Storage) |
| **AI - Local** | Gemini Nano (Chrome) |
| **AI - Cloud** | Banana.dev (Virtual Try-On Model) |
| **Search** | SerpAPI (Google Images) |
| **Auth** | Firebase Authentication (Google) |
| **Hosting** | Vercel / Firebase Hosting |

## 📁 Project Structure

```
tryon-mvp/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── try-on/page.tsx       # Main try-on flow (3 steps)
│   │   └── api/
│   │       └── search-outfits/   # Outfit search endpoint
│   └── lib/
│       ├── firebase.ts           # Firebase config
│       └── gemini-nano.ts        # Local AI utilities
├── functions/
│   └── index.js                  # Firebase Functions (Banana API)
├── public/                       # Static assets
├── .env.local.example            # Environment template
└── SETUP.md                      # Detailed setup guide
```

## 🎯 User Flow

1. **Upload Photo** - Take or upload a full-body photo
2. **AI Analysis** - Gemini Nano analyzes proportions locally
3. **Browse Outfits** - AI searches for matching outfits online
4. **Select Outfit** - Choose from 12 outfit options
5. **Generate Try-On** - Banana.dev creates realistic preview
6. **View Result** - Side-by-side comparison in seconds

## 🔑 Environment Variables

Create `.env.local`:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# SerpAPI
SERPAPI_KEY=
```

Firebase Functions config (via CLI):
```bash
firebase functions:config:set banana.key="YOUR_KEY"
firebase functions:config:set banana.model_key="YOUR_MODEL"
```

## 🧪 Testing Locally

```bash
# Start dev server
npm run dev

# Test outfit search API
curl -X POST http://localhost:3000/api/search-outfits \
  -H "Content-Type: application/json" \
  -d '{"query":"summer dress casual"}'

# View Firebase Functions logs
firebase functions:log
```

## 📊 Cost Estimate

| Service | Free Tier | Paid Usage |
|---------|-----------|------------|
| Firebase | Up to 1K users/mo | ~$0-5/mo |
| SerpAPI | 100 searches/mo | $50/mo for 5K |
| Banana.dev | Pay-as-you-go | ~$0.02-0.10 per try-on |
| **Total** | **~$0** | **~$2-10/mo** for 100 try-ons |

## 🔒 Privacy & Security

- ✅ Gemini Nano runs **locally** - photos never leave device for analysis
- ✅ Firebase Storage rules restrict access to user's own uploads
- ✅ Firestore rules ensure users only see their own jobs
- ✅ Google Sign-In for secure authentication
- ✅ No persistent storage of try-on results (can be added)

## 🚧 Known Limitations (MVP)

- Gemini Nano requires Chrome Canary with flags
- One person per photo
- ~5-10s processing time per try-on
- SerpAPI free tier: 100 searches/month
- No outfit history/favorites (yet)

## 🎨 Screenshots

*(Add screenshots here once deployed)*

## 📝 TODO / Roadmap

- [ ] Add outfit favorites and history
- [ ] Support multiple outfit sources
- [ ] Improve fit scoring with ML model
- [ ] Add social sharing
- [ ] Mobile app (React Native)
- [ ] Batch try-on (multiple outfits at once)
- [ ] User profiles and saved preferences

## 🤝 Contributing

This is an MVP proof-of-concept. Contributions welcome!

## 📄 License

MIT

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Backend services
- [Banana.dev](https://www.banana.dev/) - AI inference hosting
- [SerpAPI](https://serpapi.com/) - Search API
- [Gemini Nano](https://deepmind.google/technologies/gemini/nano/) - On-device AI

---

**Built with Next.js, Firebase, and AI** 🚀
