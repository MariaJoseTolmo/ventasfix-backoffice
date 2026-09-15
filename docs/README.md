# Documentación de arquitectura — Backoffice VentasFix

Sistema de backoffice web y API REST para VentasFix. Permite a los trabajadores administrar usuarios, productos y clientes desde una interfaz gráfica, y expone la misma funcionalidad como API autenticada para la integración con Softland.

Examen transversal — Desarrollo de Software Web I (IF204IINF), Instituto Profesional San Sebastián.

## Por dónde empezar

| Si necesitás… | Leé |
|---|---|
| Entender el requerimiento y dónde están los 100 puntos | [01-ANALISIS.md](01-ANALISIS.md) |
| Ver cómo está construido el sistema | [02-ARQUITECTURA.md](02-ARQUITECTURA.md) |
| Conocer las tablas y por qué están así | [03-MODELO-DATOS.md](03-MODELO-DATOS.md) |
| Consultar endpoints y códigos de respuesta | [04-CONTRATO-API.md](04-CONTRATO-API.md) |
| Verificar que no falte nada de la rúbrica | [05-TRAZABILIDAD-RUBRICA.md](05-TRAZABILIDAD-RUBRICA.md) |
| Grabar los dos videos | [06-GUION-VIDEOS.md](06-GUION-VIDEOS.md) |
| Saber por qué se eligió cada tecnología | [adr/](adr/README.md) |

## Stack en una tabla

| Capa | Tecnología | Decisión |
|---|---|---|
| Interfaz | React 18 + Vite + React Router | [ADR-001](adr/ADR-001-spa-react-mas-api-rest.md) |
| Componentes de UI | Ant Design | [ADR-013](adr/ADR-013-ant-design-como-base-de-ui.md) |
| Estado de servidor | TanStack Query + Axios | [ADR-011](adr/ADR-011-tanstack-query-en-el-front.md) |
| API | Node.js + Express 4 | [ADR-001](adr/ADR-001-spa-react-mas-api-rest.md) |
| Organización backend | Capas `routes → controllers → services → models` | [ADR-004](adr/ADR-004-estructura-en-capas.md) |
| Persistencia | PostgreSQL 16 + Sequelize | [ADR-002](adr/ADR-002-sequelize-como-orm.md) |
| Validación y contrato | Zod + zod-to-openapi | [ADR-005](adr/ADR-005-zod-fuente-unica-de-contrato.md) |
| Documentación de API | Swagger UI en `/api-docs` | [ADR-005](adr/ADR-005-zod-fuente-unica-de-contrato.md) |
| Autenticación | JWT Bearer + bcrypt | [ADR-003](adr/ADR-003-jwt-bearer-unico.md) |
| Integración externa | `softland-mock` + patrón Adapter | [ADR-006](adr/ADR-006-mock-softland-con-adapter.md) |
| Infraestructura | Docker Compose (dev + entrega) | [ADR-012](adr/ADR-012-docker-compose-dev-y-entrega.md) |

## Índice de decisiones

| # | Decisión | Indicadores que sostiene |
|---|---|---|
| [001](adr/ADR-001-spa-react-mas-api-rest.md) | SPA React + API REST en monorepo | Arquitectura, vistas, componentes |
| [002](adr/ADR-002-sequelize-como-orm.md) | Sequelize como ORM | Conexión y configuración de BD (6 pts) |
| [003](adr/ADR-003-jwt-bearer-unico.md) | JWT Bearer único para SPA y Softland | Autorización y autenticación (8 pts) |
| [004](adr/ADR-004-estructura-en-capas.md) | Estructura por capa técnica | Arquitectura (5 pts), patrones (7 pts) |
| [005](adr/ADR-005-zod-fuente-unica-de-contrato.md) | Zod como fuente única del contrato | Validaciones en los 4 CRUD (36 pts) |
| [006](adr/ADR-006-mock-softland-con-adapter.md) | Mock de Softland como contenedor + Adapter | Componentes reutilizables (5 pts) |
| [007](adr/ADR-007-borrado-logico.md) | Borrado lógico (`paranoid`) | Eliminar registros (9 pts) |
| [008](adr/ADR-008-imagenes-en-filesystem.md) | Imágenes en filesystem con volumen | Modelos con todos los campos (6 pts) |
| [009](adr/ADR-009-precio-venta-derivado.md) | `sale_price` como columna con hook | Modelos con todos los campos (6 pts) |
| [010](adr/ADR-010-errores-de-dominio.md) | Errores de dominio + handler central | Códigos HTTP en los 4 CRUD (36 pts) |
| [011](adr/ADR-011-tanstack-query-en-el-front.md) | TanStack Query para estado de servidor | Componentes reutilizables, vistas |
| [012](adr/ADR-012-docker-compose-dev-y-entrega.md) | Dos composes: desarrollo y entrega | Reproducibilidad de la entrega |
| [013](adr/ADR-013-ant-design-como-base-de-ui.md) | Ant Design como base de UI | Vistas (5), componentes reutilizables (5) |

## Estado

| Aspecto | Estado |
|---|---|
| Decisiones de arquitectura | Cerradas |
| Diseño del front | Libre, confirmado por el docente — resuelto con Ant Design ([ADR-013](adr/ADR-013-ant-design-como-base-de-ui.md)) |
| Nomenclatura | Cerrada — todo el código en inglés (ver [03-MODELO-DATOS.md](03-MODELO-DATOS.md#convención-de-nomenclatura)) |
