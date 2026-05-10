# Análisis ULTRA — Parte 3: Small Fixes

> Complementa los informes 1 (secciones 1–14) y 2 (secciones 15–27).
> Foco: arreglos pequeños / no peligrosos pero importantes para calidad y mantenibilidad.

---

## A. Naming / Typos

| # | Archivo:Línea | Issue | Fix |
|---|---|---|---|
| A1 | `src/helpers.js:14` | `LEADS_REF` (typo: el proyecto se llama "lends", no "leads"). El string es correcto (`"/lends"`) pero la constante delata copy-paste de otro contexto. | Renombrar a `LENDS_REF`. |
| A2 | `src/helpers/index.js:4,11,18,25` | Placeholder genérico `"Email no encontrado"` se muestra cuando no se resuelve el `displayName` — confunde al usuario porque NO se buscó un email. | Cambiar a `"Usuario no encontrado"` o `"Sin nombre"`. |
| ~~A3~~ ✅ Resuelto (Tarea 1.A) | `src/helpers.js` | Bloque comentado de implementación antigua (~52 líneas) eliminado el 2026-05-09. |
| A4 | `src/components/Home/AddLoanModal.js:81,84` | Labels en inglés: `"FROM COMPANY"`, `"TO COMPANY"` en campos hidden, mientras toda la UI está en español. | Eliminar labels (campos ocultos no requieren) o traducir a `"Empresa origen"`/`"Empresa destino"`. |
| A5 | `public/manifest.json:6` | Doble slash: `"./icons//favicon.ico"`. | `"./icons/favicon.ico"`. |
| A6 | `public/manifest.json:22` | MIME inválido: `"icons/image/png"`. | `"image/png"`. |

---

## B. Imports

| # | Archivo:Línea | Issue |
|---|---|---|
| B1 | `src/pages/Home.js:27` | Importa `Alert` de antd pero **no se usa** (delegado a `NoCompanyAlert`). |
| B2 | `src/components/Home/LogOutDropdown.js:18` | `const { _, setUser } = useContext(UserContext)` — `_` es un nombre de variable real, no descarte. ESLint lo marca como unused. |
| B3 | `src/components/Home/LogOutDropdown.js:4` | `useNavigate` importado de `"react-router"` mientras todo el resto del proyecto usa `"react-router-dom"`. |
| B4 | `src/components/DateRangeFilter.js:4` | `react-device-detect` importado pero `isMobile` no se usa en este archivo. |

---

## C. React micro-issues

| # | Archivo:Línea | Issue |
|---|---|---|
| C1 | `src/pages/Home.js:266,285` | `onClick={() => openDeleteConfirmation(item)}` recreado en cada render. Aceptable, pero con `useCallback` + memo en `LendsList` el render se aplana. |
| C2 | `src/components/Home/LendsList.js:212-223` | `.map((entry, index) => key={index})` en historial de comments — los índices NO son estables si reordenan o filtran. Usar hash del contenido o ts del comment. |
| C3 | `src/pages/Home.js:95` | Idem: `key={index}` para líneas de comentario. |
| C4 | `src/components/Home/LendsList.js:227` | Idem. |
| C5 | `src/pages/Home.js` (varios) | 8 estados separados (`users`, `visible`, `loading`, `returnData`, `belongsData`, `startDate`, `endDate`, `dateRange`, `filterType`) — candidato a `useReducer` o a varios custom hooks. |

---

## D. CSS / estilos

| # | Archivo:Línea | Issue |
|---|---|---|
| D1 | `src/App.css` (todo) | 40 líneas de boilerplate CRA sin uso (`.App-logo`, `.App-link`, `.App-header`, `App-logo-spin` keyframes). |
| D2 | `src/index.css:2` | Línea comentada `/* margin: 0; */` — decisión ya tomada, eliminar comentario. |
| D3 | `src/styles/FloatingButton.css:14-26` | `.floating-button` y `.floating-button-mobile` con CSS **idéntico**. Consolidar. |
| D4 | `src/helpers.js:34-46`, `162-174`, `219-231` + `Login.js:64-109` + `Home.js:189-234` | **Estilos inline de toast duplicados 8 veces**: `position: fixed, top: 10, right: 10, zIndex: 1000, padding: 10px, borderRadius: 4, boxShadow...`. Extraer a constante `TOAST_STYLE` o helper `showToast(type, content)`. |
| D5 | `src/components/Home/LendsList.js` | 23 ocurrencias de `style={{...}}` inline. Colores `#1890ff`, `red`, `#ff7043` repetidos. Extraer a clases CSS o tokens del theme antd. |

