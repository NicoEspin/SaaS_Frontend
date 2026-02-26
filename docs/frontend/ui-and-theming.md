# UI, theming y estilos

## TailwindCSS v4 (CSS-first)

Archivo: `app/globals.css`

- Importa Tailwind v4 via `@import "tailwindcss";`
- Importa animaciones `@import "tw-animate-css";`
- Importa integracion de shadcn `@import "shadcn/tailwind.css";`
- Define `@source` para que Tailwind escanee `app/**/*` y `components/**/*`.

## Design tokens (CSS variables)

Los colores se manejan por tokens CSS en `app/globals.css`:

- `:root` (light)
- `.dark` (dark)

El mapping a Tailwind se hace con `@theme inline` (convencion shadcn):

- `--color-primary`, `--color-background`, `--color-border`, etc.

Regla: en componentes se usan clases semanticas (`bg-background`, `text-foreground`, `bg-primary`, ...) y no colores hardcodeados.

## shadcn/ui

Configuracion: `components.json`

- style: `new-york`
- `rsc: true`
- `cssVariables: true`
- UI primitives en `components/ui/*`

Buenas practicas:

- Para agregar nuevos componentes shadcn, usar el CLI (`npx shadcn@latest add <componente>`).

## Theme mode (light/dark)

Store: `stores/theme-store.ts`

- Persiste en `localStorage` (`name: theme-mode`).

Sync con el DOM:

- `components/theme/ThemeClassSync.tsx` aplica/remueve la clase `.dark` en `document.documentElement`.

## Dashboard charts

- Los charts usan `recharts` y colores derivados de CSS variables (`hsl(var(--primary))`, etc.).
- Se cargan con `dynamic(..., { ssr: false })` desde `components/dashboard/DashboardBento.tsx`.
