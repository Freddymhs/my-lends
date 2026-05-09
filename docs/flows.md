# Flow Validation Document — My Lends

> Documento mantenido manualmente. Describe cómo funciona la app para el usuario final.
> Llenar cada flujo después de probarlo. Útil como guía para `/tools:run-browser_test`.
>
> Última actualización: 2026-04-05

---

## Convenciones

- **Precondiciones**: qué debe existir antes de ejecutar el flujo
- **Pasos**: acciones del usuario (navegar, click, escribir, etc.)
- **Resultado esperado**: qué ve/obtiene el usuario al completar
- **Casos borde**: situaciones alternativas relevantes

---

## Módulo: Autenticación

### Flujo: Login usuario existente

**Precondiciones:**
- El usuario ya tiene cuenta en Firebase (ya hizo login antes)
- El usuario tiene `company` asignada (no "null")

**Pasos:**
1. (por llenar)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- (por llenar)

---

### Flujo: Registro usuario nuevo

**Precondiciones:**
- El usuario nunca ha usado la app

**Pasos:**
1. (por llenar)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- Usuario que cierra el popup de Google sin completar el login

---

### Flujo: Logout

**Precondiciones:**
- Usuario logueado en `/lends`

**Pasos:**
1. (por llenar)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- (por llenar)

---

## Módulo: Company Setup (FASE 2)

### Flujo: Usuario nuevo elige su empresa

**Precondiciones:**
- Usuario recién registrado, `company === "null"`

**Pasos:**
1. (por llenar — pantalla `/setup` no implementada aún)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- Nombre de empresa que no existe aún
- Nombre con typo (distinto al de otros usuarios de la misma empresa)

---

### Flujo: Activar modo personal

**Precondiciones:**
- Usuario sin company asignada en `/setup`

**Pasos:**
1. (por llenar — no implementado aún)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- (por llenar)

---

## Módulo: Préstamos

### Flujo: Crear préstamo

**Precondiciones:**
- Usuario logueado con `company` válida
- Al menos un usuario de otra empresa existe en el sistema

**Pasos:**
1. (por llenar)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- Formulario incompleto (sin nombre, sin destinatario)
- Destinatario sin company asignada (debería estar deshabilitado)

---

### Flujo: Marcar préstamo como devuelto

**Precondiciones:**
- Existe al menos un préstamo en estado "No devuelto"

**Pasos:**
1. (por llenar)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- Desmarcar un préstamo ya devuelto
- Agregar comentario al cambiar estado

---

### Flujo: Eliminar préstamo (soft delete)

**Precondiciones:**
- Existe al menos un préstamo visible

**Pasos:**
1. (por llenar)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- El préstamo eliminado desaparece del filtro por defecto
- Activar filtro "Eliminados" para verlo

---

## Módulo: Filtros

### Flujo: Filtrar por estado

**Precondiciones:**
- Hay préstamos en múltiples estados (devuelto, no devuelto, eliminado)

**Pasos:**
1. (por llenar)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- Deseleccionar todos los filtros
- Activar solo "Eliminados"

---

### Flujo: Filtrar por rango de fechas

**Precondiciones:**
- Hay préstamos de distintas fechas

**Pasos:**
1. (por llenar)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- Rango sin resultados
- Quitar filtro de fecha

---

## Módulo: Mobile UX

### Flujo: Swipe para marcar devuelto (mobile)

**Precondiciones:**
- Usuario en mobile con al menos un préstamo visible

**Pasos:**
1. (por llenar)

**Resultado esperado:**
- (por llenar)

**Casos borde:**
- Swipe a medias (no completo)

---

### Flujo: Toggle columnas en mobile

**Precondiciones:**
- Usuario en mobile

**Pasos:**
1. (por llenar)

**Resultado esperado:**
- Lista pasa de 1 a 2 columnas (o viceversa), preferencia persiste tras logout/login

**Casos borde:**
- (por llenar)
