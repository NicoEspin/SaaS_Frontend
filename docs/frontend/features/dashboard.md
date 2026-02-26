# Feature: Dashboard

Ruta publica canonica:

- `/dashboard/{locale}`

Ruta interna:

- `/[locale]/dashboard`

Implementacion:

- `app/[locale]/(app)/dashboard/page.tsx` renderiza `components/dashboard/DashboardBento.tsx`.

Notas:

- `DashboardBento` es Client Component.
- Los datos (sales/topSkus/stock) estan hardcodeados como demo.
- Charts (`SalesChart`, `StockChart`, `TopSkusChart`) se importan con `dynamic(..., { ssr: false })`.