---

## E. HTML / public/

| # | Archivo:Línea | Issue |
|---|---|---|
| E1 | `public/index.html:24` | `<title>PWA</title>` genérico. Cambiar a `<title>Lends — Préstamos entre empresas</title>`. |
| E2 | `public/index.html:27` | `<noscript>You need to enable JavaScript...</noscript>` en inglés mientras la app es ES. |
| E3 | `public/index.html` | Faltan metas SEO: `description`, `og:title`, `og:description`, `og:image`, `twitter:card`. |
| E4 | `public/index.html` | Falta `<meta name="apple-mobile-web-app-capable" content="yes">` y `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`. |
| E5 | `public/index.html` | `<meta name="viewport">` debería incluir `viewport-fit=cover` para safe areas iOS. |
| E6 | `public/-favicon.ico`, `-logo192.png`, `-logo512.png` | Archivos con **guion inicial** (legacy CRA + nuevos en `icons/`). Renombrar y actualizar referencias. |
| E7 | `public/robots.txt` | Default CRA. Añadir `Sitemap: https://...` cuando haya hosting. |

---

## F. package.json

| # | Issue |
|---|---|
| F1 | Script `start` hardcodea `kill-port 3000`. Permitir override con `PORT` env var. |
| F2 | Faltan scripts: `lint`, `format`, `typecheck`, `test:coverage`, `prepare` (husky). |
| F3 | Falta `"engines": { "node": ">=18" }`. |
| F4 | Falta `"homepage"` (rompe deploys en subpath como Firebase Hosting con multi-site). |
| F5 | `react-router` y `react-router-dom` ambos como dependency — solo se usa `react-router-dom`. |
| F6 | `react-swipeable` declarado pero nunca importado. |
| F7 | 7 paquetes `workbox-*` no usados (background-sync, broadcast-update, cacheable-response, google-analytics, navigation-preload, range-requests, streams). |
| F8 | `web-vitals` ^2.1.4 — la v3+ trae INP (métrica clave en 2024+). |
| F9 | Browserslist por defecto CRA (~80 navegadores) — bundle más pesado del necesario. |
| F10 | Cero devDependencies — todo en `dependencies` (CRA típico, pero sin `eslint-config`, `prettier`, `husky` declarados). |

---

## G. .gitignore / .env

| # | Issue |
|---|---|
| G1 | **Falta `.env.example`** — onboarding nuevo desconoce las 6 vars `REACT_APP_FIREBASE_*`. |
| G2 | `.gitignore` no incluye explícitamente: `.firebase/`, `*.log`, `.DS_Store` por carpeta, `coverage/`. |
| G3 | `build/` está en `.gitignore` pero **versionado** en repo. Limpiar con `git rm -r --cached build/`. |

---

## H. Accesibilidad ligera

| # | Archivo:Línea | Issue |
|---|---|---|
| H1 | `src/components/Home/HeaderApp.js:32-39` | Botón con solo icono `<ColumnWidthOutlined />` sin `aria-label`. |
| H2 | `src/components/Home/LogOutDropdown.js:45` | Botón solo icono `<LogoutOutlined />` sin `aria-label`. |
| H3 | `src/components/Home/AddLoanModal.js:64-70` | Botón flotante `<PlusOutlined />` sin `aria-label="Agregar préstamo"`. |
| H4 | `src/pages/Login.js:116` | `<Title>L E N D S</Title>` con espaciado por estética: lectores de pantalla leen "L, E, N, D, S". Usar `letter-spacing` CSS y mantener texto `LENDS`. |
| H5 | `src/components/Home/LendsList.js:38-86` | Color como **única señal** de estado (rojo=eliminado, naranja=devuelto). Falla WCAG 1.4.1. Añadir icono o texto. |
| H6 | `src/components/Home/LendsList.js:46,59,82` | Iconos a `13–15px`. Tap targets recomendados ≥ 44 × 44. |

