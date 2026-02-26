# Estructura del proyecto

Estructura principal (resumen):

- `app/`: rutas (Next.js App Router)
- `app/[locale]/`: arbol de rutas por locale (interno)
- `components/`: componentes de UI y features
- `components/ui/`: componentes shadcn/ui (primitivas)
- `i18n/`: configuracion de locales + helpers de navegacion
- `lib/`: clientes HTTP, helpers, tipos, hooks (por dominio)
- `messages/`: diccionarios de traduccion (`en.json`, `es.json`)
- `stores/`: stores Zustand (auth, theme, onboarding draft)
- `middleware.ts`: canonicalizacion de URL + auth gating + rewrite a rutas internas

## Rutas (App Router)

El arbol interno esta bajo `app/[locale]/`:

- `app/[locale]/layout.tsx`: layout raiz por locale (provee next-intl + fonts + theme sync)
- `app/[locale]/page.tsx`: index del locale (redirige a dashboard)
- `app/[locale]/(auth)/...`: login/register/onboarding
- `app/[locale]/(app)/...`: dashboard/products/inventory/reports/settings

Nota: aunque las rutas internas usan prefijo (`/es/dashboard`), el `middleware` expone URLs publicas canonicas con sufijo (`/dashboard/es`).
