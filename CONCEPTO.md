# CONCEPTO.md — My Lends

Documento de análisis completo del proyecto para onboarding rápido y auditorías.

---

## ¿Qué es este proyecto?

**My Lends** es una PWA (Progressive Web App) de gestión de préstamos de ítems/productos entre empresas. Está pensada para equipos que se prestan herramientas, materiales u objetos físicos entre sí y necesitan llevar registro de quién le debe qué a quién.

El modelo es **B2B interno**: un usuario pertenece a una `company`, y puede prestar ítems a usuarios de *otras* compañías. Cada préstamo tiene un ciclo de vida con estados y un historial de cambios auditado.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| UI | React 18 + Ant Design 5 |
| Routing | React Router v6 |
| Auth | Firebase Authentication (Google OAuth) |
| Base de datos | Firebase Realtime Database |
| PWA | Workbox custom en `src/service-worker.js` (actualmente desregistrado en `index.js:18` — ver FASE 6) |
| Mobile UX | react-device-detect + react-swipeable-list |
| Fechas | moment.js (locale `es`) |
| Hosting | Sin configurar (puede ser Firebase Hosting o Vercel) |

---

## Arquitectura

### Rutas

```
/        → pages/Login.js     (pública)
/lends   → pages/Home.js      (protegida de facto por UserContext)
```

`/lends` está protegida por `<PrivateRoute>` (`src/components/PrivateRoute.js`) que redirige a `/` si no hay `user.uid`. Hay además un catch-all `path="*"` que envía a `/` cualquier URL inválida. `Login.js` redirige a `/lends` si ya hay sesión. **Importante:** este guard es de UX, no perímetro de seguridad real — la protección efectiva vive en las reglas de Firebase (FASE 6). Ver `docs/decisions/DECISION_AUTH_GUARD.md`.

### Estado global

`UserContext.js` es el único estado global. Persiste en `localStorage`. Contiene:

```js
{ uid, email, displayName, company, numberOfColumns }
```

- `company`: clave de multi-tenancy. Si es `"null"` (string), el usuario no tiene empresa asignada y es bloqueado.
- `numberOfColumns`: preferencia de columnas de la lista (1 o 2), guardada también en Firebase `/users/{uid}`.

### Base de datos Firebase (Realtime DB)

Dos colecciones planas:

```
/users/{uid}
  - email, displayName, uid, company, numberOfColumns

/lends/{push_id}
  - name, quantity, date (string "DD-MM-YYYY HH:mm:ss")
  - from (uid), fromCompany
  - to (uid), toCompany
  - returned (bool)
  - returnedBy (uid | null)
  - deleted (bool)
  - deletedBy (uid | null)
  - comment (string con historial concatenado con \n)
```

### Helpers (src/helpers.js)

Capa de acceso a datos. Todas las operaciones Firebase viven aquí. API exportada:

| Función | Descripción |
|---|---|
| `getDataFromFirebase(cb, onErr, start, end, filterType)` | Suscripción en tiempo real a `/lends`. Filtra por fecha y estado en cliente. |
| `getUsersInFirebase(cb, onErr)` | Suscripción en tiempo real a `/users`. |
| `addNewItemToDatabase(item)` | Push nuevo préstamo. Formatea la fecha con moment antes de guardar. |
| `changeStateOfItemInDatabase(item, {uid, displayName, comment}, type)` | Cambia estado (`returned` o `deleted`) y appends al historial de `comment`. |
| `deleteItemFromDatabase(item)` | Soft delete (marca `deleted: true`). No borra nada. |
| `changeNumberOfColumnsInDatabase(n, user)` | Actualiza preferencia de columnas del usuario. |

> **Nota**: al final del archivo hay código comentado (implementación anterior). Es código muerto — ignorar.

### Flujo de datos en Home.js

```
mount
  └─ useEffect [uid, startDate, endDate, company, filterType]
       ├─ getUsersInFirebase → setUsers + actualiza UserContext con datos frescos del DB
       └─ getDataFromFirebase → filtra por fromCompany/toCompany → setReturnData / setBelongsData

Tabs:
  "Préstamos" → returnData (lends donde fromCompany === mi company)
  "Deudas"    → belongsData (lends donde toCompany === mi company)
```

---

## Modelo de estados de un préstamo

```
NUEVO (sin returnedBy, returned=undefined)
  │
  ├─ swipe derecho / "Marcar regresado" → returned=true, returnedBy=uid
  │     └─ se puede desmarcar → returned=false (toggles)
  │
  └─ swipe izquierdo / "Borrar" → deleted=true, deletedBy=uid
```

Los filtros (`filterType`) corresponden a estos estados:

