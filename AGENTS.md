# apps/web — Frontend Agent Rules (Next.js + shadcn/ui + next-intl)

This is the Next.js frontend (App Router). Follow these rules strictly.

## Commands (required before finishing)

- Dev: `npm dev`
- Build: `npm build`
- Lint: `npm lint`
- Typecheck: `npm typecheck`
- Tests (if present): `npm test`

Definition of Done:

1. No TypeScript errors (must pass `npm typecheck`)
2. No ESLint errors (must pass `npm lint`)
3. UI matches design intent, responsive, accessible
4. Uses design tokens (CSS variables) — no hardcoded theme colors
5. All user-facing text is translated via `next-intl` (no hardcoded strings)
6. All UI uses shadcn/ui components — no raw HTML for interactive elements or layout primitives

---

## Tech constraints

- Next.js (App Router)
- TypeScript (strict mindset: no `any`)
- TailwindCSS
- shadcn/ui components only (from `@/components/ui/*`)
- next-intl for i18n (required)

Do NOT introduce new UI libraries without explicit instruction.

---

## shadcn/ui (MANDATORY)

### Core rule

**Every UI primitive must come from shadcn/ui.** Never use raw `<button>`, `<input>`,
`<select>`, `<textarea>`, `<table>`, custom modals, or custom toggle/switch HTML.
Always use the shadcn equivalent.

### Before using any component

1. Check `components.json` exists in the project root — confirms shadcn is initialised.
2. Check the component file exists at `components/ui/<name>.tsx`.
3. If it does NOT exist → install it:
   ```bash
   npx shadcn@latest add <component-name>
   ```
4. Never hand-write shadcn component files. Always use the CLI.

### API differences (critical — will cause TS errors if wrong)

| Component  | ❌ Wrong (native)         | ✅ Correct (shadcn)                       |
|------------|--------------------------|-------------------------------------------|
| `Switch`   | `onChange(e)`            | `onCheckedChange(checked: boolean)`       |
| `Select`   | `onChange(e.target.val)` | `onValueChange(value: string)`            |
| `Checkbox` | `onChange(e)`            | `onCheckedChange(checked: boolean)`       |
| `Dialog`   | `isOpen`                 | `open` + `onOpenChange(open: boolean)`    |

### shadcn Select — mandatory pattern

shadcn `Select` is Radix-based, not a native `<select>`. Always use:

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Pick one" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="TEXT">Text</SelectItem>
  </SelectContent>
</Select>
```

### shadcn Switch — mandatory pattern

shadcn `Switch` has NO `label` prop and NO `onChange`. Always pair with `<Label>`:

```tsx
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

<div className="flex items-center gap-2">
  <Switch id="sw" checked={checked} onCheckedChange={setChecked} />
  <Label htmlFor="sw">Label text</Label>
</div>
```

### Migration map: native → shadcn

| Replace…                   | …with                                         |
|----------------------------|-----------------------------------------------|
| `<button>`                 | `<Button>`                                    |
| `<input>`                  | `<Input>`                                     |
| `<label>`                  | `<Label>`                                     |
| `<select>` + `<option>`    | `<Select>` + `<SelectTrigger/Content/Item>`   |
| `<textarea>`               | `<Textarea>`                                  |
| `<table>` raw              | `<Table>` + sub-components                    |
| Custom modal/overlay       | `<Dialog>`                                    |
| Custom toggle/switch       | `<Switch>` + `<Label>`                        |
| `<div role="alert">`       | `<Alert>` + `<AlertDescription>`             |
| Custom skeleton divs       | `<Skeleton>`                                  |
| Custom badge `<span>`      | `<Badge>`                                     |

### Skill reference

→ **Always read `skills/shadcn-ui/SKILL.md`** before adding, modifying, or refactoring
any component that touches the UI layer.

---

## Internationalization (MANDATORY) — next-intl

### Hard rules

- All user-facing strings must come from `next-intl`:
  - Use `useTranslations()` in Client Components
  - Use `getTranslations()` in Server Components
- Do not ship hardcoded UI text in components/pages.
- Keys must be stable and consistent. Prefer namespaced keys:
  - `Nav.*`, `Auth.*`, `Common.*`, `Errors.*`, `Forms.*`, `Dashboard.*`, `Products.*`, `Attributes.*`, `Pages.*`

### Locale strategy

- Use a locale segment strategy: `app/[locale]/...`
- Keep routing and links locale-aware.
- Provide a default locale and supported locales list in a single source of truth.

### Translation files

- Store dictionaries in `messages/en.json`, `messages/es.json`, etc.
- Avoid duplicate keys; keep keys short but descriptive.
- When adding new UI, always add keys in **all** supported locales in the same change.

### Type-safety

- Prefer typed message keys where possible.
- Do not cast translation results to force types. Fix the source.

---

## Design system & theming (MANDATORY)

### Primary brand color

Primary brand is a deep navy based on Tailwind `blue-900` (#1e3a8a), BUT:

✅ Use semantic tokens:

- `bg-primary`, `text-primary-foreground`, `border-border`, `bg-background`, etc.
- Tokens must map to CSS variables (`--primary`, `--background`, etc.)
- Dark/Light mode must be switchable by swapping variables (e.g. `.dark` class)

❌ Never hardcode:

- `bg-blue-900`, `text-blue-900`, `#1e3a8a` directly in components
  (only allowed in token definitions in `app/globals.css`)

