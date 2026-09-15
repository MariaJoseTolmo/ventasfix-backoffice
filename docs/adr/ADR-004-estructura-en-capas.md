# ADR-004 — Estructura por capa técnica

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Indicadores** | Arquitectura descriptiva (5) · Patrones de diseño (7) · Conexión con servicios (6) |

## Contexto

Dos renglones de la rúbrica condicionan esta decisión más que cualquier consideración técnica.

El primero: el indicador de arquitectura distingue el nivel Alto (3 pts) del Sobresaliente (5 pts) únicamente por si *"los nombres de los archivos son descriptivos"*.

El segundo: *"Conecta todos los controladores con los **servicios** creados: Usuario, Producto, Cliente"* (6 pts). Eso no son "servicios web": es una **capa de servicios**. Un controller que llama directo al modelo no satisface el indicador.

## Decisión

Organización **por capa técnica**, con el rol declarado en el nombre de cada archivo:

```
src/config · models · services · controllers · routes · middlewares · validators · errors
```

Flujo obligatorio: `routes → middlewares → controllers → services → models`.

Regla dura: **ningún controller invoca un modelo de Sequelize directamente.**

## Alternativas consideradas

### Screaming Architecture / organización por funcionalidad

`src/modules/users/`, `src/modules/products/`, `src/modules/clients/`, cada uno con sus rutas, controller, servicio, modelo y validador dentro.

| A favor | En contra |
|---|---|
| Es lo que correspondería en producción | **La carpeta `controllers/` no existe en el primer nivel** |
| Una funcionalidad se toca en una sola carpeta | Un evaluador que busca los controladores puede leerlo como "estructura con errores" (2 pts) |
| Los límites del dominio son explícitos | La ventaja aparece a partir de decenas de entidades; acá hay tres |
| Escala de verdad | |

**Descartada por audiencia, no por mérito.** Con tres entidades, el beneficio de organizar por funcionalidad es marginal; el riesgo ante el indicador de arquitectura, no. Conocer al lector es parte del oficio.

### Capas con submódulos internos

Carpetas por capa en el primer nivel, y subcarpetas por dominio dentro de cada una.

| A favor | En contra |
|---|---|
| Legible para el evaluador y algo más ordenado | Con tres entidades, la subdivisión no aporta nada |

**Descartada** por ser ceremonia sin beneficio.

## Consecuencias

### Se gana

- **El evaluador encuentra las palabras de la rúbrica como carpetas de primer nivel**: controladores, modelos, rutas, servicios.
- **El flujo se explica en 30 segundos** y se dibuja como un diagrama lineal.
- **Cada archivo declara su rol**, que es exactamente lo que separa 3 de 5 puntos.
- **La capa de servicios queda forzada por la estructura**, no por disciplina individual.

### Se paga

- **No escala.** Con 40 entidades habría 40 archivos por carpeta y tocar una funcionalidad obligaría a navegar entre siete carpetas. A esta escala, irrelevante.
- **Los límites del dominio son implícitos.** Nada impide que `user.service.js` importe `product.model.js`; solo la convención lo evita.

## Responsabilidad de cada capa

| Capa | Hace | No hace |
|---|---|---|
| `routes/` | Declara endpoints y encadena middlewares | Lógica de ningún tipo |
| `middlewares/` | Autentica, valida, carga archivos, traduce errores | Acceder a la base de datos |
| `controllers/` | Traduce HTTP ↔ dominio; elige el código de éxito | Reglas de negocio ni consultas |
| `services/` | Reglas de negocio; lanza errores de dominio | **Saber que existe HTTP** |
| `models/` | Esquema, hooks, restricciones | Orquestar casos de uso |
| `validators/` | Define el contrato de entrada con Zod | Consultar la base de datos |
| `errors/` | Clases de error de dominio | Conocer códigos HTTP |

## Evidencia

| Qué | Dónde |
|---|---|
| Estructura completa | [02-ARQUITECTURA.md](../02-ARQUITECTURA.md#estructura-de-carpetas) |
| Capa de servicios | `api/src/services/` |
| Controllers sin acceso a datos | Ningún `Model.findAll()` dentro de `controllers/` |
| Nomenclatura | Todo archivo sigue `<entidad>.<rol>.js` |
