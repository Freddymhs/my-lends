# FASE 7: Small Fixes & Polish

**Status:** ⏸️ PENDIENTE
**Prioridad:** 🟢 Baja-Media
**Dependencias:** Ninguna técnica — puede ejecutarse en paralelo a FASE 4 (UI/UX) o después de FASE 1.

> Conjunto de arreglos pequeños / no peligrosos pero importantes para calidad, mantenibilidad, accesibilidad y profesionalidad del producto. Total: **45+ items** clasificados por categoría. Tiempo estimado: **~2 horas** para los 20 más impactantes (Tarea 7.U — *Top 20 Wins*).
>
> **Nota:** algunas tareas se solapan con FASE 1 (1.A, 1.B, 1.C). En esos casos la FASE 7 se mantiene como vista exhaustiva, pero el trabajo se ejecuta una sola vez. Esos solapes están marcados con ⤴︎.

---

## Tarea 7.A: Naming / Typos

- **Archivos:** `src/helpers.js`, `src/helpers/index.js`, `src/components/Home/AddLoanModal.js`, `public/manifest.json`
- **Qué hacer:**
  - `helpers.js:14` — renombrar constante `LEADS_REF` → `LENDS_REF` (proyecto se llama "lends", no "leads"). Actualizar todas las referencias.
  - `helpers/index.js:4,11,18,25` — placeholder `"Email no encontrado"` → `"Usuario no encontrado"` o `"Sin nombre"`.
  - `AddLoanModal.js:81,84` — labels en inglés (`"FROM COMPANY"`, `"TO COMPANY"`) en campos hidden — eliminar labels o traducir.
  - `manifest.json:6` — eliminar doble slash: `"./icons//favicon.ico"` → `"./icons/favicon.ico"`.
  - `manifest.json:22` — corregir MIME inválido: `"icons/image/png"` → `"image/png"`.
- **Resultado esperado:** consistencia de naming en todo el proyecto. Manifest valida con DevTools.

---

## Tarea 7.B: Imports limpios

- **Archivos:** `src/pages/Home.js`, `src/components/Home/LogOutDropdown.js`, `src/components/DateRangeFilter.js`
- **Qué hacer:**
  - `Home.js:27` — eliminar import `Alert` (no se usa). ⤴︎ ya cubierto en 1.A.
  - `LogOutDropdown.js:18` — eliminar `_` del destructuring (`const { _, setUser }` → `const { setUser }`). ⤴︎ ya cubierto en 1.A.
  - `LogOutDropdown.js:4` — cambiar `import { useNavigate } from "react-router"` → `from "react-router-dom"` (consistencia).
  - ~~`DateRangeFilter.js:4` — verificar/eliminar import de `react-device-detect` si `isMobile` no se usa.~~ ✅ Resuelto en Tarea 1.F (2026-05-11).
- **Resultado esperado:** 0 imports no usados; 1 sola fuente de `react-router-dom`.

---

## Tarea 7.C: React micro-issues

- **Archivos:** `src/components/Home/LendsList.js`, `src/pages/Home.js`
- **Qué hacer:**
  - `LendsList.js:212-223` — reemplazar `key={index}` por hash o timestamp del `entry`.
  - `LendsList.js:227` — idem.
  - `Home.js:95` — idem para historial de comments.
  - Estabilizar handlers `onClick={() => fn(item)}` con `useCallback` cuando se pasan a componentes memoizados.
- **Resultado esperado:** keys estables en `.map()`; sin warnings de React Dev Tools.

---

## Tarea 7.D: CSS — eliminar duplicación de estilos

- **Archivos:** `src/utils/toast.js` (crear), `src/helpers.js`, `src/pages/Login.js`, `src/pages/Home.js`, `src/styles/FloatingButton.css`, `src/App.css`, `src/index.css`, `src/components/Home/LendsList.js`
- **Qué hacer:**
  - **Crear `src/utils/toast.js`** que exporte `showSuccess(content)` y `showError(content)` con el `style` consolidado:
    ```js
    const TOAST_STYLE = {
      position: "fixed", top: 10, right: 10, zIndex: 1000,
      padding: "10px", borderRadius: 4,
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    };
    ```
  - Reemplazar las **8 ocurrencias** duplicadas:
    - `helpers.js:34-46`, `162-174`, `219-231`
    - `Login.js:64-76`, `81-93`, `97-109`
    - `Home.js:189-201`, `222-234`
  - `App.css` — eliminar 40 líneas de boilerplate CRA (`.App-logo`, `.App-link`, `.App-header`, keyframes `App-logo-spin`).
  - `index.css:2` — eliminar línea comentada `/* margin: 0; */`.
  - `FloatingButton.css:14-26` — consolidar `.floating-button` y `.floating-button-mobile` (CSS idéntico).
  - `LendsList.js` — extraer colores `#1890ff`, `red`, `#ff7043` a tokens (preparación para FASE 4.F theming).
