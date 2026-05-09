Tengo todo lo necesario. El bundle gzipped es 433 KB (muy alto). Procedo a generar el informe complementario completo en español.

---

# INFORME COMPLEMENTARIO ULTRA EXHAUSTIVO — `my-lends-pwa`

> Este informe **complementa** el análisis previo (secciones 1–14). Se centra en material no cubierto: walkthrough archivo por archivo, código real para fixes, reglas de seguridad implementables, métricas de bundle medidas, plan de tests con código ejecutable, plan de migración a Vite, refactor profundo de `Home.js`, sistema de diseño, modelo de datos y roadmap accionable.

---

## 15. Walkthrough Archivo por Archivo (DEEP DIVE)

A continuación, cada archivo de `src/` con propósito real, líneas problemáticas y refactor con snippet **ANTES → DESPUÉS** ejecutable.

---

### 15.1 `src/index.js` (23 líneas)

**Propósito real**: Bootstrap de la app. Crea el root de React 18, monta `<App/>` en `StrictMode`, y **explícitamente desregistra** el service worker (línea 18: `serviceWorkerRegistration.unregister()`).

**Líneas problemáticas**:
- **L18**: `serviceWorkerRegistration.unregister()` — **anula la PWA** pese a tener todo el aparataje Workbox y `manifest.json`. Esto es contradictorio con la naturaleza del proyecto.
- **L22**: `reportWebVitals()` se invoca **sin callback** → no reporta nada (el `if (onPerfEntry && onPerfEntry instanceof Function)` en L2 de `reportWebVitals.js` lo descarta silenciosamente).
- No hay `ErrorBoundary`. Cualquier excepción no capturada en árbol React rompe la pantalla en blanco.

**Refactor propuesto**:

```jsx
// ANTES (src/index.js)
serviceWorkerRegistration.unregister();
reportWebVitals();
```

```jsx
// DESPUÉS (src/index.js)
import { ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import { theme } from "./theme";
import ErrorBoundary from "./components/ErrorBoundary";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigProvider locale={esES} theme={theme}>
        <App />
      </ConfigProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Activar PWA en producción (clave: register, no unregister)
if (process.env.NODE_ENV === "production") {
  serviceWorkerRegistration.register({
    onUpdate: (registration) => {
      // Mostrar toast "Hay una nueva versión, recarga"
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    },
  });
}

// Web vitals: enviar a consola en dev, a analytics en prod
reportWebVitals(
  process.env.NODE_ENV === "production"
    ? (metric) => navigator.sendBeacon?.("/metrics", JSON.stringify(metric))
    : console.log
);
```

---

### 15.2 `src/App.js` (23 líneas)

**Propósito real**: Define las únicas dos rutas (`/` y `/lends`) y envuelve todo en `UserProvider`.

**Líneas problemáticas**:
- **L13–L16**: No hay ruta `*` (404). Cualquier URL inválida muestra pantalla en blanco.
- **L13–L16**: La ruta `/lends` **no protege auth**. Un usuario sin login puede entrar directamente vía URL (la "protección" actual depende de que `Home.js` haga `signOut` si `user.company` es nula, no si `user.uid` es nulo — bug C1 del análisis previo).
- **L11**: `<div className="App">` sin clase realmente definida (no hay `App.css` con estilos relevantes).

**Refactor propuesto**:

```jsx
// ANTES (src/App.js)
<Routes>
  <Route path="/" element={<Login />} />
  <Route path="/lends" element={<Home />} />
</Routes>
```

```jsx
// DESPUÉS (src/App.js)
import RequireAuth from "./components/RequireAuth";
import NotFound from "./pages/NotFound";

<Routes>
  <Route path="/" element={<Login />} />
  <Route
    path="/lends"
    element={
      <RequireAuth>
        <Home />
      </RequireAuth>
    }
  />
  <Route path="*" element={<NotFound />} />
</Routes>
```

```jsx
// NUEVO: src/components/RequireAuth.jsx
import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserContext } from "../UserContext";

export default function RequireAuth({ children }) {
  const { user } = useContext(UserContext);
  const location = useLocation();
  if (!user?.uid) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
}
```

---

### 15.3 `src/UserContext.js` (23 líneas)

**Propósito real**: Persistencia ingenua del usuario en `localStorage`. Cualquier mutación a `user` se sincroniza.

**Líneas problemáticas**:
- **L7–L12**: Lectura síncrona de `localStorage` en cada render inicial — OK pero sin validación de schema. Si alguien mete texto inválido, `JSON.parse` revienta sin try/catch.
- **L14–L16**: `useEffect` que escribe `JSON.stringify(user)` en cada cambio. Cuando `user` es `null` (logout), guarda literalmente la cadena `"null"` y queda inconsistente con el shape inicial.
- **No hay sincronización con `onAuthStateChanged` de Firebase** — el contexto puede quedar con un user cacheado mientras Firebase no lo reconoce. Bug C1 del análisis previo.
- **L4**: `createContext()` sin valor por defecto → consumidores fuera del provider explotan.

**Refactor propuesto**:

```jsx
// ANTES (líneas 7-12)
const [user, setUser] = useState(() => {
  const localData = localStorage.getItem("user");
  return localData
    ? JSON.parse(localData)
    : { uid: null, email: null, displayName: null, company: null };
});

useEffect(() => {
  localStorage.setItem("user", JSON.stringify(user));
}, [user]);
```

```jsx
// DESPUÉS (src/UserContext.jsx)
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, database } from "./firebase-config";

const STORAGE_KEY = "lends:user:v1";
const EMPTY_USER = Object.freeze({
  uid: null, email: null, displayName: null,
  company: null, numberOfColumns: 2,
});

export const UserContext = createContext({ user: EMPTY_USER, setUser: () => {} });

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.uid ? parsed : EMPTY_USER;
    } catch {
      return EMPTY_USER;
    }
  });

  // Persistir
  useEffect(() => {
    if (user?.uid) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // Sincronizar con Firebase Auth (única fuente de verdad)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(EMPTY_USER);
        return;
      }
      // Suscribir cambios de profile en RTDB
      const userRef = ref(database, `/users/${fbUser.uid}`);
      const unsubProfile = onValue(userRef, (snap) => {
        const profile = snap.val() ?? {};
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          company: profile.company ?? null,
          numberOfColumns: profile.numberOfColumns ?? 2,
        });
      });
      return () => unsubProfile();
    });
    return () => unsubAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
```

---

### 15.4 `src/firebase-config.js` (19 líneas)

**Propósito real**: Inicializa la SDK de Firebase y exporta `auth`, `database`.

**Líneas problemáticas**:
- **No hay validación** de variables `REACT_APP_FIREBASE_*`. Si alguna está vacía → `initializeApp` arranca pero las llamadas posteriores fallan con errores opacos.
- **No exporta tipos ni helpers**, lo que obliga a importar `ref`, `push`, `set` directos en cada archivo.
- **No hay separación dev/prod** ni emulator hookup (`connectAuthEmulator`, `connectDatabaseEmulator`).

**Refactor propuesto**:

```js
// ANTES
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  // ...
};
const app = initializeApp(firebaseConfig);
```

```js
// DESPUÉS (src/firebase-config.js)
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

const REQUIRED = [
  "REACT_APP_FIREBASE_API_KEY",
  "REACT_APP_FIREBASE_AUTH_DOMAIN",
  "REACT_APP_FIREBASE_PROJECT_ID",
  "REACT_APP_FIREBASE_DATABASE_URL",
  "REACT_APP_FIREBASE_APP_ID",
];
REQUIRED.forEach((k) => {
  if (!process.env[k]) {
    throw new Error(`[firebase-config] Variable ${k} no definida en .env`);
  }
});

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

if (process.env.REACT_APP_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectDatabaseEmulator(database, "127.0.0.1", 9000);
}

export default app;
```

---

### 15.5 `src/helpers.js` (304 líneas — gran parte comentado)

**Propósito real**: Capa de acceso a Firebase Realtime DB. Contiene CRUD de `lends` + `users` + filtros + cambio de estado + audit string.

**Líneas problemáticas (críticas)**:
- **L1–L235** activo + **L253–L304** comentado: dos versiones del mismo módulo conviven. Confusión total. Hay que **borrar las líneas 253–304**.
- **L25–L50 (`addNewItemToDatabase`)**:
  - **L29**: `newItem.date.format(...)` — asume que viene un `moment` siempre. Si el caller envía un Date u Dayjs, explota.
  - **L34–L46**: `message.success` con estilos inline duplicados en 4 funciones (DRY violado).
  - No retorna el `id` del nuevo lend → imposible "deshacer" inmediato.
- **L52–L127 (`getDataFromFirebase`)**:
  - **L82–L113**: lógica de filtros ENORME y duplicada con `Filters.js`. La condición de "wasReturned" en L97-98 es **idéntica** a "notReturned" en L94-95 (`returned === false`) → bug funcional: nunca diferencia uno del otro.
  - **L70–L80**: trae **TODO** `/lends` y filtra en cliente (no usa `orderByChild + equalTo`). Para una empresa de 500 préstamos esto descarga los 500.
  - **L117**: `lends.reverse()` en lugar de ordenar por `date` real → si la inserción no fue cronológica, queda mal.
- **L154–L178 (`deleteItemFromDatabase`)**:
  - **L155**: destructura `returned` y lo descarta del payload → si el item ya estaba "returned: true", al "borrar" pierde ese flag.
  - **L161**: `set(...)` sobrescribe TODO el nodo → race condition si dos usuarios actúan a la vez.
- **L180–L235 (`changeStateOfItemInDatabase`)**:
  - **L187**: parsea con `moment().format("HH:mm")` — sin fecha completa → si dos cambios ocurren en días distintos a la misma hora, el log es indistinguible.
  - **L191–L195**: `validateNewParrafo` trunca a 100 chars **después de prefijar el displayName y el emoji**, así que el comentario real útil del usuario puede quedar cortado a media palabra.
  - **L197–L199**: concatena strings al campo `comment` → **anti-patrón crítico**. No es un audit log: es texto. No se puede consultar, ni paginar, ni diferenciar eventos.
  - **L202–L215**: `switch` sin `default` real (solo `break`).
  - **L217**: `set(leadRef, {...itemUpdated})` otra vez sobrescritura completa.

**Refactor (extracto crítico)**:

