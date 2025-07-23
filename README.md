# InstaBin

---

Simple code sharing platform - paste code, get instant shareable links.

**Live Website:** [https://insta-bin.netlify.app/](https://insta-bin.netlify.app/)

## Features

- **Multi-tab support** - create and organize multiple code snippets in one paste
- **User authentication** - sign up with email/password or Google OAuth
- **Personal dashboard** - manage and organize your code pastes
- **Anonymous pasting** - no signup required for guest users
- **Instant shareable links** with unique IDs
- **Syntax highlighting** for 19+ languages (Monaco Editor)
- **Responsive design** - works on all devices
- **View tracking** - see how many times your paste was viewed
- **Privacy controls** - make pastes public or private
- **Secure storage** - Firebase Firestore backend with authentication

## Quick Start

---

```bash
# Clone and install
git clone https://github.com/mahbubkousar/instabin && cd instabin
npm run install:all

# Setup environment variables
cp client/.env.example client/.env
# Edit client/.env with your Firebase config

# Start development server
npm run dev
```

## Environment Setup

Create `client/.env` with your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

For server-side, set these environment variables:
- `FIREBASE_PROJECT_ID` - your Firebase project ID
- `FIREBASE_SERVICE_ACCOUNT` - stringified service account JSON (for local development)

## Tech Stack

---

- **Frontend**: React 18 + TypeScript + Monaco Editor
- **Backend**: Serverless functions (Netlify)
- **Database**: Firebase Firestore
- **Hosting**: Static deployment with global CDN

## Deployment

---

**Deploy to Netlify:**

1.  **Setup Firebase:**

    - Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
    - Enable Firestore Database
    - Enable Authentication with Email/Password and Google providers
    - Generate service account key
    - Copy web app config for client-side

2.  **Deploy:**

    - Fork this repo → Connect to Netlify
    - Set environment variables:
      - `FIREBASE_PROJECT_ID`: your-project-id
      - `FIREBASE_SERVICE_ACCOUNT`: service-account-json
    - Auto-deploy from GitHub

## API

---

- `POST /api/paste` - Create paste
- `GET /api/paste?id={id}` - Get paste
- `GET /api/health` - Health check

## Contributing

---

1.  Fork → Branch → Code → Test → PR
2.  Follow existing code style
3.  Add tests for new features

## License

---

MIT
