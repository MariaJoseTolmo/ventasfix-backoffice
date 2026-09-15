# Registro de decisiones de arquitectura (ADR)

Cada archivo documenta **una** decisión: el problema que la motivó, la opción elegida, las alternativas que se descartaron y qué se gana y se pierde con ella.

Un ADR no se edita cuando se cambia de opinión. Se escribe uno nuevo que reemplaza al anterior, y el viejo queda marcado como *Reemplazada*. El historial de decisiones vale tanto como la decisión vigente.

## Decisiones vigentes

| # | Decisión | Estado |
|---|---|---|
| [001](ADR-001-spa-react-mas-api-rest.md) | SPA React + API REST en monorepo | Aceptada |
| [002](ADR-002-sequelize-como-orm.md) | Sequelize como ORM | Aceptada |
| [003](ADR-003-jwt-bearer-unico.md) | JWT Bearer único para SPA y Softland | Aceptada |
| [004](ADR-004-estructura-en-capas.md) | Estructura por capa técnica | Aceptada |
| [005](ADR-005-zod-fuente-unica-de-contrato.md) | Zod como fuente única del contrato | Aceptada |
| [006](ADR-006-mock-softland-con-adapter.md) | Mock de Softland como contenedor + Adapter | Aceptada |
| [007](ADR-007-borrado-logico.md) | Borrado lógico con `paranoid` | Aceptada |
| [008](ADR-008-imagenes-en-filesystem.md) | Imágenes en filesystem con volumen | Aceptada |
| [009](ADR-009-precio-venta-derivado.md) | `sale_price` como columna con hook | Aceptada |
| [010](ADR-010-errores-de-dominio.md) | Errores de dominio + handler central | Aceptada |
| [011](ADR-011-tanstack-query-en-el-front.md) | TanStack Query para estado de servidor | Aceptada |
| [012](ADR-012-docker-compose-dev-y-entrega.md) | Dos composes: desarrollo y entrega | Aceptada |
| [013](ADR-013-ant-design-como-base-de-ui.md) | Ant Design como base de UI | Aceptada |

## Formato

```markdown
# ADR-00X — Título en una línea

- Estado · Fecha · Indicadores de rúbrica afectados

## Contexto      → Qué problema obligó a decidir
## Decisión      → Qué se eligió, en una frase
## Alternativas  → Qué se descartó y por qué
## Consecuencias → Qué se gana y qué se paga
## Evidencia     → Dónde se ve en el código
```