```js
// ANTES (helpers.js L180-217)
export const changeStateOfItemInDatabase = async (item, { uid: responsibleUid, displayName, comment }, typeChange) => {
  const { id, returned, ...itemUpdated } = item;
  const leadRef = ref(database, `${LEADS_REF}/${id}`);
  const newParrafo = `(${moment().format("HH:mm")})${displayName}: ${comment.trim() || "✉️"}`;
  const validateNewParrafo = (c) => c.length > 100 ? c.substring(0,100) : c;
  const updatedComment = `${item.comment ? item.comment : ""} \n ${validateNewParrafo(newParrafo)}`;
  // switch...
  await set(leadRef, { ...itemUpdated });
};
```

```js
// DESPUÉS (src/services/lends.js)
import { ref, update, push, serverTimestamp } from "firebase/database";
import { database } from "../firebase-config";

const LENDS = "/lends";

const sanitizeComment = (raw) => (raw ?? "").trim().slice(0, 280);

/**
 * Cambia el estado de un préstamo (returned o deleted) usando update atómico
 * y agrega un evento al audit trail estructurado.
 */
export async function changeLendState(item, actor, typeChange) {
  const validTypes = ["returned", "deleted"];
  if (!validTypes.includes(typeChange)) {
    throw new Error(`changeLendState: tipo inválido ${typeChange}`);
  }
  if (!item?.id) throw new Error("changeLendState: item sin id");
  if (!actor?.uid) throw new Error("changeLendState: actor sin uid");

  const eventsRef = ref(database, `${LENDS}/${item.id}/events`);
  const eventKey = push(eventsRef).key;

  const updates = {};
  updates[`${LENDS}/${item.id}/events/${eventKey}`] = {
    type: typeChange,
    actorUid: actor.uid,
    actorName: actor.displayName ?? null,
    comment: sanitizeComment(actor.comment),
    timestamp: serverTimestamp(), // <-- usa hora de servidor, no cliente
  };

  if (typeChange === "returned") {
    updates[`${LENDS}/${item.id}/returned`] = !item.returned;
    updates[`${LENDS}/${item.id}/returnedBy`] = actor.uid;
    updates[`${LENDS}/${item.id}/returnedAt`] = serverTimestamp();
  } else if (typeChange === "deleted") {
    updates[`${LENDS}/${item.id}/deleted`] = true;
    updates[`${LENDS}/${item.id}/deletedBy`] = actor.uid;
    updates[`${LENDS}/${item.id}/deletedAt`] = serverTimestamp();
  }

  await update(ref(database), updates);
}
```

---

### 15.6 `src/helpers/index.js` (35 líneas)

**Propósito real**: 4 funciones casi idénticas para resolver `displayName` desde un array de users según el campo `to`, `from`, `returnedBy`, `deletedBy`.

**Líneas problemáticas**:
- **L1–L27**: 4 funciones que difieren solo en el campo. Patrón de duplicación textual.
- **L4, L11, L18, L25**: fallback `"Email no encontrado"` cuando justamente lo que faltó era el `displayName`, no el email — texto incorrecto.
- **Coexistencia con `helpers.js` en la raíz** → `helpers/index.js` y `helpers.js` se confunden mutuamente al importar (Node resuelve `./helpers` como `./helpers.js`, no como `./helpers/index.js`).

**Refactor propuesto**:

```js
// ANTES (35 líneas)
const findToUserName = (item, users) => users.find(({uid}) => uid === item.to)?.displayName || "Email no encontrado";
// ... (3 más casi iguales)
```

```js
// DESPUÉS (src/utils/users.js)
const FALLBACK = "Usuario desconocido";

/**
 * Resuelve displayName de un usuario por su uid.
 * @param {string|null|undefined} uid
 * @param {Array<{uid:string, displayName:string}>} users
 */
export function resolveUserName(uid, users) {
  if (!uid) return FALLBACK;
  return users.find((u) => u.uid === uid)?.displayName ?? FALLBACK;
}

// Helpers semánticos opcionales (azúcar)
export const getRecipientName = (item, users) => resolveUserName(item.to, users);
export const getLenderName = (item, users) => resolveUserName(item.from, users);
export const getReturnerName = (item, users) => resolveUserName(item.returnedBy, users);
export const getDeleterName = (item, users) => resolveUserName(item.deletedBy, users);
```

---

### 15.7 `src/Filters.js` (40 líneas)

**Propósito real**: Componente `TreeSelect` para filtrar lends por estado.

**Líneas problemáticas**:
- **Ubicación**: está en `src/Filters.js` y no en `src/components/Filters.js`. Inconsistencia con resto del árbol.
- **L19**: `value={Object.keys(filterType).filter(...)}` recalcula en cada render → `useMemo` ayudaría pero el array es chico.
- **L17**: `showSearch={false}` — no permite búsqueda, OK porque solo hay 4 opciones.
- **L27–L33**: textos hardcoded en español — sin i18n.
- No expone el contrato del shape `filterType` ni valida que las claves existan.

**Refactor propuesto**: mover a `src/components/Filters/StatusFilter.jsx` y extraer las opciones a una constante.

```jsx
// DESPUÉS (src/components/Filters/StatusFilter.jsx)
import { TreeSelect } from "antd";

const STATUS_OPTIONS = [
  { value: "notReturned", title: "No regresados" },
  { value: "returned",    title: "Regresados" },
  { value: "wasReturned", title: "Regresado anteriormente" },
  { value: "deleted",     title: "Eliminados" },
];

export default function StatusFilter({ value, onChange }) {
  const selected = STATUS_OPTIONS.filter((o) => value[o.value]).map((o) => o.value);

  const handleChange = (next) => {
    onChange(
      STATUS_OPTIONS.reduce((acc, o) => {
        acc[o.value] = next.includes(o.value);
        return acc;
      }, {})
    );
  };

  return (
    <TreeSelect
      style={{ width: "100%" }}
      value={selected}
      treeData={STATUS_OPTIONS}
      treeCheckable
      showCheckedStrategy={TreeSelect.SHOW_PARENT}
      placeholder="Estados para filtrar los préstamos"
      onChange={handleChange}
      allowClear
    />
  );
}
```

---

### 15.8 `src/components/DateRangeFilter.js` (50 líneas)

**Propósito real**: Selector de rango con dos botones (Filtrar / Quitar).

**Líneas problemáticas**:
- **L4**: `import { isMobile } from "react-device-detect"` importado pero **nunca usado** → warning ESLint.
- **L5**: `// import moment from "moment"` comentado, ruido.
- **L15**: `console.log("Por favor selecciona un rango de fechas válido")` en producción.
- **L10–L11**: `dateRange[0].startOf("day")` asume que viene un `moment` (porque AntD v5 ya migró a Day.js por defecto). Esto puede romperse silenciosamente.
- No valida `dateRange` antes de llamar `endOf` — si el caller pasa un array vacío, falla.

**Refactor propuesto**:

```jsx
// ANTES (L9-17)
const handleFilter = () => {
  if (dateRange[0] && dateRange[1]) {
    const start = dateRange[0].startOf("day").toDate();
    const end = dateRange[1].endOf("day").toDate();
    onFilter(start, end);
  } else {
    console.log("Por favor selecciona un rango de fechas válido");
  }
};
```

```jsx
// DESPUÉS
import { message } from "antd";

const handleFilter = () => {
  const [from, to] = dateRange ?? [];
  if (!from || !to) {
    message.warning("Selecciona un rango de fechas válido");
    return;
  }
  onFilter(from.startOf("day").toDate(), to.endOf("day").toDate());
};
```

Y eliminar L4 (`isMobile` sin uso) y L5 (comentario).

---

### 15.9 `src/components/IsLoadingScreen.js` (20 líneas)

**Propósito real**: Pantalla de carga full-viewport.

**Líneas problemáticas**:
- **L4**: `loading && (...)` — un componente que solo renderiza cuando se le pasa `loading=true` debería **no recibir esa prop**: el caller decide si renderizarlo. Patrón confuso.
- **L7–L11**: `height: "100vh"` — al estar dentro de la jerarquía de `<HeaderApp>`, suma 64+px y produce scroll.
- No declara `aria-live="polite"` para accesibilidad.

**Refactor propuesto**:

```jsx
// ANTES
const IsLoadingScreen = ({ loading }) =>
  loading && (<div style={{...height:"100vh"}}><Spin size="large"/></div>);

// {loading && <IsLoadingScreen loading={loading} />}  (uso confuso)
```

```jsx
// DESPUÉS (src/components/LoadingScreen.jsx)
import { Spin } from "antd";

export default function LoadingScreen({ tip = "Cargando..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "60vh",
        width: "100%",
      }}
    >
      <Spin size="large" tip={tip} />
    </div>
  );
}

// uso correcto: {loading ? <LoadingScreen /> : <Home />}
```

---

### 15.10 `src/components/Home/AddLoanModal.js` (179 líneas)

**Propósito real**: Modal para crear préstamo. Combina botón flotante + formulario AntD.

**Líneas problemáticas**:
- **L1–L9**: `Card`, `Spin`, `Divider`, `Tabs`, `Col`, `Row` no aparecen pero **no se importan tampoco** — OK. Pero `import { Button } from "antd"` (L7) está duplicado conceptualmente con la primera línea (Modal/Form/Input/etc.).
- **L20**: estado local `toCompany` que **nunca se lee** después de setearlo (L156). Solo se usa para `form.setFieldsValue`. Eliminar.
- **L23–L30**: `initialValues.from = auth.currentUser?.uid` se evalúa en el render del componente, no del modal — si el user aún no cargó, queda `undefined`.
- **L32–L37**: `filteredUsers` y `filteredUsersByCompany` recalculados cada render, sin `useMemo`.
- **L41**: `onCreate(values)` **no espera** la promesa — si Firebase falla, el modal ya se cerró.
- **L43–L44**: `setVisible(false)` antes de `form.resetFields()` — race UI.
- **L65**: `disabled={company === "null"}` — comparación a string literal `"null"` (workaround del bug histórico de guardar `"null"` en lugar de `null` en Login.js L51).
- **L73**: `visible={visible}` deprecated en antd v5 → debe ser `open={visible}` (de hecho AntD imprime warning en consola).
- **L80–L113**: tres campos `hidden` (`fromCompany`, `toCompany`, `date`, `from`) → si la app falla en `auth.currentUser`, el form crea un préstamo con `from: undefined` que va a Firebase → corrupción de datos.
- **L92**: `format="DD-MM-YYYY HH:mm:ss"` → guardar fechas como **string formateado** es el peor anti-patrón. Debería ser ISO 8601 o timestamp Unix.

**Refactor (parcial)**:

