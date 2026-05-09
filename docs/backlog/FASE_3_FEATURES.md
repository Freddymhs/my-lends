# FASE 3: Features Nuevas

**Status:** ⏸️ PENDIENTE
**Prioridad:** 🟡 Media
**Dependencias:** FASE 2 completada

> Fase placeholder. Las features se agregan aquí conforme el usuario las defina.
> Cada feature nueva = una tarea nueva en esta fase (o una fase propia si es compleja).

---

## Features conocidas (por definir en detalle)

Estas ideas surgieron durante el análisis inicial pero necesitan ser especificadas antes de implementar:

### Feature A: Historial de cambios como estructura de datos real
- Actualmente el historial es un string con `\n` como separador — no es iterable.
- Migrar a array de objetos en Firebase: `[{ uid, displayName, comment, timestamp, action }]`.
- **Impacto:** requiere migración de datos existentes en Firebase.
- **Dependencia:** decidir en `docs/decisions/DECISION_HISTORIAL.md` antes de tocar.

### Feature B: [Por definir]
- Agregar aquí cuando el usuario recuerde o necesite nuevas features.

### Feature C: [Por definir]
- Agregar aquí cuando el usuario recuerde o necesite nuevas features.

---

## Cómo agregar una feature nueva

1. Crear una tarea en este archivo con formato estándar.
2. Si la feature es compleja (>3 archivos, múltiples pantallas), crear `FASE_3_[NOMBRE].md` propio.
3. Documentar la decisión técnica en `docs/decisions/` si involucra cambio de modelo de datos.

---

## Criterios de Aceptación

- [ ] (se definen por feature al momento de especificarla)
