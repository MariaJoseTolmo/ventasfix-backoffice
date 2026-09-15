# ADR-007 — Borrado lógico con `paranoid`

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Indicadores** | Eliminar registros (9) |

## Contexto

La rúbrica exige eliminar *"de manera **segura y eficiente**"* (9 pts). El enunciado no aclara si el borrado debe ser físico o lógico.

**Honestidad técnica previa:** en este esquema, usuarios, productos y clientes no tienen ninguna relación entre sí —no hay pedidos, no hay carro, no hay claves foráneas—. El argumento habitual de que el borrado lógico protege la integridad referencial **no aplica**. El argumento válido es otro: trazabilidad y reversibilidad.

En un backoffice, quien borra es una persona cansada haciendo clic en una tabla. El borrado físico convierte ese clic en pérdida definitiva.

## Decisión

**Borrado lógico** en las tres entidades, con `paranoid: true` de Sequelize.

- `destroy()` escribe `deleted_at` en vez de eliminar la fila.
- Todas las consultas filtran los registros borrados automáticamente.
- La API responde `204 No Content`, o `404` si el `id` no existe.

## Alternativas consideradas

### Borrado físico

`DELETE` real sobre la tabla; la fila desaparece.

| A favor | En contra |
|---|---|
| Sin ambigüedad: el evaluador refresca pgAdmin y la fila no está | Irreversible: un borrado mal apuntado no tiene vuelta atrás |
| "Eficiente" en sentido literal: sin columna extra ni filtro en cada consulta | Cero trazabilidad de qué se borró y cuándo |
| Es lo que el enunciado dice textualmente | Si mañana se agregan pedidos, quedan referencias huérfanas |

**Descartada.** La ventaja es de claridad para el evaluador, y eso se resuelve mostrándolo bien en el video.

### Borrado lógico + endpoint de purga

Borrado lógico por defecto, más purga definitiva y vista de papelera.

| A favor | En contra |
|---|---|
| Cubre las dos lecturas del evaluador | Rutas, controllers, servicios y vistas extra por entidad |
| Es el comportamiento de un backoffice serio | **Ningún indicador premia la papelera** |

**Descartada por alcance.** Ese tiempo rinde más en los videos, que valen 12 puntos.

## Consecuencias

### Se gana

- **Seguro de forma literal y demostrable.** Un borrado accidental se revierte con `restore()`.
- **Trazabilidad.** Queda registro de qué se borró y cuándo.
- **Los conteos del dashboard quedan correctos solos**, porque el filtro es automático.
- **Costo de implementación casi nulo**: una línea por modelo.
- **Contenido técnico real para el video**, en lugar de "llamo a `destroy`".

### Se paga

- **Las tablas crecen indefinidamente.** Irrelevante a esta escala.
- **Toda consulta lleva un filtro implícito** por `deleted_at`. Mitigado con índice sobre esa columna.
- **Choque entre `UNIQUE` y borrado lógico.** Resuelto con índices parciales; ver abajo.

### El choque entre `UNIQUE` y el borrado lógico

Un `UNIQUE` corriente de PostgreSQL **no sabe nada de `deleted_at`**: sigue aplicando a las filas borradas lógicamente. Eso produce un fallo silencioso y caro:

1. Se elimina el usuario `ana@ventasfix.cl`. La fila queda con `deleted_at` poblado.
2. Se intenta dar de alta otro usuario con ese mismo email.
3. `user.service.js` consulta si el email existe. Como el `defaultScope` de `paranoid` **excluye los borrados**, la consulta no encuentra nada y la validación pasa.
4. El `INSERT` llega a PostgreSQL y choca contra el `UNIQUE`, que sí ve la fila borrada.
5. Sequelize lanza `SequelizeUniqueConstraintError`, que no es un error de dominio, así que cae en el caso no controlado del `errorHandler` → **`500`**.

Donde correspondía un `409`, la API devuelve un `500`. Y el indicador "Insertar registros" (9 pts) exige precisamente *"el código de respuesta HTTP correcto"*.

**Solución en dos capas:**

**1. Índices únicos parciales**, que es la forma correcta de combinar unicidad con borrado lógico:

```sql
CREATE UNIQUE INDEX users_email_active_idx
  ON users (email) WHERE deleted_at IS NULL;
```

La unicidad aplica solo a los registros vigentes. El email de un usuario eliminado queda liberado, que es el comportamiento que espera cualquiera que usa un backoffice.

**2. Traducción del error de constraint en el `errorHandler`**, como red de seguridad:

```js
if (err instanceof UniqueConstraintError) {
  return next(new ConflictError('Ya existe un registro con ese valor'));
}
```

Esta segunda capa no es redundante: cubre la **condición de carrera** entre la verificación del servicio y el `INSERT`. Si dos peticiones simultáneas intentan crear el mismo email, ambas pasan la verificación y una choca contra el índice. Sin esta traducción, esa petición recibiría un `500`.

Se aplica a los cuatro índices únicos: `users.email`, `users.rut`, `products.sku` y `clients.company_rut`.

### Riesgo principal — y cómo se mitiga

> Si el evaluador abre pgAdmin y ve la fila todavía presente, puede concluir que la eliminación no funcionó.

Mitigación, obligatoria en el video del sistema:

1. Eliminar un registro desde la interfaz.
2. Mostrar que desapareció del listado.
3. Mostrar que `GET /api/products/:id` ahora devuelve `404`.
4. Abrir pgAdmin, mostrar `deleted_at` poblado y explicar que `paranoid` filtra automáticamente.
5. Nombrar la decisión: borrado lógico por reversibilidad y trazabilidad.

Ese medio minuto convierte un riesgo en evidencia de criterio.

## Evidencia

| Qué | Dónde |
|---|---|
| Configuración | `paranoid: true` en los tres modelos |
| Columna | `deleted_at` en las tres migraciones |
| Índice | Sobre `deleted_at` en las tres tablas |
| Respuesta HTTP | `204` al eliminar, `404` si no existe |
| Conteos consistentes | `dashboard.service.js` no necesita filtrar a mano |
