# Auth y sesiones

## Modelo actual

- El frontend asume autenticacion por cookies (tokens en cookies).
- El `middleware` decide si dejar pasar o redirigir segun cookies:
  - `accessToken`
  - `refreshToken`

## Rutas publicas vs privadas

Publicas (primer segmento logico):

- `/login/{locale}`
- `/register/{locale}`
- `/onboarding/{locale}`

Privadas:

- Todo lo demas (ej: `/dashboard/{locale}`, `/products/{locale}`, ...)

## Store de auth (Zustand)

Archivo: `stores/auth-store.ts`

Expone:

- `login(dto)`: POST `/auth/login`
- `logout({reason})`: POST `/auth/logout` (best-effort) + redirect a login
- `onboardingInitial(dto)`: POST `/onboarding/initial`

Redirect en logout:

- Construye la ruta de login segun pathname actual via `getLoginPathForPathname()`.
- Si `reason === "expired"`, agrega `?reason=expired`.

## Cliente HTTP y refresh automatico

Archivo: `lib/api-client.ts`

- axios instance `apiClient`
  - `withCredentials: true` (cookies)
  - `baseURL`: depende de `NEXT_PUBLIC_API_BASE_URL` (ver `README.md`)

Interceptor de respuestas:

- Si recibe 401 (y no es endpoint `/auth/*`):
  - intenta una sola vez refrescar via POST `/auth/refresh` (se serializa con una promesa global)
  - reintenta la request original
  - si falla el refresh, hace `logout({ reason: "expired" })` (si no estas en ruta publica)

Nota: para que esto funcione, el backend debe exponer `/auth/refresh` y setear cookies correctamente.
