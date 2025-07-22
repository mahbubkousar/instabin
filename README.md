# InstaBin

Simple code sharing platform - paste code, get instant shareable links.

## Features

- 🚀 **Anonymous pasting** - no signup required
- 🔗 **Instant shareable links** with unique IDs
- 🎨 **Syntax highlighting** for 19+ languages (Monaco Editor)
- 📱 **Responsive design** - works on all devices
- 📊 **View tracking** - see how many times your paste was viewed
- 🔒 **Secure storage** - Firebase Firestore backend

## Quick Start

```bash
# Clone and install
git clone <repo-url> && cd instabin
npm run install:all

# Start development servers
npm run dev
# Visit http://localhost:3000
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Monaco Editor
- **Backend**: Serverless functions (Vercel/Netlify)  
- **Database**: Firebase Firestore
- **Hosting**: Static deployment with global CDN

## Deployment

**Deploy to Netlify (Free):**

1. **Setup Firebase:**
   - Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore Database
   - Generate service account key

2. **Deploy:**
   - Fork this repo → Connect to Netlify
   - Set environment variables:
     - `FIREBASE_PROJECT_ID`: your-project-id
     - `FIREBASE_SERVICE_ACCOUNT`: service-account-json
   - Auto-deploy from GitHub

**Detailed Guide:** See [FIREBASE_NETLIFY_GUIDE.md](./FIREBASE_NETLIFY_GUIDE.md)

## Project Structure

```
├── client/           # React frontend
├── api/             # Vercel functions  
├── netlify/         # Netlify functions
├── server/          # Local dev server
└── docs/            # Deployment guides
```

## API

- `POST /api/paste` - Create paste
- `GET /api/paste?id={id}` - Get paste
- `GET /api/health` - Health check

## Contributing

1. Fork → Branch → Code → Test → PR
2. Follow existing code style
3. Add tests for new features

## License

MIT