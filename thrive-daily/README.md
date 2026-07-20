# Thrive Daily 🌱

A calm, wellness-themed self-improvement Telegram Mini App. Built with React, Vite, Firebase Auth + Firestore, and the Telegram WebApp SDK.

## Stack

- React 18 + Vite (plain JavaScript, no TypeScript)
- React Router (client-side routing)
- Firebase Authentication (email/password)
- Firestore (real-time sync, offline persistence)
- Telegram WebApp global SDK (loaded via script tag, no bundler dependency)
- Deployed to Netlify

## Getting Started

```bash
npm install
npm run dev
```

Open the local URL Vite prints (e.g. `http://localhost:5173`). It runs fine as a normal web app outside Telegram too — Telegram-specific calls no-op gracefully when `window.Telegram` isn't present.

## 1. Configure Firebase

1. Go to the [Firebase console](https://console.firebase.google.com/) and open (or create) your project — this app was scaffolded against the `thrive-daily-555b1` project used elsewhere in this codebase.
2. Project settings → General → Your apps → add a Web app if you haven't.
3. Copy the config object into `src/firebase.js`, replacing the placeholder values:

```js
const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...'
}
```

4. In the Firebase console, enable **Authentication → Sign-in method → Email/Password**.
5. In **Firestore Database**, create a database (production mode), then deploy `firestore.rules` (or paste its contents into the Rules tab). Rules lock every document to its authenticated owner (`users/{uid}` and `users/{uid}/journal/{entryId}`).

## 2. Run locally

```bash
npm run dev
```

## 3. Build for production

```bash
npm run build
```

Outputs static files to `dist/`.

## 4. Deploy to Netlify

**Option A — Netlify UI / drag & drop**
1. Run `npm run build`.
2. Drag the `dist/` folder into Netlify's "Deploys" page, or connect this repo and let Netlify run `npm run build` with publish directory `dist` (already configured in `netlify.toml`).

**Option B — Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

`netlify.toml` already includes the SPA redirect rule (`/* -> /index.html`) so client-side routing works on refresh/deep links, plus headers that allow the app to be embedded inside `web.telegram.org` frames.

## 5. Register as a Telegram Mini App

1. Message **@BotFather** on Telegram, create/select your bot.
2. `/newapp` (or `/mybots` → your bot → Bot Settings → Menu Button / Mini App) and set the Web App URL to your Netlify URL (e.g. `https://thrive-daily.netlify.app`).
3. Open your bot in Telegram and launch the Mini App. It will call `WebApp.ready()`/`expand()` automatically, adopt Telegram's theme colors, and respect safe-area insets for notch/home-indicator devices.

## Project Structure

```
thrive-daily/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── firestore.rules
├── src/
│   ├── main.jsx           # entry point, mounts React + Router
│   ├── App.jsx             # routes, auth guards, layout
│   ├── firebase.js         # Firebase init (auth + Firestore)
│   ├── telegram.js         # Telegram WebApp SDK wrapper
│   ├── gamification.js     # XP/level/streak/achievement logic
│   ├── content.js          # lessons, exercises, challenges, moods data
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useUserStats.js # Firestore-synced XP/streak/mood state
│   │   └── useJournal.js   # Firestore-synced journal CRUD
│   ├── components/
│   │   ├── TabBar.jsx
│   │   ├── Loading.jsx
│   │   └── Progress.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Home.jsx
│   │   ├── Mood.jsx
│   │   ├── Lessons.jsx
│   │   ├── Journal.jsx
│   │   ├── Exercises.jsx
│   │   ├── Insights.jsx
│   │   └── Profile.jsx
│   └── styles/
│       └── theme.css
```

## Features

- **Auth**: register/login/logout via Firebase Email+Password, persisted locally.
- **Home dashboard**: greeting, today's lesson, today's challenge, mood quick-picker, XP, streak, level progress bar.
- **Journal**: create/delete entries, real-time Firestore sync, each new entry awards XP.
- **Mood tracker**: 5 states (Great, Calm, Okay, Stressed, Sad), one per day, awards XP once/day.
- **Lessons**: 5 categories (Mindset, Emotional Intelligence, Finance, Discipline, Relationships), a rotating "lesson of the day" that awards XP once/day.
- **Exercises**: guided breathing timer (box breathing, 4 rounds), gratitude reflection, goal setting — each awards XP and (for text exercises) saves to the journal.
- **Gamification**: XP thresholds map to 5 levels (🌱 Seed → 🌟 Sage), streak tracking (resets if a day is missed), achievement badges.
- **Profile**: name/email, level summary, lifetime stats, sign out.
- **Insights**: journal count, exercise count, current streak, total XP, achievement gallery.
- **Telegram integration**: `ready()`, `expand()`, fullscreen request, theme color sync, BackButton wiring on sub-pages, safe-area CSS variables for notch/home-indicator layout.

## Notes

- All Firestore reads use real-time `onSnapshot` listeners, so XP/streak/journal changes reflect instantly across the UI.
- The app works as a normal web app (not just inside Telegram) — useful for testing on desktop/iPhone Safari during development.
- No browser-side Babel, no CDN React, no single-file HTML — this is a standard Vite build pipeline.
