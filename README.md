# GanApp

**Find what's happening near you, right now.**
GanApp shows live "pings" on a map: events and places pinned with a **live photo only**. Every ping **disappears on its own**, and **reviews expire after 30 days unless people vote them helpful**. Explorers find things to do, and Promoters (establishments) post clearly labeled promoted pings.

IE103-2 Technopreneurship · GRP1-AC2 (GANAPP)

---

## Run it on your phone

You need a laptop with **Node.js 22.13 or newer** (nodejs.org) and a phone with **Expo Go** (Play Store / App Store). This project uses **Expo SDK 58**, the same version as the current Expo Go.

**Windows PowerShell (first time only):**
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

```bash
git clone https://github.com/Zutsamiwalanju/GanApp.git
cd GanApp
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iPhone). Your phone and laptop must be on the same Wi-Fi. If they aren't, use `npx expo start --tunnel`.

If you already cloned it before: `git pull`, then `npm install` again.

### One-time Supabase setting

In the Supabase dashboard, go to **Authentication → Sign In / Providers**, turn on **Allow anonymous sign-ins**, then save.

## What's in the app

| Area | Features |
|---|---|
| Onboarding | Illustrated intro, Explorer or Promoter, interests, location or a sample area (Makati or Intramuros). No sign-up needed. |
| Explore | Pings that reach you, with "happening now" first. Filters: Happening now, Today, Free, Near me. Recommendations from your interests. Area switcher. |
| Map | Category-colored pins, 500 m / 1 km / 5 km radius, recenter, walking directions, Save. |
| Pin | **Live camera only** (no gallery). The ping is placed where the photo was taken. Real text fields, category, day + time picker, price, duration and reach. Community-rules check before publishing. |
| Ping page | Event time or opening hours (open/closed), place reviews with ▲ Helpful, Who's going, I'm going, Share, Save, Report / Block. Owners can Edit. |
| Connect | A chat circle for every event; long-press a message to report it or block someone. |
| Promoter | Dashboard, private **practice ping**, promoted pings (6 hrs / 12 hrs / 24 hrs / 7 days, 1 / 3 / 5 km), insights, **Extend ping +6 hrs**, Edit, Remove (also deletes the photo). |
| Also | Saved, Notifications, Search, Profile, Privacy & community rules. |

All times use the **12-hour format** and are worked out from the data. Sample events follow the real Manila clock, for example "Sunset Sessions, 5:00 PM – 10:00 PM".

### Trust & safety (enforced in the database, not just the app)
- One review per person per place. You can't review your own ping or upvote your own review.
- Reviews belong to the **place**, so a venue keeps its reputation across many pings.
- Report anything; it's hidden for you right away and **for everyone after 3 reports**.
- Block people to hide everything they post.
- Only Promoter accounts can mark a ping as Promoted. Only admins can set "verified".
- Stats are honest: each person counts once and owners' own views don't count.

## Tech

- **App:** React Native 0.88 + Expo SDK 58 (expo-router), TypeScript, Inter font
- **Backend:** Supabase. Postgres with row level security, anonymous auth, `ping-photos` storage
- **Maps:** react-native-maps · **Camera:** expo-camera · **Location:** expo-location · **Images:** expo-image

```
app/                    screens (file = route)
  (tabs)/               Explore, Map, Pin, Connect
  create/               camera → details → settings → published
  ping/[id], ping/edit  event page and edit
  promoter/             dashboard and live insights
src/
  api.ts                every Supabase call
  store.tsx             app state (profile, location, pings, saves, blocks…)
  time.ts               12-hour times, "happening now", open/closed
  assets.ts             bundled artwork, icons and fonts
  components/           UI kit, Inter Text, Report/Block menu, day/time picker
assets/                 app icon, splash, illustrations (art/), category icons (cat/), fonts
supabase/schema.sql     original tables (v1). v2 changes are in the Supabase migration history:
                        v2_trust_safety_and_places, v2_demo_data
```

## Keys

`.env` holds the Supabase URL and **publishable** key. Both are meant to be public.
**Never** put the `service_role` key or the database password in this repo, and never paste them in chat.

## Demo tips

- At Mapúa, pick **Intramuros** (or use your location there): Kalye Food Crawl, Plaza Roma Acoustic Jam, Muralla Study Café and more.
- For the Promoter demo, choose Promoter, tap **Try a practice ping**, then **Extend ping +6 hrs** and watch "Ping visible until…" change.

## Not done yet (needs a store build or more time)

- Push notifications (Expo Go can't receive them; the Notifications screen lists nearby pings instead)
- Saving your account with an email so you can move to a new phone
- Verified business badges and payments for promoted pings
- Dark mode
- Real-time chat (it currently refreshes every 5 seconds)
- Android Play Store build: needs a Google Maps API key in `app.json`

Artwork and icon were drawn for GanApp. Inter font © The Inter Project Authors, SIL Open Font License (see `assets/fonts/OFL.txt`).
