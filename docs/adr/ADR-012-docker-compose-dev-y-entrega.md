# ADR-012 — Dos composes: desarrollo y entrega

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Indicadores** | Ninguno directo · condiciona que el evaluador logre ejecutar el proyecto |

## Contexto

Ningún indicador de la rúbrica menciona Docker. Pero **todos los indicadores dependen de que el evaluador logre ejecutar el proyecto.** Si abre el comprimido y tiene que instalar PostgreSQL, crear la base a mano y adivinar variables de entorno, empieza a evaluar con mala predisposición — y cada paso manual es una oportunidad de que algo falle en su máquina y se cobre como error del proyecto.

Pero hay una tensión con el trabajo diario: si el front vive en un contenedor con el build estático, cada cambio de CSS obliga a reconstruir la imagen. El desarrollo se vuelve insoportable antes del segundo día.

Son dos necesidades legítimas y opuestas: iteración rápida durante el desarrollo, reproducibilidad exacta en la entrega.

## Decisión

**Dos archivos de composición**, uno por necesidad.

| Archivo | Para | Front | API |
|---|---|---|---|
| `docker-compose.yml` | Desarrollo | Vite con HMR | `nodemon` + *bind mount* |
| `docker-compose.prod.yml` | Entrega | Build estático sobre Nginx | Node sin observador |

Servicios comunes: `postgres`, `api`, `web`, `softland-mock`.
Volúmenes nombrados: `pgdata` y `uploads`.

## Alternativas consideradas

### Compose único con el servidor de desarrollo de Vite

| A favor | En contra |
|---|---|
| Un solo archivo, imposible ejecutar el equivocado | **Se entrega un servidor de desarrollo como si fuera el producto** |
| HMR durante el desarrollo y el evaluador usa el mismo comando | Si el evaluador lo nota, es una observación justa y sin defensa |
| Lo más simple de documentar | Arranque más lento y sin build optimizado |

**Descartada** por entregar un artefacto de desarrollo como producto final.

### Solo PostgreSQL en Docker

API y front corriendo en el host con `npm run dev`.

| A favor | En contra |
|---|---|
| La iteración más rápida posible | Docker figura en el stack y se usaría para una sola cosa |
| Depuración directa desde el editor | El evaluador necesita la versión correcta de Node y `npm install` en dos carpetas |

**Descartada** por trasladar al evaluador la responsabilidad de armar el entorno.

## Consecuencias

### Se gana

- **Recarga en caliente real en ambos lados** durante el desarrollo.
- **El evaluador ejecuta un comando** y obtiene un build de producción de verdad.
- **Distinguir desarrollo de producción es señal de criterio** y da material concreto para el video.
- **`.env.example` documenta toda la configuración**, lo que refuerza el indicador de variables de entorno.
- **Las migraciones y seeders corren al arrancar**: la base queda lista con un usuario administrador.

### Se paga

- **Dos archivos que mantener sincronizados.** Se mitiga extrayendo lo común y dejando solo las diferencias en el de producción.
- **Riesgo de ejecutar el equivocado.** El `README.md` de la raíz debe indicar el comando de forma inequívoca.

## Comandos

```bash
# Desarrollo
docker compose up

# Entrega — lo que ejecuta el evaluador
docker compose -f docker-compose.prod.yml up --build
```

## Puertos y volúmenes

| Servicio | Puerto | Volumen |
|---|---|---|
| `web` | 5173 (dev) · 80 (entrega) | — |
| `api` | 3000 | `uploads` |
| `postgres` | 5432 | `pgdata` |
| `softland-mock` | 4000 | — |

Los volúmenes son **nombrados**, no *bind mounts*: sobreviven a `docker compose down` y no dependen de rutas del sistema anfitrión.

## Verificación

- [ ] `docker compose -f docker-compose.prod.yml up --build` funciona en una máquina sin nada instalado salvo Docker
- [ ] Las migraciones y seeders corren automáticamente
- [ ] Las credenciales del administrador inicial están en el `README.md`
- [ ] `.env` real **no** está en el comprimido; `.env.example` sí
- [ ] `node_modules/` está en `.dockerignore` y fuera del comprimido
- [ ] Las imágenes subidas sobreviven a un reinicio de los contenedores

## Evidencia

| Qué | Dónde |
|---|---|
| Composición de desarrollo | `docker-compose.yml` |
| Composición de entrega | `docker-compose.prod.yml` |
| Imágenes | `api/Dockerfile`, `web/Dockerfile` |
| Servidor estático | `web/nginx.conf` |
| Configuración documentada | `.env.example` |
