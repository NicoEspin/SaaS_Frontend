# Stack y dependencias

## Versiones principales

- Next.js: `16.1.6` (App Router)
- React: `19.2.3`
- TypeScript: `^5` (modo `strict`)
- TailwindCSS: `^4` (CSS-first)
- next-intl: `^4.8.2`
- shadcn/ui: inicializado via `components.json`
- axios: `^1.13.5`
- Zustand: `^5.0.11`
- recharts: `^3.7.0` (charts del dashboard)
- @tanstack/react-table: `^8.21.3` (infra disponible; hoy el listado de productos usa tabla shadcn)

## Scripts npm

Definidos en `package.json`:

- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `eslint`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
