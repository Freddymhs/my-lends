# Backlog — My Lends

**Generado:** 2026-04-05
**Stack:** React 18 (CRA) · React Router v6 · Firebase Auth + Realtime DB · Ant Design 5 · PWA

---

## Fases

| Fase | Nombre | Estado | Prioridad |
|------|--------|--------|-----------|
| [FASE 0](FASE_0_BUGS_CRITICOS.md) | Bugs Críticos | ✅ COMPLETADA (3/3) | 🔴 Alta |
| [FASE 1](FASE_1_REFACTOR.md) | Refactor & Limpieza | ⏸️ PENDIENTE | 🔴 Alta |
| [FASE 2](FASE_2_COMPANY_FEATURE.md) | Company Self-Assignment + Modo Personal | ⏸️ PENDIENTE | 🔴 Alta |
| [FASE 3](FASE_3_FEATURES.md) | Features Nuevas (placeholder) | ⏸️ PENDIENTE | 🟡 Media |
| [FASE 4](FASE_4_UIUX.md) | UI/UX Polish | ⏸️ PENDIENTE | 🟡 Media |
| [FASE 5](FASE_5_TESTING.md) | Testing | ⏸️ PENDIENTE | 🟡 Media |
| [FASE 6](FASE_6_PRODUCCION.md) | Producción | ⏸️ PENDIENTE | 🟠 Media-Alta |
| [FASE 7](FASE_7_SMALL_FIXES.md) | Small Fixes & Polish | ⏸️ PENDIENTE | 🟢 Baja-Media |

**Orden de ejecución:** 0 → 1 → 2 → 3 → 4 → 5 → 6
**FASE 7** es transversal: puede ejecutarse en paralelo a 1 / 4 o en cualquier momento como "spring cleaning" (~2 h).

---

## Diagramas de Referencia

| Archivo | Tipo | Contenido |
|---------|------|-----------|
| [`../diagrams/DIAGRAMAS_COMPONENTES.md`](../diagrams/DIAGRAMAS_COMPONENTES.md) | Flowcharts | Topología del sistema |
| [`../diagrams/DIAGRAMAS_SECUENCIA.md`](../diagrams/DIAGRAMAS_SECUENCIA.md) | Sequences | Auth, creación de préstamo, cambio de estado |
| [`../diagrams/DIAGRAMAS_ESTADOS.md`](../diagrams/DIAGRAMAS_ESTADOS.md) | States | Ciclo de vida de un préstamo |

Estos diagramas son referencia estructural estable. Actualizar solo ante cambios de topología o reglas de negocio.

---

## Decisiones Técnicas

Carpeta `../decisions/` — documentar decisiones arquitectónicas cuando surjan durante el desarrollo.
Formato: `DECISION_[TEMA].md` — explica el POR QUÉ, no el QUÉ.

---

## Validación de Flujos

| Archivo | Propósito |
|---------|-----------|
| [`../flows.md`](../flows.md) | Flujos de usuario documentados manualmente. Guía para QA y E2E. |

Llenar después de probar cada feature. Usar como referencia con `/tools:run-browser_test`.
