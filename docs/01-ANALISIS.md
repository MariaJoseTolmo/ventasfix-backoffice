# Análisis del requerimiento

VentasFix necesita un backoffice web con login que permita administrar usuarios, productos y clientes, más un dashboard con conteos. La misma funcionalidad debe quedar expuesta como API REST autenticada, porque la empresa tiene contratado Softland como sistema de gestión y necesita integrarse.

## Alcance real, no alcance declarado

El enunciado se titula **"Microservicio de Manejo de Carro de Compra"**, pero ni los requerimientos ni un solo indicador de la rúbrica mencionan carro de compra, pedidos o checkout. Lo que se pide y se evalúa es:

- Tres mantenedores CRUD completos: usuarios, productos, clientes.
- Un dashboard con tres conteos.
- Login de acceso al sistema.
- API REST con autenticación.

**Se construye para la rúbrica, no para el título.** Implementar un carro de compras consumiría tiempo sin sumar un solo punto.

## Los tres requisitos no negociables

Estos vienen de las "Notas importantes" del enunciado y ninguno admite interpretación:

| # | Requisito | Dónde se resuelve |
|---|---|---|
| 1 | El template entregado por la empresa es obligatorio; no se acepta otro | **Levantado por el docente** — ver más abajo |
| 2 | Ningún método de escritura puede guardar datos vacíos | [ADR-005](adr/ADR-005-zod-fuente-unica-de-contrato.md) |
| 3 | La contraseña debe estar cifrada en la base de datos | [ADR-003](adr/ADR-003-jwt-bearer-unico.md) |
| 4 | El consumo de la API debe tener autenticación | [ADR-003](adr/ADR-003-jwt-bearer-unico.md) |
| 5 | Todos los emails de usuario deben ser `@ventasfix.cl` | [ADR-005](adr/ADR-005-zod-fuente-unica-de-contrato.md) |

### El template: restricción levantada

El enlace de Google Drive del enunciado estaba **truncado** —el identificador tiene 31 caracteres y Google Drive usa 33—, así que el template nunca estuvo disponible.

**El docente del ramo confirmó que el diseño del front es libre.** La restricción queda sin efecto y desaparece el trabajo de portar HTML y Bootstrap a componentes React.

La decisión de qué usar en su lugar está en [ADR-013](adr/ADR-013-ant-design-como-base-de-ui.md).

## Dónde están los 100 puntos

| Bloque | Puntos | % |
|---|---:|---:|
| CRUD — insertar, recuperar, actualizar, eliminar (9 c/u) | 36 | 36% |
| Videos — sistema y API (6 c/u) | 12 | 12% |
| Autorización y autenticación | 8 | 8% |
| Patrones de diseño (modelos, controladores, vistas conectados) | 7 | 7% |
| Conexión y configuración de BD/ORM | 6 | 6% |
| Conexión de controladores con servicios | 6 | 6% |
| Rutas | 5 | 5% |
| Arquitectura descriptiva | 5 | 5% |
| Componentes reutilizables | 5 | 5% |
| Vistas de usuario | 5 | 5% |
| Cifrado de contraseña | 5 | 5% |
| **Total** | **100** | |

Escala al 60% de exigencia: 60 puntos = 4.0, 100 puntos = 7.0.

## Tres hallazgos que cambian las prioridades

Leer los niveles intermedios de la rúbrica —y no solo el "Sobresaliente"— revela dónde se pierden puntos de verdad.

### 1. Ocho puntos dependen de la capa de validación, no del CRUD

Los cuatro indicadores de CRUD bajan de 9 a 7 puntos por la misma causa: *"…pero con errores de ejecución **o con carencia de las validaciones**"*.

Son 2 puntos × 4 indicadores = **8 puntos** que se juegan en una capa transversal, no en la lógica de cada operación. Por eso la validación se trata como infraestructura y no como un detalle de cada controller. → [ADR-005](adr/ADR-005-zod-fuente-unica-de-contrato.md)

### 2. Otros cuatro puntos dependen del código HTTP

Los mismos cuatro indicadores suben de 8 a 9 puntos *"con el código de respuesta HTTP correcto"*.

Un `500` donde correspondía `404`, o un `200` donde correspondía `201`, cuesta un punto por endpoint. La forma de blindarlo es centralizar el mapeo en un solo archivo en vez de repetirlo en quince. → [ADR-010](adr/ADR-010-errores-de-dominio.md)

### 3. La arquitectura se evalúa por los nombres de archivo

El nivel "Alto" (3 pts) del indicador de arquitectura dice: *"Se evidencia construcción de la arquitectura del proyecto, pero **los nombres de los archivos no son descriptivos**"*. El "Sobresaliente" (5 pts) es lo mismo, descriptivo.

La diferencia de 2 puntos no está en la sofisticación de la arquitectura, sino en que cada archivo declare su rol en el nombre: `product.controller.js`, `product.service.js`, `product.model.js`. → [ADR-004](adr/ADR-004-estructura-en-capas.md)

## Ambigüedades del enunciado y cómo se resolvieron

| Ambigüedad | Resolución | Detalle |
|---|---|---|
| "Servicio externo" no está definido | Contenedor `softland-mock` independiente | [ADR-006](adr/ADR-006-mock-softland-con-adapter.md) |
| `sale_price` es derivable de `net_price` | Columna real, recalculada por hook | [ADR-009](adr/ADR-009-precio-venta-derivado.md) |
| `minimum_stock`, `low_stock` y `high_stock` no tienen semántica declarada | Se define e impone por restricción | [03-MODELO-DATOS.md](03-MODELO-DATOS.md#umbrales-de-stock) |
| "Eliminar" no aclara si es físico o lógico | Borrado lógico, demostrado explícitamente | [ADR-007](adr/ADR-007-borrado-logico.md) |

## Siguiente paso

Leé [02-ARQUITECTURA.md](02-ARQUITECTURA.md) para ver cómo se traduce todo esto en componentes.
