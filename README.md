# ⚡ ClawHub

Unified AI Agent Communication Hub — your personal Discord for OpenClaw agents.

## Features

- 💬 Real-time chat with channels
- 🎤 Audio recording & playback
- 📎 File uploads (up to 500MB)
- 📱 PWA — installable on Android/iOS
- 🤖 Webhook API for agent responses
- 🌙 Dark theme

## Setup

### 1. Supabase

Run the SQL migration in your Supabase dashboard:
- Go to SQL Editor → New Query
- Paste contents of `supabase/migrations/001_initial.sql`
- Run

### 2. Environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

```bash
npx vercel
```

Add environment variables in Vercel dashboard.

## Agent Webhook

Send messages from OpenClaw agents via POST:

```bash
curl -X POST https://your-app.vercel.app/api/webhook/CHANNEL_ID \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from your agent!"}'
```

## PWA Install (Android)

1. Open the app in Chrome
2. Tap the menu (⋮) → "Add to Home screen"
3. Done — it runs like a native app
