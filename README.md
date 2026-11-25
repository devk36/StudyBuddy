# 🐾 Study Paws

> *A cozy little study corner for two friends and one very hardworking pet.*

Study Paws is a gift website: a Pomodoro study room with a virtual pet (cat, puppy or bunny) that reads with you, naps during breaks, celebrates finished sessions and gets dramatically disappointed when you skip. Two friends can study together in a real-time **shared room** with a synced timer, presence, reactions and shared goals. It also has a meme corner, achievements, a pet shop, ambient sounds and a lot of tiny details.

- **Solo mode** works out of the box, with no backend and no accounts. Everything is saved in the browser.
- **Shared rooms** need a free Supabase project, which takes about 10 minutes to set up (see below).

---

## 1. Quick start (local)

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build and preview:

```bash
npm run build        # type-checks, then builds to dist/
npm run preview      # http://localhost:4173
```

Requires Node 20.19+ (or 22.12+).

---

## 2. Make it yours 💌 (personalization)

**Edit one file: [`src/config/personalize.ts`](src/config/personalize.ts)**

| Field | What it does |
| --- | --- |
| `friendName` | The person receiving the gift ("Good evening, Bestie!") |
| `yourName` | You, shown on the note ("a little note from Kunal") |
| `petName`, `defaultPet` | The companion's name and starting species (`'cat' \| 'dog' \| 'bunny'`) |
| `roomName` | Default name for new shared rooms |
| `welcomeTitle`, `welcomeSubtitle` | Welcome screen and home page headline |
| `note`, `signature` | The handwritten letter inside the gift envelope |
| `personalMessages` | Your own lines, mixed into the pet's chatter and the "Encourage me" button. Supports `{friend}` and `{you}`. |

Your friend can also change names and messages in **Settings ⚙️**. Those edits are saved in their browser and override the defaults. **Settings → Replay the welcome** shows the gift-opening screen again.

---

## 3. Shared rooms (Supabase) 🫂

GitHub Pages only hosts static files, so real-time sync runs on **Supabase** (free tier is plenty).

### 3.1 Create the backend

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It's safe to run again later.
3. Go to **Authentication → Sign In / Providers** and enable **Anonymous sign-ins**.
4. Go to **Project Settings → API** and copy the **Project URL** and the **anon / public** key.
   ⚠️ **Never** use the `service_role` key. It bypasses all security.
5. *(Recommended)* In **Realtime → Settings**, turn **off** "Allow public access" so only private, authorized channels are allowed. Study Paws uses only private channels.
6. *(Optional)* In **Authentication → Attack Protection**, enable CAPTCHA if the site will be widely public.

### 3.2 Connect the app

Local development: copy `.env.example` to `.env` and fill it in:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

GitHub Pages: add the same two values as **repository secrets** (see §4).

### 3.3 How it works (and why it's secure)

| Concern | How it's handled |
| --- | --- |
| Identity | Anonymous sign-in (no email, password or personal data). The session persists in the browser. |
| Room privacy | Every room has a random 10-character invite code (about 8×10¹⁴ possibilities). You can't read a room until you've joined it with the code. |
| Reads | Row Level Security: you can only `select` rooms and members of rooms you belong to. |
| Writes | Clients have **no** insert/update/delete rights. All writes go through `SECURITY DEFINER` functions that check membership and validate input: timer shape and limits, goal length (≤120), names (≤30, control characters stripped), stats size, max 40 goals, max 6 members, max 10 new rooms per hour. |
| Realtime | Presence, reactions and messages use a **private** channel `room:<uuid>`. Policies on `realtime.messages` only let members send or receive. Incoming payloads are validated again on the client (allowed emojis only, length limits) and rendered as plain text (no HTML injection). |
| Timer sync | The room row stores `endsAt` (an absolute timestamp). Every device computes `endsAt − now` using a **server-clock offset** (`server_now()` RPC), so phones with drifting clocks still agree. Updates use **optimistic concurrency** (`version`), so if two people press a button at once, one wins cleanly. |
| Messages | Reactions and messages are broadcast only and **never stored**. |

Housekeeping (optional): the end of `schema.sql` has a commented `pg_cron` job that deletes rooms unused for 60 days.

