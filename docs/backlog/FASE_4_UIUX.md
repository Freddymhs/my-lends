# FASE 4: UI/UX Polish

**Status:** ⏸️ PENDIENTE
**Prioridad:** 🟡 Media
**Dependencias:** FASE 2 completada (la UX de company setup define flujos nuevos)

---

## Tareas

### Tarea 4.A: Feedback visual de estados del préstamo

- **Archivo:** `src/components/Home/LendsList.js`
- **Qué hacer:**
  - Los íconos de estado (CheckCircle) son pequeños y poco intuitivos. Revisar si hay una forma más clara de comunicar el estado sin depender solo del color/ícono.
  - Agregar un badge o tag de texto (Ant Design `<Tag>`) junto al nombre del ítem según estado: "Pendiente", "Devuelto", "Desmarcado", "Eliminado".

### Tarea 4.B: Pantalla vacía (empty state)

- **Archivos:** `src/components/Home/LendsList.js`, `src/pages/Home.js`
- **Qué hacer:**
  - Cuando `returnData` o `belongsData` están vacíos, mostrar un empty state (Ant Design `<Empty>`) con mensaje contextual.
  - Tab "Préstamos" vacío: "No has registrado préstamos aún".
  - Tab "Deudas" vacío: "Nadie te ha prestado nada".

### Tarea 4.C: Mejorar UX del filtro de fechas

- **Archivo:** `src/components/DateRangeFilter.js`
- **Qué hacer:**
  - El flujo actual requiere seleccionar rango + presionar "Filtrar" (dos pasos). Evaluar si el filtro puede aplicarse automáticamente al cerrar el RangePicker (`onChange` directo).
  - Agregar botones rápidos: "Esta semana", "Este mes".

### Tarea 4.D: Mejorar UX mobile del header

- **Archivo:** `src/components/Home/HeaderApp.js`
- **Qué hacer:**
  - El botón de toggle de columnas no tiene tooltip ni label — un usuario nuevo no sabe qué hace.
  - Agregar `tooltip` de Ant Design: "1 columna / 2 columnas".
  - Mostrar el nombre del usuario logueado en el header.

### Tarea 4.E: Accesibilidad mínima

- **Archivos:** `src/components/Home/LendsList.js`, `src/components/Home/AddLoanModal.js`
- **Qué hacer:**
  - Agregar `aria-label` a botones de acción sin texto visible (logout, toggle columnas, flotante +).
  - Verificar que el tab order sea lógico en el modal de creación.

### Tarea 4.F: Consistencia visual

- **Archivos:** Múltiples
- **Qué hacer:**
  - El color `#1890ff` (azul Ant Design 4) aparece hardcodeado en varios lugares. Ant Design 5 usa `#1677ff` por defecto. Reemplazar todos los colores hardcodeados por tokens de tema o `token.colorPrimary`.
  - Revisar que el color `#ff7043` (naranja de "devuelto") sea consistente en todos los componentes.

---

## Criterios de Aceptación

- [ ] El estado de cada préstamo se entiende sin necesidad de expandir el item
- [ ] Las listas vacías muestran un mensaje claro
- [ ] El filtro de fechas funciona de forma intuitiva en mobile
- [ ] Los botones de acción tienen labels o tooltips descriptivos
- [ ] No hay colores hardcodeados en el código fuente
