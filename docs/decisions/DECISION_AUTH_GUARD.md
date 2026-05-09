# DECISION: Auth Guard en cliente vía `PrivateRoute`

**Fecha:** 2026-05-09
**Status:** Aceptado
**Autores:** fmarcos-l + asistente
**Tarea relacionada:** Backlog FASE_0 — Tarea 0.B
**Commit:** pendiente

---

## Contexto

La ruta `/lends` debe estar protegida ante accesos sin sesión. Antes de esta decisión, `App.js` montaba `<Home>` directamente sin guard: cualquier URL directa renderizaba la página, y la "protección" era el `setTimeout(4000)` de `Home.js:142-160` que detectaba `!user?.company`, llamaba a `signOut` y navegaba a `/`. Resultado UX: ~4 segundos de pantalla vacía antes del redirect.

## Alternativas evaluadas

| # | Alternativa | Pros | Contras | Decisión |
|---|---|---|---|---|
| A | **`PrivateRoute` wrapper** que lee `user.uid` de `UserContext` y redirige con `<Navigate to="/" replace />` | Síncrono (sin flicker), 11 líneas, alineado con docs de React Router v6, fácil de testear | Cliente puede saltarse el guard si manipula `localStorage` (mitigado por reglas Firebase) | ✅ **Elegida** |
| B | Suscripción global a `onAuthStateChanged` en `App.js` que setea estado y condicionalmente renderiza Routes | Fuente de verdad alineada con Firebase Auth | Más complejo, requiere refactor de `UserContext`, scope mayor que la tarea 0.B | Postergada — candidata para FASE 1.E (custom hooks) |
| C | Solo reglas Firebase, sin guard cliente | Mínima superficie, real perímetro de seguridad | UX rota: usuario sin sesión ve UI rota antes de que las queries fallen | Rechazada |
| D | Mantener el `setTimeout(4000)` actual | Sin cambios | UX ya degradada (4 s de blanco) | Rechazada |

## Decisión

Adoptamos la alternativa **A — `PrivateRoute` cliente**:
- `src/components/PrivateRoute.js` envuelve la ruta `/lends`.
- Guard adicional: `<Route path="*" element={<Navigate to="/" replace />} />` evita pantalla en blanco con URLs inválidas.
- `Home.js:142-160` (timeout sin company) se conserva — protege el caso "uid presente pero sin company", complementario al guard de uid.

## Consecuencias

**Positivas**
- Redirección instantánea sin flicker.
- Código aislado, fácil de testear y reemplazar.
- Sin acoplamiento a Firebase Auth en `App.js` — suscripción a `onAuthStateChanged` puede agregarse después en `UserContext` sin tocar la ruta.

**Negativas / a tener presente**
- **El guard NO es perímetro de seguridad real.** Un atacante con DevTools puede escribir un `user` válido en `localStorage` y montar `<Home>`. La seguridad real vive en las reglas de Firebase Realtime DB (FASE 6) — el guard solo evita que usuarios legítimos lleguen a UI con datos incompletos.
- Si en el futuro se introduce `onAuthStateChanged` global, el guard debe seguir leyendo desde `UserContext` (no duplicar fuentes de verdad).
- La ruta catch-all redirige silenciosamente — sustituir por `<NotFound>` real cuando se aborde FASE 4 (UI/UX Polish).

## Referencias

- Implementación: `src/components/PrivateRoute.js`, `src/App.js`
- Backlog: `docs/backlog/FASE_0_BUGS_CRITICOS.md` Tarea 0.B
- Análisis técnico: `docs/ANALISIS_TECNICO_DETALLADO.md` §15.2