---

## 4. Deploy to GitHub Pages 🚀

1. Push this folder to a GitHub repository (branch `main`).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. *(Shared rooms)* **Settings → Secrets and variables → Actions → New repository secret**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Push to `main` (or run the workflow manually from the **Actions** tab). The included workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes the site.
5. Your site will be at `https://<user>.github.io/<repo>/`.

**Why it just works on Pages:** the app uses **hash routing** (`#/study`, `#/room/abc…`), so there are no server-side routes and no `404.html` tricks, and refreshing any page works. Assets use a **relative base** (`./`), so any repository name works without config. (If you ever need an absolute base, build with `VITE_BASE=/repo-name/`.)

To share a room, send the invite link: `https://<user>.github.io/<repo>/#/room/<code>`.

---

## 5. Features

**Companion** 🐱🐶🐰
- 3 species, all hand-drawn SVG, with 13 expressions: happy, sleepy, focused, excited, hungry, proud, lazy, confused, motivational, dramatically disappointed, annoyed, blushing, purring.
- Reacts to the timer: reads a book while you study, gets sleepy after 40+ minutes, sleeps during breaks, jumps and celebrates when a session ends, throws a party-hat party after a full cycle, and gets disappointed after repeated skips.
- Petting combo: tapping repeatedly goes purr → bounce → blush → excited → annoyed → pretends to sleep.
- Feed treats, cookies, milk (sleepy mug) or coffee (jittery mug). The pet gets hungry after 4 hours without a snack.
- Tap an equipped accessory and the pet comments on it.
- Context-aware messages rotate every 40 seconds and mix in your `personalMessages`.

**Pomodoro timer** ⏱
- Defaults: 25 / 5 / 15 minutes, with a long break every 4 sessions. All of it is customizable, plus auto-start breaks/sessions, sounds, volume and notifications.
- Start, pause, resume, reset, skip, and switch between study / short / long.
- Timestamp-based, so it survives refreshes, closed tabs and background throttling. A session that ended while the tab was closed is credited when you return, and stale auto-starts are suppressed.
- Multi-tab safe: crediting is idempotent per session id, and the tabs sync through `storage` events.
- The countdown shows in the browser tab title. Partial focus time (≥1 min) is credited when you skip or reset.

**Focus mode** 🎧: a fullscreen-capable minimal view with the dial, pet, goal bar and one calm line. Space toggles pause, Esc exits. Optionally hides memes and messages.

**Study room** 🏡: an illustrated desk with a lamp, books, notebook, pen, laptop, mug with steam, plant and window, in **5 themes**:
- Cozy Bedroom: bed, blanket, sleeping kitty, string lights.
- Rainy Day: animated rain on the window.
- Library: bookshelves, ladder, clock, arched window.
- Night Study: moon, twinkling stars, dim room, glowing lamp.
- Spring Garden: sun, flowers, vines, a passing bird.

**Ambient sounds** 🌧️: rain, fireplace, coffee shop, library, forest, night crickets, typing, soft lo-fi and white noise. They can be mixed, each has its own volume, and nothing autoplays. All of them are **synthesized live with the Web Audio API**: no audio files, no licensing questions, zero download weight.

**Shared room** 🫂
- Create or join a room, copy the code or invite link, or use the native share sheet.
- Live presence (studying / break / paused / hanging out / offline, plus 🎧 when in focus mode), streaks, minutes and sessions per person.
- Shared, synced timer: anyone can control it, and the timer settings are shared.
- Both pets sit on the desk together. Your friend's pet mirrors their status and outfit.
- 12 reactions that float across your friend's screen, 9 quick messages, and short custom messages (≤120 characters).
- Shared goal checklist and a combined "together today" goal.
- Auto-rejoin after a refresh. Stays connected while you browse other pages, and the nav shows an unread badge.

**Meme Corner** 😂: 28 original memes drawn with the pets, on a tilted Pinterest-style masonry board.
- Filters: study, procrastination, motivation, exams, breaks, late night, cats, dogs, bunnies, favorites.
- Random, previous/next (arrow keys), favorite, share (native share sheet or copy link), and deep links to individual memes.
- Contextual pop-ups for starting a session, finishing one, breaks, procrastination (5 idle minutes), a full cycle, skipping and reaching your goal. They're rate-limited and can be turned off.

