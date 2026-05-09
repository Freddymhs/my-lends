# FASE 2: Company Self-Assignment + Modo Personal

**Status:** ⏸️ PENDIENTE
**Prioridad:** 🔴 Alta
**Dependencias:** FASE 1 completada

> Actualmente `company` se asigna manualmente por backend. Esta fase agrega dos modos:
> 1. **Modo B2B**: el usuario puede unirse a una company existente o crear una nueva (con validaciones de seguridad).
> 2. **Modo Personal**: el usuario puede usar la app sin company para gestión personal de préstamos.

---

## Orden de ejecución

1. Tarea 2.A — Definir modelo de datos (base para todo lo demás)
2. Tarea 2.B — Lógica de asignación en Firebase (helpers)
3. Tarea 2.C — Pantalla/modal de onboarding de company
4. Tarea 2.D — Modo personal (sin company)
5. Tarea 2.E — Adaptar Home y flujos existentes

---

## Tareas

### Tarea 2.A: Definir modelo de company en Firebase

- **Archivo:** `docs/decisions/DECISION_COMPANY_MODEL.md` (crear)
- **Qué hacer:**
  - Decidir si `company` sigue siendo string libre o pasa a ser una colección `/companies/{id}`.
  - Opción A (simple): `company` sigue siendo string pero se normaliza (lowercase trim). Los usuarios se "unen" escribiendo el nombre exacto.
  - Opción B (robusta): nueva colección `/companies/{id}` con `{ name, ownerId, members: [uid] }`. Los usuarios buscan y se unen por ID o código de invitación.
  - **Recomendación inicial**: empezar con Opción A (menor cambio) + validación de unicidad. Opción B es la evolución natural si el proyecto escala.
  - Documentar la decisión antes de implementar.

### Tarea 2.B: Funciones de company en helpers

- **Archivo:** `src/helpers.js` (modificar)
- **Qué hacer:**
  - `joinCompany(uid, companyName)` → normaliza el nombre (lowercase trim), verifica que exista al menos un usuario con esa company, actualiza `/users/{uid}.company`.
  - `createCompany(uid, companyName)` → verifica que no exista ya (para evitar duplicados con typos), escribe en `/users/{uid}.company`.
  - `setPersonalMode(uid)` → escribe `company: "personal"` en `/users/{uid}` (valor especial que activa modo personal).

### Tarea 2.C: Pantalla de onboarding de company

- **Archivo:** `src/pages/CompanySetup.js` (crear), `src/App.js` (modificar)
- **Qué hacer:**
  - Nueva ruta `/setup` accesible solo si el usuario tiene `company === "null"`.
  - UI con dos opciones: "Unirme a empresa existente" (input de nombre) o "Crear empresa nueva" (input de nombre).
  - Botón "Usar en modo personal" que lleva al modo personal.
  - Validaciones: nombre no vacío, no solo espacios, longitud mínima.
  - Al completar: redirige a `/lends`.
  - Reemplazar el actual timeout de 4 segundos en `Home.js` por una redirección directa a `/setup`.

### Tarea 2.D: Modo personal (sin company)

- **Archivos:** `src/pages/Home.js`, `src/helpers.js`, `src/components/Home/NoCompanyAlert.js`
- **Qué hacer:**
  - Cuando `company === "personal"`, el usuario ve solo sus propios préstamos (sin filtro por company).
  - En modo personal, el tab "Deudas" puede ocultarse o mostrar un mensaje explicativo.
  - `getDataFromFirebase` adaptar: si `company === "personal"`, filtrar por `from === uid` en lugar de `fromCompany`.
  - Eliminar `NoCompanyAlert` o reemplazar por un badge informativo de modo.

### Tarea 2.E: Adaptar validaciones de company en formularios

- **Archivo:** `src/components/Home/AddLoanModal.js`
- **Qué hacer:**
  - En modo personal, el selector de destinatario puede quedar deshabilitado o mostrar solo contactos (si se implementa en el futuro).
  - Asegurar que `company === "personal"` no rompa el filtro de usuarios de otras empresas.

---

## Criterios de Aceptación

- [ ] Un usuario nuevo que hace login llega a `/setup` en lugar de ser expulsado
- [ ] El usuario puede crear una empresa nueva y quedar activo en la app
- [ ] El usuario puede unirse a una empresa existente escribiendo el nombre exacto
- [ ] El usuario puede elegir modo personal y usar la app para préstamos propios
- [ ] Los préstamos en modo personal solo aparecen para el usuario que los creó
- [ ] No hay más timeout de 4 segundos ni redirección al login por falta de company
