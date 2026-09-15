# ADR-008 — Imágenes en filesystem con volumen Docker

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Indicadores** | Modelos con todos los campos (6) · CRUD de productos |

## Contexto

Cada producto tiene exactamente una imagen, y el campo es obligatorio. Hay que decidir dónde vive el binario.

Condición particular de esta entrega: el proyecto se entrega comprimido y se demuestra en video. **Cualquier dependencia de internet o de credenciales externas es un riesgo de que "no funcione" en la máquina del evaluador.**

## Decisión

**Filesystem con volumen Docker.**

- `multer` recibe el archivo y lo guarda en `UPLOAD_DIR` (`/app/uploads`), montado como volumen nombrado.
- La columna `image_url` guarda **solo la ruta relativa**.
- Express sirve la carpeta como contenido estático.

## Alternativas consideradas

### Columna `bytea` en PostgreSQL

El binario vive dentro de la tabla `products`.

| A favor | En contra |
|---|---|
| Consistencia transaccional total: si el `INSERT` falla, no queda archivo huérfano | La tabla crece brutalmente y los respaldos se vuelven lentos |
| Un respaldo de la base se lleva todo | Hay que excluir la columna en cada listado o se envían megabytes por producto |
| Sin volumen ni servicio de estáticos | Servir la imagen exige un endpoint que lee de la base en cada petición, sin caché de navegador |

**Descartada.** Se paga en rendimiento todos los días.

### Almacenamiento de objetos (Cloudinary / S3)

| A favor | En contra |
|---|---|
| Es la respuesta de producción: CDN, transformaciones, escala | Requiere cuenta y credenciales |
| Backend sin estado | **Credenciales dentro del comprimido entregado a la institución** |
| Podría argumentarse también como servicio externo | Si el evaluador no tiene credenciales válidas, las imágenes no cargan y el sistema parece roto |

**Descartada.** Correcta en producción, mala apuesta en una entrega evaluada.

### Base64 en columna `TEXT` — antipatrón

Se descarta sin evaluar como alternativa legítima, y se documenta por ser un error frecuente:

- Infla el dato un 33%.
- Mete cientos de kilobytes en **cada** respuesta del listado de productos.
- Rompe el caché del navegador: el binario viaja incrustado en JSON y no puede cachearse como recurso.
- Hace impracticable un `SELECT *` sobre la tabla.

No existe escenario en el que sea la respuesta correcta.

## Consecuencias

### Se gana

- **Separación de responsabilidades correcta**: la base guarda metadatos, el filesystem guarda archivos.
- **Rendimiento**: el navegador cachea la imagen como cualquier estático y el listado responde en milisegundos.
- **Funciona sin conexión**: sin cuentas ni credenciales, el evaluador no depende de nada externo.
- **El volumen sobrevive a `docker compose down`**, lo que permite explicarlo como decisión consciente de persistencia.

### Se paga

- **Configuración de multer**: límite de tamaño, lista blanca de tipos MIME y nombres únicos para evitar colisiones.
- **Archivos huérfanos**: hay que borrar el archivo anterior al reemplazar una imagen. Se resuelve en `product.service.js`.
- **No escala a múltiples instancias** del backend sin almacenamiento compartido. Fuera del alcance.
- **Sin transaccionalidad**: si el `INSERT` falla después de guardar el archivo, queda huérfano. Se mitiga con limpieza en el manejo de errores.

## Configuración

| Variable | Valor por defecto | Propósito |
|---|---|---|
| `UPLOAD_DIR` | `/app/uploads` | Destino de las imágenes |
| `MAX_UPLOAD_SIZE` | `2097152` (2 MB) | Límite por archivo |
| `ALLOWED_MIME_TYPES` | `image/jpeg,image/png,image/webp` | Lista blanca |

Nombre de archivo: `<uuid>.<extensión>`, para evitar colisiones y no exponer el nombre original. La extensión se deriva del tipo MIME de la lista blanca, nunca del nombre que envió el cliente, y antes de aceptar el archivo se comprueban sus bytes de firma (PNG, JPEG, WebP): un `.html` declarado como `image/png` no puede terminar servido como HTML desde `/uploads`.

## Evidencia

| Qué | Dónde |
|---|---|
| Middleware de carga | `api/src/middlewares/upload.middleware.js` |
| Columna | `products.image_url` |
| Volumen | `uploads` en `docker-compose.yml` |
| Servicio de estáticos | `express.static` en `api/src/app.js` |
| Limpieza de huérfanos | `api/src/services/product.service.js` (imagen reemplazada) · `api/src/middlewares/errorHandler.middleware.js` (petición fallida tras la subida) |
