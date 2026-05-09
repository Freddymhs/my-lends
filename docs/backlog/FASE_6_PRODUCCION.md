# FASE 6: Producción

**Status:** ⏸️ PENDIENTE
**Prioridad:** 🟠 Media-Alta
**Dependencias:** Todas las fases anteriores

---

## Tareas

### Tarea 6.A: Configurar hosting

- **Archivos:** `firebase.json` (crear) o `vercel.json` (crear)
- **Qué hacer:**
  - Decidir plataforma: Firebase Hosting (ya tienen Firebase, zero config) o Vercel.
  - Firebase Hosting: `npm install -g firebase-tools` → `firebase init hosting` → `firebase deploy`.
  - Documentar en `docs/decisions/DECISION_HOSTING.md`.

### Tarea 6.B: Variables de entorno en producción

- **Archivo:** `.env.example` (crear)
- **Qué hacer:**
  - Crear `.env.example` con todas las `REACT_APP_FIREBASE_*` en blanco como template.
  - Configurar las variables en el panel de la plataforma de hosting elegida.
  - Verificar que el build de producción no expone los valores en el bundle más allá de lo inevitable (Firebase Web SDK los necesita en el cliente).

### Tarea 6.C: Error Boundary global

- **Archivo:** `src/components/ErrorBoundary.js` (crear), `src/index.js` (modificar)
- **Qué hacer:**
  - Crear un `ErrorBoundary` de clase React que capture errores de render.
  - Mostrar una UI de fallback amigable en lugar de pantalla en blanco.
  - Envolver `<App>` con `<ErrorBoundary>` en `index.js`.

### Tarea 6.D: Reglas de seguridad de Firebase

- **Archivo:** `firebase/database.rules.json` (crear)
- **Qué hacer:**
  - Actualmente las reglas de Firebase Realtime DB son probablemente abiertas (modo desarrollo).
  - Definir reglas mínimas: solo usuarios autenticados pueden leer/escribir.
  - Regla de `/users/{uid}`: solo el propio usuario puede escribir su perfil.
  - Regla de `/lends`: cualquier usuario autenticado puede leer, solo puede escribir el `from` uid.

### Tarea 6.E: PWA — validar manifest y service worker

- **Archivos:** `public/manifest.json`, `src/service-worker.js`
- **Qué hacer:**
  - Verificar que el manifest tiene `name`, `short_name`, `icons` correctos.
  - Testear instalación como PWA en Chrome (mobile y desktop).
  - Verificar que el service worker cachea correctamente en producción.

### Tarea 6.F: Performance básica

- **Archivos:** `src/pages/Home.js`
- **Qué hacer:**
  - Agregar `React.memo` o `useMemo` donde haya renders innecesarios evidentes (en particular `LendsList` re-renderiza con cada cambio de estado del padre).
  - Lazy load de páginas: `React.lazy` + `Suspense` para `Login` y `Home`.

---

## Criterios de Aceptación

- [ ] `npm run build` produce un bundle sin warnings
- [ ] La app es accesible en una URL pública
- [ ] Las reglas de Firebase rechazan requests no autenticados
- [ ] La app es instalable como PWA en mobile
- [ ] Un error de render no rompe toda la app (ErrorBoundary activo)
- [ ] Las variables de entorno NO están en el repositorio