| Key | Condición real |
|---|---|
| `notReturned` | No tiene `returnedBy`, no está deleted |
| `returned` | `returnedBy` existe && `returned === true` |
| `wasReturned` | `returnedBy` existe && `returned === false` (fue devuelto, luego desmarcado) |
| `deleted` | `deleted === true` && tiene `deletedBy` |

> **Advertencia**: la lógica de filtro en `helpers.js` tiene redundancia entre `notReturned` y `wasReturned` (misma condición). Revisar antes de tocar.

---

## Multi-tenancy

- Cada usuario tiene un campo `company` (string libre, asignado manualmente en el DB).
- Los préstamos se registran con `fromCompany` y `toCompany` (string, no FK).
- La separación "Préstamos / Deudas" se hace filtrando en cliente por estos campos.
- Un usuario sin company (`company === "null"`) es expulsado automáticamente del home tras 4 segundos.
- No existe pantalla de onboarding para usuarios nuevos — se les redirecciona al login sin explicación.

---

## UX Mobile vs Desktop

| Feature | Mobile | Desktop |
|---|---|---|
| Columns | 1 o 2 (configurable por usuario) | 4 fijas |
| Swipe to act | ✅ (react-swipeable-list) | ❌ (hay trailing/leading actions pero no se muestran) |
| Layout | Columna | Fila |
| Botón de columnas | ✅ visible en header | ❌ oculto |

El botón flotante (+) para agregar préstamo tiene clases CSS distintas por plataforma (`floating-button-mobile` vs `floating-button`).

---

## Componentes clave

| Componente | Archivo | Rol |
|---|---|---|
| `Home` | `pages/Home.js` (369 líneas) | Orquestador principal. Maneja toda la lógica de estado, filtros, confirmaciones y suscripciones. |
| `LendsList` | `components/Home/LendsList.js` (338 líneas) | Lista renderizada con Collapse + Swipeable. Incluye lógica de estado visual (íconos) y historial de cambios. Tiene ~80 líneas de código comentado (Card antiguo). |
| `AddLoanModal` | `components/Home/AddLoanModal.js` | Formulario de creación. Filtra usuarios por empresa. `toCompany` se sincroniza manualmente al form. |
| `HeaderApp` | `components/Home/HeaderApp.js` | Header con logout y toggle de columnas mobile. |
| `Filters` | `Filters.js` | TreeSelect multicheck para filtrar por estado. |
| `DateRangeFilter` | `components/DateRangeFilter.js` | RangePicker con botones Filtrar/Quitar. |
| `UserContext` | `UserContext.js` | Context + localStorage. Sin `useReducer`, estado simple con `useState`. |
| `Login` | `pages/Login.js` | Google OAuth popup. Si el usuario no existe en DB, lo registra con `company: "null"`. |

---

## === ANÁLISIS DE RIESGO ===

### Crítico

| Área | Archivo | Razón |
|---|---|---|
| ~~Lógica de autenticación y registro~~ ✅ Resuelto | `pages/Login.js:55–61` | ~~Al registrar un usuario nuevo, `setUser` usa `userPropsInRealtimeDB?.company` que es `undefined`.~~ **Tarea 0.A cerrada (2026-05-09):** ahora usa los literales `"null"` y `2`. Nota: el bug nunca era observable (Home.js:143 cubre `undefined`/`"null"`/`""` con un check generoso) — era inconsistencia DB↔Context, no UX rota. |
| ~~Guard de ruta inexistente~~ ✅ Resuelto | `App.js` + `src/components/PrivateRoute.js` | **Tarea 0.B cerrada (2026-05-09):** `<PrivateRoute>` envuelve `/lends`; URLs inválidas redirigen a `/`. Ver `docs/decisions/DECISION_AUTH_GUARD.md`. |
| Filtro de estados duplicado | `helpers.js:getDataFromFirebase` | `notReturned` y `wasReturned` tienen exactamente la misma condición (`returnedBy` existe && `returned === false`). El filtro no funciona correctamente para distinguirlos. |

### Alto

| Área | Archivo | Razón |
|---|---|---|
| `company` como string libre | DB `/users` | No hay enum ni validación. Si se escribe distinto (mayúsculas, espacios), los préstamos no matchean. Un typo rompe la multi-tenancy. |
| `Home.js` sobrerecargado | `pages/Home.js` | 369 líneas con lógica de suscripción, confirmaciones modales, swipe handlers, filtros y navegación. Viola SRP. Difícil de testear y mantener. |
| Historial de comentarios como string concatenado | `helpers.js:changeStateOfItemInDatabase` | El historial es `item.comment` con `\n` como separador. No es un array — no se puede iterar, ordenar ni paginar. Crece sin límite. |
| `moment.js` deprecado | Global | moment está en modo mantenimiento. La app lo usa para formatear fechas y en el DatePicker. Migrar a `dayjs` (que ya usa Ant Design internamente). |

