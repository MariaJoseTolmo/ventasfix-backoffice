# Trazabilidad con la rúbrica

Cada indicador de la rúbrica, qué exige el nivel Sobresaliente, dónde lo resuelve la arquitectura y cómo se evidencia. Sirve como lista de verificación antes de la entrega y como guion para los videos.

## Resumen

| Bloque | Puntos |
|---|---:|
| Producto de software | 88 |
| Videos | 12 |
| **Total** | **100** |

Escala al 60% de exigencia: 60 puntos = 4.0 · 100 puntos = 7.0.

## Indicadores del producto

### Componentes del framework — rutas · 5 pts

**Sobresaliente:** "Realiza la construcción de todas las rutas solicitadas."

| | |
|---|---|
| Dónde | `api/src/routes/` — cinco archivos de rutas |
| Cobertura | 15 endpoints CRUD + login + `me` + dashboard + sync |
| Evidencia | `routes/index.js` monta todo; Swagger UI lista cada ruta |

- [ ] Los 5 endpoints de usuarios existen y responden
- [ ] Los 5 de productos existen y responden
- [ ] Los 5 de clientes existen y responden

### Arquitectura descriptiva · 5 pts

**Sobresaliente:** "Se evidencia construcción de la arquitectura del proyecto de forma descriptiva."

> El nivel Alto (3 pts) solo se diferencia en que *"los nombres de los archivos no son descriptivos"*. Dos puntos se juegan en la nomenclatura.

