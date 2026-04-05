# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Kill port 3000 and start dev server
npm run build    # Production build
npm test         # Run tests (interactive watch mode)
npm test -- --watchAll=false  # Run tests once
```

Firebase config requires a `.env` file with `REACT_APP_FIREBASE_*` variables (see `src/firebase-config.js` for the keys needed).

## Architecture

**Stack:** React 18, React Router v6, Ant Design 5, Firebase (Auth + Realtime Database), PWA (Workbox).

**Data flow:**
- `UserContext.js` — global auth state, persisted in localStorage. Holds `uid`, `email`, `displayName`, `company`.
- `src/helpers.js` — all Firebase Realtime Database operations. The two DB refs are `/lends` and `/users`.
- `src/helpers/index.js` — pure helper functions for resolving user display names from uid lookups.

**Routing:**
- `/` → `pages/Login.js`
- `/lends` → `pages/Home.js`

**Multi-tenancy:** Data is scoped by `company`. A lend has both `fromCompany` and `toCompany`. `Home.js` separates data into "Préstamos" (lends the user's company made) and "Deudas" (lends received by the user's company). Users without a `company` are signed out automatically after 4 seconds.

**Lend states:** Items use flags `returned` (bool) and `deleted` (bool). State changes are soft — never hard deletes. `changeStateOfItemInDatabase` in `helpers.js` handles both `"returned"` and `"deleted"` transitions, appending an audit trail to `item.comment`.

**Filter logic:** `getDataFromFirebase` in `helpers.js` applies date range and `filterType` filters server-side before calling back. `filterType` has four keys: `notReturned`, `returned`, `wasReturned`, `deleted`.

**Mobile UX:** `react-device-detect` controls layout; `react-swipeable-list` provides swipe-to-act on mobile (swipe left = delete, swipe right = mark returned).

**Note:** `src/helpers.js` has dead code at the bottom (commented-out old implementation). Ignore it.
