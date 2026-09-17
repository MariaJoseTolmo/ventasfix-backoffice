# Guion de los videos

Dos videos de **máximo 10 minutos** cada uno, 6 puntos cada uno. Se evalúan con cinco aspectos idénticos y **ninguno depende del código**: calidad, tiempo, estructura, forma de compartir y expresión oral. Son los 12 puntos más baratos de la evaluación y los que más se pierden por dejarlos para el final.

## Lo que exige la rúbrica, punto por punto

| Aspecto | Exigencia | Cómo se cumple |
|---|---|---|
| Calidad | Imagen legible, audio claro y parejo | Grabar a 1080p, zoom del navegador al 125%, micrófono a 15 cm, sin música de fondo |
| Tiempo | Máximo 10 minutos | Apuntar a **8:30**. Un video de 10:10 pierde el aspecto completo |
| Estructura | Portada → presentación en cámara → demostración → resumen | Las cuatro partes, en ese orden, sin saltarse ninguna |
| Compartir | Enlace con acceso para quien lo tenga | YouTube *no listado* o Drive con "cualquiera con el enlace". **Probar el enlace desde una ventana de incógnito** |
| Expresión oral | Clara, con lenguaje técnico correcto | Guion escrito, no improvisar. Grabar la voz en una toma aparte si hace falta |

Nombres obligatorios:

| Entregable | Nombre |
|---|---|
| Video del sistema | `ExF_Sistema_<apellido>_<nombre>` |
| Video de la API | `EXF_API_<apellido>_<nombre>` |
| Comprimido | `EXF_<APELLIDO>_<NOMBRE>` |

## Estructura común

Ambos videos siguen la misma secuencia de cuatro bloques. Los tiempos son objetivos, no límites.

| Bloque | Duración | En cámara | Contenido |
|---|---|---|---|
| 1. Portada | 0:00 – 0:15 | Diapositiva estática | Título del video · logo del Instituto Profesional San Sebastián · nombre completo |
| 2. Presentación | 0:15 – 1:00 | **Sí, obligatorio** | Quién presenta, qué se va a mostrar, con qué stack |
| 3. Demostración | 1:00 – 8:00 | No hace falta | El recorrido de abajo |
| 4. Cierre | 8:00 – 8:30 | Opcional | Resumen de lo mostrado en tres frases |

La rúbrica dice que al inicio es necesario aparecer en pantalla y luego no. **No conviene aparecer durante toda la demostración**: la cámara tapa parte de la pantalla y distrae de lo que se evalúa.

---

## Video 1 — Sistema

**Objetivo:** demostrar las 5 vistas y el CRUD completo desde la interfaz, dejando en evidencia las decisiones que la rúbrica premia.

### Bloque 2 — Presentación (0:15 – 1:00)

Texto sugerido, para decir en cámara:

> Hola, soy [nombre completo]. En este video muestro el backoffice de VentasFix, un sistema de administración de usuarios, productos y clientes. Está construido con React y Ant Design en el front, una API REST en Node y Express, PostgreSQL como base de datos y Sequelize como ORM, todo desplegado con Docker. Voy a recorrer el login, el dashboard y los tres mantenedores, y a mostrar cómo se refleja cada operación en la base de datos.

### Bloque 3 — Demostración (1:00 – 8:00)

