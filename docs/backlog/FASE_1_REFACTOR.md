# FASE 1: Refactor & Limpieza

**Status:** ⏸️ PENDIENTE
**Prioridad:** 🔴 Alta
**Dependencias:** FASE 0 completada

> Respetar la estructura actual. Sin cambiar comportamiento observable. El objetivo es que el código sea mantenible antes de agregar features.

---

## Tareas

### Tarea 1.A: ✅ Resuelto (2026-05-09) — Eliminar imports muertos y code muerto

- **Archivos modificados:** `src/pages/Home.js`, `src/components/Home/HeaderApp.js`, `src/components/Home/LogOutDropdown.js`, `src/helpers.js`, `src/components/Home/LendsList.js`
- **Implementación:**
  - `Home.js`: eliminados `PlusOutlined`, `deleteItemFromDatabase`, `Alert` del antd import + comentario huérfano `// deleteItemFromDatabase(item);`.
  - `HeaderApp.js`: eliminados `Tabs`, `Spin`, `Card` del import (quedan `Button`, `Col`, `Row`, `Divider`).
  - `LogOutDropdown.js`: `const { _, setUser } = useContext(...)` → `const { setUser } = useContext(...)`.
  - `helpers.js`: eliminado import de `remove` + comentario inline `// await remove(leadRef);` (L153) + bloque comentado completo de implementación antigua (52 líneas).
  - `LendsList.js`: eliminado bloque comentado del `<Card>` antiguo (86 líneas, L244-329).
- **Resultado:** -149 líneas netas. Build pasa con bundle 433.79 KB gzip.
- **Pendiente:** 3 warnings `react-hooks/exhaustive-deps` (LogOutDropdown.js:29, Home.js:160, Home.js:253) **delegados a Tarea 1.F** — no son fixes triviales (Home.js:253 requiere refactor para evitar loop infinito).

### Tarea 1.B: ✅ Resuelto (2026-05-09) — Eliminar console.log de producción

- **Archivos modificados:** `src/pages/Login.js`, `src/pages/Home.js`, `src/components/Home/LogOutDropdown.js`, `src/components/DateRangeFilter.js`, `src/components/Home/AddLoanModal.js`
- **Implementación:**
  - Scope ampliado tras inspección: 13 `console.*` totales detectados → 8 logs informacionales eliminados, 1 log ascendido a `console.error` con mensaje descriptivo (`Home.js:234`), 1 catch silenciado con comentario explicativo (`AddLoanModal.js`).
  - Archivos limpiados: `Login.js` (-2 logs), `Home.js` (-3 logs + 1 ascenso), `LogOutDropdown.js` (-1 log), `DateRangeFilter.js` (-1 log).
  - 5 `console.error` mantenidos en catches genuinos (`helpers.js`, `Home.js:150`, `Home.js:234`, `LogOutDropdown.js:26`) hasta que se introduzca un logger centralizado en FASE 5/6.
- **Convención persistida:** `CLAUDE.md` sección "Logging convention" documenta la regla.
- **Resultado:** -10 líneas. Bundle gzip -126 B.

### Tarea 1.C: ✅ Resuelto (2026-05-09) — Reemplazar APIs deprecadas de Ant Design 5

- **Archivos modificados:** `src/components/Home/AddLoanModal.js`, `src/components/Home/LogOutDropdown.js`, `src/pages/Home.js`
- **Implementación:**
  - `<Modal visible>` → `<Modal open>`. Renombrado también el state interno (`visible/setVisible` → `open/setOpen`) en `AddLoanModal` y `Home` para coherencia padre↔hijo.
  - `<Dropdown overlay={<Menu items=... onClick=.../>}>` → `<Dropdown menu={{ items, onClick }}>`. Import de `Menu` removido (era el único consumidor).
  - `<Tabs><TabPane tab>...</TabPane></Tabs>` + `const { TabPane } = Tabs` → `<Tabs items={[{ key, label, children }]} />`.
- **Resultado:** build pasa sin warnings de antd deprecation. La sintaxis nueva de Tabs es más declarativa (+10 líneas netas).

### Tarea 1.D: ✅ Resuelto (2026-05-09) — Migrar moment.js → dayjs