**Goals and achievements** 🏆
- Daily goal presets (30 min, 1 h, 2 h, 3 h, or custom), a progress bar and a 7-day chart.
- 17 badges, including Tiny Scholar, Academic Weapon, Sleep Deprived Genius, Focus Monster, The Comeback Kid, Consistency Queen/King, Study Paws Champion, Better Together and Certified Pet Lover. Each unlock gets a toast, confetti and a chime.

**Pet shop** 🪙: earn paw coins (+10 per session, +25 for the daily goal, +5 per badge, +5 per challenge). Spend them on glasses, a bow, a daisy, headphones, a scarf, a backpack or a graduation cap. Items in the same slot swap automatically.

**Little extras**: mood check-in with tailored plans (overwhelmed → a 10-minute mini-session you can start with one tap), a fortune cookie, a random tiny challenge, an "Encourage me" button, a meme of the day, and backup/restore/reset of your data.

**Quality**
- Mobile-first, with a floating bottom tab bar plus a "More" sheet on phones.
- Safe-area insets, `100dvh`, 16 px inputs (no iOS zoom), and 44 px touch targets.
- Keyboard focus rings and ARIA labels.
- Honors `prefers-reduced-motion`, with an extra manual toggle.
- WCAG AA text contrast.
- About 110 KB gzipped JS. The Supabase client (56 KB gz) is lazy-loaded only when a shared room opens.

---

## 6. Extending it

| Want to add… | Where |
| --- | --- |
| **Memes** | [`src/content/memes.ts`](src/content/memes.ts): copy an entry and give it a unique `id`. Use one panel (classic) or two panels (comparison). To use a real image, put it in `public/memes/`, set `image: 'memes/file.webp'` and fill in `credit` (only use CC0/CC-BY/your own images). Add the id to `memeMoments` to make it pop up contextually. |
| **Pet messages** | [`src/content/messages.ts`](src/content/messages.ts) → `petMessages[context]`. Placeholders: `{friend}`, `{you}`, `{pet}`, `{species}`, `{mins}`. |
| **Encouragements, fortunes, challenges, quick messages, reactions** | Same file. |
| **Achievements** | [`src/content/achievements.ts`](src/content/achievements.ts): add `{ id, emoji, name, description, color, test: (ctx) => boolean }`. |
| **Shop items** | [`src/content/shop.ts`](src/content/shop.ts), plus a drawing branch in `Accessory()` in [`src/components/Pet.tsx`](src/components/Pet.tsx). |
| **Mood check-in plans** | [`src/content/moods.ts`](src/content/moods.ts) |
| **Themes** | Add to [`src/content/themes.ts`](src/content/themes.ts) and to `ThemeId` in [`src/lib/types.ts`](src/lib/types.ts), then add colours in `T` plus a `LeftDecor`/`Window` branch in [`src/components/Scene.tsx`](src/components/Scene.tsx). |
| **Pets** | Add a palette, ears and tail in [`src/components/Pet.tsx`](src/components/Pet.tsx), extend `Species`, add a snack in `shop.ts`, and update the `pet in (...)` checks in `schema.sql`. |
| **Ambient sounds** | Add a generator in `generators` and an entry in `ambientSounds` in [`src/lib/audio.ts`](src/lib/audio.ts). |

---

## 7. Project structure

```
├── index.html                    # fonts, meta, PWA manifest link
├── vite.config.ts                # relative base for GitHub Pages
├── .env.example                  # Supabase public config template
├── .github/workflows/deploy.yml  # build + deploy to Pages
├── supabase/schema.sql           # tables, RLS, RPCs, realtime policies
├── public/                       # favicon, manifest
└── src/
    ├── config/personalize.ts     # ✏️ names, note, welcome text
    ├── content/                  # memes, messages, achievements, shop, themes, moods
    ├── lib/
    │   ├── timer.ts              # pure timestamp-based Pomodoro engine
    │   ├── store.ts              # persisted app state (localStorage)
    │   ├── actions.ts            # crediting, coins, achievements, solo timer
    │   ├── room.ts               # shared rooms: realtime, presence, sync
    │   ├── supabase.ts           # lazy client + anonymous auth
    │   ├── audio.ts              # chimes + procedural ambience
    │   ├── progress.ts           # streaks + achievement context
    │   ├── router.ts / events.ts / notify.ts / ui.ts / hooks.ts / util.ts
    ├── components/               # Pet, Companion, Scene, Timer, FocusMode, Welcome, Nav, Overlays, …
    ├── pages/                    # Home, StudyRoom, SharedRoom, MemeCorner, Achievements, PetShop, Settings
    └── styles/                   # design tokens + page styles
```