| Min | Pantalla | Qué hacer | Qué decir (idea central) |
|---|---|---|---|
| 1:00 | Terminal | `docker compose -f docker-compose.prod.yml up` ya levantado; mostrar `docker compose ps` con los 4 contenedores | "Cuatro contenedores: el front servido por Nginx, la API, PostgreSQL y un mock de Softland. Un solo comando levanta todo desde cero, incluidas las migraciones y el usuario inicial." |
| 1:30 | Login | Intentar con contraseña incorrecta → error. Luego entrar con el admin | "El login devuelve un JWT que el front guarda y envía en cada petición. Con credenciales incorrectas la API responde 401." |
| 2:00 | Dashboard | Mostrar los tres conteos | "Los conteos vienen de un único endpoint agregado, `/api/dashboard/summary`, para no hacer tres viajes." |
| 2:30 | Usuarios → Crear | Dejar un campo vacío y pulsar **Save** → error bajo ese campo (no sale ninguna petición: es la primera línea de defensa del formulario). Poner un email `@gmail.com` → la API responde `422` y el error aparece bajo **Email**. Corregir y guardar | "Ningún campo puede ir vacío y el email debe ser del dominio de la empresa. Los obligatorios los frena el formulario; el resto de reglas —dominio del email, RUT válido, umbrales— viven en un schema Zod en el backend y el front solo marca el campo que la API señaló." |
| 3:30 | **pgAdmin** | Abrir la tabla `users`, mostrar la fila recién creada | **"La contraseña está cifrada con bcrypt. El hash empieza con `$2b$12$`. Lo hace un hook del modelo, así que no existe forma de guardar una contraseña en texto plano."** |
| 4:00 | Usuarios → Editar | Cambiar el apellido, guardar, ver la tabla actualizada sola | "La tabla se refresca sin recargar: TanStack Query invalida la caché después de cada mutación." |
| 4:30 | Productos → Crear | Subir imagen, poner precio neto 10.000. Señalar que el formulario **no tiene** campo de precio de venta. Guardar y mostrar la columna **Sale price** con 11.900 | **"El precio de venta no lo escribe el usuario: el formulario ni siquiera lo pide. Lo calcula un hook del modelo con la tasa de IVA que vive en una variable de entorno. Es imposible que quede desincronizado."** |
| 5:15 | Productos | Poner stock mínimo mayor que stock bajo → la API responde `422` y el error aparece bajo **Minimum stock** | "Los umbrales de stock tienen una relación obligatoria, validada en Zod y además con un CHECK en PostgreSQL." |
| 5:45 | Clientes → Crear y editar | Rápido, sin detenerse | "Mismo patrón, mismos componentes: `CrudTable`, `EntityForm` y `ConfirmDelete` se reutilizan en los tres mantenedores." |
| 6:15 | Clientes → **Eliminar** | Pulsar **Delete**, confirmar en el `Popconfirm`, ver que desaparece del listado sin recargar | "El borrado es lógico." |
| 6:30 | **pgAdmin** | Mostrar la fila con `deleted_at` poblado | **"La fila sigue en la tabla con la fecha de borrado. Sequelize la excluye automáticamente de todas las consultas. Es reversible y queda trazabilidad: en un backoffice real, un clic equivocado no puede destruir información."** |
| 7:00 | Dashboard | Volver y mostrar que el conteo de clientes bajó en uno | "El conteo respeta el borrado lógico sin código adicional." |
| 7:15 | Productos → Softland | Pulsar **Sync with Softland** en `SoftlandSyncPanel`, abrir la pestaña Network y mostrar `POST /api/softland/sync` → `200` con `sent`/`received`/`status` | "Este panel consume un servicio externo: el mock de Softland, que corre en otro contenedor con su propia URL. La API lo integra con un Adapter que traduce su formato al nuestro." |
| 7:45 | Editor de código | Mostrar `web/src/components/common/` y `web/src/pages/` | "Cinco vistas, componentes reutilizables en `common/`. Las páginas orquestan; los componentes solo presentan." |

### Bloque 4 — Cierre (8:00 – 8:30)

> Para resumir: el sistema tiene login con JWT, dashboard y tres mantenedores completos. Las contraseñas se guardan cifradas, el precio de venta se calcula solo, el borrado es lógico y reversible, y los componentes se reutilizan en todas las vistas. Todo se levanta con un comando de Docker. Gracias.

---

## Video 2 — API

**Objetivo:** demostrar los 15 endpoints CRUD con sus códigos HTTP correctos, la autenticación y la arquitectura en capas. **Este video sostiene 36 puntos de CRUD + 8 de autenticación + 6 de servicios + 7 de patrones.**

Herramienta: **Swagger UI**. Se puede abrir en `http://localhost/api-docs` (a través de Nginx) o en `http://localhost:3000/api-docs` (directo a la API): el spec declara un servidor relativo, así que «Try it out» usa siempre el origen de la página y no cruza puertos. Es la más legible en pantalla y permite mostrar el spec y probar en el mismo lugar. Tener Postman o `curl` como respaldo por si algo falla en vivo.

### Bloque 2 — Presentación (0:15 – 1:00)

> Hola, soy [nombre completo]. En este video muestro la API REST de VentasFix, pensada para que sistemas de terceros como Softland operen sobre los mismos datos que el backoffice. Está construida con Node, Express, Sequelize y PostgreSQL, documentada con Swagger y autenticada con JWT. Voy a recorrer la arquitectura en capas, la autenticación y las operaciones de crear, leer, actualizar y eliminar, prestando atención a los códigos de respuesta HTTP.

### Bloque 3 — Demostración (1:00 – 8:00)

