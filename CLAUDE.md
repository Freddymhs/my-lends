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
- `/lends` → `pages/Home.js`, protegida por `<PrivateRoute>` (`src/components/PrivateRoute.js`); URLs inválidas redirigen a `/`. Ver `docs/decisions/DECISION_AUTH_GUARD.md`.

**Multi-tenancy:** Data is scoped by `company`. A lend has both `fromCompany` and `toCompany`. `Home.js` separates data into "Préstamos" (lends the user's company made) and "Deudas" (lends received by the user's company). Users without a `company` are signed out automatically after 4 seconds.

**Lend states:** Items use flags `returned` (bool) and `deleted` (bool). State changes are soft — never hard deletes. `changeStateOfItemInDatabase` in `helpers.js` handles both `"returned"` and `"deleted"` transitions, appending an audit trail to `item.comment`.

**Filter logic:** `getDataFromFirebase` in `helpers.js` applies date range and `filterType` filters before calling back. The 4 mutually-exclusive item states are:
- `notReturned` → no `returnedBy` field, not deleted (item never touched)
- `returned` → has `returnedBy` AND `returned === true` (currently marked returned)
- `wasReturned` → has `returnedBy` AND `returned === false` (returned then unmarked)
- `deleted` → `deleted === true` AND `deletedBy` truthy

**Mobile UX:** `react-device-detect` controls layout; `react-swipeable-list` provides swipe-to-act on mobile (swipe left = delete, swipe right = mark returned).

**Note:** `src/helpers.js` has dead code at the bottom (commented-out old implementation). Ignore it.

## Project documentation

- **Backlog**: 7 fases en `docs/backlog/FASE_*.md` + `docs/backlog/README.md`. Tracking en `.claude/backlog-progress.json` (versionado). Antes de proponer trabajo nuevo, revisar si ya está fichado.
- **Análisis técnicos vivos**:
  - `docs/ANALISIS_TECNICO_DETALLADO.md` — walkthrough archivo por archivo, refactors propuestos, reglas Firebase, plan de tests, migración Vite.
  - `docs/ANALISIS_SMALL_FIXES.md` — 45+ small fixes priorizados.
  Leer antes de regenerar análisis equivalentes.
- **Concepto**: `CONCEPTO.md` (raíz, ~11 KB) es análisis técnico extendido. `docs/_CONCEPTO.md` (~1 KB) es el brief original del backlog (no editar). **No son duplicados.**
- **Diagramas**: `docs/diagrams/DIAGRAMAS_*.md` (componentes, secuencia, estados) — referencia estructural estable.
- **Flujos**: `docs/flows.md` — guía manual para QA y E2E.
