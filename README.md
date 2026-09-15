# VentasFix

Backoffice interno de VentasFix: gestión de usuarios, productos y clientes,
con sincronización hacia un ERP Softland simulado. SPA de React sobre una API
REST de Express, con PostgreSQL como almacenamiento.

Ver [`docs/`](docs/) para la arquitectura completa, el modelo de datos, el
contrato de la API y las decisiones de diseño (ADRs).

## Cómo levantar el proyecto

Requisitos: Docker Desktop (o Docker Engine + Compose v2). Nada más.

### Desarrollo (hot reload)

```bash
cp .env.example .env
docker compose up
```

- `api` corre con `nodemon` y bind mount de `api/src`: los cambios de código
  recargan sin reconstruir la imagen.
- Al arrancar, el contenedor `api` corre las migraciones y los seeders
  automáticamente.

### Entrega (lo que ejecuta el evaluador)

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up --build
```

Build de producción, sin `nodemon` ni bind mounts. Mismas migraciones y
seeders al arrancar.

Una vez arriba:

| Qué | URL |
|---|---|
| **Backoffice (front)** | `http://localhost` |
| API | `http://localhost:3000/api` |
| Swagger UI | `http://localhost:3000/api-docs` |
| Health check | `http://localhost:3000/api/health` |
| Mock de Softland | `http://localhost:4000/health` |

En el navegador: abrir `http://localhost`, iniciar sesión con las
credenciales de abajo y recorrer Dashboard, Users, Products y Clients desde el
menú lateral. El front (React + Ant Design, servido por Nginx) solo habla con
su propio origen: Nginx hace proxy de `/api` y `/uploads` al contenedor `api`.

Para probar desde Swagger: `POST /api/auth/login` con las credenciales de
abajo, copiar el `token`, botón **Authorize** → `Bearer <token>`.

## Credenciales del usuario administrador (seed)

| Campo | Valor |
|---|---|
| Email | `admin@ventasfix.cl` |
| Password | `Admin.2026` |

## Tests del backend

Requieren el contenedor `postgres` corriendo (`docker compose up -d postgres`);
la suite crea y migra la base `<DB_NAME>_test` sola.

```bash
cd api && npm install && npm test
```

## Tests y lint del frontend

No necesitan Docker: la API se simula con MSW.

```bash
cd web && npm install && npm test && npm run lint
```

Para desarrollar el front fuera de Docker con la API levantada en `:3000`:
`cd web && npm run dev` (Vite en `http://localhost:5173`, con proxy a `/api`).

## Resetear la base antes de grabar o evaluar

```bash
docker compose -f docker-compose.prod.yml exec api npm run db:reset
```

## Documentación

- [`docs/02-ARQUITECTURA.md`](docs/02-ARQUITECTURA.md) — estructura de carpetas, capas, seguridad, configuración.
- [`docs/03-MODELO-DATOS.md`](docs/03-MODELO-DATOS.md) — tablas, columnas, índices.
- [`docs/04-CONTRATO-API.md`](docs/04-CONTRATO-API.md) — endpoints y códigos de respuesta.
- [`docs/adr/`](docs/adr/) — decisiones de arquitectura (ADRs).
