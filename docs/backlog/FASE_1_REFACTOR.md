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

### Tarea 1.C: Reemplazar APIs deprecadas de Ant Design 5

- **Archivos:** `src/components/Home/AddLoanModal.js`, `src/components/Home/LogOutDropdown.js`, `src/pages/Home.js`
- **Qué hacer:**
  - `AddLoanModal.js:72`: `visible` → `open`
  - `LogOutDropdown.js:42`: `overlay={<Menu>}` → prop `menu={{ items: menuItems, onClick: handleMenuClick }}`
  - `Home.js`: reemplazar `<TabPane>` por array `items` en `<Tabs>`

### Tarea 1.D: Migrar moment.js → dayjs

- **Archivos:** `src/helpers.js`, `src/components/Home/LendsList.js`, `src/components/Home/AddLoanModal.js`
- **Qué hacer:**
  - Instalar `dayjs` (ya incluido por Ant Design 5, solo importar)
  - Reemplazar `import moment from 'moment'` por `import dayjs from 'dayjs'`
  - Reemplazar `import 'moment/locale/es'` por `import 'dayjs/locale/es'; dayjs.locale('es')`
  - Adaptar los formatos: `moment(x, fmt)` → `dayjs(x, fmt)`, `.format()` igual
  - Desinstalar `moment` del `package.json`

### Tarea 1.E: Extraer lógica de Home.js a custom hooks

- **Archivos:** `src/hooks/useLends.js` (crear), `src/hooks/useUsers.js` (crear), `src/pages/Home.js` (modificar)
- **Qué hacer:**
  - `useLends(uid, company, startDate, endDate, filterType)` → encapsula la suscripción a Firebase de préstamos y retorna `{ returnData, belongsData, loading }`
  - `useUsers(uid)` → encapsula la suscripción a Firebase de usuarios y retorna `{ users }`
  - `Home.js` queda solo como orquestador de UI y confirmaciones

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
