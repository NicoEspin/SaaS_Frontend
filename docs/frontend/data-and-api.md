# Datos y API

## Cliente HTTP

Archivo: `lib/api-client.ts`

- `apiClient` es una instancia axios compartida.
- `withCredentials: true` para cookies.
- `baseURL` se resuelve con `NEXT_PUBLIC_API_BASE_URL` (si no existe, usa `/api/v1`).

## Endpoints usados hoy

Auth / onboarding (ver `stores/auth-store.ts`):

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /onboarding/initial`

Productos (ver `lib/products/api.ts`):

- `POST /products`
- `GET /products` (cursor pagination)
- `GET /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`

Definiciones de atributos (ver `lib/products/api.ts`):

- `POST /products/attribute-definitions`
- `GET /products/attribute-definitions?categoryId=...`
- `PATCH /products/attribute-definitions/:id`
- `DELETE /products/attribute-definitions/:id`

Categorias (ver `lib/categories/api.ts`):

- `GET /categories`
- `GET /categories/:id`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

Import/export (ver `lib/products/api.ts`):

- `POST /imports/products/preview` (multipart)
- `POST /imports/products/confirm`
- `GET /exports/products` (blob)

## Manejo de errores

Helper: `lib/products/utils.ts`

- `getAxiosErrorMessage()` intenta extraer `message` del backend.
- Si no hay, se usa `Common.errors.generic` via `next-intl`.

## Paginacion

- Products y categories usan cursor (`nextCursor`).
- Hooks: `lib/products/hooks/use-products-list.ts`, `lib/categories/hooks/use-categories.ts`.