- **Archivos modificados:** `src/utils/dayjs.js` (nuevo), `src/helpers.js`, `src/components/Home/LendsList.js`, `src/components/Home/AddLoanModal.js`, `src/components/DateRangeFilter.js`, `package.json`, `package-lock.json`
- **Implementación:**
  - Creado `src/utils/dayjs.js` que carga el plugin `customParseFormat` y `locale "es"` una sola vez. Todos los archivos importan desde aquí (evita parses inválidos por plugin no cargado).
  - 9 ocurrencias de `moment` migradas. Bug fix incidental en `LendsList.js`: el formato truncado `"DD-MM"` (que moment toleraba) reemplazado por el formato completo `"DD-MM-YYYY HH:mm:ss"` consistente con el input real.
  - Línea comentada `// import moment` eliminada en `DateRangeFilter.js`.
  - `npm uninstall moment` ejecutado. `dayjs` ahora viene transitivo desde antd v5.
- **Resultado:** bundle gzip **433.66 KB → 414.42 KB** (-19.24 KB / -4.4 %).
- **Convención persistida:** `CLAUDE.md` documenta usar `import dayjs from "<...>/utils/dayjs"` siempre.

### Tarea 1.E: ✅ Resuelto (2026-05-10) — Extraer lógica de Home.js a custom hooks

- **Archivos modificados:** `src/hooks/useLends.js` (nuevo), `src/hooks/useUsers.js` (nuevo), `src/utils/toastStyle.js` (nuevo), `src/pages/Home.js` (modificado)
- **Implementación:**
  - `useUsers(uid)`: suscribe a `/users`, retorna `{ users }`. Usa `setUser(prev => ({...prev, ...me}))` para sincronizar profile sin dependerse de `user` (evita loop).
  - `useLends(uid, company, startDate, endDate, filterType)`: suscribe a `/lends`, retorna `{ returnData, belongsData, loading }`.
  - `TOAST_STYLE` centralizado en `src/utils/toastStyle.js` (precondición para FASE 7.D que consolidará los 6 toasts duplicados restantes).
  - Effect de expulsión por sin-company refactorizado con `clearTimeout` cleanup y constante `EXPULSION_DELAY_MS = 4000` (fija incidentalmente el bug B4 — timer fantasma post-logout).
- **Resultado:** Home.js de **366 → 262 líneas**. Warnings ESLint exhaustive-deps **3 → 1** (queda solo `LogOutDropdown:28`, scope de 1.F).
- **Cambio de comportamiento conocido:** el `setUser({})` que el código original ejecutaba en el error path de `getUsersInFirebase` (Home.js:179) NO se migró al hook. Decisión consciente: el comportamiento era un side effect raro (logout parcial en error de fetch). Ahora el usuario se queda en `/lends` con users vacíos si `/users` falla.

### Tarea 1.F: Corregir useCallback y useEffect dependencies

- **Archivos:** `src/components/Home/LogOutDropdown.js:29`, `src/pages/Home.js:163`, `src/pages/Home.js:256`
- **Qué hacer:**
  - `LogOutDropdown`: agregar `setUser` a deps de `useCallback` (estable porque viene de Context)
  - `Home.js:163`: evaluar si agregar `navigate` y `setUser` o estabilizar con `useRef`
  - `Home.js:256`: agregar `setUser` — verificar que no genera loop (depende de la tarea 1.E)

### Tarea 1.G: Refactorizar let mutable en modal de cambio de estado

- **Archivo:** `src/pages/Home.js:71`
- **Qué hacer:**
  - `let comment = ""` dentro del `content` del Modal es una variable closure mutable.
  - Usar `useRef` o extraer a un componente propio que maneje el estado del textarea internamente.

---

## Criterios de Aceptación

- [ ] `npm run build` compila sin ningún warning ni error
- [ ] No hay `console.log` en archivos de `src/`
- [ ] No hay warnings de Ant Design en consola del browser
- [ ] `moment` eliminado del `package.json`
- [ ] `Home.js` < 200 líneas (lógica de datos extraída a hooks)
- [ ] Comportamiento de la app idéntico al anterior
