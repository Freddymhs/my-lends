# My Lends

Sistema de gestión de préstamos de items/productos entre empresas. Permite registrar qué le prestaste a quién, marcar devoluciones y llevar un historial de cambios.

## Tech Stack

- **Frontend**: React 18, Ant Design 5, React Router v6
- **Backend/DB**: Firebase Realtime Database + Firebase Auth
- **PWA**: Workbox (service worker preconfigured)
- **Mobile UX**: react-device-detect, react-swipeable-list

## Setup

```bash
npm install
npm start       # mata el puerto 3000 y arranca dev server
npm run build   # build de producción
npm test        # tests en modo watch
```

Variables de entorno requeridas en `.env`:

```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

## Estructura

```
src/
├── pages/          # Login.js, Home.js
├── components/     # Componentes UI por sección (Home/, DateRangeFilter, etc.)
├── helpers.js      # Todas las operaciones Firebase (lends + users)
├── helpers/        # Utilidades puras (resolución de nombres de usuarios)
├── UserContext.js  # Estado global de auth (persistido en localStorage)
├── Filters.js      # Filtros por estado de préstamo
└── firebase-config.js
```

## Estado

- Status: En desarrollo activo
- Firebase plan: Spark (gratuito) — 1 GB almacenamiento, 10 GB/mes descarga

## Roadmap y deuda técnica

Ver [`docs/backlog/README.md`](docs/backlog/README.md) para el plan de 7 fases (bugs críticos → producción) y [`docs/ANALISIS_TECNICO_DETALLADO.md`](docs/ANALISIS_TECNICO_DETALLADO.md) para análisis técnico.
