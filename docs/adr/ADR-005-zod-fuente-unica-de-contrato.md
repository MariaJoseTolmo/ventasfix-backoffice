# ADR-005 — Zod como fuente única del contrato

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Indicadores** | Los 4 CRUD (36) · Autorización y validación (8) |

## Contexto

Los cuatro indicadores de CRUD bajan de 9 a 7 puntos por la misma causa: *"…con errores de ejecución **o con carencia de las validaciones**"*. Son **8 puntos** que no dependen de la lógica de cada operación sino de una capa transversal.

A eso se suman dos exigencias del enunciado: ningún método de escritura puede guardar datos vacíos, y todos los emails de usuario deben pertenecer a `@ventasfix.cl`.

Y hay un problema de diseño de fondo: el contrato de un producto se escribiría **tres veces** —en el validador del backend, en la documentación de Swagger y en el formulario de React—. Tres copias que empiezan a divergir en la primera semana.

## Decisión

**Zod** como definición única del contrato, con `@asteasolutions/zod-to-openapi` generando el spec de Swagger desde los mismos schemas.

- Un schema por entidad en `api/src/validators/`.
- Un único `validate.middleware` los aplica en las rutas.
- Los errores se mapean a `422` con detalle campo por campo.

## Alternativas consideradas

### express-validator + swagger-jsdoc

Cadenas de validación declaradas en cada ruta y Swagger escrito como comentarios JSDoc.

| A favor | En contra |
|---|---|
| El camino idiomático de Express, muy documentado en español | El contrato queda **duplicado** en validador, comentario y formulario |
| Arranca en 15 minutos | Nada garantiza que la documentación refleje la validación real |
| Las validaciones se leen junto a la ruta que protegen | Los comentarios JSDoc inflan los archivos de rutas |

**Descartada** por el costo de mantener tres copias sincronizadas.

### Joi + celebrate

| A favor | En contra |
|---|---|
| Maduro, potente, muy expresivo | Mismo problema de duplicación |
| Se integra limpio con el manejo de errores de Express | Menos comunidad activa; Zod lo superó en el ecosistema |

**Descartada** por no ofrecer ventaja sobre las otras dos.

## Consecuencias

### Se gana

- **Una sola fuente de verdad.** Agregar un campo al producto actualiza validación y documentación a la vez. **Swagger no puede mentir.**
- **El schema se comparte con React.** Mismo lenguaje, mismo paquete: el formulario valida con las mismas reglas que el backend.
- **Errores estructurados.** Se mapean a `422` con el detalle por campo, y el formulario marca el campo exacto sin replicar reglas.
- **Un solo archivo para explicar en el video**, que cubre validación y documentación juntas.

### Se paga

- **Configuración inicial engorrosa.** El *registry* de `zod-to-openapi` toma una o dos horas la primera vez.
- **Una dependencia más** que justificar.
- **Curva de aprendizaje** si no se conoce Zod.

## Reglas de validación

| Entidad | Regla | Respuesta |
|---|---|---|
| Todas | Ningún campo obligatorio vacío o ausente | `422` |
| Usuario | `email` debe terminar en `@ventasfix.cl` | `422` |
| Usuario | `rut` válido con dígito verificador | `422` |
| Usuario | `password` de largo mínimo | `422` |
| Usuario | `email` y `rut` únicos | `409` |
| Producto | `net_price` numérico `>= 0` | `422` |
| Producto | `minimum_stock <= low_stock <= high_stock` | `422` |
| Producto | `sku` único | `409` |
| Producto | Imagen obligatoria, tipo MIME permitido | `422` / `415` |
| Cliente | `company_rut` válido y único | `422` / `409` |
| Cliente | `contact_email` con formato válido, sin restricción de dominio | `422` |

**La unicidad se verifica en el servicio, no en el validador.** Zod valida forma; consultar si un email ya existe es una regla de negocio que requiere base de datos, y eso pertenece a `services/`.

Esa verificación **no es suficiente por sí sola**: entre la consulta y el `INSERT` hay una ventana en la que otra petición puede insertar el mismo valor. El índice único de PostgreSQL es la garantía real, y el `errorHandler` traduce su violación a `409`. Ver [ADR-007](ADR-007-borrado-logico.md#el-choque-entre-unique-y-el-borrado-lógico).

## Evidencia

| Qué | Dónde |
|---|---|
| Schemas | `api/src/validators/` |
| Middleware | `api/src/middlewares/validate.middleware.js` |
| Generación de Swagger | `api/src/config/swagger.config.js` |
| Documentación viva | `/api-docs` |
| Red de seguridad adicional | `allowNull: false` y `CHECK` en los modelos y migraciones |
