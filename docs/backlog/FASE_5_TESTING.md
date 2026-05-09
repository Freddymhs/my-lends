# FASE 5: Testing

**Status:** ⏸️ PENDIENTE
**Prioridad:** 🟡 Media
**Dependencias:** FASE 1 completada (el refactor hace el código testeable), FASE 2 deseable

---

## Estrategia

Tres capas en orden de valor/esfuerzo:

1. **Unit tests** — funciones puras de `helpers.js` y `helpers/index.js`
2. **Component tests** — flujos críticos con React Testing Library
3. **E2E** — flujos de usuario completos (opcional, requiere Firebase emulator o mocks)

---

## Tareas

### Tarea 5.A: Setup de testing

- **Archivos:** `src/setupTests.js` (ya existe), `package.json`
- **Qué hacer:**
  - CRA ya incluye `@testing-library/react` y `@testing-library/jest-dom`.
  - Agregar `@testing-library/user-event` si no está.
  - Configurar mocks de Firebase para tests (jest manual mock o `jest.mock('firebase/database')`).
  - Verificar que `npm test -- --watchAll=false` corre correctamente.

### Tarea 5.B: Unit tests — lógica de filtros

- **Archivo:** `src/helpers.test.js` (crear)
- **Qué hacer:**
  - Testear la lógica de `filterType` en `getDataFromFirebase` con datos mock:
    - `notReturned`: ítem sin `returnedBy`
    - `returned`: `returnedBy` existe && `returned === true`
    - `wasReturned`: `returnedBy` existe && `returned === false`
    - `deleted`: `deleted === true` && `deletedBy` existe
  - Testear filtro de fechas con rango válido e inválido.
  - Estos tests son los más valiosos porque detectan el bug de filtro duplicado.

### Tarea 5.C: Unit tests — helpers de nombres

- **Archivo:** `src/helpers/index.test.js` (crear)
- **Qué hacer:**
  - `findToUserName`: retorna `displayName` si el uid existe en la lista, o fallback.
  - `findFromUserName`: ídem.
  - `findReturnedByUserName`, `findDeletedByUserName`: ídem.

### Tarea 5.D: Component test — flujo de Login

- **Archivo:** `src/pages/Login.test.js` (crear)
- **Qué hacer:**
  - Mock de `firebase/auth` (`signInWithPopup`).
  - Mock de `firebase/database` (`get`, `set`).
  - Test: usuario existente → se llama `setUser` con `company` correcto.
  - Test: usuario nuevo → se llama `set` con `company: "null"` y luego `setUser` con valores explícitos.
  - Test: login fallido → se muestra `message.error`.

### Tarea 5.E: Component test — AddLoanModal

- **Archivo:** `src/components/Home/AddLoanModal.test.js` (crear)
- **Qué hacer:**
  - Test: formulario vacío → botón OK no dispara `onCreate`.
  - Test: formulario completo → `onCreate` se llama con los valores correctos.
  - Test: usuario de la misma company no aparece en el selector.

### Tarea 5.F: Component test — Filters (estado del préstamo)

- **Archivo:** `src/Filters.test.js` (crear)
- **Qué hacer:**
  - Test: cambiar selección actualiza `filterType` correctamente.
  - Test: deseleccionar todos → `filterType` con todos en `false`.

---

## Criterios de Aceptación

- [ ] `npm test -- --watchAll=false` corre sin errores
- [ ] Cobertura de la lógica de filtros al 100%
- [ ] Cobertura del bug de Login (usuario nuevo) con test específico
- [ ] Al menos 1 test por función exportada de `helpers/index.js`
- [ ] Los mocks de Firebase no llaman a Firebase real