```jsx
// ANTES (L11-37)
const AddLoanModal = ({ visible, onCreate, setVisible, users, actualCompanyIs, company }) => {
  const [form] = Form.useForm();
  const [toCompany, setToCompany] = useState(""); // jamás se lee

  const initialValues = {
    date: moment(),
    from: auth.currentUser?.uid,
    fromCompany: actualCompanyIs,
    // ...
  };
  const filteredUsers = users.filter(({uid}) => uid !== auth?.currentUser?.uid);
  const filteredUsersByCompany = filteredUsers.filter(({company}) => company !== actualCompanyIs);
```

```jsx
// DESPUÉS
const AddLoanModal = ({ open, onCreate, onClose, users, fromCompany }) => {
  const { user } = useContext(UserContext);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const candidateUsers = useMemo(
    () =>
      users.filter(
        (u) => u.uid !== user?.uid && u.company !== fromCompany && u.company && u.company !== "null"
      ),
    [users, user?.uid, fromCompany]
  );

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onCreate({
        name: values.name.trim(),
        quantity: values.quantity,
        from: user.uid,
        fromCompany,
        to: values.to,
        toCompany: values.toCompany,
        createdAt: Date.now(), // timestamp ms, no string
      });
      form.resetFields();
      onClose();
    } catch (err) {
      // validateFields lanza si hay errores; otros errores son de Firebase
      if (err?.errorFields) return;
      message.error("No se pudo crear el préstamo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open} // <-- v5 API
      confirmLoading={submitting}
      title="Crear préstamo"
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
    >
      {/* Form sin campos hidden tramposos */}
    </Modal>
  );
};
```

---

### 15.11 `src/components/Home/HeaderApp.js` (77 líneas)

**Propósito real**: Header con logout + botón de cambio de columnas + título.

**Líneas problemáticas**:
- **L1**: importa `Tabs, Spin, Divider, Card` que nunca usa (excepto `Divider`).
- **L3**: `Header` viene de `antd/es/layout/layout` — import de ruta interna privada (frágil ante cambios de antd).
- **L31**: `{isMobile && (<Button .../>)}` — el botón solo aparece en mobile, pero la lógica de cambiar columnas afecta también a desktop.
- **L36–L38**: pasa `numberOfColumns` (current) al helper que hace el toggle binario `=== 2 ? 1 : 2` — si alguna vez se quiere `3` columnas, el toggle es restrictivo.
- **L57–L71**: `<Divider/>` envuelto en otro `<div>` con altura 55px solo para crear espacio — sustituir por `marginBottom`.
- **L52**: `<h1>Mis Préstamos</h1>` — h1 duplicado con `<Title>` de Login → confuso para lectores de pantalla.

**Refactor**:

```jsx
// ANTES
import { Tabs, Button, Col, Row, Spin, Divider, Card } from "antd";
import { Header } from "antd/es/layout/layout";
```

```jsx
// DESPUÉS
import { Button, Col, Row, Divider, Layout, Typography } from "antd";
const { Header } = Layout;
const { Title } = Typography;
// ... resto
<Title level={2} style={{ margin: 0 }}>Mis Préstamos</Title>
```

---

### 15.12 `src/components/Home/LendsList.js` (339 líneas)

**Propósito real**: Renderiza grid de cards swipe-eable con cada lend, su estado, comentarios y metadatos.

**Líneas problemáticas**:
- **L13–L15**: `moment.locale("es")` en el módulo (top-level) → side-effect global.
- **L26**: `const { Panel } = Collapse;` dentro del componente → recreado cada render (ínfimo, pero anti-patrón).
- **L31–L36**: `handleCollapseChange` reescribe el array `openKey` con AND/NOT operadores comma — no solo es feo, también pierde clic rápidos por race.
- **L38–L87 (`ItemStatus`)**: función dentro del componente, no memoizada. **Muy** anidada (4 niveles de if). Compara `item.returnedBy !== null` cuando puede no existir (`undefined`).
- **L89**: `<List>` con `dataSource={data}` sin `key` propia — se confía en el `key` interno de antd. Cuando muchos items, fricción.
- **L98**: `<SwipeableListItem key={id}>` dentro de `<SwipeableList>` que se recrea para **cada** item (un `<SwipeableList>` por item) — esto es un bug de uso: debe haber un solo `<SwipeableList>` envolviendo todos los `SwipeableListItem`. Con la implementación actual, no funciona el swipe de "siguiente" item.
- **L119**: color hardcoded `#ff7043` y `#1890ff`. Se repite 8 veces en el archivo.
- **L165**: `item.quantity.toString().trim()` — si `quantity` es number, `.toString().trim()` es redundante.
- **L192–L223**: array de objetos `{label, value}` definido inline en cada render — extraer.
- **L226–L240**: `item.comment?.split("\n")` — el `comment` es un string concatenado (anti-patrón ya visto), aquí se reparsea para mostrar "audit log". Frágil.
- **L244–L329**: 86 líneas de `<Card>` **comentadas**. Borrar.

**Refactor (extracto)**:

```jsx
// ANTES (L96-102) - SwipeableList por cada item
{data.map(item => (
  <SwipeableList fullSwipe>
    <SwipeableListItem key={item.id} ...>...</SwipeableListItem>
  </SwipeableList>
))}
```

```jsx
// DESPUÉS - 1 SwipeableList envolviendo TODOS los items
<SwipeableList fullSwipe type="IOS">
  {data.map(item => (
    <SwipeableListItem
      key={item.id}
      trailingActions={trailingActions(item)}
      leadingActions={leadingActions(item)}
    >
      <LendCard
        item={item}
        users={users}
        isOpen={openKey === item.id}
        onToggle={() => setOpenKey(prev => prev === item.id ? null : item.id)}
      />
    </SwipeableListItem>
  ))}
</SwipeableList>
```

Y extraer `<LendCard/>` y `<LendStatusIcon/>` como componentes propios.

---

### 15.13 `src/components/Home/LogOutDropdown.js` (51 líneas)

**Propósito real**: Botón con dropdown que ejecuta logout.

**Líneas problemáticas**:
- **L18**: `const { _, setUser } = useContext(UserContext)` — el `_` es un nombre de variable, no destructuring de "ignorado" en JS. Lint lo señala. Eliminar `_` o usar `const { setUser } = useContext(UserContext)`.
- **L23**: `console.log("User signed out successfully")` en producción.
- **L42**: `<Dropdown overlay={<Menu...>}>` — `overlay` está deprecado en antd v5; debe ser `menu={{ items, onClick }}`.
- **L25**: `setUser(null)` luego `navigate("/")` — race con `useEffect` del Login que ya habría redirigido.

**Refactor**:

```jsx
// ANTES
<Dropdown overlay={<Menu items={menuItems} onClick={handleMenuClick} />} trigger={["click"]}>
```

```jsx
// DESPUÉS
<Dropdown
  menu={{ items: menuItems, onClick: handleMenuClick }}
  trigger={["click"]}
>
  <Button size="large" type="primary" icon={<LogoutOutlined />} aria-label="Cerrar sesión" />
</Dropdown>
```

Y eliminar `console.log` + `_`.

---

### 15.14 `src/components/Home/NoCompanyAlert.js` (18 líneas)

**Propósito real**: Alerta cuando el user no pertenece a una compañía.

**Líneas problemáticas**:
- **L4**: `company === "null"` — string literal. Workaround del bug histórico (Login.js L51 escribe `"null"` literal en RTDB).
- El componente "renderiza solo si X" — antipatrón clásico. Debería renderizarse incondicional y el caller decide.

**Refactor**:

```jsx
// DESPUÉS
const NoCompanyAlert = () => (
  <Alert
    message="No perteneces a ninguna compañía"
    description="Solicita a tu compañía que te invite o crea una nueva."
    type="warning"
    showIcon
    action={<Button size="small" type="primary">Crear empresa</Button>}
  />
);
// uso: {!company && <NoCompanyAlert/>}
```

---

### 15.15 `src/pages/Home.js` (369 líneas) — ver sección 21 para refactor profundo

**Líneas problemáticas adicionales no cubiertas en 14**:
- **L37–L54**: 9 estados separados (`useState`) — candidato a `useReducer`.
- **L42–L43**: doble destructuring de `user` en líneas separadas, no idiomático.
- **L66**: `// deleteItemFromDatabase(item);` comentario de código muerto.
- **L130**: `console.log("El estado del item ha sido cambiado por", uid);` debug en prod.
- **L138**: `console.log("Operación cancelada.");` ídem.
- **L142–L163**: `useEffect` que hace **logout automático con `setTimeout(4000)`** si no hay company. Es Bug C2 del análisis previo. Sin cleanup → si el user navega antes del timeout, igual lo desloguea.
- **L156**: `await signOut(auth)` dentro de `setTimeout` callback async, sin manejar error.
- **L165–L256**: gigantesco `useEffect` con 5 dependencias. La función `loadData` está definida dentro y reasigna `unsubscribeLeads`/`unsubscribeUsers` que **el cleanup ya capturó por closure** — si `getDataFromFirebase` lanza síncronamente, `unsubscribe` queda como no-op y filtra suscripciones.
- **L307–L329**: 3 contenedores `<div style={{display:"flex"}}>` con misma config — JSX repetitivo.
- **L334**: `<Tabs>` + `TabPane` (deprecated en v5, usar `items`).

---

### 15.16 `src/service-worker.js` (73 líneas)

**Propósito real**: Service Worker Workbox custom (template CRA).

**Líneas problemáticas**:
- **No se usa** porque `index.js` L18 llama `unregister()`. Código muerto en runtime.
- **L46**: `process.env.PUBLIC_URL + '/index.html'` — funciona en CRA pero rompe al migrar a Vite (no existe `process.env.PUBLIC_URL`).
- **No cachea** llamadas a Firebase Realtime DB → lo cual es correcto (datos en tiempo real), pero no hay fallback offline ni queue de escrituras pendientes.
- **L51–L62**: cachea PNGs same-origin, pero el manifest.json y los íconos están en `/icons/*.png`. Si están en otro origen (CDN futuro), no funciona.

**Refactor sugerido**: cuando se active la PWA, agregar cache manual para los assets de antd (CSS pesado), un `BackgroundSync` para escrituras a `/lends`, y registrar `navigator.connection` para mostrar banner offline.

---

### 15.17 `src/serviceWorkerRegistration.js` (138 líneas)

**Propósito real**: Boilerplate CRA estándar.

**Líneas problemáticas**:
- Está OK como está pero **no se invoca `register()`** → ver 15.1.
- **L42**: `console.log('This web app is being served...')` en localhost.
- **L96**: `console.error('Error during service worker registration:', error)` no envía a monitoreo.

---

### 15.18 `src/reportWebVitals.js` (14 líneas)