| Min | Pantalla | Qué hacer | Qué decir (idea central) |
|---|---|---|---|
| 1:00 | Editor de código | Mostrar el árbol `api/src/`: `routes/`, `controllers/`, `services/`, `models/`, `middlewares/`, `validators/`, `errors/` | **"Arquitectura en capas. Cada archivo lleva su rol en el nombre. Una petición entra por la ruta, pasa por los middlewares, el controller la delega en el servicio, y el servicio usa el modelo. El servicio no sabe que existe HTTP."** |
| 1:45 | Editor | Abrir `product.controller.js` y mostrar un método de 3 líneas | "El controller no decide códigos de error. Solo delega y hace `next(err)`." |
| 2:00 | Editor | Abrir `errorHandler.middleware.js` y mostrar la tabla de mapeo | "Los servicios lanzan errores de dominio: `NotFoundError`, `ConflictError`. Un único middleware los traduce a 404, 409, 422. Un solo lugar, imposible equivocarse en un endpoint." |
| 2:30 | Swagger | Abrir `/api-docs`, recorrer los grupos de endpoints | "La documentación se genera desde los mismos schemas Zod que validan las peticiones. No puede quedar desactualizada." |
| 3:00 | Swagger | Intentar `GET /api/products` sin token → **401** | "Todo endpoint exige autenticación." |
| 3:15 | Swagger | `POST /api/auth/login` con el admin → copiar el token → botón **Authorize** → pegar | "El login verifica el hash con bcrypt y firma un JWT con vigencia de 15 minutos." |
| 3:45 | Swagger | `GET /api/products` → **200** con la lista | "Recuperar: 200." |
| 4:00 | Swagger | `GET /api/products/9999` → **404** | "Un id inexistente devuelve 404, no 500. El servicio lanza `NotFoundError`." |
| 4:15 | Swagger | `POST /api/products` con `name` vacío → **422** con `details` | **"Crear con datos inválidos: 422 y el detalle campo por campo. Ningún campo puede ir vacío."** |
| 4:45 | Swagger | `POST /api/products` válido → **201** con cabecera `Location` | "Crear correcto: 201 Created y la ubicación del recurso nuevo. Fijate que `sale_price` viene calculado aunque no lo mandé." |
| 5:15 | Swagger | Repetir el mismo `POST` con el mismo SKU → **409** | "Duplicado: 409 Conflict." |
| 5:30 | Swagger | `PUT /api/products/{id}` cambiando `net_price` → **200**, `sale_price` recalculado | "Actualizar: 200. El hook recalculó el precio de venta." |
| 6:00 | Swagger | `DELETE /api/products/{id}` → **204** sin cuerpo | "Eliminar: 204 No Content." |
| 6:15 | Swagger | `GET /api/products/{id}` del recién borrado → **404** | "Desde afuera el recurso dejó de existir." |
| 6:30 | **pgAdmin** | Mostrar la fila con `deleted_at` | **"Pero la fila sigue ahí: borrado lógico. Es seguro y reversible."** |
| 6:50 | Swagger | `POST /api/users` con email `@gmail.com` → **422**. Luego válido → **201**. Mostrar en pgAdmin el hash | "Registro de usuario con cifrado de la clave." |
| 7:20 | Swagger | `POST /api/softland/sync` → **200** | "Integración con el servicio externo a través del Adapter." |
| 7:40 | Editor | Abrir `product.service.js`, señalar `findByPk` + `save()` | "Las actualizaciones pasan siempre por la instancia para que los hooks se ejecuten." |

### Bloque 4 — Cierre (8:00 – 8:30)

> Para resumir: la API expone los quince endpoints de usuarios, productos y clientes, más login, dashboard e integración con Softland. Cada operación responde el código HTTP que corresponde —201, 200, 204, 404, 409, 422— porque el mapeo vive en un solo middleware. La validación y la documentación salen del mismo schema. Gracias.

---

## Antes de grabar

- [ ] Base de datos **reseteada** (`docker compose -f docker-compose.prod.yml exec api npm run db:reset`) para que los ids sean predecibles y no haya basura de pruebas
- [ ] pgAdmin abierto con las tres tablas en pestañas, ya conectado
- [ ] Swagger ya autorizado en una pestaña de respaldo, por si el login falla en vivo
- [ ] Una imagen de producto lista en el escritorio para subir
- [ ] Datos de prueba escritos en un bloc de notas para copiar y pegar (evita errores de tipeo en cámara)
- [ ] Zoom del navegador al 125% y del editor a 16pt
- [ ] Notificaciones del sistema silenciadas
- [ ] Diapositiva de portada lista, con logo y nombre
- [ ] Guion impreso o en un segundo monitor

## Errores que cuestan puntos

| Error | Consecuencia | Prevención |
|---|---|---|
| Pasarse de 10 minutos | Se pierde el aspecto "tiempo" completo | Apuntar a 8:30 y cortar en edición |
| Mostrar el borrado sin abrir pgAdmin | El evaluador puede creer que no borra | La toma de `deleted_at` es obligatoria en los dos videos |
| Enlace privado | Se pierde el aspecto "compartir" | Probar desde incógnito antes de entregar |
| Improvisar la explicación | Se pierde "expresión oral" por titubeos | Guion escrito; grabar audio aparte si hace falta |
| Mostrar `sale_price` sin explicar que se calcula | Se desperdicia una decisión de diseño | La frase del hook es obligatoria |
| Decir "llamo a destroy" | Lenguaje técnico pobre | Nombrar `paranoid`, `deleted_at`, "borrado lógico" |
| No nombrar la capa de servicios | Se pierde evidencia de 6 pts | La frase "el servicio no sabe que existe HTTP" es obligatoria |

## Siguiente paso

Cuando el backend esté listo, ensayar el video 2 completo una vez con cronómetro. Si pasa de 9 minutos, recortar del bloque 3 los pasos de clientes, nunca los de códigos HTTP.