---

## 8. Known limitations

- **Shared rooms need Supabase.** Without the env vars, the Shared Room page shows setup instructions and everything else works solo.
- **iPhone notifications** only work when the site is added to the Home Screen (iOS 16.4+). In a regular Safari tab, the timer still completes correctly and plays a chime when you return.
- **Background tabs:** browsers throttle timers in hidden tabs, so a "session done" chime or notification can arrive up to about a minute late on some browsers. The *time itself* is always correct because it's timestamp-based, and the session is credited at its true end.
- **Ambient audio on iOS** stops when the phone locks or Safari is backgrounded (an iOS rule for web audio). On iOS 17+ it plays even with the silent switch on. Earlier iOS versions respect the silent switch.
- **Element fullscreen** isn't available on iPhone Safari, so the Fullscreen button is hidden there. Focus mode still fills the screen.
- **Stats are per device.** Solo progress lives in the browser's localStorage. Use Settings → Download backup to move devices. Shared rooms share today's stats with roommates.
- **Messages and reactions** are ephemeral by design (not stored), so they don't appear for someone who joins later.
- **Memes are original drawings**, not scraped Pinterest images. Pinterest content is generally copyrighted, so it was used only as inspiration for formats and captions.

---

## 9. Testing report

Automated checks run against the production build:

**End-to-end (Playwright: Chrome desktop, WebKit iPhone 13 + iPad, Chrome Pixel 7) — all passed, 0 console errors**
- Gift welcome flow: envelope → letter → choose companion and name → home. Not shown again after a reload.
- Pet: petting combo reaches "annoyed", coffee and eating animations, accessory reactions.
- Home: the overwhelmed check-in suggests a 10-minute plan, fortune cookie, challenge (+5 coins), encourage.
- Timer: counts down, survives a page reload mid-session, pause freezes it, completion after 25 simulated minutes credits 25 min / 1 session / coins, the break auto-starts and the pet falls asleep, skip break returns to study.
- Focus mode opens; Esc closes it. All 5 themes render. Two ambient sounds mix and stop.
- Achievements unlock. Memes: 28 render, the viewer's next/favorite work, the favorites and cat filters work.
- Shop: buy glasses → the pet wears them.
- No horizontal overflow on any page at iPhone, iPad and Pixel sizes.
- GitHub Pages simulation: build served under `/study-paws/`, deep links `#/memes/<id>` and `#/room/<code>` work, no 404s.

**Database (`schema.sql` executed in PGlite/Postgres with stubbed Supabase `auth`/`realtime` schemas) — all passed**
- The schema applies and is idempotent.
- RLS: non-members can't read rooms or members; members can.
- Wrong code → "room not found". Codes are case-insensitive. Control characters are stripped from names.
- Timer: correct version → update; stale version → `null`. Invalid or absurd timers are rejected. Outsiders can't modify anything.
- Goals: add (trimmed, attributed), toggle (order preserved), remove. The daily goal is clamped. Stats validated.
- Direct INSERT/UPDATE/DELETE on the tables are denied.
- Realtime: members can send and receive on `room:<id>`; outsiders are blocked by the RLS policy.
- The room creation rate limit works. Leaving works, and an empty room is deleted.

**Other**
- TypeScript strict mode: 0 errors.
- WCAG contrast of the key text pairs is ≥ 4.5:1 (body text 10.4:1, primary button 5.2:1).

**Not verified automatically:** a live two-device session against a real Supabase project (no credentials were available here). The client is fully type-checked against `@supabase/supabase-js`, and the server half is verified above. After setup, test it by opening the invite link in two browsers.