**Propósito real**: Boilerplate CRA. Importa `web-vitals` lazily.

**Líneas problemáticas**:
- **L3**: usa API antigua (`getCLS`, `getFID`, `getFCP`, `getLCP`, `getTTFB`) — `web-vitals` v3+ usa `onCLS`, `onFID`, `onINP`, `onLCP`, `onTTFB`. El `package.json` declara `"web-vitals": "^2.1.4"` (versión vieja). Actualizar.
- No se invoca con callback en `index.js` → totalmente inútil.

---

## 16. Implementación Concreta de los Bugs Críticos (C1–C6)

> Recordatorio del análisis previo (mapeo): C1=auth desincronizada, C2=logout automático con setTimeout, C3=set() destructivo, C4=fechas como string, C5=comment como audit log, C6=reglas Firebase abiertas.

### C1 — Auth desincronizada (UserContext + Home)

**Código actual (`src/UserContext.js` L7–L16)**:
```jsx
const [user, setUser] = useState(() => {
  const localData = localStorage.getItem("user");
  return localData ? JSON.parse(localData) : { uid: null, ... };
});
useEffect(() => { localStorage.setItem("user", JSON.stringify(user)); }, [user]);
```

**Código corregido**: ver sección 15.3 (suscripción a `onAuthStateChanged` + `onValue` de RTDB como única fuente de verdad).

**Test (Jest + RTL)**:
```jsx
// src/__tests__/UserContext.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import { UserContext, UserProvider } from "../UserContext";
import { onAuthStateChanged } from "firebase/auth";
import { onValue } from "firebase/database";

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));
jest.mock("firebase/database", () => ({
  onValue: jest.fn(),
  ref: jest.fn(),
  getDatabase: jest.fn(),
}));

const Probe = () => {
  const { user } = React.useContext(UserContext);
  return <div data-testid="uid">{user?.uid ?? "anon"}</div>;
};

test("propaga uid cuando Firebase Auth emite usuario", async () => {
  let authCb;
  onAuthStateChanged.mockImplementation((_, cb) => { authCb = cb; return () => {}; });
  onValue.mockImplementation((_, cb) => { cb({ val: () => ({ company: "ACME" }) }); return () => {}; });

  render(<UserProvider><Probe /></UserProvider>);
  expect(screen.getByTestId("uid")).toHaveTextContent("anon");

  authCb({ uid: "u1", email: "e@x.com", displayName: "Foo" });
  await waitFor(() => expect(screen.getByTestId("uid")).toHaveTextContent("u1"));
});

test("limpia user cuando Firebase Auth emite null", async () => {
  let authCb;
  onAuthStateChanged.mockImplementation((_, cb) => { authCb = cb; return () => {}; });
  render(<UserProvider><Probe /></UserProvider>);
  authCb(null);
  await waitFor(() => expect(screen.getByTestId("uid")).toHaveTextContent("anon"));
});
```

**Validación manual**:
1. Login con cuenta A → ver `/lends` con datos de A.
2. Abrir DevTools → Application → Storage → eliminar entrada `lends:user:v1`.
3. Recargar. La pantalla debe redirigir a `/` (porque `onAuthStateChanged` rige).
4. En otra pestaña, hacer logout → la pestaña original debe redirigir a `/` automáticamente al recibir el evento.

---

### C2 — Logout automático con `setTimeout`

**Código actual (`src/pages/Home.js` L142–L163)**:
```jsx
useEffect(() => {
  if (!user?.company || user.company === "null" || user.company === "") {
    const getOut = () => {
      try {
        setTimeout(async () => {
          setUser(null);
          await signOut(auth);
          navigate("/");
        }, 4000);
      } catch (error) { console.error("Error signing out:", error); }
    };
    getOut();
    return;
  }
}, [user]);
```

**Código corregido**:
```jsx
// Reemplazar por: NO desloguear. Mostrar modal/CTA para asignar compañía.
useEffect(() => {
  if (!user?.uid) return;
  if (!user.company || user.company === "null") {
    // No expulsar. Bloquear acciones que requieran company.
    // <NoCompanyAlert/> ya está renderizado en el JSX.
    return;
  }
}, [user]);
```

Si la regla de negocio realmente exige expulsar:
```jsx
useEffect(() => {
  if (!user?.uid || user.company) return;
  let cancelled = false;
  const id = setTimeout(async () => {
    if (cancelled) return;
    await signOut(auth);
    navigate("/", { replace: true });
  }, 4000);
  return () => { cancelled = true; clearTimeout(id); };
}, [user?.uid, user?.company, navigate]);
```

**Test**:
```jsx
test("NO desloguea automáticamente cuando user no tiene company", async () => {
  jest.useFakeTimers();
  const navigate = jest.fn();
  // ... render Home con user sin company
  jest.advanceTimersByTime(10000);
  expect(signOut).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalledWith("/");
  jest.useRealTimers();
});
```

**Validación manual**: crear usuario nuevo, no asignar company → verificar que NO te expulsa a los 4 s; en cambio, ves alerta y CTA.

---

### C3 — `set()` destructivo en cambio de estado

**Código actual (`src/helpers.js` L154–L178 y L180–L235)**:
```js
const { id, returned, ...itemUpdated } = item;
const leadRef = ref(database, `${LEADS_REF}/${id}`);
// ...
await set(leadRef, { ...itemUpdated });
```

**Código corregido**: usar `update()` con paths atómicos (ver sección 15.5 código completo de `changeLendState`).

**Test**:
```js
// src/services/__tests__/lends.test.js
import { update, push, ref } from "firebase/database";
import { changeLendState } from "../lends";

jest.mock("firebase/database");

test("changeLendState (returned) usa update atómico, no set", async () => {
  push.mockReturnValue({ key: "evt-1" });
  ref.mockImplementation((_, p) => ({ path: p }));

  await changeLendState(
    { id: "lend-1", returned: false },
    { uid: "u1", displayName: "Foo", comment: "ok" },
    "returned"
  );
  expect(update).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      "/lends/lend-1/returned": true,
      "/lends/lend-1/returnedBy": "u1",
      "/lends/lend-1/events/evt-1": expect.objectContaining({ type: "returned" }),
    })
  );
});

test("changeLendState lanza si type es inválido", async () => {
  await expect(
    changeLendState({ id: "x" }, { uid: "u1" }, "foo")
  ).rejects.toThrow("tipo inválido foo");
});
```

**Validación manual**:
1. Crear préstamo → marcar como returned con comentario "primero".
2. En otra pestaña/usuario, casi simultáneamente marcar como deleted con comentario "segundo".
3. Verificar en Firebase Console que el préstamo conserva ambos eventos en `/lends/{id}/events/`.

---

### C4 — Fechas como string

**Código actual (`src/helpers.js` L29)**:
```js
date: newItem.date.format("DD-MM-YYYY HH:mm:ss"),
```

**Código corregido**:
```js
// helpers.js → addNewItemToDatabase
import { serverTimestamp } from "firebase/database";

const itemToAdd = {
  ...newItem,
  date: undefined,             // eliminar campo legacy
  createdAt: serverTimestamp() // ms epoch desde el servidor
};
delete itemToAdd.date;
```

Y en `LendsList.js`, donde se lee:
```jsx
// ANTES
{ label: "Fecha de préstamo:", value: moment(item.date, "DD-MM").format("DD/MMMM") },
{ label: "Hora de préstamo:", value: moment(item.date, "DD-MM-YYYY HH:mm:ss").format("HH:mm") },
```
```jsx
// DESPUÉS
import dayjs from "dayjs";
const created = dayjs(item.createdAt ?? item.date); // fallback durante migración
{ label: "Fecha:", value: created.format("DD/MM/YYYY") },
{ label: "Hora:", value: created.format("HH:mm") },
```

**Test**:
```js
test("addNewItemToDatabase guarda createdAt como serverTimestamp", async () => {
  await addNewItemToDatabase({ name: "X", quantity: 1, from: "u1", to: "u2", fromCompany: "A", toCompany: "B" });
  expect(push).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ createdAt: expect.any(Object) })
  );
  // serverTimestamp() retorna {".sv": "timestamp"} — chequear esa shape
});
```

**Validación manual**: crear préstamo con dispositivo cuya hora de sistema esté adelantada 2 horas → en Firebase Console el `createdAt` debe ser un número (ms) que al convertir refleje hora de servidor, no del dispositivo.

---

### C5 — Comment como audit log de string

Ya cubierto en 15.5 (`changeLendState` con `events/{key}`). El test en C3 valida que `events` se escribe; el manual:

**Validación manual**: ejecutar 3 cambios sobre un mismo préstamo (returned → not returned → returned). En Firebase Console `/lends/{id}/events/` deben aparecer 3 nodos con timestamps server-side y separados por tipo.

---

### C6 — Reglas Firebase abiertas

Ver sección 17 completa.

---

## 17. Reglas Firebase Realtime Database — Implementación completa

Archivo: `firebase/database.rules.json` (a crear en raíz del repo, junto con `firebase.json` para deploy).