- **Resultado esperado:** 8 toasts con 1 sola implementación; CSS sin código muerto.

---

## Tarea 7.E: HTML / public/

- **Archivos:** `public/index.html`, `public/manifest.json`, `public/-favicon.ico`, `public/-logo192.png`, `public/-logo512.png`, `public/robots.txt`
- **Qué hacer:**
  - `index.html:24` — `<title>PWA</title>` → `<title>Lends — Préstamos entre empresas</title>`.
  - `index.html:27` — traducir `<noscript>` a español.
  - `index.html` — añadir metas SEO: `description`, `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card`.
  - `index.html` — añadir metas iOS: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.
  - `index.html` — `<meta name="viewport">` con `viewport-fit=cover` para safe areas.
  - Renombrar archivos en `public/`: `-favicon.ico` → `favicon.ico`, `-logo192.png` → `logo192.png`, `-logo512.png` → `logo512.png`. Actualizar referencias en `index.html` y `manifest.json`.
  - `robots.txt` — preparar línea `Sitemap:` (queda vacía hasta tener hosting).
- **Resultado esperado:** preview rico al compartir URL en redes/Slack/WhatsApp; instalación PWA en iOS sin cosas extrañas.

---

## Tarea 7.F: package.json

- **Archivo:** `package.json`
- **Qué hacer:**
  - Añadir scripts faltantes:
    - `"lint": "eslint src/"`
    - `"format": "prettier --write src/"`
    - `"test:coverage": "react-scripts test --coverage --watchAll=false"`
    - `"prepare": "husky install"` (cuando FASE 6 instale husky)
  - Añadir `"engines": { "node": ">=18" }`.
  - Añadir `"homepage": "/"` (o el subpath del hosting).
  - Eliminar dependencias muertas:
    - `react-router` (queda solo `react-router-dom`)
    - `react-swipeable` (no se importa)
    - 7 paquetes `workbox-*` no usados: `background-sync`, `broadcast-update`, `cacheable-response`, `google-analytics`, `navigation-preload`, `range-requests`, `streams`
  - Actualizar `web-vitals` v2 → v4+ (incluye INP).
  - Permitir `PORT` env var en el script `start`: `"start": "kill-port ${PORT:-3000} && react-scripts start"`.
- **Resultado esperado:** `package.json` más liviano y descriptivo; bundle reducido por dependencias eliminadas.

---

## Tarea 7.G: .gitignore / .env

- **Archivos:** `.gitignore`, `.env.example` (crear)
- **Qué hacer:**
  - Crear `.env.example` con las 6 variables de Firebase en blanco:
    ```
    REACT_APP_FIREBASE_API_KEY=
    REACT_APP_FIREBASE_AUTH_DOMAIN=
    REACT_APP_FIREBASE_PROJECT_ID=
    REACT_APP_FIREBASE_STORAGE_BUCKET=
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
    REACT_APP_FIREBASE_APP_ID=
    REACT_APP_FIREBASE_DATABASE_URL=
    ```
  - Añadir a `.gitignore`: `.firebase/`, `*.log`, `coverage/`.
  - Limpiar `build/` versionado: `git rm -r --cached build/` y commit.
- **Resultado esperado:** onboarding documentado, repo limpio.

---

## Tarea 7.H: Accesibilidad ligera (WCAG quick wins)

- **Archivos:** `src/components/Home/HeaderApp.js`, `src/components/Home/LogOutDropdown.js`, `src/components/Home/AddLoanModal.js`, `src/pages/Login.js`, `src/components/Home/LendsList.js`
- **Qué hacer:**
  - `HeaderApp.js:32-39` — `aria-label="Cambiar número de columnas"` en el botón de columnas.
  - `LogOutDropdown.js:45` — `aria-label="Cerrar sesión"`.
  - `AddLoanModal.js:64-70` — `aria-label="Agregar nuevo préstamo"`.
  - `Login.js:116` — cambiar `<Title>L E N D S</Title>` por `<Title style={{ letterSpacing: "0.5em" }}>LENDS</Title>` para preservar la estética sin romper screen readers.
  - `LendsList.js:38-86` — agregar texto o icono junto al color para indicar estado (cumple WCAG 1.4.1).
  - `LendsList.js:46,59,82` — aumentar tamaño de iconos clicables a ≥ 24×24 (idealmente 44×44).
- **Resultado esperado:** Lighthouse Accessibility ≥ 90.

---

## Tarea 7.I: UX pequeñeces