### Medio

| Área | Archivo | Razón |
|---|---|---|
| `LendsList` con código muerto | `components/Home/LendsList.js:244–329` | ~85 líneas comentadas de la implementación con `Card` anterior. Aumenta el tamaño del archivo sin valor. |
| `toCompany` sincronización manual | `AddLoanModal.js:156–157` | `toCompany` se guarda en estado local Y en el form (`setFieldsValue`). Si hay un error en el `onChange`, queda desincronizado. |
| `console.log` en producción | `Login.js:28`, `Home.js:240`, `LogOutDropdown.js:22` | Hay `console.log` con datos de usuario que llegan a producción. |
| `let` implícito en modal | `Home.js:71` | `let comment = ""` dentro del `content` del Modal — muta una variable de closure. Funciona, pero es frágil si el modal se re-renderiza. |

### Bajo

| Área | Archivo | Razón |
|---|---|---|
| `visible` prop deprecated | `AddLoanModal.js:72` | Ant Design 5 cambió `visible` por `open` en `Modal`. Genera warning en consola. |
| `overlay` deprecated | `LogOutDropdown.js:42` | `Dropdown` con `overlay` está deprecado en Ant Design 5. Usar `menu` prop. |
| `TabPane` deprecated | `Home.js:335,340` | `Tabs.TabPane` está deprecado. Usar `items` prop en `Tabs`. |

---

## Deuda técnica

- `helpers.js` tiene ~60 líneas de código comentado al final (implementación antigua).
- `LendsList.js` tiene ~85 líneas de código comentado (Card antiguo).
- `console.log` en 3+ archivos que llegan a producción.
- `moment.js` en lugar de `dayjs`.
- 3 APIs deprecadas de Ant Design 5 generando warnings silenciosos.
- `company` como string libre sin validación ni enum → riesgo de datos corruptos.
- No hay tests de ningún tipo más allá del boilerplate de CRA (`App.test.js` vacío).

---

## Cobertura de tests

| Flow | Estado |
|---|---|
| Login con Google | ❌ Sin test |
| Registro de usuario nuevo | ❌ Sin test |
| Creación de préstamo | ❌ Sin test |
| Cambio de estado (devolver/borrar) | ❌ Sin test |
| Filtros por estado | ❌ Sin test (lógica duplicada no detectada) |
| Filtro por fecha | ❌ Sin test |
| Multi-tenancy (separación por company) | ❌ Sin test |
| `App.test.js` | ⚠️ Boilerplate CRA, no cubre nada del dominio |

---

## Recomendación de auditoría

**~~Prioridad 1 — Bug crítico inmediato~~ ✅ Resuelto (2026-05-09)**: ~~corregir el registro de usuarios nuevos en `Login.js:55–61`~~ — Tarea 0.A cerrada. El `setUser` ahora usa los literales `"null"` y `2` consistentes con el `set()`. Re-clasificación tras revisión: el bug **nunca fue observable** (el check de `Home.js:143` lo enmascaraba); era code smell + inconsistencia DB↔Context, no UX rota.

**~~Prioridad 2 — Guard de ruta~~ ✅ Resuelto (2026-05-09)**: ~~agregar un `PrivateRoute` wrapper en `App.js`~~ — Tarea 0.B cerrada. Ver `src/components/PrivateRoute.js` y `docs/decisions/DECISION_AUTH_GUARD.md`.

**Prioridad 3 — Filtro de estados**: revisar y corregir la lógica en `getDataFromFirebase` para `notReturned` vs `wasReturned`.

**Prioridad 4 — Limpieza de deuda**: eliminar código comentado, reemplazar APIs deprecadas de Ant Design 5, y eliminar `console.log` de producción.

**Cuando el proyecto crezca**: migrar historial de cambios de string a array de objetos en DB, añadir validación de `company` al registrar usuarios, y extraer lógica de `Home.js` a custom hooks.

---

## Documentación viva

- Backlog priorizado: [`docs/backlog/README.md`](docs/backlog/README.md)
- Análisis técnico detallado: [`docs/ANALISIS_TECNICO_DETALLADO.md`](docs/ANALISIS_TECNICO_DETALLADO.md)
- Small fixes priorizados: [`docs/ANALISIS_SMALL_FIXES.md`](docs/ANALISIS_SMALL_FIXES.md)
- Diagramas: [`docs/diagrams/`](docs/diagrams/)