```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "users": {
      ".read": "auth != null",
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid",
        ".validate": "newData.hasChildren(['email','displayName','uid'])",
        "uid": {
          ".validate": "newData.isString() && newData.val() == $uid"
        },
        "email": {
          ".validate": "newData.isString() && newData.val().matches(/^[^@]+@[^@]+\\.[^@]+$/)"
        },
        "displayName": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 80"
        },
        "company": {
          ".validate": "newData.isString() || newData.val() == null"
        },
        "numberOfColumns": {
          ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 4"
        },
        "$other": { ".validate": false }
      }
    },

    "companies": {
      ".read": "auth != null",
      "$companyId": {
        ".write": "auth != null && (
          !data.exists() ||
          data.child('ownerUid').val() == auth.uid
        )",
        ".validate": "newData.hasChildren(['name','ownerUid','createdAt'])",
        "name": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 80" },
        "ownerUid": { ".validate": "newData.isString()" },
        "createdAt": { ".validate": "newData.isNumber()" },
        "$other": { ".validate": false }
      }
    },

    "memberships": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        "$companyId": {
          ".write": "auth != null && (auth.uid == $uid || root.child('companies/'+$companyId+'/ownerUid').val() == auth.uid)",
          ".validate": "newData.hasChildren(['role','joinedAt'])",
          "role": { ".validate": "newData.isString() && (newData.val() == 'admin' || newData.val() == 'member')" },
          "joinedAt": { ".validate": "newData.isNumber()" }
        }
      }
    },

    "lends": {
      ".read": "auth != null",
      ".indexOn": ["fromCompany", "toCompany", "from", "to", "createdAt", "deleted", "returned"],

      "$lendId": {
        ".write": "auth != null && (
          (!data.exists() && newData.child('from').val() == auth.uid) ||
          (data.exists() && (
            root.child('users/'+auth.uid+'/company').val() == data.child('fromCompany').val() ||
            root.child('users/'+auth.uid+'/company').val() == data.child('toCompany').val()
          ))
        )",

        ".validate": "newData.hasChildren(['name','quantity','from','to','fromCompany','toCompany','createdAt'])",

        "name": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 120" },
        "quantity": { ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 10000" },
        "from": { ".validate": "newData.isString() && root.child('users/'+newData.val()).exists()" },
        "to": { ".validate": "newData.isString() && root.child('users/'+newData.val()).exists()" },
        "fromCompany": { ".validate": "newData.isString() && newData.val().length > 0" },
        "toCompany": { ".validate": "newData.isString() && newData.val().length > 0" },
        "createdAt": { ".validate": "newData.isNumber() || newData.hasChild('.sv')" },

        "returned":   { ".validate": "newData.isBoolean()" },
        "returnedBy": { ".validate": "newData.isString() && root.child('users/'+newData.val()).exists()" },
        "returnedAt": { ".validate": "newData.isNumber() || newData.hasChild('.sv')" },

        "deleted":   { ".validate": "newData.isBoolean()" },
        "deletedBy": { ".validate": "newData.isString() && root.child('users/'+newData.val()).exists()" },
        "deletedAt": { ".validate": "newData.isNumber() || newData.hasChild('.sv')" },

        "events": {
          "$eventId": {
            ".validate": "newData.hasChildren(['type','actorUid','timestamp'])",
            "type":      { ".validate": "newData.val() == 'returned' || newData.val() == 'deleted' || newData.val() == 'created' || newData.val() == 'commented'" },
            "actorUid":  { ".validate": "newData.isString() && newData.val() == auth.uid" },
            "actorName": { ".validate": "newData.isString() && newData.val().length <= 80" },
            "comment":   { ".validate": "newData.isString() && newData.val().length <= 280" },
            "timestamp": { ".validate": "newData.hasChild('.sv') || newData.isNumber()" },
            "$other":    { ".validate": false }
          }
        },

        "$other": { ".validate": false }
      }
    }
  }
}
```

`firebase.json` (raíz):
```json
{
  "database": {
    "rules": "firebase/database.rules.json"
  },
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "/service-worker.js",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      }
    ]
  }
}
```

**Despliegue**: `firebase deploy --only database,hosting`.

---

## 18. Análisis de Bundle y Performance (medido)

### 18.1 Tamaño bundle real (medido en build/)

| Asset | Bytes | Gzip estimado |
|---|---|---|
| `static/js/main.c768920c.js` | **1,4 MB** | **433 KB** (medido con `gzip -c`) |
| `static/js/453.5b640c3a.chunk.js` | 8 KB | ~3 KB |
| `static/css/main.0b4c7ced.css` | 4,2 KB | ~1,3 KB |
| **Total JS gzip** | — | **~436 KB** |

### 18.2 Composición estimada del bundle

| Lib | % aprox | KB gzip |
|---|---|---|
| `antd` (importado en barril completo) | 50% | ~218 KB |
| `firebase` (auth + database) | 18% | ~78 KB |
| `moment` (con todos los locales) | 14% | ~61 KB |
| `react` + `react-dom` | 8% | ~35 KB |
| `react-router-dom` | 3% | ~13 KB |
| `react-swipeable-list` + `react-swipeable` | 2% | ~9 KB |
| `react-device-detect` | 1% | ~4 KB |
| Workbox (no hace bundle si SW está deshabilitado) | 0% | 0 |
| Aplicación propia | 4% | ~18 KB |

### 18.3 Lighthouse esperado (mobile, 4G simulado)

| Métrica | Estimado actual | Objetivo |
|---|---|---|
| Performance | **35–55** | > 80 |
| FCP | 2.8–3.5 s | < 1.8 s |
| LCP | 4.0–5.5 s | < 2.5 s |
| TBT | 600–900 ms | < 200 ms |
| CLS | 0.05 | < 0.1 (OK) |
| PWA | **30/100** (falla porque SW está unregister) | > 90 |

Razones del score bajo:
- 1.4 MB JS sin code-splitting de rutas.
- Moment con todos los locales (incluye zh, ja, ko, ar...).
- Antd importado completo, no por componente.
- Sin SW activo → no hay precache de revisita.
- Sin `<link rel="preconnect">` para `*.firebaseio.com` y `accounts.google.com`.

### 18.4 Quick wins (orden de impacto)

| Acción | Reducción gzip | Esfuerzo |
|---|---|---|
| Activar SW (ya está implementado) | 0 KB pero **3x revisitas** | 5 min |
| Eliminar moment → dayjs | -55 KB | 2 h |
| Lazy-load `AddLoanModal` y `Modal.confirm` | -25 KB inicial | 1 h |
| `React.lazy` rutas (`/lends`) | -150 KB inicial | 1 h |
| `babel-plugin-import` para antd (CRA) o ESM tree-shake con Vite | -80 KB | 4 h en CRA, 1 h en Vite |
| Eliminar `react-device-detect` (usar `window.matchMedia`) | -4 KB | 30 min |
| Eliminar `workbox-google-analytics`, `workbox-streams`, `workbox-range-requests` no usados | -8 KB | 15 min |
| **Total** | **-247 KB** (~57% reducción) | ~9 h |

### 18.5 Code splitting recomendado

```js
// src/App.js
import { lazy, Suspense } from "react";
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));

<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/lends" element={<RequireAuth><Home/></RequireAuth>} />
    <Route path="*" element={<NotFound/>} />
  </Routes>
</Suspense>
```

```js
// src/pages/Home.js — lazy load del modal
const AddLoanModal = lazy(() => import("../components/Home/AddLoanModal"));
// ...
{visible && <Suspense fallback={null}><AddLoanModal .../></Suspense>}
```

---

## 19. Plan de Tests — implementación detallada

### 19.1 Estructura propuesta

```
src/
├── __tests__/
│   ├── App.test.jsx
│   ├── UserContext.test.jsx
│   └── integration/
│       └── Home.flow.test.jsx
├── services/
│   └── __tests__/
│       └── lends.test.js
├── components/
│   └── __tests__/
│       └── Filters.test.jsx
├── pages/
│   └── __tests__/
│       └── Login.test.jsx
└── __mocks__/
    └── firebase/
        ├── app.js
        ├── auth.js
        └── database.js
e2e/
├── playwright.config.ts
└── tests/
    └── lend-flow.spec.ts
```

### 19.2 Mock Firebase (`src/__mocks__/firebase/database.js`)

```js
// src/__mocks__/firebase/database.js
const _state = { listeners: new Map() };

export const getDatabase = jest.fn(() => ({}));
export const ref = jest.fn((db, path) => ({ _path: path }));
export const push = jest.fn((r) => ({ key: `mock-${Date.now()}` }));
export const set = jest.fn(() => Promise.resolve());
export const update = jest.fn(() => Promise.resolve());
export const remove = jest.fn(() => Promise.resolve());
export const get = jest.fn(() => Promise.resolve({ exists: () => false, val: () => null }));
export const onValue = jest.fn((r, cb) => {
  const id = `${r._path}-${Math.random()}`;
  _state.listeners.set(id, cb);
  // emisión inicial vacía
  cb({ val: () => null });
  return () => _state.listeners.delete(id);
});
export const query = jest.fn((r) => r);
export const serverTimestamp = jest.fn(() => ({ ".sv": "timestamp" }));

// helper para tests: emitir un valor en una ruta
export const __emit = (path, value) => {
  _state.listeners.forEach((cb, id) => {
    if (id.startsWith(path)) cb({ val: () => value });
  });
};
export const __reset = () => {
  _state.listeners.clear();
  [push, set, update, remove, get, onValue].forEach((fn) => fn.mockClear());
};
```

### 19.3 Tests unitarios de `helpers.js` (5 completos)

```js
// src/services/__tests__/lends.test.js
import { addNewItemToDatabase, deleteItemFromDatabase, changeLendState, getDataFromFirebase } from "../lends";
import * as fbdb from "firebase/database";
import { __emit, __reset } from "firebase/database";

jest.mock("firebase/database");
jest.mock("../firebase-config", () => ({ database: {} }));
jest.mock("antd", () => ({ message: { success: jest.fn(), error: jest.fn() } }));

beforeEach(() => __reset());

// --- TEST 1: addNewItemToDatabase ---
test("addNewItemToDatabase llama push con createdAt como serverTimestamp", async () => {
  fbdb.push.mockReturnValue({ key: "abc" });
  await addNewItemToDatabase({ name: "Taladro", quantity: 1, from: "u1", to: "u2", fromCompany: "A", toCompany: "B" });
  expect(fbdb.push).toHaveBeenCalledWith(
    expect.objectContaining({ _path: "/lends" }),
    expect.objectContaining({
      name: "Taladro",
      quantity: 1,
      from: "u1",
      to: "u2",
      fromCompany: "A",
      toCompany: "B",
      createdAt: { ".sv": "timestamp" }
    })
  );
});

// --- TEST 2: changeLendState (returned) ---
test("changeLendState (returned) hace update atómico de returned + evento", async () => {
  fbdb.push.mockReturnValue({ key: "evt-1" });
  await changeLendState(
    { id: "L1", returned: false },
    { uid: "u1", displayName: "Foo", comment: "ok" },
    "returned"
  );
  expect(fbdb.update).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      "/lends/L1/returned": true,
      "/lends/L1/returnedBy": "u1",
      "/lends/L1/events/evt-1": expect.objectContaining({
        type: "returned",
        actorUid: "u1",
        comment: "ok"
      })
    })
  );
});

// --- TEST 3: changeLendState (deleted) ---
test("changeLendState (deleted) marca deleted=true sin tocar returned", async () => {
  fbdb.push.mockReturnValue({ key: "evt-2" });
  await changeLendState(
    { id: "L1", returned: true },
    { uid: "u1", displayName: "Foo", comment: "" },
    "deleted"
  );
  const call = fbdb.update.mock.calls[0][1];
  expect(call["/lends/L1/deleted"]).toBe(true);
  expect(call["/lends/L1/deletedBy"]).toBe("u1");
  expect(call["/lends/L1/returned"]).toBeUndefined();
});

// --- TEST 4: getDataFromFirebase aplica filtro de fechas ---
test("getDataFromFirebase descarta items fuera del rango", () => {
  const cb = jest.fn();
  const start = new Date("2025-01-01");
  const end = new Date("2025-01-31");
  fbdb.onValue.mockImplementation((r, callback) => {
    callback({ val: () => ({
      L1: { name: "A", createdAt: new Date("2025-01-15").getTime() },
      L2: { name: "B", createdAt: new Date("2024-12-30").getTime() }
    }) });
    return () => {};
  });
  getDataFromFirebase(cb, jest.fn(), start, end, {});
  expect(cb).toHaveBeenCalledWith([
    expect.objectContaining({ id: "L1", name: "A" })
  ]);
});

// --- TEST 5: deleteItemFromDatabase usa update soft-delete ---
test("deleteItemFromDatabase setea deleted=true sin perder otros campos", async () => {
  await deleteItemFromDatabase({ id: "L1", name: "X", returned: true, fromCompany: "A" });
  expect(fbdb.update).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ "/lends/L1/deleted": true })
  );
  // No debería sobreescribir returned o name
  const payload = fbdb.update.mock.calls[0][1];
  expect(payload["/lends/L1/name"]).toBeUndefined();
  expect(payload["/lends/L1/returned"]).toBeUndefined();
});
```