---

## I. UX pequeñeces

| # | Archivo:Línea | Issue |
|---|---|---|
| I1 | `src/helpers.js:34,46,162,219` | Toasts con `duration` por defecto (3 s) — corto para mensajes con CTA. Aumentar a 4–5 s. |
| I2 | `src/components/Home/AddLoanModal.js` | Modal no enfoca primer input al abrir. Usar `autoFocus` en el `Input` de nombre. |
| I3 | `src/components/IsLoadingScreen.js` | Solo spinner sin texto. Añadir `"Cargando…"` para confianza. |
| I4 | `src/components/Home/LendsList.js:104` | `<Collapse>` sin label de "ver historial" cuando está cerrado — usuario no sabe que hay más info. |
| I5 | `src/pages/Home.js:67` | `comment: "deleted"` — string técnico aparece en historial visible al usuario como `"(HH:mm)displayName: deleted"`. |
| I6 | `src/helpers.js:188` | Fallback de comment vacío es `"✉️"` — emoji aleatorio sin significado. Mejor `"(sin nota)"`. |
| I7 | `src/pages/Home.js:78` | Modal de confirmación captura `comment` pero si el usuario cierra y reabre, queda residuo en `let comment` (closure). |

---

## J. Firebase pequeñeces

| # | Archivo:Línea | Issue |
|---|---|---|
| J1 | `src/pages/Login.js:31` | `ref(database, \`users/${user.uid}\`)` sin slash inicial. Inconsistente con `USERS_REF = "/users"` en `helpers.js:15`. RTDB acepta ambos pero la inconsistencia es un *code smell*. |
| J2 | `src/pages/Home.js:144-160` | `getOut()` usa `setTimeout(4000)` y luego `signOut`, pero **no cancela** el timer si el componente se desmonta o `user` cambia → race condition (signOut tras re-login). |
| J3 | `src/pages/Login.js:30-32` | `get(ref)` síncrono pre-`set()` para validar existencia → 2 round trips. Podría hacerse atómico con `transaction()` o leer una sola vez. |
| J4 | `src/firebase-config.js` | Falta `databaseURL` explícito. Algunas regiones de RTDB no se infieren del `projectId` y `getDatabase()` falla en silencio. |

---

## K. Cleanup de archivos

| # | Issue |
|---|---|
| K1 | `src/helpers.js` y `src/helpers/index.js` coexisten. Node resuelve `./helpers` al `.js`, NO al directorio (ambigüedad real, aunque hoy no rompe). Consolidar en uno o renombrar a `helpers/users.js` + `helpers/lends.js`. |
| K2 | `src/App.css` con 40 líneas muertas (boilerplate CRA). |
| K3 | ~~`docs/_CONCEPTO.md` y `CONCEPTO.md` (raíz) son duplicados.~~ **Falso positivo:** `CONCEPTO.md` (raíz, 11.5 KB) es análisis técnico completo; `docs/_CONCEPTO.md` (1.1 KB) es brief original del backlog marcado *"no editar"*. Son complementarios, no duplicados. |
| K4 | `build/` versionado pese a `.gitignore`. |
| K5 | `src/App.test.js` busca `"learn react"` (boilerplate CRA) — test garantizado a fallar. Eliminar o reemplazar. |

---

## L. Seguridad ligera

| # | Archivo:Línea | Issue |
|---|---|---|
| L1 | `src/UserContext.js:8,15` | `localStorage` key `"user"` muy genérico. Conflicto con otras apps en el mismo dominio. Usar `"lends:user:v1"`. |
| ~~L2~~ ✅ Resuelto (Tarea 1.B) | `src/pages/Login.js` | `console.log("User signed in:", user)` eliminado. |
| ~~L3~~ ✅ Resuelto (Tarea 1.B) | `src/pages/Login.js` | `console.log("User already exists in database")` eliminado. |
| ~~L4~~ ✅ Resuelto (Tarea 1.B) | `src/pages/Home.js` | `console.log("El estado del item ha sido cambiado por", uid)` eliminado. |
| ~~L5~~ ✅ Resuelto (Tarea 1.B) | `src/components/Home/LogOutDropdown.js` | `console.log("User signed out successfully")` eliminado. |
| L6 | `public/index.html` | Sin Content-Security-Policy meta (depende del hosting, pero un `<meta http-equiv="Content-Security-Policy">` mínimo previene XSS basico). |

