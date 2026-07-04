# JAJ Hub

A retro 8-bit launchpad. The homepage is mission control; each app is
available from JAJ Hub.

## Structure

```
jaj-hub/
├── app/
│   ├── layout.tsx          # shared shell: Nav + Footer + theme (all pages)
│   ├── globals.css         # the whole design system + Draft Hub styles
│   ├── page.tsx            # homepage: hero + launchpad cards
│   ├── draft/page.tsx      # /draft — the working Draft Hub app
│   ├── tools/page.tsx      # /tools — placeholder app
│   └── experiments/page.tsx# /experiments — placeholder app
├── components/
│   ├── Hero.tsx            # JAJ hero with boot sequence
│   ├── Nav.tsx             # sticky retro command bar
│   ├── DraftApp.tsx        # the draft-night command centre (client-side)
│   ├── PixelText.tsx       # renders JAJ in the 5x7 pixel font
│   ├── Stars.tsx           # background starfield
│   └── Footer.tsx
├── lib/
│   └── draftLogic.js       # pure draft logic: CSV, draft order, restore
├── package.json
├── tsconfig.json
└── next.config.mjs
```

## The Draft Hub (`/draft`)

A single-admin draft-night command centre — built to run on one screen
(a TV or a screen share). Everything is client-side: no accounts, no
database, no APIs.

- **Setup**: league name, 8 generated-colour teams with editable names,
  1-30 rounds, snake or linear order, and a one-by-one draft-order reveal.
- **Player pool**: upload the FantasyPros consensus cheatsheet CSV
  (`RK, TIERS, PLAYER NAME, TEAM, POS, BYE WEEK`) or add custom players.
  Search and base-position-filter the pool.
- **Draft board**: full round-by-team big board, current pick
  highlighted, one-click drafting, undo last pick.
- **Team preview**: click a team header to view its grouped roster.
- **Save & restore**: *Export Restore CSV* writes the complete draft
  state to a single CSV (RowType schema: META / TEAM / PICK /
  AVAILABLE / MANUAL). *Import Restore CSV* validates it (RowType
  column + schema version), warns before replacing anything, and
  continues from the correct next pick. *Export Final Results CSV*
  produces a clean results sheet.
- **Autosave**: state is saved to localStorage after every change
  ("Last saved: HH:MM"), so a refresh never loses the draft.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. vercel.com → **Add New → Project** → import the repo.
3. Vercel auto-detects Next.js — click **Deploy**. Done.
4. Add your domain under **Settings → Domains** if you have one.

Every `git push` after that redeploys automatically.

## Adding another app later

1. Create `app/my-app/page.tsx` — the route `/my-app` now exists and
   automatically gets the shared Nav, Footer and theme.
2. Add a card for it to the `APPS` array at the top of
   `app/page.tsx` (title, description, status, cta, href).
3. Optionally add it to the `LINKS` array in `components/Nav.tsx`.

Reuse the existing CSS classes (`.pixel-panel`, `.section-title`,
`.card`, `.btn`, `.field`) and the new app matches the theme with zero
extra styling. If an app needs interactivity, make its main component a
client component (`"use client"`) like `DraftApp.tsx`, and keep any
pure logic in `lib/` so it stays testable.

Deployment trigger
