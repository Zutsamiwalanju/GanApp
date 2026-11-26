# GanApp

**Find what's happening near you, right now.**
GanApp shows live "pings" on a map: events and places pinned with a **live photo only**. Every ping **disappears on its own**, and **reviews expire after 30 days unless people vote them helpful**. Explorers find things to do, and Promoters (establishments) post clearly labeled promoted pings.

IE103-2 Technopreneurship · GRP1-AC2 (GANAPP)

---

## What works

| Area | Features |
|---|---|
| Onboarding | 3 intro slides, choose Explorer or Promoter, interests, location (or Makati sample city). No sign-up: each phone gets an anonymous account |
| Explore | Live pings that reach you, nearest first, with filters (Happening now, Today, Free, Near me), recommendations from your interests, pull to refresh |
| Map | Real map with colored pins, 500 m / 1 km / 5 km radius, ping card with walking directions (Google Maps) and Save |
| Pin | **Live camera only** (no gallery), photo stamped with where it was taken, real text fields, category, start/end times, price, duration and vicinity |
| Ping page | Countdown, About, Reviews (upvote "Helpful", kept-up-by-votes tag), Who's going, I'm going, Share, Save |
| Connect | Event chat circle for every live event |
| Promoter | Dashboard with reach/directions/going, create promoted ping (6 hrs / 12 hrs / 24 hrs / Weekly, 1 / 3 / 5 km, Promoted label), live insights, **Extend ping +6 hrs** (end time updates instantly), remove ping |
| Also | Saved places, Notifications (live pings near you), Search, Profile (name, role, location, interests) |

All times are shown in **12-hour format** (e.g. `Today, 6:00 PM – 10:00 PM`, `Until Tomorrow, 4:00 AM`) and are computed from the data, not typed in.

## Tech

- **App:** React Native + Expo (expo-router), TypeScript
- **Backend:** Supabase: Postgres with row level security, anonymous auth, storage bucket `ping-photos`
- **Maps:** react-native-maps · **Camera:** expo-camera · **Location:** expo-location

```
app/                 screens (file = route)
  (tabs)/            Explore, Map, Pin, Connect
  create/            camera → details → settings → published
  promoter/          dashboard and live ping insights
  ping/[id]          event/place page
src/
  api.ts             every Supabase call
  store.tsx          app state (profile, location, pings, saves…)
  time.ts            12-hour time formatting and countdowns
  geo.ts             distance, radius labels, directions links
  components/ui.tsx  buttons, chips, cards, badges (Figma styles)
supabase/schema.sql  database tables, rules and functions
```

## Run it on your phone (first time)

You need: a laptop with **Node.js 20+** (nodejs.org) and an Android or iPhone with **Expo Go** (Play Store / App Store).

```bash
git clone https://github.com/<your-username>/GanApp.git
cd GanApp
npm install
npx expo install expo@latest     # match the Expo version your Expo Go app supports
npx expo install --fix           # align all Expo packages to that version
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iPhone). Your phone and laptop must be on the same Wi-Fi. If they aren't, use `npx expo start --tunnel`.

### One-time Supabase setting (required)

In the Supabase dashboard: **Authentication → Sign In / Providers → turn on "Allow anonymous sign-ins"**, then save. Without this the app shows "Can't reach GanApp".

The database tables, security rules, photo bucket and sample Makati data are already set up in the project. `supabase/schema.sql` is a copy for reference.

### Keys

`.env` holds the Supabase URL and **publishable** key. Both are meant to be public and are safe in the app.
**Never** put the `service_role` key or database password in this repo, and never paste them in chat.

## Demo tips

- Choose **Explore sample city** at the location step to see the Makati demo pings (Sunset Sessions, Gallery After Hours, The Mill…). They refresh automatically so they always look live.
- For the Promoter demo, choose Promoter, take a live photo, publish, then tap **Extend ping +6 hrs** and watch "Until…" and "Ends in…" update.

## Known limits / next steps

- Push notifications (the Notifications screen currently lists live pings near you)
- Promoter verification badge and a Report button for moderation
- Dark mode, weekly repeating pings, real-time chat (it currently refreshes every 5 seconds)
- Play Store build: needs a Google Maps API key in `app.json` for Android builds outside Expo Go