### How to implement tokens

- Define tokens in `app/globals.css` using `:root` and `.dark`
- Tailwind config must map colors to `hsl(var(--token))` (shadcn convention)

### UI decisions

- Use shadcn primitives (Button, Card, Dialog, Sheet, DropdownMenu, Tabs, Table, etc.)
- For variants, prefer `cva` patterns already used by shadcn components
- Use `cn()` helper for className composition (no manual string concatenation)

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

Any data coming from Route Handlers, External APIs, localStorage, or searchParams
must be validated/normalized at the boundary (Zod recommended), then typed downstream.

If a component consumes API data:
- Create a typed adapter (normalize shape once)
- Never scatter optional chaining everywhere to "fix" types

---

## Next.js best practices (App Router)

- Default to Server Components; add `'use client'` only when needed.
- Keep data fetching on the server when possible.
- Prevent waterfalls: fetch in parallel, use Suspense/streaming if it helps.
- Use `error.tsx`, `loading.tsx`, `not-found.tsx` per route when appropriate.

---

## Accessibility & UX (required)

- All interactive elements must be keyboard accessible
- Visible focus states (don't remove outlines unless replaced properly)
- Forms: proper labels, `aria-*` attributes where relevant
- Use semantic HTML first, then enhance with shadcn components

---

## Folder expectations

- `app/` routes + layouts
- `app/[locale]/` locale segment routes
- `components/` shared components
- `components/ui/` shadcn components (CLI-managed — do NOT hand-edit unless customising)
- `components/products/` product domain components
- `lib/` utilities (`cn`, formatters, validators, fetchers, i18n helpers)
- `messages/` translation dictionaries (`en.json`, `es.json`, …)
- `skills/` agent skill files

---

## Skills usage (when to use them)

Read the relevant `SKILL.md` **before** writing any code for that domain.

| Skill                    | File                              | Use when…                                                        |
|--------------------------|-----------------------------------|------------------------------------------------------------------|
| `shadcn-ui`              | `skills/shadcn-ui/SKILL.md`       | Adding/replacing any UI component; installing shadcn components  |
| `next-best-practices`    | *(if present)*                    | Creating/modifying routes, layouts, metadata, fetch patterns     |
| `ui-ux-pro-max`          | *(if present)*                    | Designing new pages/sections, layout, typography, empty states   |
| `zustand-state-management` | *(if present)*                  | Adding shared client-side state, persist/devtools, hydration     |

If design system docs exist (e.g. `design-system/MASTER.md`), treat them as source of truth.

---

## Products page — known component inventory

The following components exist under `components/products/` and must be kept in sync
with shadcn conventions when modified:

- `ProductsClient` — main client orchestrator (filters, table, dialogs, pagination)
- `ProductTable` — data table using `<Table>` shadcn primitives + `<Badge>`, `<Button>`, `<Skeleton>`
- `ProductFilters` — filter bar using `<Input>`, `<Select>`, `<Button>`
- `ProductForm` — create/edit form inside `<Dialog>`
- `AttributeDefinitionsManager` — attribute CRUD inside `<Dialog>` with `<Table>`, `<Select>`, `<Switch>`, `<Input>`, `<Textarea>`, `<Label>`
- `ConfirmDialog` — destructive confirm using `<Dialog>`
- `ImportProductsDialog` — import flow using `<Dialog>`
- `ExportProductsDialog` — export flow using `<Dialog>`

### Known shadcn API issues to watch in this codebase

1. `AttributeDefinitionsManager` currently uses a **native `<select>`** pattern for the
   type selector and **`onChange` + `label` prop on `<Switch>`** — these must be migrated
   to the correct shadcn `<Select>` and `<Switch>` + `<Label>` APIs.

2. Any `<div role="alert">` for inline errors should be replaced with
   `<Alert><AlertDescription>...</AlertDescription></Alert>`.

3. Always run `npx shadcn@latest add alert` if `<Alert>` is not yet installed.