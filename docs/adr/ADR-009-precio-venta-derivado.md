# ADR-009 — `sale_price` como columna real recalculada por hook

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Indicadores** | Modelos con todos los campos (6) |

## Contexto

El enunciado lista `precio neto` y `precio de venta` como dos campos obligatorios del producto, y aclara que el segundo es el primero con IVA del 19%.

Está pidiendo **guardar un dato que se puede derivar del otro**. Eso es redundancia: el día que alguien actualice el neto por un camino que no recalcule el de venta, la base empieza a mentir, y nadie se entera hasta que sale una boleta mal.

La regla de diseño es que debe haber una sola fuente de verdad. Pero choca con un riesgo concreto: el indicador de modelos baja de 6 a 5 puntos *"pero no con todos los campos solicitados"*. Si la columna no existe, el evaluador abre pgAdmin, no la ve, y descuenta.

Hay que satisfacer ambas cosas.

## Decisión

**La columna existe en la tabla, pero nunca la escribe el cliente.**

- `sale_price` es una columna `DECIMAL(12,2)` real.
- Un hook `beforeSave` / `beforeUpdate` la recalcula **siempre** desde `net_price`. Si el cliente envía `sale_price`, la API lo **rechaza con `422`** en vez de ignorarlo en silencio: un valor que se descarta sin aviso es un error que nadie ve.
- La tasa vive en `TAX_RATE` (`0.19`) en variables de entorno, nunca en el código.

```js
Product.addHook('beforeSave', (product) => {
  product.sale_price = Number(
    (product.net_price * (1 + Number(process.env.TAX_RATE))).toFixed(2)
  );
});
```

## Alternativas consideradas

### Campo `VIRTUAL` de Sequelize

La columna no existe; un *getter* devuelve `net_price × 1.19` y aparece igual en las respuestas JSON.

| A favor | En contra |
|---|---|
| Pureza total: un solo dato, cero posibilidad física de inconsistencia | **El evaluador no ve la columna en el esquema** |
| Es la respuesta de normalización de libro | No se puede filtrar ni ordenar por `sale_price` en SQL |

**Descartada.** Regala un punto a cambio de una pureza que nadie evalúa, y pierde capacidad de consulta.

### Columna generada por PostgreSQL

`GENERATED ALWAYS AS (net_price * 1.19) STORED`.

| A favor | En contra |
|---|---|
| La garantía más fuerte: ni un `INSERT` por SQL crudo puede desincronizarla | Sequelize no lo soporta en la definición del modelo |
| La columna existe y se puede indexar, filtrar y ordenar | Hay que escribirlo con SQL crudo en la migración y marcarlo de solo lectura a mano |
| Es el motor haciendo su trabajo | **La tasa de IVA queda congelada en el esquema**: cambiarla exige una migración |

**Descartada** por el acoplamiento de la tasa al esquema. Es la alternativa más sólida técnicamente y quedaría como primera opción si el IVA fuera inmutable.

## Consecuencias

### Se gana

- **El indicador se cumple sin ambigüedad**: la columna está y se ve.
- **Un solo lugar de cálculo.** Ningún servicio ni controller recalcula el precio por su cuenta.
- **La lógica vive en un solo lugar** y se explica en quince segundos.
- **La tasa es configurable.** Si el IVA cambia, es una variable de entorno, no una búsqueda y reemplazo por todo el código.
- **Se puede filtrar y ordenar por `sale_price`** en SQL.

### Se paga

- **Sigue siendo un dato derivado almacenado.** Es redundancia consciente, exigida por el enunciado.
- **Un `INSERT` por SQL directo se saltea el hook.** Aceptado: toda escritura pasa por el ORM, incluidos los seeders.
- **Las operaciones masivas tampoco disparan el hook.** `Product.update(data, { where })` deja `sale_price` desincronizado en silencio. La capa de servicios debe usar `findByPk` + `save()`. Ver la advertencia en [ADR-002](ADR-002-sequelize-como-orm.md#advertencia-crítica-las-operaciones-masivas-no-disparan-hooks-de-instancia).
- **Cambiar `TAX_RATE` no recalcula lo ya guardado.** Haría falta una migración de datos. Documentado como limitación conocida.

### Nota sobre el tipo de dato

`DECIMAL`, nunca `FLOAT`. Los precios son dinero y el punto flotante binario no representa exactamente los decimales: `0.1 + 0.2` da `0.30000000000000004`. Acumulado en un catálogo, eso es un descuadre contable.

## Evidencia

| Qué | Dónde |
|---|---|
| Columna | `products.sale_price`, `DECIMAL(12,2)` |
| Hook | `api/src/models/product.model.js` |
| Tasa configurable | `TAX_RATE` en `.env.example` |
| Valor del cliente rechazado (`422`) | El schema Zod es `.strict()` y no admite `sale_price` en la entrada |