| | |
|---|---|
| Dónde | Estructura completa en [02-ARQUITECTURA.md](02-ARQUITECTURA.md#estructura-de-carpetas) |
| Decisión | [ADR-004](adr/ADR-004-estructura-en-capas.md) |
| Evidencia | Carpetas por capa; cada archivo lleva su rol en el nombre |

- [ ] Todo archivo sigue el patrón `<entidad>.<rol>.js`
- [ ] Ningún archivo se llama `index.js` salvo agregadores reales
- [ ] `docs/` acompaña la entrega

### Patrones de diseño — modelos, controladores y vistas conectados · 7 pts

**Sobresaliente:** "Se evidencia construcción de todos los modelos, controladores y vistas **y su conexión entre ellas**."

> El nivel Alto (5 pts) cae por *"no hay conexión entre ellas"*. Lo que se evalúa es el flujo completo, no las piezas sueltas.

| | |
|---|---|
| Dónde | Flujo `routes → controllers → services → models` |
| Patrones | Tabla en [02-ARQUITECTURA.md](02-ARQUITECTURA.md#patrones-de-diseño-aplicados) |
| Evidencia | Recorrido de una petición de punta a punta |

- [ ] 3 modelos, 5 controladores y 5 vistas existen
- [ ] Se puede seguir un dato desde el formulario React hasta la fila en PostgreSQL

### Componentes reutilizables · 5 pts

**Sobresaliente:** "Se presenta evidencia de creación de componentes reutilizables **con consumo de servicio externo**."

| | |
|---|---|
| Dónde | `web/src/components/common/` y `web/src/components/softland/` |
| Decisión | [ADR-006](adr/ADR-006-mock-softland-con-adapter.md) · [ADR-011](adr/ADR-011-tanstack-query-en-el-front.md) |
| Evidencia | `CrudTable`, `EntityForm`, `ConfirmDelete` usados en los 3 mantenedores; `SoftlandSyncPanel` consume el contenedor externo |

- [ ] El mismo `CrudTable` renderiza usuarios, productos y clientes
- [ ] `SoftlandSyncPanel` llama a `softland-mock` y se ve el request en la pestaña Network
- [ ] `EntityForm` muestra bajo el campo exacto el `details` de un `422` (email `@gmail.com`, umbrales de stock)
- [ ] `CrudTable` muestra error con reintento —no "No records yet"— si la API no responde

### Vistas de usuario · 5 pts

**Sobresaliente:** "**Desarrolla todas las vistas de usuario**: login, dashboard, mantenedor de usuarios, mantenedor de productos, mantenedor de clientes."

| | |
|---|---|
| Dónde | `web/src/pages/` — cinco páginas |
| Evidencia | Navegación completa por el menú lateral |

- [ ] `LoginPage` · `DashboardPage` · `UsersPage` · `ProductsPage` · `ClientsPage`
- [ ] Las 4 vistas privadas comparten la misma cáscara (`AppLayout`: menú lateral + barra superior); el login es una tarjeta centrada con el mismo tema de Ant
- [ ] Las rutas privadas redirigen al login sin sesión

### Conexión de controladores con servicios · 6 pts

**Sobresaliente:** "Conecta todos los controladores con los servicios creados: Usuario, Producto, Cliente."

> Este indicador es el que obliga a tener una **capa de servicios separada**. Un controller que llama directo al modelo no lo satisface.

| | |
|---|---|
| Dónde | `api/src/services/` — cinco servicios más el adapter |
| Decisión | [ADR-004](adr/ADR-004-estructura-en-capas.md) · [ADR-010](adr/ADR-010-errores-de-dominio.md) |
| Evidencia | Ningún controller invoca un modelo de Sequelize directamente |

- [ ] `user.controller` → `user.service` → `user.model`
- [ ] Ídem para producto y cliente
- [ ] Ningún `Model.findAll()` aparece dentro de un controller

### Conexión y configuración de BD/ORM · 6 pts

**Sobresaliente:** "Se evidencia correcta implementación de los modelos **y** la configuración de la Base de Datos en las variables de entorno."

| | |
|---|---|
| Dónde | `api/src/models/` y `api/src/config/database.config.js` |
| Decisión | [ADR-002](adr/ADR-002-sequelize-como-orm.md) · [ADR-008](adr/ADR-008-imagenes-en-filesystem.md) · [ADR-009](adr/ADR-009-precio-venta-derivado.md) |
| Evidencia | `.env.example` documentado; migraciones versionadas |

- [ ] Ninguna credencial está escrita en el código
- [ ] Los 3 modelos tienen **todos** los campos del enunciado
- [ ] `products` incluye la columna `sale_price` visible en pgAdmin
- [ ] `docker compose up` crea el esquema desde cero

### Autorización y autenticación · 8 pts

**Sobresaliente:** "Se evidencia una correcta implementación de Inicio de Sesión o middleware para la validación de los datos."

| | |
|---|---|
| Dónde | `auth.controller.js`, `authenticate.middleware.js`, `validate.middleware.js` |
| Decisión | [ADR-003](adr/ADR-003-jwt-bearer-unico.md) · [ADR-005](adr/ADR-005-zod-fuente-unica-de-contrato.md) |
| Evidencia | Login funcional + dos middlewares operando |

- [ ] Login válido devuelve token; login inválido devuelve `401`
- [ ] Sin token, un endpoint protegido devuelve `401`
- [ ] Token manipulado devuelve `401`
- [ ] Swagger permite autorizar y probar endpoints protegidos

### Cifrado de datos · 5 pts

**Sobresaliente:** "Se evidencia construcción de controlador Registro de Usuario **con el cifrado de la clave**."

| | |
|---|---|
| Dónde | Hook `beforeSave` en `user.model.js` |
| Decisión | [ADR-003](adr/ADR-003-jwt-bearer-unico.md) |
| Evidencia | La columna `password` en pgAdmin muestra un hash `$2b$12$…` |

- [ ] Crear un usuario y verificar en pgAdmin que la clave está hasheada
- [ ] `password` no aparece en ninguna respuesta de la API
- [ ] `BCRYPT_ROUNDS` está en `.env`

### Insertar · Recuperar · Actualizar · Eliminar · 9 pts cada uno (36 pts)

**Sobresaliente en los cuatro:** "…con el código de respuesta HTTP correcto."
**Lo que baja a 7 pts en los cuatro:** "…pero con errores de ejecución **o con carencia de las validaciones**."

| | |
|---|---|
| Dónde | `controllers/` + `services/` + `validators/` + `errorHandler.middleware.js` |
| Decisión | [ADR-005](adr/ADR-005-zod-fuente-unica-de-contrato.md) · [ADR-010](adr/ADR-010-errores-de-dominio.md) · [ADR-007](adr/ADR-007-borrado-logico.md) |
| Evidencia | Tabla de códigos en [04-CONTRATO-API.md](04-CONTRATO-API.md#códigos-de-respuesta) |

- [ ] `POST` devuelve `201` con `Location`
- [ ] `GET /:id` inexistente devuelve `404`, no `500`
- [ ] `PUT` valida igual que `POST`
- [ ] `DELETE` devuelve `204` sin cuerpo
- [ ] Enviar un campo vacío devuelve `422` con el campo señalado
- [ ] Email fuera de `@ventasfix.cl` es rechazado
- [ ] Duplicar email, RUT o SKU devuelve `409`
- [ ] Reutilizar el email de un usuario **eliminado** funciona (índice único parcial)
- [ ] Subir una imagen sobredimensionada devuelve `413`, no `500`
- [ ] Toda actualización usa `findByPk` + `save()`, nunca `Model.update(...)`

## Indicadores de video · 6 pts cada uno

Los dos videos se evalúan con los mismos cinco aspectos. **Los 12 puntos no dependen del código**, así que conviene no dejarlos para el final.

| Aspecto | Requisito |
|---|---|
| Calidad | Imagen legible y audio claro a volumen parejo |
| Tiempo | Máximo 10 minutos cada uno |
| Estructura | Portada con título, logo institucional y nombre → presentación en cámara → demostración → resumen de cierre |
| Compartir | Enlace por separado, con acceso habilitado para quien tenga el enlace |
| Expresión oral | Explicación clara, con lenguaje técnico correcto |

Nombres exigidos: `ExF_Sistema_apellido_nombre` y `EXF_API_apellido_nombre`.
Archivo comprimido: `EXF_APELLIDO_NOMBRE`.

### Puntos de la arquitectura que conviene mostrar

| Video | Momento | Qué decir |
|---|---|---|
| Sistema | Al mostrar el borrado | Que es **lógico**: el registro desaparece del listado pero queda auditable. Abrir pgAdmin y mostrar `deleted_at` poblado, explicando que `paranoid` filtra automáticamente |
| Sistema | Al crear un usuario | Abrir pgAdmin y mostrar el hash bcrypt en la columna `password` |
| Sistema | Al listar productos | Señalar que `sale_price` lo recalcula el hook, no el formulario |
| API | Al abrir Swagger | Que el spec se genera desde los mismos schemas Zod que validan, así que no puede desincronizarse |
| API | Al probar un `POST` inválido | Mostrar el `422` con el detalle por campo |
| API | Al autenticar | Usar el botón *Authorize*, mostrar un `401` antes y un `200` después |
| API | Al sincronizar con Softland | Explicar el patrón Adapter y que el ERP consume los mismos endpoints que el backoffice |

> **Advertencia sobre el borrado lógico.** Si el evaluador abre la tabla y ve la fila todavía presente, puede concluir que la eliminación no funcionó. Mostrarlo explícitamente en cámara no es opcional.

## Verificación final antes de entregar

- [ ] `docker compose -f docker-compose.prod.yml up --build` levanta todo desde cero
- [ ] El `README.md` de la raíz indica qué comando ejecutar
- [ ] `.env.example` está presente y completo; `.env` real **no** se incluye
- [ ] Los seeders crean un usuario administrador y las credenciales están documentadas
- [ ] `node_modules/` no está en el comprimido
- [ ] Las 5 vistas se ven terminadas y consistentes entre sí
- [ ] Los dos videos duran menos de 10 minutos y los enlaces son accesibles
