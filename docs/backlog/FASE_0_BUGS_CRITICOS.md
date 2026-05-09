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

### Tarea 0.A: Fix bug registro de usuario nuevo en Login

- **Archivo:** `src/pages/Login.js` (modificar)
- **Qué hacer:**
  - En el bloque `else` (usuario nuevo), el `setUser` en línea ~59 usa `userPropsInRealtimeDB?.company` que es `undefined` porque el snapshot acaba de crearse.
  - Reemplazar con los valores que se acaban de escribir en el `set()`: `company: "null"`, `numberOfColumns: 2`.
- **Referencia:** `src/pages/Login.js:46–77`

### Tarea 0.B: Agregar PrivateRoute en App.js

- **Archivo:** `src/App.js` (modificar)
- **Qué hacer:**
  - Crear un componente `PrivateRoute` que lea `user.uid` de `UserContext`.
  - Si no hay `uid`, redirigir a `/`.
  - Envolver la ruta `/lends` con `PrivateRoute`.
- **Referencia:** `src/App.js`, `src/UserContext.js`

### Tarea 0.C: Corregir lógica de filtro notReturned vs wasReturned

- **Archivo:** `src/helpers.js` (modificar — función `getDataFromFirebase`)
- **Qué hacer:**
  - `notReturned`: ítem sin `returnedBy` y sin `deleted` (nunca fue marcado).
  - `wasReturned`: tiene `returnedBy` Y `returned === false` (fue devuelto pero se desmarcó).
  - Actualmente ambos tienen la misma condición — corregir la de `notReturned`.
- **Referencia:** `src/helpers.js` — bloque del switch de filtros

---

## Criterios de Aceptación

- [ ] Un usuario nuevo puede hacer login y queda con `company: "null"` correctamente en contexto
- [ ] Acceder a `/lends` sin sesión redirige a `/` inmediatamente
- [ ] Los filtros "No regresados" y "Regresado anteriormente" muestran datos distintos y correctos
- [ ] `npm run build` sin errores de ESLint