### 19.4 Test de componente `Login.js`

```jsx
// src/pages/__tests__/Login.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { get, set } from "firebase/database";
import Login from "../Login";
import { UserProvider } from "../../UserContext";

jest.mock("firebase/auth");
jest.mock("firebase/database");
jest.mock("../../firebase-config", () => ({ auth: {}, database: {} }));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <UserProvider>
        <Login />
      </UserProvider>
    </MemoryRouter>
  );

test("usuario nuevo: signInWithPopup → set en /users/{uid}", async () => {
  signInWithPopup.mockResolvedValue({
    user: { uid: "u-new", email: "n@x.com", displayName: "Nuevo" }
  });
  get.mockResolvedValue({ exists: () => false, val: () => null });
  set.mockResolvedValue();

  renderLogin();
  fireEvent.click(screen.getByRole("button", { name: /Iniciar sesión/i }));

  await waitFor(() => {
    expect(set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: "u-new",
        email: "n@x.com",
        displayName: "Nuevo",
        company: null
      })
    );
  });
});

test("usuario existente: NO llama set, propaga company desde RTDB", async () => {
  signInWithPopup.mockResolvedValue({
    user: { uid: "u-old", email: "o@x.com", displayName: "Viejo" }
  });
  get.mockResolvedValue({
    exists: () => true,
    val: () => ({ company: "ACME", numberOfColumns: 1 })
  });

  renderLogin();
  fireEvent.click(screen.getByRole("button", { name: /Iniciar sesión/i }));

  await waitFor(() => expect(get).toHaveBeenCalled());
  expect(set).not.toHaveBeenCalled();
});
```

### 19.5 Test de integración `Home.js`

```jsx
// src/__tests__/integration/Home.flow.test.jsx
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UserContext } from "../../UserContext";
import Home from "../../pages/Home";
import { __emit } from "firebase/database";

jest.mock("firebase/database");
jest.mock("firebase/auth");
jest.mock("../../firebase-config", () => ({ auth: { currentUser: { uid: "me" } }, database: {} }));

const renderHome = (userOverride = {}) => {
  const ctxValue = {
    user: { uid: "me", email: "me@x.com", displayName: "Me", company: "ACME", numberOfColumns: 2, ...userOverride },
    setUser: jest.fn(),
  };
  return render(
    <MemoryRouter>
      <UserContext.Provider value={ctxValue}>
        <Home />
      </UserContext.Provider>
    </MemoryRouter>
  );
};

test("cambio de tab: muestra deudas en lugar de préstamos", async () => {
  renderHome();
  __emit("/users", { me: { uid: "me", company: "ACME", displayName: "Me" }, otro: { uid: "otro", company: "OTROCO", displayName: "Otro" } });
  __emit("/lends", {
    L1: { name: "MiPrestamo", quantity: 1, fromCompany: "ACME", toCompany: "OTROCO", from: "me", to: "otro", createdAt: Date.now() },
    L2: { name: "MiDeuda", quantity: 2, fromCompany: "OTROCO", toCompany: "ACME", from: "otro", to: "me", createdAt: Date.now() },
  });

  await screen.findByText("MiPrestamo");
  expect(screen.queryByText("MiDeuda")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("tab", { name: /Deudas/i }));
  await screen.findByText("MiDeuda");
  expect(screen.queryByText("MiPrestamo")).not.toBeInTheDocument();
});

test("filtro 'Eliminados': oculta los activos y muestra los borrados", async () => {
  renderHome();
  __emit("/lends", {
    L1: { name: "Activo", fromCompany: "ACME", toCompany: "X", quantity: 1, from: "me", to: "otro", createdAt: Date.now() },
    L2: { name: "Borrado", fromCompany: "ACME", toCompany: "X", quantity: 1, from: "me", to: "otro", deleted: true, deletedBy: "me", createdAt: Date.now() },
  });
  await screen.findByText("Activo");

  // Abrir TreeSelect y marcar "Eliminados"
  fireEvent.mouseDown(screen.getByPlaceholderText(/Estados/i));
  fireEvent.click(await screen.findByText("Eliminados"));

  await screen.findByText("Borrado");
  expect(screen.queryByText("Activo")).not.toBeInTheDocument();
});
```

### 19.6 Test E2E con Playwright

```ts
// e2e/playwright.config.ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  webServer: { command: "npm run start", port: 3000, reuseExistingServer: !process.env.CI }
});
```

```ts
// e2e/tests/lend-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Flujo crear → marcar devuelto", () => {
  test.beforeEach(async ({ page }) => {
    // Inyectar credenciales mock vía emulador o cookie de auth
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.setItem("lends:user:v1", JSON.stringify({
        uid: "u-test",
        email: "test@e2e.com",
        displayName: "E2E User",
        company: "ACME-TEST",
        numberOfColumns: 2
      }));
    });
    await page.goto("/lends");
  });

  test("crea préstamo y luego lo marca como devuelto", async ({ page }) => {
    // 1. Abrir modal
    await page.getByRole("button", { name: /\+/ }).click();

    // 2. Llenar formulario
    await page.getByLabel("Nombre del artículo").fill("Taladro Bosch E2E");
    await page.getByLabel("Cantidad").fill("1");
    await page.getByLabel(/Para/).click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Agregar" }).click();

    // 3. Verificar aparición en la lista
    await expect(page.getByText("Taladro Bosch E2E")).toBeVisible({ timeout: 5000 });

    // 4. Marcar como devuelto (swipe simulado: invocar acción directa)
    const item = page.locator("text=Taladro Bosch E2E").locator("..").locator("..");
    await item.dispatchEvent("touchstart", { touches: [{ clientX: 0, clientY: 0 }] });
    await item.dispatchEvent("touchmove", { touches: [{ clientX: 200, clientY: 0 }] });
    await item.dispatchEvent("touchend");
    await page.getByText("Marcar como regresado").click();
    await page.getByRole("button", { name: "Confirmar" }).click();

    // 5. Verificar ícono de devuelto
    await expect(item.locator(".anticon-check-circle")).toHaveCSS("color", "rgb(255, 112, 67)");
  });
});
```

---

## 20. Migración CRA → Vite — Plan paso a paso

### 20.1 Comandos secuenciales

```bash
# 1. Backup
git checkout -b feat/migrate-vite

# 2. Desinstalar CRA
npm uninstall react-scripts

# 3. Instalar Vite + plugins
npm install -D vite @vitejs/plugin-react vite-plugin-pwa vitest @vitest/ui jsdom @testing-library/jest-dom

# 4. Reemplazar moment por dayjs
npm uninstall moment
npm install dayjs

# 5. Reemplazar react-device-detect (opcional)
npm uninstall react-device-detect
```

### 20.2 `index.html` en raíz (mover desde `public/`)

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/icons/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#000000" />
    <link rel="apple-touch-icon" href="/icons/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>Lends</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/index.jsx"></script>
  </body>
</html>
```

### 20.3 `vite.config.js`

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/**/*"],
      manifest: {
        name: "Lends - Gestiona tus préstamos",
        short_name: "Lends",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/logo192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/logo512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable_icon_x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*$/,
            handler: "NetworkOnly" // datos en tiempo real, nunca cachear
          }
        ]
      }
    })
  ],
  server: { port: 3000 },
  build: {
    outDir: "build",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":   ["react", "react-dom", "react-router-dom"],
          "vendor-firebase":["firebase/app","firebase/auth","firebase/database"],
          "vendor-antd":    ["antd","@ant-design/icons"]
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    globals: true
  }
});
```

### 20.4 Variables de entorno

```bash
# .env (antes)
REACT_APP_FIREBASE_API_KEY=xxx

# .env (después)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_DATABASE_URL=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### 20.5 `firebase-config.js` migrado

```js
// src/firebase-config.js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### 20.6 Service worker

Eliminar `src/service-worker.js` y `src/serviceWorkerRegistration.js`. `vite-plugin-pwa` los regenera. En `index.jsx`:
```js
import { registerSW } from "virtual:pwa-register";
if (import.meta.env.PROD) registerSW({ immediate: true });
```

### 20.7 Lista exhaustiva de archivos a tocar

| Archivo | Cambio |
|---|---|
| `package.json` | scripts: `start` → `vite`, `build` → `vite build`, `test` → `vitest` |
| `index.html` | mover de `public/` a raíz, reemplazar `%PUBLIC_URL%` por `/` |
| `vite.config.js` | crear |
| `.env*` | renombrar `REACT_APP_*` → `VITE_*` |
| `src/firebase-config.js` | `process.env` → `import.meta.env` |
| `src/index.js` → `src/index.jsx` | renombrar (Vite exige `.jsx` para JSX) |
| `src/App.js` → `src/App.jsx` | renombrar |
| Todos los `.js` con JSX | renombrar a `.jsx` |
| `src/service-worker.js` | borrar |
| `src/serviceWorkerRegistration.js` | borrar |
| `src/setupTests.js` | reemplazar `@testing-library/jest-dom` por `@testing-library/jest-dom/vitest` |
| Tests `.test.js` | jest → vitest (`jest.fn` → `vi.fn`, `jest.mock` → `vi.mock`) |
| `src/reportWebVitals.js` | actualizar a `web-vitals@^4` (`onCLS`, `onINP`, etc.) |

### 20.8 Riesgos esperados

