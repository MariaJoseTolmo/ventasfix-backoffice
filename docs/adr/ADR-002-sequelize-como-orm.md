# ADR-002 — Sequelize como ORM

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Indicadores** | Conexión y configuración de BD/ORM (6) · Cifrado (5) |

## Contexto

El indicador de base de datos exige *"correcta implementación de los modelos **y** la configuración de la Base de Datos en las variables de entorno"*, y el nivel inmediatamente inferior cae por *"no con todos los campos solicitados"*. O sea: el evaluador va a abrir los archivos de modelos y contar campos.

Además hay dos reglas que conviene que la capa de datos garantice por sí misma, sin depender de que alguien se acuerde de invocarlas:

- La contraseña debe guardarse cifrada, siempre.
- `sale_price` debe corresponder siempre a `net_price × (1 + IVA)`.

## Decisión

**Sequelize** como ORM, con `sequelize-cli` para migraciones y seeders.

Un archivo por modelo en `api/src/models/`, y las reglas invariantes implementadas como *hooks* del modelo.

## Alternativas consideradas

### Prisma

| A favor | En contra |
|---|---|
| Experiencia de desarrollo muy superior; cliente tipado con autocompletado real | Los modelos viven en **un** archivo DSL, no en archivos por entidad — el evaluador que busca "los modelos" puede no darlo por evidenciado |
| `migrate dev` es lo mejor del ecosistema | Sin campos calculados en el esquema |
| `DATABASE_URL` en `.env` queda directo | Sin hooks de modelo: el hash de contraseña se va al servicio y deja de ser invariante |
| | Agrega un paso de `generate` al build de Docker |

**Descartada.** La ventaja técnica es real, pero el costo es perder las garantías a nivel de modelo, que es justo lo que sostiene dos indicadores.

### Drizzle ORM

| A favor | En contra |
|---|---|
| El más elegante de los tres; SQL visible, sin capa mágica | El menos conocido en contexto académico |
| Migraciones por diferencia | Sin hooks ni campos virtuales |
| Peso mínimo | Documentación que asume dominio previo de SQL |

**Descartada.** No suma puntos y sí agrega riesgo de explicación.

## Consecuencias

### Se gana

- **Los modelos son evidencia inequívoca.** Tres archivos, un vistazo, todos los campos a la vista.
- **Invariantes en el modelo, no en cada servicio.** `beforeSave` cifra la contraseña y recalcula `sale_price` en un solo lugar, en vez de repetirlo en cada caso de uso. Ver la advertencia sobre operaciones masivas más abajo.
- **Validación en dos niveles.** `allowNull: false`, `isEmail`, `is: /@ventasfix\.cl$/` como red de seguridad además de Zod.
- **Borrado lógico gratis.** `paranoid: true` es una línea por modelo ([ADR-007](ADR-007-borrado-logico.md)).
- **Terreno conocido.** Es el ORM estándar en cursos de Node; nadie pierde tiempo peleando con la herramienta.

### Se paga

- **Sin tipado.** No hay chequeo estático sobre los campos del modelo.
- **API más verbosa** que la de Prisma o Drizzle.
- **Riesgo de N+1** si se descuidan los `include`. Irrelevante aquí: no hay relaciones entre entidades.
- **Los hooks no cubren SQL directo.** Un `INSERT` manual se los saltea. Por eso las reglas críticas también van como `CHECK` en la migración.

### Advertencia crítica: las operaciones masivas no disparan hooks de instancia

Sequelize distingue entre operaciones sobre **instancias** y operaciones **masivas**, y solo las primeras disparan `beforeSave` / `beforeUpdate` / `beforeCreate`.

| Operación | ¿Dispara hooks de instancia? |
|---|---|
| `Model.create(data)` | Sí |
| `instance.save()` | Sí |
| `Model.update(data, { where })` | **No** — solo `beforeBulkUpdate` |
| `Model.bulkCreate(rows)` | **No** — solo `beforeBulkCreate` |
| `Model.destroy({ where })` | **No** — solo `beforeBulkDestroy` |

Consecuencia concreta: si `user.service.js` actualizara con `User.update({ password }, { where: { id } })`, **la contraseña se guardaría en texto plano**. Lo mismo con `sale_price`: quedaría desincronizado sin que nada avise.

**Regla obligatoria para toda la capa de servicios:**

```js
// Correcto — dispara los hooks
const user = await User.findByPk(id);
if (!user) throw new NotFoundError('Usuario no encontrado');
user.set(data);
await user.save();

// Incorrecto — se saltea el cifrado
await User.update(data, { where: { id } });
```

Si alguna vez hace falta una actualización masiva, debe pasar `{ individualHooks: true }` explícitamente.

Como red de seguridad adicional, los modelos registran también los hooks masivos (`beforeBulkUpdate`, `beforeBulkCreate`) aplicando la misma transformación, para que un descuido no termine en una contraseña legible en la base.

## Evidencia

| Qué | Dónde |
|---|---|
| Modelos | `api/src/models/user.model.js`, `product.model.js`, `client.model.js` |
| Configuración por entorno | `api/src/config/database.config.js` + `.env.example` |
| Esquema versionado | `api/migrations/` |
| Datos iniciales | `api/seeders/` |
| Cifrado como invariante | Hook `beforeSave` en `user.model.js` |
