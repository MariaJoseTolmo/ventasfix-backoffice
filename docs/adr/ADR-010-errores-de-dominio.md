# ADR-010 — Errores de dominio + manejador central

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Indicadores** | Los 4 CRUD (36) · Patrones de diseño (7) · Conexión con servicios (6) |

## Contexto

Los cuatro indicadores de CRUD suben de 8 a 9 puntos *"con el código de respuesta HTTP correcto"*. Son **36 puntos** —más de un tercio de la nota— cuyo nivel máximo depende de que cada endpoint responda el número que corresponde.

Con quince endpoints, repetir la lógica de "si no existe, `404`" quince veces significa quince oportunidades de olvidarla. Alcanza con fallar en una.

Y hay un principio de arquitectura de fondo:

> **La capa de servicios no debe saber que existe HTTP.**

Si `productService.findById()` ejecuta `res.status(404).json(...)`, la lógica de negocio queda casada con el transporte. Ese servicio ya no puede invocarse desde el adapter de Softland, desde una tarea programada ni desde un test sin levantar Express.

El servicio habla el idioma del dominio —"este producto no existe"—. Traducir eso a un número es responsabilidad de la capa web, y de nadie más.

## Decisión

**Clases de error de dominio + un único manejador de errores.**

1. `api/src/errors/` define `AppError` y sus derivados: `NotFoundError`, `ValidationError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `ExternalServiceError`.
2. Los servicios **lanzan** errores de dominio. No conocen códigos HTTP.
3. Los controllers solo hacen `next(err)`.
4. `errorHandler.middleware.js`, registrado al final, mapea cada clase a su código y devuelve siempre la misma estructura de respuesta.

```js
async function getById(req, res, next) {
  try {
    const product = await productService.findById(req.params.id);
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
}
```

El `404` no aparece: lo lanza el servicio y lo traduce el manejador.

## Alternativas consideradas

### Códigos de estado en cada controller

`if/else` y `res.status()` escritos a mano en cada handler.

| A favor | En contra |
|---|---|
| Sin indirección: se abre el controller y se ve qué devuelve | La misma lógica repetida en quince endpoints; basta olvidarla en uno |
| Cero configuración | El formato de error termina distinto en cada controller |
| Manejable con tres entidades | Los controllers se inflan y la lógica de negocio se filtra dentro, debilitando los indicadores de patrones y de conexión con servicios |

**Descartada.** Es exactamente el riesgo que cuesta 2 puntos en cada uno de los cuatro indicadores.

### Patrón Result

Los servicios devuelven `{ ok, data, error }` en lugar de lanzar.

| A favor | En contra |
|---|---|
| Los errores son parte explícita de la firma: quien llama no puede ignorarlos | No es idiomático en Express |
| Flujo de control totalmente predecible | Sin TypeScript se pierde el chequeo que hace valioso al patrón |
| | **Cada controller vuelve a decidir el mapeo a HTTP**: no resuelve el problema central |

**Descartada.** Elegante en lenguajes con tipos suma; fricción gratuita acá.

## Tabla de correspondencia

Vive en un solo archivo: `errorHandler.middleware.js`.

| Clase | HTTP | Cuándo |
|---|---:|---|
| `ValidationError` | `422` | Datos bien formados que no cumplen las reglas |
| `UnauthorizedError` | `401` | Sin token, vencido, o credenciales incorrectas |
| `ForbiddenError` | `403` | Autenticado sin permiso |
| `NotFoundError` | `404` | El recurso no existe |
| `ConflictError` | `409` | Email, RUT o SKU duplicado |
| `PayloadTooLargeError` | `413` | Imagen sobre `MAX_UPLOAD_SIZE` |
| `UnsupportedMediaTypeError` | `415` | Tipo MIME no permitido |
| `ExternalServiceError` | `502` | Softland no respondió |
| *(no controlado)* | `500` | Se registra completo, se responde genérico |

### Errores de librerías externas

`MulterError` y `SequelizeUniqueConstraintError` no son errores de dominio, así que sin traducción caerían en el caso no controlado y devolverían `500` donde correspondía `413`, `415` o `409`.

El `errorHandler` los normaliza antes de aplicar la tabla:

```js
if (err instanceof UniqueConstraintError) err = new ConflictError('Ya existe un registro con ese valor');
if (err instanceof MulterError) err = mapMulterError(err);
```

**Es el punto ciego típico de este patrón:** se escriben clases de dominio impecables y se olvida que el ORM y los middlewares lanzan errores propios. Cada uno de esos olvidos es un `500` donde la rúbrica esperaba otro código.

## Consecuencias

### Se gana

- **El mapeo vive en un solo archivo**, así que es imposible que un endpoint devuelva `500` donde correspondía `404`.
- **Controllers de tres líneas**, legibles de un vistazo — muy conveniente para el video.
- **Servicios reutilizables** desde el adapter, una tarea programada o un test, sin tocar nada.
- **Formato de error uniforme** en toda la API, lo que se refleja en Swagger.
- **Refuerza dos indicadores más**: la lógica queda en `services/`, que es justo lo que piden los indicadores de patrones y de conexión con servicios.

### Se paga

- **Hay que crear las clases de error** antes de escribir el primer controller.
- **Los handlers asíncronos deben envolverse** (`express-async-errors` o un `asyncHandler`), o los rechazos de promesa nunca llegan al middleware. **Es el error más común de este patrón.**
- **Una indirección más**: para saber qué código devuelve un endpoint hay que mirar el manejador. Se compensa con la tabla de arriba.

## Evidencia

| Qué | Dónde |
|---|---|
| Clases de error | `api/src/errors/` |
| Manejador central | `api/src/middlewares/errorHandler.middleware.js` |
| Servicios sin HTTP | Ningún `res.` ni `status` en `api/src/services/` |
| Controllers delgados | Todos siguen el patrón `try/catch → next(err)` |
| Contrato documentado | [04-CONTRATO-API.md](../04-CONTRATO-API.md#códigos-de-respuesta) |