- **Archivos:** `src/helpers.js`, `src/components/Home/AddLoanModal.js`, `src/components/IsLoadingScreen.js`, `src/components/Home/LendsList.js`, `src/pages/Home.js`
- **Qué hacer:**
  - Toasts: aumentar `duration` por defecto de 3 s → 4–5 s para mensajes de error.
  - `AddLoanModal.js` — añadir `autoFocus` al primer `Input` del form (nombre del préstamo).
  - `IsLoadingScreen.js` — añadir texto `"Cargando…"` debajo del spinner.
  - `LendsList.js:104` — añadir label `"Ver historial"` cuando el `<Collapse>` está cerrado.
  - `Home.js:67` — el `comment: "deleted"` que se concatena al historial es un string técnico que aparece visible al usuario. Cambiar a un emoji o etiqueta legible (`"🗑️ eliminado"`).
  - `helpers.js:188` — fallback `"✉️"` para comment vacío → `"(sin nota)"`.
- **Resultado esperado:** UX más profesional, menos *jargon* técnico filtrado a la UI.

---

## Tarea 7.J: Firebase pequeñeces

- **Archivos:** `src/pages/Login.js`, `src/firebase-config.js`, `src/pages/Home.js`
- **Qué hacer:**
  - `Login.js:31` — usar `${USERS_REF}/${user.uid}` en vez de `users/${user.uid}` (consistencia con `helpers.js:15`).
  - `firebase-config.js` — añadir `databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL` explícito (RTDB v10 lo requiere para algunas regiones).
  - `Home.js:142-160` — `getOut()` usa `setTimeout(4000)` sin cancelar en cleanup → race condition si el user cambia. Guardar el `id` del timeout y limpiarlo en el `return` del `useEffect`. ⤴︎ relacionado con bug B4 del análisis.
- **Resultado esperado:** sin race conditions de signOut, configuración Firebase robusta.

---

## Tarea 7.K: Cleanup de archivos

- **Archivos:** `src/helpers.js`, `src/helpers/index.js`, `src/App.css`, `src/App.test.js`, `build/`
- **Qué hacer:**
  - Consolidar `src/helpers.js` y `src/helpers/index.js` en una estructura clara: `src/helpers/index.js` (barrel) + `src/helpers/lends.js` + `src/helpers/users.js`. Node resuelve `./helpers` ambiguamente cuando hay archivo Y carpeta con el mismo nombre.
  - Eliminar `src/App.css` (40 líneas boilerplate CRA muerto). ⤴︎ ya parcial en 1.A.
  - Eliminar `src/App.test.js` boilerplate (busca `"learn react"`, garantizado a fallar) o reemplazar por test real.
  - `git rm -r --cached build/` (versionado pese a `.gitignore`).
  - **Nota:** `CONCEPTO.md` (raíz) y `docs/_CONCEPTO.md` parecen duplicados pero **no lo son**. El primero es análisis técnico (11.5 KB), el segundo es el brief original del backlog (1.1 KB, marcado *"no editar"*). Mantener ambos.
- **Resultado esperado:** estructura sin ambigüedades ni duplicados.

---

## Tarea 7.L: Seguridad ligera (no crítica)

- **Archivos:** `src/UserContext.js`, `src/pages/Login.js`, `src/pages/Home.js`, `src/components/Home/LogOutDropdown.js`, `src/components/Home/AddLoanModal.js`
- **Qué hacer:**
  - `UserContext.js:8,15` — cambiar `localStorage` key `"user"` → `"lends:user:v1"` (namespace + versión).
  - Eliminar `console.log` con PII:
    - `Login.js:28` — `"User signed in:"` (expone email/displayName). ⤴︎ ya en 1.B.
    - `Login.js:37` — `"User already exists in database"`.
    - `Home.js:130` — `"El estado del item ha sido cambiado por", uid`.
    - `LogOutDropdown.js:23` — `"User signed out successfully"`.
    - `AddLoanModal.js:46` — `"Validation failed:"` cambiar a `console.warn` o eliminar.
  - Auditar otros `console.log` en `src/` y dejar solo los que tienen valor de debugging.
- **Resultado esperado:** 0 logs con PII en consola de producción.

---

## Tarea 7.M: Manifest / PWA

- **Archivo:** `public/manifest.json`
- **Qué hacer:**
  - L3 — `description` más conciso y diferente de `name`.
  - L65-72 — eliminar `screenshots` falsos (apuntan a un ícono) o capturar screenshots reales `1280x720` o `540x720` con Chrome DevTools.
  - L75-100 — diferenciar las 2 `shortcuts` (URL y descripción distintas) o dejar solo 1.
  - Añadir `"categories": ["business", "productivity"]`.
  - Añadir `"id": "/"` (recomendado en PWA standard 2024).
  - Verificar `purpose` en cada ícono: maskables → `"maskable"`, normales → `"any"`.
