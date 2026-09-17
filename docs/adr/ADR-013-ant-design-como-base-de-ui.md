# ADR-013 — Ant Design como base de UI

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Reemplaza** | La restricción de template obligatorio del enunciado |
| **Indicadores** | Componentes reutilizables (5) · Vistas de usuario (5) |

## Contexto

El enunciado exigía aplicar un template provisto por la empresa y no aceptar otro en su reemplazo. Ese template nunca estuvo disponible: el enlace de Google Drive del PDF estaba truncado.

**El docente del ramo confirmó que el diseño del front es libre.** Eso elimina el bloqueante y, de paso, elimina el trabajo de portar HTML y Bootstrap a componentes React — porque ahora se puede partir de algo que ya es React.

Pero la decisión no es cosmética. Hay una tensión con el indicador de 5 puntos:

> *"Se presenta evidencia de **creación de componentes reutilizables** con consumo de servicio externo"*

Cuanto más resuelve la librería, menos código propio hay para mostrar. Del otro lado de la balanza: 36 puntos en CRUD, 8 en autenticación y 12 en videos, y ninguno de ellos mejora por haber escrito una tabla a mano.

## Decisión

**Ant Design** como librería de componentes, con una capa propia de composición en `web/src/components/common/`.

Componentes de Ant que hacen el trabajo pesado:

| Componente | Resuelve |
|---|---|
| `Layout` · `Menu` | Cáscara del backoffice: barra lateral y superior |
| `Table` | Los tres listados, con orden y paginación |
| `Form` · `Input` · `InputNumber` · `Upload` | Los formularios de alta y edición |
| `Modal` · `Popconfirm` | Diálogos y confirmación de borrado |
| `Statistic` · `Card` | Los tres conteos del dashboard |
| `message` · `notification` | Retroalimentación de cada operación |

## Alternativas consideradas

### Tailwind CSS + shadcn/ui

No es una dependencia: se copia el código de cada componente al repositorio.

| A favor | En contra |
|---|---|
| Los componentes **viven en el código propio**: el indicador de 5 pts queda indiscutible | La tabla con orden, paginación y acciones se construye a mano — un día entero |
| Control total del diseño; accesibilidad correcta vía Radix | Obliga a tomar decisiones de diseño que la librería daba resueltas |
| Bundle mínimo | Más configuración: Tailwind + shadcn + Vite |

**Descartada por presupuesto de tiempo.** Es la opción más fuerte para el indicador de componentes, pero le quita horas a los 36 puntos de CRUD y a los 12 de videos.

### MUI (Material UI)

| A favor | En contra |
|---|---|
| El ecosistema más grande de React | El `DataGrid` con filtros y edición en línea es **de pago**; el gratuito es más limitado que la `Table` de Ant |
| Sistema de theming potente | Material Design está pensado para móvil, no para paneles densos |
| | Más verboso que Ant para el mismo resultado |

**Descartada.** Una tabla es el 60% de este proyecto y es justo donde MUI es más débil sin licencia.

## Cómo se sostiene el indicador de componentes reutilizables

Usar una librería **no exime** de crear componentes propios. La evidencia está en la capa de composición, y tiene que ser real.

| Componente propio | Qué encapsula | Usado en |
|---|---|---|
| `CrudTable` | `Table` de Ant + columna de acciones + estados de carga, vacío y error (con reintento) | 3 mantenedores |
| `EntityForm` | `Form` de Ant + mapeo de los errores `422` al campo correspondiente (y resumen para los que no calzan con ningún campo) | 3 formularios |
| `ConfirmDelete` | `Popconfirm` + llamada a la mutación + notificación | 3 borrados |
| `PageHeader` | Título y acción primaria | Dashboard y los 3 mantenedores |
| `StatCard` | `Statistic` + estado de carga | 3 tarjetas del dashboard |
| `SoftlandSyncPanel` | Consumo del servicio externo | Productos y dashboard |
| `StockGauge` | Estado del stock (`stockStatus`) + barra con los tres umbrales + valor en monospace | Columna Stock de `ProductsPage` y panel "Needs attention" del dashboard |

El componente que mejor sostiene el indicador es **`EntityForm`**: traduce el `details` del error `422` de la API al campo exacto del formulario. Eso no lo da Ant Design ni ninguna librería — nace del contrato de la API propia, y es la prueba de que existe una capa de composición pensada, no un envoltorio decorativo.

