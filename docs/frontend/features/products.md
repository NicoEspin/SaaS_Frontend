# Feature: Products

Ruta publica canonica:

- `/products/{locale}`

Ruta interna:

- `/[locale]/products`

## Pagina

- `app/[locale]/(app)/products/page.tsx` (Server Component)
  - Titulo/subtitulo via `getTranslations("Pages")`
  - Renderiza `components/products/ProductsClient.tsx`

## ProductsClient (orquestador)

Archivo: `components/products/ProductsClient.tsx`

Responsabilidades:

- Estado de filtros (UI) + filtros aplicados (query)
- Listado con cursor pagination via `useProductsList()`
- Columnas dinamicas via `useAttributeDefinitions(categoryId)`
- Dialogs: create/edit, delete confirm, import, export, manager de atributos

## Listado

- UI: `components/products/ProductTable.tsx`
- Hook: `lib/products/hooks/use-products-list.ts`
- API: `lib/products/api.ts` -> `GET /products`

Comportamiento:

- `loadMore()` usa `nextCursor`.
- Dedup por `id` al append.

## Create / Edit

- UI: `components/products/ProductForm.tsx` (Dialog)
- Mutations: `lib/products/hooks/use-product-mutations.ts`
- Endpoints: `POST /products`, `PATCH /products/:id`

Notas de UX:

- Si se selecciona `categoryId`, carga definiciones de atributos y renderiza inputs por tipo.
- Permite crear categoria "inline" desde el form (POST `/categories`).

## Delete

- Confirm: `components/products/ConfirmDialog.tsx`
- Endpoint: `DELETE /products/:id`

## Atributos dinamicos

Definiciones:

- Tipos soportados: `TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `ENUM`
- Endpoint: `/products/attribute-definitions`

Manager:

- UI: `components/products/AttributeDefinitionsManager.tsx`
- Permite:
  - Buscar/seleccionar categorias
  - Crear categoria con definiciones iniciales (drafts)
  - CRUD de definiciones por categoria

Convencion:

- `useAttributeDefinitions()` solo fetchea si `categoryId` parece ULID (len 26).

## Import

- UI: `components/products/ImportProductsDialog.tsx`
- Flow:
  1) Preview: `POST /imports/products/preview` -> retorna `previewId`, `summary`, `errors`, `rows`
  2) Confirm: `POST /imports/products/confirm` con `{ previewId }`

## Export

- UI: `components/products/ExportProductsDialog.tsx`
- Endpoint: `GET /exports/products` (blob)

Columnas:

- Base: `EXPORT_BASE_COLUMNS` en `lib/products/types.ts`
- Dinamicas: `attr_<key>`

El filename se obtiene de `Content-Disposition` si el backend lo envia; si no, usa fallback `products_YYYY-MM-DD.<format>`.
