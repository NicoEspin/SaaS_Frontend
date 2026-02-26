# Frontend - Documentacion

Este directorio documenta el frontend actual (Next.js App Router).

## Indice

- `docs/frontend/stack.md`
- `docs/frontend/folder-structure.md`
- `docs/frontend/routing-and-i18n.md`
- `docs/frontend/auth-and-sessions.md`
- `docs/frontend/ui-and-theming.md`
- `docs/frontend/data-and-api.md`
- `docs/frontend/features/dashboard.md`
- `docs/frontend/features/products.md`

## En pocas palabras

- Framework: Next.js (App Router) + React
- Estilos: TailwindCSS v4 (configuracion CSS-first) + shadcn/ui
- i18n: next-intl
- Estado cliente: Zustand (auth, onboarding draft, theme)
- HTTP: axios (cookies + refresh automatico)

## Como correrlo

Requisitos:

- Node.js 20+
- npm

Comandos:

```bash
npm install
npm run dev
```

Checks recomendados:

```bash
npm run lint
npm run typecheck
npm run build
```

## URLs (importante)

El frontend expone URLs canonicas con el locale como sufijo:

- `/dashboard/es`
- `/products/en`

Internamente, Next.js sigue usando rutas con locale como prefijo (`app/[locale]/...`), y el `middleware` reescribe.
Detalles en `docs/frontend/routing-and-i18n.md`.

## Feature set actual

- Auth: login, register (draft local), onboarding inicial (tenant + branch + admin)
- App: dashboard (UI demo con charts), inventory/reports/settings (paginas scaffold), products (CRUD + filtros + atributos dinamicos + import/export)