| Riesgo | Mitigación |
|---|---|
| Imports relativos rotos por extensión | Configurar `resolve.extensions: ['.js','.jsx','.ts','.tsx']` o renombrar todo |
| `process.env.PUBLIC_URL` en `service-worker.js` | Eliminado al usar `vite-plugin-pwa` |
| `babel-plugin-import` para antd no funciona | Vite ya hace tree-shake nativo para antd v5 ESM — innecesario |
| Tests jest no migran 1:1 a vitest | API casi idéntica, pero `jest.useFakeTimers` → `vi.useFakeTimers()` |
| Workbox manual perdido | `vite-plugin-pwa` cubre 95% del caso de uso |
| `react-device-detect` SSR-checks rompen | Reemplazar por hook `useMediaQuery` propio |
| HMR para CSS-in-JS de antd | Funciona out-of-the-box en Vite |

---

## 21. Refactor Profundo `Home.js` (369 → ~80 líneas)

### 21.1 Estructura propuesta

```
src/pages/Home/
├── Home.jsx                    # 80 líneas
├── constants.js                # estados iniciales, opciones
├── hooks/
│   ├── useLends.js             # suscripción /lends + filtros
│   ├── useUsers.js             # suscripción /users
│   └── useExpulsionTimer.js    # (opcional, ver C2)
├── components/
│   ├── HomeTabs.jsx
│   ├── HomeFilters.jsx
│   └── ChangeStateModal.jsx
```

### 21.2 `constants.js`

```js
export const INITIAL_FILTER = Object.freeze({
  notReturned: true,
  returned: true,
  wasReturned: true,
  deleted: false,
});
export const TAB_KEYS = { LENDS: "lends", DEBTS: "debts" };
```

### 21.3 `hooks/useLends.js`

```js
import { useEffect, useState } from "react";
import { subscribeLends } from "../../services/lends";

export function useLends({ uid, company, dateRange, filterType }) {
  const [data, setData] = useState({ lends: [], debts: [], loading: true, error: null });

  useEffect(() => {
    if (!uid || !company) {
      setData({ lends: [], debts: [], loading: false, error: null });
      return;
    }
    setData((d) => ({ ...d, loading: true }));

    const unsubscribe = subscribeLends({
      onData: (all) => {
        setData({
          lends: all.filter((l) => l.fromCompany === company),
          debts: all.filter((l) => l.toCompany === company),
          loading: false,
          error: null,
        });
      },
      onError: (error) => setData((d) => ({ ...d, error, loading: false })),
      filters: { dateRange, filterType },
    });
    return unsubscribe;
  }, [uid, company, dateRange?.[0], dateRange?.[1], JSON.stringify(filterType)]);

  return data;
}
```

### 21.4 `hooks/useUsers.js`

```js
import { useEffect, useState } from "react";
import { subscribeUsers } from "../../services/users";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    return subscribeUsers({ onData: setUsers, onError: setError });
  }, []);

  return { users, error };
}
```

### 21.5 `components/HomeTabs.jsx`

```jsx
import { Tabs } from "antd";
import LendsList from "../../components/Home/LendsList";
import { TAB_KEYS } from "../constants";

export default function HomeTabs({ lends, debts, users, onSwipeReturn, onSwipeDelete }) {
  return (
    <Tabs
      centered
      defaultActiveKey={TAB_KEYS.LENDS}
      items={[
        {
          key: TAB_KEYS.LENDS,
          label: "Préstamos",
          children: <LendsList data={lends} users={users} onReturn={onSwipeReturn} onDelete={onSwipeDelete} mode="lender" />
        },
        {
          key: TAB_KEYS.DEBTS,
          label: "Deudas",
          children: <LendsList data={debts} users={users} onReturn={onSwipeReturn} onDelete={onSwipeDelete} mode="debtor" />
        }
      ]}
    />
  );
}
```

### 21.6 `components/HomeFilters.jsx`

```jsx
import StatusFilter from "../../components/Filters/StatusFilter";
import DateRangeFilter from "../../components/DateRangeFilter";

export default function HomeFilters({ filterType, setFilterType, dateRange, setDateRange, onApplyDate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <StatusFilter value={filterType} onChange={setFilterType} />
      <DateRangeFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        onFilter={onApplyDate}
      />
    </div>
  );
}
```

### 21.7 `Home.jsx` final

```jsx
import { useContext, useState } from "react";
import { Modal, Input } from "antd";
import { UserContext } from "../../UserContext";
import { useLends } from "./hooks/useLends";
import { useUsers } from "./hooks/useUsers";
import { addNewItemToDatabase, changeLendState } from "../../services/lends";
import LoadingScreen from "../../components/LoadingScreen";
import HeaderApp from "../../components/Home/HeaderApp";
import NoCompanyAlert from "../../components/Home/NoCompanyAlert";
import AddLoanModal from "../../components/Home/AddLoanModal";
import HomeTabs from "./components/HomeTabs";
import HomeFilters from "./components/HomeFilters";
import { INITIAL_FILTER } from "./constants";

export default function Home() {
  const { user } = useContext(UserContext);
  const [filterType, setFilterType] = useState(INITIAL_FILTER);
  const [dateRange, setDateRange] = useState([null, null]);
  const [appliedRange, setAppliedRange] = useState([null, null]);
  const [modalOpen, setModalOpen] = useState(false);

  const { users } = useUsers();
  const { lends, debts, loading } = useLends({
    uid: user?.uid, company: user?.company,
    dateRange: appliedRange, filterType
  });

  const handleReturn = (item) =>
    Modal.confirm({
      title: "Marcar como regresado",
      content: <CommentInput onChange={(c) => (handleReturn._comment = c)} />,
      onOk: () => changeLendState(item, { ...user, comment: handleReturn._comment ?? "" }, "returned")
    });

  const handleDelete = (item) =>
    Modal.confirm({
      title: "¿Eliminar préstamo?",
      okType: "danger",
      onOk: () => changeLendState(item, { ...user, comment: "deleted" }, "deleted")
    });

  if (loading) return <LoadingScreen />;

  return (
    <>
      <HeaderApp />
      <HomeFilters
        filterType={filterType} setFilterType={setFilterType}
        dateRange={dateRange} setDateRange={setDateRange}
        onApplyDate={(s, e) => setAppliedRange([s, e])}
      />
      {!user?.company && <NoCompanyAlert />}
      <HomeTabs
        lends={lends} debts={debts} users={users}
        onSwipeReturn={handleReturn} onSwipeDelete={handleDelete}
      />
      <AddLoanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={addNewItemToDatabase}
        users={users}
        fromCompany={user?.company}
      />
    </>
  );
}

const CommentInput = ({ onChange }) => (
  <Input.TextArea maxLength={280} rows={3} placeholder="Comentario opcional" onChange={(e) => onChange(e.target.value)} />
);
```

---

## 22. Sistema de Diseño Propuesto

### 22.1 `src/theme.js`

```js
// src/theme.js
import { theme as antdTheme } from "antd";

export const tokens = {
  brand: {
    primary: "#1890ff",      // azul corporativo (reemplaza usos hardcoded)
    success: "#ff7043",      // naranja "regresado" (mantener, distintivo)
    danger:  "#f5222d",
    neutral: "#d9d9d9",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius:  { sm: 4, md: 8, lg: 12 },
  font:    { sizeBase: 14, family: "'Inter', system-ui, sans-serif" }
};

export const lightTheme = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary:    tokens.brand.primary,
    colorSuccess:    tokens.brand.success,
    colorError:      tokens.brand.danger,
    colorBorder:     tokens.brand.neutral,
    borderRadius:    tokens.radius.md,
    fontFamily:      tokens.font.family,
    fontSize:        tokens.font.sizeBase,
  },
  components: {
    Button:   { borderRadius: tokens.radius.md, controlHeight: 40 },
    Input:    { borderRadius: tokens.radius.sm },
    Modal:    { borderRadiusLG: tokens.radius.lg },
    Tabs:     { itemSelectedColor: tokens.brand.primary },
    List:     { itemPadding: `${tokens.spacing.sm}px ${tokens.spacing.md}px` }
  }
};

export const darkTheme = {
  ...lightTheme,
  algorithm: antdTheme.darkAlgorithm,
  token: { ...lightTheme.token, colorBgBase: "#0d1117" }
};
```

### 22.2 Mapeo color hardcoded → token

| Color en código | Reemplazo |
|---|---|
| `#1890ff` (8 ocurrencias) | `token.colorPrimary` |
| `#ff7043` (6 ocurrencias) | `token.colorSuccess` |
| `#d9d9d9` (1) | `token.colorBorder` |
| `red` (3) | `token.colorError` |
| `#000000`, `#ffffff` (manifest) | `token.colorBgBase` / `colorTextBase` |

### 22.3 Uso

```jsx
// src/index.jsx
import { ConfigProvider } from "antd";
import { lightTheme, darkTheme } from "./theme";
const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

<ConfigProvider theme={isDark ? darkTheme : lightTheme} locale={esES}>
  <App />
</ConfigProvider>
```

Y en componentes:
```jsx
import { theme } from "antd";
const { token } = theme.useToken();
<span style={{ color: token.colorSuccess }}>...</span>
```

---

## 23. Modelo de Datos Mejorado

### 23.1 Schema `/companies/{id}`

```json
{
  "companies": {
    "acme-2025": {
      "name": "ACME S.A.",
      "ownerUid": "u-abc",
      "createdAt": 1730000000000,
      "members": { "u-abc": true, "u-def": true },
      "invitationCode": "ACME-7K2P"
    }
  }
}
```

### 23.2 Schema `/lends/{id}` con `events`

```json
{
  "lends": {
    "L-xyz": {
      "name": "Taladro Bosch",
      "quantity": 1,
      "from": "u-abc",       "fromCompany": "acme-2025",
      "to":   "u-def",       "toCompany":   "wayne-2025",
      "createdAt": 1730000000000,
      "returned": false,
      "deleted": false,
      "events": {
        "evt-1": { "type": "created",   "actorUid": "u-abc", "timestamp": 1730000000000 },
        "evt-2": { "type": "commented", "actorUid": "u-def", "comment": "lo recibí en buen estado", "timestamp": 1730003600000 },
        "evt-3": { "type": "returned",  "actorUid": "u-def", "timestamp": 1730100000000 }
      }
    }
  }
}
```

### 23.3 Schema `/memberships/{uid}/{companyId}` (multi-empresa)

```json
{
  "memberships": {
    "u-abc": {
      "acme-2025":  { "role": "admin",  "joinedAt": 1729000000000 },
      "wayne-2025": { "role": "member", "joinedAt": 1730000000000 }
    }
  }
}
```

### 23.4 Script de migración (one-shot)