---

## M. Manifest / PWA

| # | Archivo:Línea | Issue |
|---|---|---|
| M1 | `public/manifest.json:3` | `description` casi igual a `name` — verbosidad. |
| M2 | `public/manifest.json:75-100` | Dos shortcuts con misma `description` y URLs casi iguales (`/` y `/lends`). |
| M3 | `public/manifest.json:65-72` | `screenshots` apuntan a `maskable_icon_x512.png` (es ícono, no screenshot) con tamaño falso `540x720`. Lighthouse penaliza. |
| M4 | `public/manifest.json` | Falta `"categories": ["business", "productivity"]`. |
| M5 | `public/manifest.json` | Falta `"id": "/"` (recomendado en PWA standard 2024). |

---

## 🏆 Top 20 Small Wins priorizados (costo-beneficio)

| # | Tarea | Archivo:Línea | Tiempo | Impacto |
|---|---|---|---|---|
| 1 | Extraer `TOAST_STYLE` constante (8 duplicados → 1) | helpers.js / Login.js / Home.js | 10 min | Alto |
| 2 | Renombrar `LEADS_REF` → `LENDS_REF` | helpers.js:14 | 2 min | Medio |
| ~~3~~ ✅ | ~~Eliminar 51 líneas de código comentado~~ | helpers.js | Resuelto (Tarea 1.A) | — |
| 4 | Limpiar boilerplate CSS (`App.css`) | App.css | 3 min | Medio |
| 5 | `aria-label` en 4 botones de solo icono | HeaderApp/LogOut/AddLoan/Home | 10 min | Alto a11y |
| 6 | Crear `.env.example` | raíz | 3 min | Alto DX |
| 7 | Renombrar archivos `-favicon.ico` → `favicon.ico` | public/ | 5 min | Medio |
| 8 | `<title>` descriptivo + metas OG/Twitter | public/index.html | 10 min | Alto SEO |
| ~~9~~ ✅ | ~~Quitar 5 `console.log` con PII~~ | Login/Home/LogOut | Resuelto (Tarea 1.B) | — |
| 10 | Cambiar `ref(database, "users/...")` por `${USERS_REF}/...` | Login.js:31 | 2 min | Bajo |
| 11 | Consolidar `helpers.js` + `helpers/index.js` | src/ | 15 min | Alto mantenibilidad |
| 12 | Cancelar `setTimeout` de getOut en cleanup | Home.js:142-163 | 5 min | Alto (bug B4) |
| 13 | `keys` por id estable en `.map()` | LendsList/Home | 10 min | Medio |
| 14 | Borrar `react-router`, `react-swipeable`, 7 workbox-* | package.json | 5 min + npm install | Medio bundle |
| ~~15~~ ✅ | ~~`Modal visible` → `open`, `Dropdown overlay` → `menu`, `Tabs.TabPane` → `items`~~ | AddLoanModal/LogOut/Home | Resuelto (Tarea 1.C) | — |
| 16 | `localStorage` key `"user"` → `"lends:user:v1"` | UserContext.js | 3 min | Medio |
| 17 | Fix `manifest.json`: doble slash, MIME, screenshots | public/manifest.json | 5 min | Alto Lighthouse |
| 18 | `"engines"` + `"homepage"` en package.json | package.json | 3 min | Bajo |
| 19 | "Email no encontrado" → "Usuario no encontrado" | helpers/index.js | 2 min | Medio UX |
| 20 | Borrar `App.test.js` boilerplate o reemplazar | App.test.js | 2 min | Medio |

**Tiempo total estimado: ~2 h** para los 20 wins.

---

## Resumen ejecutivo

- **45+ small fixes** detectados.
- **0 críticos** (esos están en parte 1).
- Mayor concentración en **CSS duplicado** (8 toasts idénticos) y **public/manifest.json** (5 issues).
- **2 horas de trabajo** los liquidan todos.
- Recomendado hacer en una sesión de "spring cleaning" antes de FASE 1 del backlog.