### Tres páginas explícitas, no una genérica configurable

Los tres mantenedores son estructuralmente idénticos, y la tentación es construir un único `<CrudPage entity={...} />` configurable e instanciarlo tres veces.

**Se descarta.** Un componente manejado por configuración termina con condicionales para cada caso particular, se vuelve ilegible y es difícil de explicar en cámara. La reutilización tiene que vivir en los componentes, no en una abstracción que se traga las tres páginas.

Cada mantenedor es una página explícita de unas ochenta líneas que compone los mismos componentes con distintas columnas y schemas. Se lee de un vistazo y la reutilización se ve igual de bien.

## Consecuencias

### Se gana

- **Las 5 vistas se cubren con piezas que ya existen**: el backoffice se ve profesional en horas, no en días.
- **`Form` de Ant encaja con el contrato de la API**: mapear el `422` con detalle por campo al formulario es directo.
- **`Statistic` resuelve el dashboard** casi sin código.
- **No hace falta criterio de diseño propio**: la estética de panel administrativo viene dada.
- **El tiempo ahorrado va donde están los puntos**: CRUD y videos.

### Se paga

- **Los componentes propios son envoltorios**, así que hay menos código propio que mostrar. Se compensa con la capa de composición de la tabla de arriba.
- **Bundle grande.** Irrelevante para un backoffice interno.
- **La estética de Ant es muy reconocible** y personalizarla a fondo implica pelearse con la librería.
- **Dependencia de terceros en la capa de presentación**: migrar a otra librería sería reescribir las vistas.

## Rediseño visual e informativo (2026-09-16)

### Token "Ejecutivo": fondo claro, no oscuro

El `ConfigProvider` define un tema propio vía `token` y `components` (antes iba vacío). Se evaluó un backoffice completo en tema oscuro —look más "SaaS moderno"— pero se descarta para el fondo de página: el sidebar sí queda en teal oscuro (`#0c3b3f`), pero el contenido usa fondo claro (`#f3f5f4`) y superficies blancas.

El motivo es el video de la demostración, no el gusto estético: un fondo oscuro con texto claro se degrada visiblemente con la compresión de YouTube (bandas de color, halos alrededor del texto), mientras que un fondo claro con texto oscuro sobrevive la compresión casi intacto. Dado que el 6 de los 12 puntos de video depende de "imagen legible", el tema oscuro completo es un riesgo que no vale la pena correr por estética.

### Los umbrales de stock pasan a ser información de primer nivel

Antes, `minimum_stock`/`low_stock`/`high_stock` (ver [03-MODELO-DATOS.md](../03-MODELO-DATOS.md#umbrales-de-stock)) solo se usaban para pintar un `Tag` de color en una columna más. Era una decisión de datos sin reflejo real en la interfaz: el evaluador tenía que leer tres números para entender si un producto necesitaba atención.

Con el rediseño, los umbrales conducen tres piezas de la UI, no una:

- `StockGauge` muestra el valor actual contra los tres umbrales en una sola barra, con su propio `stockStatus()` puro y testeable.
- La columna Stock de `ProductsPage` ordena por **estado** (crítico → bajo → sano → sobrestock), no por el número crudo: un producto con 5 unidades pero sobre su mínimo ya no aparece "peor" que uno con 50 unidades bajo su mínimo.
- El dashboard agrega un panel "Needs attention" que filtra y prioriza exactamente los productos que `stockStatus()` marca como no sanos.

Es la diferencia entre guardar el umbral en la base de datos y que el umbral efectivamente gobierne lo que ve quien administra el catálogo.

## Efecto sobre decisiones previas

| Decisión | Efecto |
|---|---|
| [ADR-001](ADR-001-spa-react-mas-api-rest.md) | **Desaparece su principal costo.** Ya no hay que portar el template a React |
| [ADR-011](ADR-011-tanstack-query-en-el-front.md) | Sin cambios. TanStack Query alimenta los componentes de Ant igual que a cualquier otro |
| [ADR-005](ADR-005-zod-fuente-unica-de-contrato.md) | Se refuerza: el `details` del `422` alimenta directo los errores de campo de `Form` |

## Evidencia

| Qué | Dónde |
|---|---|
| Composición propia | `web/src/components/common/` |
| Cáscara del backoffice | `web/src/components/layout/` |
| Las cinco vistas | `web/src/pages/` |
| Mapeo de errores de API a campos | `web/src/components/common/EntityForm.jsx` |