```js
// scripts/migrate-v1-to-v2.js
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import dayjs from "dayjs";

const app = initializeApp({ /* service account */ });
const db = getDatabase();

async function migrate() {
  const snap = await db.ref("/lends").once("value");
  const updates = {};

  snap.forEach((child) => {
    const id = child.key;
    const item = child.val();

    // 1. date string → createdAt timestamp ms
    if (typeof item.date === "string" && !item.createdAt) {
      const ms = dayjs(item.date, "DD-MM-YYYY HH:mm:ss").valueOf();
      updates[`/lends/${id}/createdAt`] = ms;
      updates[`/lends/${id}/date`] = null; // borrar legacy
    }

    // 2. comment string → events[]
    if (typeof item.comment === "string" && item.comment.trim()) {
      const lines = item.comment.split("\n").filter(l => l.trim());
      lines.forEach((line, idx) => {
        const eventKey = db.ref(`/lends/${id}/events`).push().key;
        // parse "(HH:mm)Nombre: comentario"
        const match = line.match(/^\((\d{2}:\d{2})\)([^:]+):\s*(.*)$/);
        updates[`/lends/${id}/events/${eventKey}`] = {
          type: "legacy_comment",
          actorName: match?.[2]?.trim() ?? "desconocido",
          comment: match?.[3]?.trim() ?? line,
          timestamp: item.createdAt + (idx * 60_000), // aproximación
          actorUid: item.from
        };
      });
      updates[`/lends/${id}/comment`] = null;
    }

    // 3. returnedBy null literal → eliminar
    if (item.returnedBy === null) {
      updates[`/lends/${id}/returnedBy`] = null;
    }
  });

  // 4. users: company "null" → null real
  const usersSnap = await db.ref("/users").once("value");
  usersSnap.forEach((u) => {
    if (u.val()?.company === "null") {
      updates[`/users/${u.key}/company`] = null;
    }
  });

  await db.ref().update(updates);
  console.log(`Migración completada: ${Object.keys(updates).length} paths actualizados`);
}

migrate().catch(console.error);
```

Ejecución: `node scripts/migrate-v1-to-v2.js` con cuenta de servicio admin.

---

## 24. Roadmap visualizado (Gantt textual)

### Sprint 1 — Estabilización (Semana 1)

| Día | Tareas | Archivos |
|---|---|---|
| L | C1: Refactor `UserContext` con `onAuthStateChanged` | `src/UserContext.js` |
| L | C2: Eliminar `setTimeout` de logout | `src/pages/Home.js` L142–L163 |
| M | C3: `set()` → `update()` atómico | `src/helpers.js` L154–L235 |
| M | C4: `date` string → `createdAt` ms + dayjs | `helpers.js`, `LendsList.js`, `AddLoanModal.js` |
| X | C5: `comment` string → `events/{key}` estructura | `helpers.js` + nuevo `services/lends.js` |
| X | C6: Crear `firebase/database.rules.json` y `firebase.json` | nuevos |
| J | Deploy reglas a staging Firebase + smoke test | — |
| V | Migración script + ejecutar contra staging | `scripts/migrate-v1-to-v2.js` |

### Sprint 2 — Calidad (Semana 2)

| Día | Tareas |
|---|---|
| L | Setup Vitest + jest-dom + 5 tests unitarios de helpers |
| M | Tests Login + Home integración |
| X | Pipeline GitHub Actions: lint + test + build (+ artifact) |
| X | Husky + lint-staged + commitlint |
| J | ESLint config (no-console, no-unused-vars, react-hooks) + Prettier |
| V | Refactor profundo `Home.js` (sección 21) + extracción hooks |

### Sprint 3 — Producción (Semana 3)

| Día | Tareas |
|---|---|
| L | Migración CRA → Vite (sección 20) |
| M | Activar PWA con `vite-plugin-pwa` + verificar Lighthouse PWA > 90 |
| X | Aplicar tema centralizado (sección 22) + dark mode |
| J | i18n con `react-i18next` (es por defecto + en) |
| V | Setup Firebase Hosting + dominio + Sentry/LogRocket + lanzamiento |

---

## 25. Métricas de éxito (KPIs)

| KPI | Estado actual | Objetivo | Cómo medir |
|---|---|---|---|
| Líneas en `Home.js` | **369** | **< 200** | `wc -l src/pages/Home.js` |
| Cobertura unitaria | **0%** | **> 60%** | `npm run test -- --coverage` |
| Lighthouse PWA | **~30** | **> 90** | Lighthouse mobile |
| Lighthouse Performance | **~45** | **> 80** | Lighthouse mobile |
| Bundle JS gzip | **433 KB** (medido) | **< 300 KB** | `du -sh build/static/js/*.js` + gzip |
| `console.log` en `src/` | **9** | **0** | `rg "console\.(log\|error)" src/` |
| `let` mutables en `src/` | varios | **0** | `rg "^\s*let\s" src/` |
| Archivos sin tipos (post-TS) | **20** | **0** | `find src -name "*.js" \! -name "*.test.js"` |
| Reglas RTDB en producción | **abiertas** | **completas validate + auth** | `firebase database:get /` debe denegar sin auth |
| Tiempo desde push hasta deploy | manual | **< 5 min** | GitHub Actions |
| Errores en Sentry / 1000 sesiones | desconocido | **< 5** | Sentry dashboard |
| Tests E2E pasando | **0** | **> 5 críticos** | `playwright test` |

---

## 26. Apéndice: Comandos de Auditoría

```bash
# 1. Detectar console.log/error en producción
rg "console\.(log|error|warn|debug)" src/ --stats

# 2. Detectar `let` (preferir const)
rg "^\s*let\s" src/

# 3. Detectar moment para reemplazar por dayjs
rg "from ['\"]moment['\"]" src/

# 4. Bundle size (después de build)
npm run build && du -sh build/static/js/*.js && \
  for f in build/static/js/*.js; do gzip -c "$f" | wc -c | awk -v f="$f" '{print f": "$1" bytes gzip"}'; done

# 5. Detectar imports de antd no tree-shakeables
rg "from ['\"]antd['\"]" src/ | rg -v "^.*from ['\"]antd/" -c

# 6. Detectar TODO/FIXME pendientes
rg "TODO|FIXME|XXX|HACK" src/

# 7. Detectar archivos con código comentado >5 líneas
for f in $(find src -name "*.js"); do
  count=$(grep -c "^//" "$f" 2>/dev/null)
  [ "$count" -gt 5 ] && echo "$f: $count líneas comentadas"
done

# 8. Detectar comparaciones a string "null"
rg '=== ["\x27]null["\x27]' src/

# 9. Detectar APIs deprecated de antd v5
rg "TabPane|Menu\s+items=|overlay=" src/

# 10. Validar variables de entorno requeridas
node -e "['REACT_APP_FIREBASE_API_KEY','REACT_APP_FIREBASE_DATABASE_URL'].forEach(k => { if(!process.env[k]) { console.error('Falta: '+k); process.exit(1); } })"

# 11. Lighthouse en CI (Chrome headless)
npx lighthouse http://localhost:3000 --output json --output html --output-path ./lighthouse-report --chrome-flags="--headless"

# 12. Auditar dependencias vulnerables
npm audit --production

# 13. Detectar useEffect sin cleanup
rg -A 20 "useEffect\(" src/ | rg "return\s*\(\s*\)" -B 5 --invert-match | rg "useEffect\("

# 14. Cantidad de `any` (post-TS)
rg ":\s*any" src/ -t ts -t tsx

# 15. Verificar reglas Firebase no-leak
firebase database:get / --token "$FIREBASE_TOKEN" 2>&1 | grep -i "permission_denied" || echo "FUGA: lectura sin auth permitida"

# 16. Detectar hooks dentro de condicionales (regla rota de React)
rg "if\s*\([^)]+\)\s*\{[^}]*use[A-Z]" src/

# 17. Stats generales
echo "Líneas por archivo:"; find src -name "*.js" -exec wc -l {} + | sort -rn | head -20
```

---

## 27. Hallazgos NUEVOS no cubiertos en el análisis previo (1–14)

Durante este análisis profundo aparecieron **8 hallazgos nuevos** que no figuraban en las secciones 1–14:

1. **Doble módulo de helpers**: `src/helpers.js` y `src/helpers/index.js` coexisten. Node resuelve `./helpers` al `.js`, NO al directorio. Cualquier importación posterior puede colisionar.
2. **`react-device-detect` import sin uso** en `DateRangeFilter.js` L4 → bundle bloat innecesario.
3. **Bug de filtro `wasReturned`** en `helpers.js` L97-98: condición idéntica a `notReturned` → la opción del TreeSelect nunca produce resultados distintos.
4. **API `<Modal visible>`** en `AddLoanModal.js` L73 está deprecated en antd v5 (es `open`). Se imprimen warnings en consola que el usuario no ve, pero rompe en próxima major.
5. **API `<Dropdown overlay>`** en `LogOutDropdown.js` L42 también deprecated en antd v5.
6. **API `<TabPane>`** en `Home.js` L334 deprecated; debe migrarse a `items` prop.
7. **Hooks de `web-vitals` v2 obsoletos**: `getCLS`, `getFID`, etc. Las nuevas son `onCLS`, `onINP`, `onLCP` y la lib en `package.json` está en v2.1.4 (debería v3+).
8. **Bug `<SwipeableList>` por item**: `LendsList.js` L96 envuelve **cada** `SwipeableListItem` en su propio `SwipeableList`, lo cual es contrario a la documentación de la lib y rompe gestos de cierre múltiple.
9. **Variable `const { _, setUser }`**: en `LogOutDropdown.js` L18, `_` es un nombre de variable real, no destructuring de descarte. ESLint la marca como unused.
10. **Falta `databaseURL`** en `firebase-config.js`: la SDK de RTDB v10 lo requiere explícitamente para `getDatabase`. Si no está en `.env`, en algunos entornos se infiere mal del `projectId`.

---

### Critical Files for Implementation

- /home/fmarcosdev/Volumes/Extended/github/DEVELOPMENT/my-lends-pwa/src/UserContext.js
- /home/fmarcosdev/Volumes/Extended/github/DEVELOPMENT/my-lends-pwa/src/helpers.js
- /home/fmarcosdev/Volumes/Extended/github/DEVELOPMENT/my-lends-pwa/src/pages/Home.js
- /home/fmarcosdev/Volumes/Extended/github/DEVELOPMENT/my-lends-pwa/src/components/Home/LendsList.js
- /home/fmarcosdev/Volumes/Extended/github/DEVELOPMENT/my-lends-pwa/src/firebase-config.js