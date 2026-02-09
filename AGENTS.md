# apps/web — Frontend Agent Rules (Next.js + shadcn/ui + next-intl)

This is the Next.js frontend (App Router). Follow these rules strictly.

## Commands (required before finishing)
- Dev: `npm dev`
- Build: `npm build`
- Lint: `npm lint`
- Typecheck: `npm typecheck`
- Tests (if present): `npm test`

Definition of Done:
1) No TypeScript errors (must pass `npm typecheck`)
2) No ESLint errors (must pass `npm lint`)
3) UI matches design intent, responsive, accessible
4) Uses design tokens (CSS variables) — no hardcoded theme colors
5) All user-facing text is translated via `next-intl` (no hardcoded strings)

---

## Tech constraints
- Next.js (App Router)
- TypeScript (strict mindset: no `any`)
- TailwindCSS
- shadcn/ui components only (from `@/components/ui/*`)
- next-intl for i18n (required)

Do NOT introduce new UI libraries without explicit instruction.

---

## Internationalization (MANDATORY) — next-intl

### Hard rules
- All user-facing strings must come from `next-intl`:
  - Use `useTranslations()` in Client Components
  - Use `getTranslations()` (or server-friendly usage) in Server Components
- Do not ship hardcoded UI text in components/pages.
- Keys must be stable and consistent. Prefer namespaced keys:
  - `Nav.*`, `Auth.*`, `Common.*`, `Errors.*`, `Forms.*`, `Dashboard.*`, etc.

### Locale strategy
- Use a locale segment strategy (recommended): `app/[locale]/...`
- Keep routing and links locale-aware.
- Provide a default locale and supported locales list in a single source of truth.

### Translation files
- Store dictionaries in a predictable structure (example):
  - `messages/en.json`
  - `messages/es.json`
- Avoid duplicate keys; keep keys short but descriptive.
- When adding new UI, always add keys in all supported locales in the same PR.

### Type-safety
- Prefer typed message keys where possible (e.g., generated types or strict key conventions).
- Do not cast translation results to force types. Fix the source.

---

## Design system & theming (MANDATORY)

### Primary brand color
Primary brand is a deep navy, based on Tailwind `blue-900` (#1e3a8a), BUT:

✅ Use semantic tokens:
- `bg-primary`, `text-primary-foreground`, `border-border`, `bg-background`, etc.
- Tokens must map to CSS variables (`--primary`, `--background`, etc.)
- Dark/Light mode must be switchable by swapping variables (e.g. `.dark` class)

❌ Never hardcode:
- `bg-blue-900`, `text-blue-900`, `#1e3a8a` directly in components
(only allowed in token definitions)

### How to implement tokens
- Define tokens in `app/globals.css` (or equivalent) using `:root` and `.dark`
- Tailwind config must map colors to `hsl(var(--token))` (shadcn convention)

### UI decisions
- Use shadcn primitives (Button, Card, Dialog, Sheet, DropdownMenu, Tabs, Table, etc.)
- For variants, prefer `cva` patterns already used by shadcn components
- Use `cn()` helper for className composition (no manual string chaos)

---

## TypeScript rules (ZERO type issues)

### Hard rules
- No `any`, no `unknown` without narrowing, no `as SomeType` unless justified
- Props must be typed (explicit types or inferred from generics)
- Prefer:
  - `type Props = { ... }`
  - `ComponentPropsWithoutRef<"button">`
  - `z.infer<typeof Schema>` for validated data shapes
  - `satisfies` for object literals to keep inference correct

### Data boundaries
Any data coming from:
- Route Handlers
- External APIs
- localStorage/sessionStorage
- searchParams
Must be validated/normalized at the boundary (Zod recommended), then typed downstream.

If a component consumes API data:
- create a typed adapter (normalize shape once)
- never scatter optional chaining everywhere to “fix” types

---

## Next.js best practices (App Router)
- Default to Server Components; add `'use client'` only when needed.
- Avoid putting client hooks (useState/useEffect) in Server Components.
- Keep data fetching on the server when possible.
- Prevent waterfalls: fetch in parallel, use Suspense/streaming if it helps.
- Use `error.tsx`, `loading.tsx`, `not-found.tsx` per route when appropriate.
- Be deliberate about runtime (Node by default; Edge only if clearly beneficial).

---

## Accessibility & UX (required)
- All interactive elements must be keyboard accessible
- Visible focus states (don’t remove outlines unless replaced properly)
- Forms: proper labels, aria attributes where relevant
- Use semantic HTML first, then enhance with components

---

## Folder expectations (typical)
- `app/` routes + layouts
- `app/[locale]/` locale segment routes (recommended)
- `components/` shared components
- `components/ui/` shadcn components
- `lib/` utilities (`cn`, formatters, validators, fetchers, i18n helpers)
- `messages/` translation dictionaries (`en.json`, `es.json`, ...)

---

## Skills usage (when to use them)
OpenCode skills are available. Use them deliberately:

- Use `next-best-practices` whenever you:
  - create/modify routes, layouts, metadata
  - decide Server vs Client components
  - implement fetching/caching/streaming patterns

- Use `ui-ux-pro-max` whenever you:
  - design a new page/section
  - refine layout, spacing, typography
  - define a reusable pattern (forms, dashboards, tables, empty states)
  - need consistent light/dark theme decisions

If design system docs exist (e.g. `design-system/MASTER.md`), treat them as source of truth.
