# Concepto Inicial del Proyecto

> Documento de origen — no editar. Refleja la idea original con la que se generó el backlog.
> Fecha: 2026-04-05

---

El proyecto es **My Lends**, una PWA de gestión de préstamos de ítems/productos entre empresas (modelo B2B interno). Los equipos se prestan herramientas, materiales u objetos físicos y necesitan llevar registro de quién le debe qué a quién.

**Flujo actual**: la gente se crea una cuenta y el administrador les asigna su `company` manualmente por backend. Funciona bien, pero falta un método para que el usuario pueda asignarse a sí mismo una company de forma segura para todos.

**Visión a futuro**:
- El usuario pueda trabajar sin company (modo personal), porque la app también sirve para gestión personal de préstamos.
- El proyecto es B2B pero con un pequeño fix funciona a nivel personal y cosas similares.
- Se buscaba que fuera escalable con más medidas de lógica interna (detalles por recordar y definir en el futuro).

**Orden de trabajo definido por el usuario**:
1. Refactor respetando el código actual
2. Features nuevas según se necesiten
3. Estabilizar todo para salir a producción
