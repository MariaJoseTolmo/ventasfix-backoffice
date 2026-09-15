# ADR-001 — SPA React + API REST en monorepo

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Indicadores** | Arquitectura (5) · Vistas (5) · Componentes reutilizables (5) · Conexión con servicios (6) |
| **Nota** | Las alternativas se evaluaron cuando el template de la empresa era obligatorio. Esa restricción fue **levantada** por el docente; ver [ADR-013](ADR-013-ant-design-como-base-de-ui.md) |

## Contexto

El sistema tiene **dos clientes con necesidades distintas**: los trabajadores de VentasFix, que necesitan una interfaz gráfica con login; y Softland, el ERP contratado, que necesita consumir los datos por API.

El enunciado pide explícitamente "generar las tablas de la base de datos, modelos, controladores, rutas y vistas", vocabulario de MVC clásico. Pero también exige una API para terceros. La pregunta es si son una aplicación o dos.

El riesgo central: si el backoffice y la API son caminos de código separados, la regla de negocio "el email debe terminar en `@ventasfix.cl`" hay que escribirla dos veces. Y la segunda copia se olvida.

## Decisión

Un monorepo con dos aplicaciones:

- **`api/`** — Express expone únicamente API REST. Es la **única** puerta de acceso a la base de datos.
- **`web/`** — SPA de React que consume esa API igual que lo haría Softland.

No existe renderizado en servidor ni rutas web paralelas a las rutas de API.

## Alternativas consideradas

### Monolito con renderizado en servidor (EJS/Pug) + API aparte

El backoffice se renderiza en el servidor con un motor de plantillas y la API vive bajo `/api`.

| A favor | En contra |
|---|---|
| El template HTML se aplica casi literal, con riesgo mínimo ante la exigencia del enunciado | React queda fuera del proyecto, siendo parte del stack definido |
| Es el MVC que la rúbrica describe textualmente | "Componentes reutilizables" solo se defiende con *partials* de EJS, argumento débil para 5 puntos |
| Menos superficie de error | Tiende a duplicar controllers web y de API |

**Descartada** porque sacrifica React y debilita el indicador de componentes reutilizables.

### Híbrido: renderizado en servidor + islas de React

Express sirve el template intacto y se montan componentes React puntuales dentro de las páginas.

| A favor | En contra |
|---|---|
| Template intacto **y** componentes React reales | Dos pipelines de build conviviendo |
| Cubre ambos indicadores sin ceder ninguno | Difícil de explicar en 10 minutos de video |

**Descartada** por costo de configuración que no devuelve puntos adicionales.

## Consecuencias

### Se gana

- **Una sola fuente de verdad del negocio.** Las reglas viven en `services/` y valen para los dos clientes.
- **La API se prueba sola.** El video de la API demuestra el mismo backend que usa el backoffice, no una fachada.
- **Componentes reutilizables de verdad.** React da el indicador sin argumentaciones forzadas.
- **Despliegue limpio en Docker.** Cada aplicación es un contenedor con su ciclo de vida.

### Se paga

- ~~**Hay que portar el template.**~~ **Costo eliminado.** El docente liberó el diseño del front, así que se parte de componentes que ya son React. Ver [ADR-013](ADR-013-ant-design-como-base-de-ui.md).
- **Hay que defender que una página React es una "vista".** Se explica en el video mostrando `pages/` y la navegación.
- **CORS entra en juego.** Se resuelve con lista blanca por entorno.

## Evidencia

| Qué | Dónde |
|---|---|
| Aplicaciones separadas | `api/` y `web/` |
| Vistas | `web/src/pages/` — cinco páginas |
| API única | `api/src/routes/index.js` monta todo bajo `/api` |
| Sin rutas web paralelas | No existe ningún motor de plantillas en `api/` |