- **Resultado esperado:** Lighthouse PWA ≥ 90; instalación en Android/iOS sin warnings.

---

## Tarea 7.N: APIs deprecadas Ant Design 5

⤴︎ **Solapa con FASE 1.C** — ejecutar una sola vez. Listado para completitud:

- `AddLoanModal.js:73` — `<Modal visible>` → `<Modal open>`.
- `LogOutDropdown.js:42` — `<Dropdown overlay={<Menu/>}>` → `<Dropdown menu={{ items, onClick }}>`.
- `Home.js:34` — `const { TabPane } = Tabs` + uso `<TabPane>` → prop `items={[{ key, label, children }]}`.

---

## Top 20 Small Wins (orden de costo-beneficio)

| # | Tarea | Tiempo | Impacto | Cubierta por |
|---|---|---|---|---|
| 1 | Extraer `TOAST_STYLE` constante (8 duplicados) | 10 min | Alto | 7.D |
| 2 | Renombrar `LEADS_REF` → `LENDS_REF` | 2 min | Medio | 7.A |
| 3 | Eliminar 51 líneas comentadas en `helpers.js:252-303` | 2 min | Medio | 1.A |
| 4 | Limpiar `App.css` (boilerplate CRA) | 3 min | Medio | 7.D / 7.K |
| 5 | `aria-label` en 4 botones de solo icono | 10 min | Alto a11y | 7.H |
| 6 | Crear `.env.example` | 3 min | Alto DX | 7.G |
| 7 | Renombrar `-favicon.ico`, `-logo192.png`, `-logo512.png` | 5 min | Medio | 7.E |
| 8 | `<title>` descriptivo + metas OG/Twitter | 10 min | Alto SEO | 7.E |
| 9 | Quitar 5 `console.log` con PII | 5 min | Medio seguridad | 1.B / 7.L |
| 10 | `ref(database, "users/...")` → `${USERS_REF}/...` | 2 min | Bajo | 7.J |
| 11 | Consolidar `helpers.js` + `helpers/index.js` | 15 min | Alto mant. | 7.K |
| 12 | Cancelar `setTimeout` de getOut en cleanup | 5 min | Alto (bug) | 7.J |
| 13 | `keys` por id estable en `.map()` | 10 min | Medio | 7.C |
| 14 | Borrar `react-router`, `react-swipeable`, 7 workbox-* | 5 min | Medio bundle | 7.F |
| 15 | APIs deprecadas antd: `visible`, `overlay`, `TabPane` | 15 min | Medio | 1.C / 7.N |
| 16 | `localStorage` key `"user"` → `"lends:user:v1"` | 3 min | Medio | 7.L |
| 17 | Fix manifest: doble slash, MIME, screenshots | 5 min | Alto Lighthouse | 7.A / 7.M |
| 18 | `"engines"` + `"homepage"` en package.json | 3 min | Bajo | 7.F |
| 19 | `"Email no encontrado"` → `"Usuario no encontrado"` | 2 min | Medio UX | 7.A |
| 20 | Borrar `App.test.js` boilerplate | 2 min | Medio | 7.K |

**Tiempo total estimado: ~2 h** para los 20 wins.

---

## Criterios de Aceptación

- [ ] 0 imports no utilizados en `src/`
- [ ] 0 `console.log` en archivos `src/` (excepto `console.error` con justificación)
- [ ] `App.css` eliminado o con CSS realmente usado
- [ ] `.env.example` presente en raíz con las 7 variables
- [ ] `build/` no versionado en git
- [ ] `manifest.json` valida en Chrome DevTools sin warnings
- [ ] `<title>` y metas SEO presentes en `index.html`
- [ ] Todos los botones de solo icono tienen `aria-label`
- [ ] `helpers.js` y `helpers/index.js` consolidados
- [ ] Lighthouse PWA ≥ 90 y Accessibility ≥ 90
- [ ] `package.json` sin `react-router`, `react-swipeable`, ni los 7 `workbox-*` no usados
- [ ] Todas las referencias a `LEADS_REF` actualizadas a `LENDS_REF`

---

## Referencias

- Análisis fuente: [`docs/ANALISIS_SMALL_FIXES.md`](../ANALISIS_SMALL_FIXES.md)
- Análisis técnico complementario: [`docs/ANALISIS_TECNICO_DETALLADO.md`](../ANALISIS_TECNICO_DETALLADO.md)
- Solapes con: [`FASE_1_REFACTOR.md`](FASE_1_REFACTOR.md) (1.A imports muertos, 1.B console, 1.C antd 5)
- Solapes con: [`FASE_4_UIUX.md`](FASE_4_UIUX.md) (theming, colores tokens)
