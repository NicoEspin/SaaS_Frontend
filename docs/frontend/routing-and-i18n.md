# Routing e i18n

## Locales

Definidos en `i18n/locales.ts`:

- Locales soportados: `es`, `en`
- Default: `es`

## Esquema de URL canonico (locale como sufijo)

Este proyecto usa un esquema canonico de URLs con locale al final:

- `/dashboard/es`
- `/products/en`
- `/{locale}` (home) ejemplo: `/es`

Tambien soporta un esquema legacy con locale al inicio:

- `/es/dashboard`

El `middleware` redirige legacy -> canonico.

## Middleware: canonicalizacion + rewrite interno

Archivo: `middleware.ts`

Responsabilidades:

1) Extraer locale desde el path
- Busca locale como sufijo (`/dashboard/es`) y como prefijo (`/es/dashboard`).

2) Auth gating
- Rutas publicas (por primer segmento logico): `login`, `register`, `onboarding`.
- Considera "autenticado" si existe cookie `accessToken` o `refreshToken`.
- Si no hay token y la ruta no es publica -> redirect a `/login/{locale}` con query `next`.
- Si hay token y la ruta es publica -> redirect a `/dashboard/{locale}`.

3) Canonicalizacion de forma
- Fuerza que el pathname publico sea siempre con locale sufijo.

4) Rewrite a rutas internas de Next.js
- Convierte el canonical (`/dashboard/es`) a interno (`/es/dashboard`) para matchear `app/[locale]/...`.
- Setea el header `X-NEXT-INTL-LOCALE` para que next-intl pueda resolver el locale.

Matcher:

- Aplica a todo excepto `api`, `_next`, `_vercel` y assets con extension.

Nota (Next.js 16.1.x): durante `next build` puede aparecer el warning de que la convencion `middleware.ts` esta deprecada a favor de `proxy`. El proyecto actualmente sigue usando `middleware.ts`.

## next-intl

Integracion:

- `next.config.ts` usa `next-intl/plugin` apuntando a `i18n/request.ts`.
- `i18n/request.ts` carga mensajes desde `messages/{locale}.json`.

Provider:

- `app/[locale]/layout.tsx` usa `NextIntlClientProvider` con `getMessages()`.

Uso en componentes:

- Client Components: `useTranslations("Namespace")`
- Server Components: `getTranslations("Namespace")`

Archivos de mensajes:

- `messages/es.json`
- `messages/en.json`

## Navegacion locale-aware

Archivo: `i18n/navigation.tsx`

- `Link`: wrapper sobre `next/link` que llama a `localizeHref()`.
- `useRouter()`: wrapper sobre `next/navigation` que localiza `push/replace/prefetch`.

Helpers:

- `lib/routes.ts`: parsing de locale, stripping, y armado de href canonico con sufijo.
