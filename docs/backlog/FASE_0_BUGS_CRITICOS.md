# FASE 0: Bugs Críticos

**Status:** ⏸️ PENDIENTE
**Prioridad:** 🔴 Alta
**Dependencias:** Ninguna — ejecutar primero

---

## Orden de ejecución

1. Tarea 0.A — Fix Login (otros tasks usan `user.company` y asumen que está bien seteado)
2. Tarea 0.B — PrivateRoute (depende de que el contexto de usuario sea confiable)
3. Tarea 0.C — Fix filtro (independiente, pero conviene tener la base estable antes)

---

## Tareas

### Tarea 0.A: Fix inconsistencia DB ↔ Context en registro de usuario nuevo

> **Nota de re-clasificación (2026-05-09):** originalmente etiquetada como "bug crítico". Tras revisión, **NO es un bug observable hoy** — el check generoso de `Home.js:143` (`!user?.company || user.company === "null" || user.company === ""`) cubre los tres casos. Es un **code smell + inconsistencia de datos** (DB tiene `"null"`, contexto tiene `undefined`). Severidad real: 🟡 Medio. Mantenerla aquí porque sigue siendo trabajo razonable hacer **antes de FASE 1** (refactor) para no llevar la inconsistencia al refactor.

- **Archivo:** `src/pages/Login.js` (modificar)
- **Qué hacer:**
  - En el bloque `else` (usuario nuevo), el `setUser` (~L55-61) usa `userPropsInRealtimeDB?.company` que es `undefined` (el snapshot leído antes confirmó que no existía → `snapshot.val() === null` → optional chaining devuelve `undefined`).
  - Reemplazar por los valores **literales** recién escritos en el `set()`: `company: "null"`, `numberOfColumns: 2`.
  - Considerar añadir comentario explicando por qué se usa el sentinel string `"null"` (para no confundir con `null` real).
- **Por qué importa aunque no rompa hoy:**
  - Si alguien simplifica el check `Home.js:143` a solo `user.company === "null"`, el bug pasa a ser observable.
  - `localStorage` con `JSON.stringify` omite `undefined`, así la persistencia queda con shape distinto al esperado.
  - `numberOfColumns` también queda `undefined` en sesión inicial — Home cae a default por casualidad, no por diseño.
- **Referencia:** `src/pages/Login.js:46–77`. Validación al final: tras login con user nuevo, `useContext(UserContext)` debe reportar `company === "null"` (string) y `numberOfColumns === 2`, no `undefined`.

### Tarea 0.B: ✅ Resuelto (2026-05-09) — Agregar PrivateRoute en App.js

- **Archivos:** `src/App.js` (modificado), `src/components/PrivateRoute.js` (nuevo)
- **Implementación:**
  - `PrivateRoute` lee `user.uid` de `UserContext`. Si falta, retorna `<Navigate to="/" replace />`.
  - `/lends` envuelta. Catch-all `path="*" → /` añadido para URLs inválidas.
  - Severidad real (post-traza): 🟡 Medio-Alto. Antes había ~4 s de pantalla blanca por el `setTimeout` de `Home.js:142-160` antes de redirigir; ahora redirección instantánea. No era bug crítico de seguridad — el perímetro real son las reglas Firebase (FASE 6).
- **Decisión arquitectónica:** `docs/decisions/DECISION_AUTH_GUARD.md`
- **Referencia:** `src/components/PrivateRoute.js`, `src/App.js`

### Tarea 0.C: ✅ Resuelto (2026-05-09) — Refactor de filtro `notReturned` / `wasReturned`

- **Archivo:** `src/helpers.js:93-105` (modificado — función `getDataFromFirebase`)
- **Implementación:**
  - Eliminada variable duplicada literal (`hasNotReturned` ≡ `hasWasReturned`).
  - Renombradas para reflejar intención: `isUntouched`, `isCurrentlyReturned`, `wasReturnedAndUndone`, `isDeleted`.
  - `Boolean(item.deletedBy)` explícito en lugar de truthy implícito.
  - Eliminada redundancia `"deleted" in item && item.deleted === true` → solo `item.deleted === true`.
- **Re-clasificación tras revisión:** severidad real **🟢 Bajo** (code smell + naming), NO 🔴 crítico. La afirmación original "el filtro no distingue" era incorrecta — la doble negación en la rama de `selectedNotReturned` (`!hasNotReturned && !hasReturned && !hasWasReturned`) enmascaraba la duplicación y los 4 estados sí se distinguían correctamente.
- **Referencia:** `src/helpers.js:93-105`, también actualizado `CLAUDE.md` sección "Filter logic" con la semántica formal de los 4 estados.

---

## Criterios de Aceptación

- [ ] Un usuario nuevo puede hacer login y queda con `company: "null"` correctamente en contexto
- [ ] Acceder a `/lends` sin sesión redirige a `/` inmediatamente
- [ ] Los filtros "No regresados" y "Regresado anteriormente" muestran datos distintos y correctos
- [ ] `npm run build` sin errores de ESLint
