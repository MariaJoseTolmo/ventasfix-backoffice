# ADR-003 — JWT Bearer único para SPA y Softland

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026-09-14 |
| **Indicadores** | Autorización y autenticación (8) · Cifrado (5) |

## Contexto

El enunciado exige dos cosas: que el sistema tenga login de acceso, y que el consumo de la API tenga un método de autenticación. Y exige que la contraseña se guarde cifrada.

Hay una tensión de diseño de fondo: **el trabajador de VentasFix y Softland no son el mismo tipo de cliente.** Uno es una persona con navegador y sesión; el otro es una máquina sin navegador y sin nadie que escriba una contraseña. Meterlos por la misma puerta es lo habitual, y es lo que termina con credenciales de una persona real configuradas dentro de un ERP.

## Decisión

**JWT Bearer único** para ambos clientes.

- `POST /api/auth/login` verifica credenciales y devuelve un token firmado.
- Un único `authenticate.middleware` protege todas las rutas.
- Contraseñas con **bcrypt**, cost 12, cifradas en el hook `beforeSave` del modelo.
- `JWT_SECRET`, `JWT_EXPIRES_IN` y `BCRYPT_ROUNDS` en variables de entorno.

## Alternativas consideradas

### Doble esquema: cookie para el humano, API Key para la máquina

El backoffice usa JWT en cookie `httpOnly` + `SameSite`; Softland usa una API Key de servicio con su propio middleware.

| A favor | En contra |
|---|---|
| Es la respuesta **arquitectónicamente correcta**: cada cliente con el mecanismo que le corresponde | CORS con `credentials`, token CSRF, tabla `api_keys` |
| Inmune a XSS: el token no es accesible desde JavaScript | Dos `securitySchemes` en Swagger |
| Dos middlewares = más evidencia para el indicador | Demostrar cookies `httpOnly` en video es menos legible que pegar un Bearer |

**Descartada por alcance**, no por mérito. Se menciona en el video como decisión razonada.

### JWT de larga duración sin renovación

Token de 24 horas en `localStorage`, sin renovación ni revocación.

| A favor | En contra |
|---|---|
| Lo más rápido de implementar | Un token robado da acceso total durante 24 horas |
| Cumple el requisito literal | No hay cierre de sesión real del lado del servidor |

**Descartada.** Es el piso del requisito, no una decisión.

## Consecuencias

### Se gana

- **Un solo camino de autenticación**: una sola cosa que explicar y una sola que puede fallar.
- **Demostración idéntica en ambos videos.** En Swagger: *Authorize* → pegar token → probar. Se ve un `401` antes y un `200` después.
- **El middleware es literalmente lo que pide el indicador.**
- **Sin configuración de CORS con credenciales ni CSRF.**
- **El cifrado es invariante.** Al vivir en el hook del modelo, ningún camino por el ORM guarda texto plano — ni siquiera los seeders.

### Se paga

- **El token vive en el navegador**, expuesto a XSS. Se mitiga con vigencia corta (15 min) y sanitización de toda entrada renderizada.
- **Softland usa credenciales de un usuario de servicio**, que es exactamente lo que la alternativa descartada evitaba. Queda documentado como deuda consciente.
- **Sin revocación anticipada.** Un token válido lo sigue siendo hasta que expira.

## Evidencia

| Qué | Dónde |
|---|---|
| Inicio de sesión | `api/src/controllers/auth.controller.js` · `services/auth.service.js` |
| Middleware de autenticación | `api/src/middlewares/authenticate.middleware.js` |
| Cifrado | Hook `beforeSave` en `api/src/models/user.model.js` |
| Contraseña nunca expuesta | `defaultScope` excluye `password` |
| Protección de fuerza bruta | `express-rate-limit` sobre `POST /api/auth/login` |
| Secretos fuera del código | `.env.example` |
