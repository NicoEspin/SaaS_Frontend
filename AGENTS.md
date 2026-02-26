# apps/web — Frontend Agent Rules (Next.js + shadcn/ui + next-intl)

This is the Next.js frontend (App Router). Follow these rules strictly.

## Commands (required before finishing)

- Dev: `npm dev`
- Build: `npm build`
- Lint: `npm lint`
- Typecheck: `npm typecheck`
- Tests (if present): `npm test`

## Definition of Done

1. No TypeScript errors (must pass `npm typecheck`)
2. No ESLint errors (must pass `npm lint`)
3. UI is visually polished — passes the full audit in `skills/ui-visual-polish/SKILL.md`
4. Uses design tokens (CSS variables) — no hardcoded theme colors
5. All user-facing text is translated via `next-intl` (no hardcoded strings)
6. All UI uses shadcn/ui components — no raw HTML for interactive elements
7. Responsive: works at 1280px (desktop) and 768px (tablet)

---

## ⚠️ Visual Quality — Non-Negotiable Rules

> Before writing a single line of UI code, read `skills/ui-visual-polish/SKILL.md`.
> These rules are not suggestions. Violating them means the task is not done.

### The 5 Hard Rules

**1. Destructive actions are always red.**
Delete, remove, revoke, disconnect, or any irreversible cancel → `variant="destructive"`.
Never use a default or outline button for these. Never hardcode `bg-red-*`.

```tsx
// ❌ Wrong
<Button onClick={handleDelete}>Delete</Button>

// ✅ Always
<Button variant="destructive">
  <Trash2 className="mr-2 h-4 w-4" />
  {t('Common.delete')}
</Button>
```

Irreversible deletions require an `<AlertDialog>` for confirmation — never a `window.confirm()` or inline prompt.

**2. Every page has one clear primary action using `bg-primary`.**
The most important CTA uses `<Button>` (default variant = primary). There is exactly one per view.
Supporting actions use `variant="outline"` or `variant="ghost"`.

**3. Status always uses semantic `<Badge>` with color-coded className.**
Never use `<span>` or raw `<div>` for status indicators.
Active = emerald, Pending = amber, Error/Danger = red, Draft = blue, Inactive = zinc.

**4. All interactive elements have hover + focus states.**

- Table rows: `hover:bg-muted/50 transition-colors cursor-pointer`
- Clickable cards: `hover:shadow-md hover:border-primary/40 transition-all`
- Nav links: `hover:bg-muted hover:text-foreground` vs `bg-primary/10 text-primary` when active
- Never remove `focus-visible` rings

**5. Loading and empty states are designed screens, not afterthoughts.**

- Content loading → `<Skeleton>` components, never a full-page spinner
- Buttons submitting → spinner icon + contextual text (`"Saving..."`, `"Deleting..."`)
- No data → `<EmptyState>` with icon (dashed circle), title, description, optional CTA
- No search results → different `<EmptyState>` with SearchX icon + clear filters action

---

## Visual Audit (Run Before Every Commit)

| Check                                                           | Fix                                       |
| --------------------------------------------------------------- | ----------------------------------------- |
| Destructive actions use `variant="destructive"`?                | Change variant                            |
| Primary CTA uses default `<Button>` (primary color)?            | Remove color overrides                    |
| Status uses `<Badge>` with semantic color className?            | Replace `<span>` → `<StatusBadge />`      |
| Supporting text uses `text-muted-foreground`?                   | Add the class                             |
| Table rows have hover state?                                    | Add `hover:bg-muted/50 transition-colors` |
| Buttons in loading show spinner + changed label?                | Add `isPending` state to button           |
| Loading content uses `<Skeleton>` not global spinner?           | Build skeleton for that view              |
| Empty views have `<EmptyState>` with icon + text + action?      | Implement component                       |
| Icon-only buttons have `<Tooltip>`?                             | Wrap in `<Tooltip>`                       |
| User actions show `toast.success()` / `toast.error()` feedback? | Add toast calls                           |

---

## Tech constraints

- Next.js (App Router)
- TypeScript (strict: no `any`)
- TailwindCSS
- shadcn/ui only (from `@/components/ui/*`)
- next-intl for i18n (required)
- `lucide-react` for icons

Do NOT introduce new UI libraries without explicit instruction.

---

## shadcn/ui (MANDATORY)

### Core rule

**Every UI primitive must come from shadcn/ui.** Never use raw `<button>`, `<input>`,
`<select>`, `<textarea>`, `<table>`, custom modals, or custom toggle/switch HTML.

### Before using any component

1. Check `components.json` exists in the project root.
2. Check the component exists at `components/ui/<name>.tsx`.
3. If it does NOT exist → install it: `npx shadcn@latest add <component-name>`
4. Never hand-write shadcn component files. Always use the CLI.

### API differences (critical — will cause TS errors if wrong)

| Component  | ❌ Wrong (native)        | ✅ Correct (shadcn)                    |
| ---------- | ------------------------ | -------------------------------------- |
| `Switch`   | `onChange(e)`            | `onCheckedChange(checked: boolean)`    |
| `Select`   | `onChange(e.target.val)` | `onValueChange(value: string)`         |
| `Checkbox` | `onChange(e)`            | `onCheckedChange(checked: boolean)`    |
| `Dialog`   | `isOpen`                 | `open` + `onOpenChange(open: boolean)` |

### shadcn Select — mandatory pattern

```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Pick one" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="TEXT">Text</SelectItem>
  </SelectContent>
</Select>;
```

### shadcn Switch — mandatory pattern

```tsx
<div className="flex items-center gap-2">
  <Switch id="sw" checked={checked} onCheckedChange={setChecked} />
  <Label htmlFor="sw">{t("Forms.switchLabel")}</Label>
</div>
```

### Migration map: native → shadcn

| Replace…                | …with                                       |
| ----------------------- | ------------------------------------------- |
| `<button>`              | `<Button>`                                  |
| `<input>`               | `<Input>`                                   |
| `<label>`               | `<Label>`                                   |
| `<select>` + `<option>` | `<Select>` + `<SelectTrigger/Content/Item>` |
| `<textarea>`            | `<Textarea>`                                |
| `<table>` raw           | `<Table>` + sub-components                  |
| Custom modal/overlay    | `<Dialog>` or `<AlertDialog>`               |
| Custom toggle/switch    | `<Switch>` + `<Label>`                      |
| `<div role="alert">`    | `<Alert>` + `<AlertDescription>`            |
| Custom skeleton divs    | `<Skeleton>`                                |
| Custom badge `<span>`   | `<Badge>`                                   |

---

## Internationalization (MANDATORY) — next-intl

### Hard rules

- All user-facing strings must come from `next-intl`:
  - `useTranslations()` in Client Components
  - `getTranslations()` in Server Components
- No hardcoded UI text anywhere in components or pages.
- Namespaced keys: `Nav.*`, `Auth.*`, `Common.*`, `Errors.*`, `Forms.*`, `Dashboard.*`, `Products.*`, `Attributes.*`, `Pages.*`, `Status.*`

### Translation files

- Store in `messages/en.json`, `messages/es.json`, etc.
- When adding new UI, add keys in **all** supported locales in the same change.

### Locale strategy

- Route segment: `app/[locale]/...`
- Keep all routing and links locale-aware.

---

## Design system & theming (MANDATORY)

### Semantic token usage

✅ Always use semantic tokens:

- `bg-primary`, `text-primary-foreground`
- `bg-destructive`, `text-destructive`
- `bg-muted`, `text-muted-foreground`
- `bg-card`, `border-border`, `bg-background`

❌ Never hardcode:

- `bg-blue-900`, `text-blue-900`, `#1e3a8a` in components
  (only allowed in token definitions in `app/globals.css`)

### Semantic color reference

| Intent            | Token / Tailwind class                                                            |
| ----------------- | --------------------------------------------------------------------------------- |
| Primary action    | `bg-primary text-primary-foreground`                                              |
| Destructive       | `bg-destructive text-destructive-foreground` / `text-destructive`                 |
| Success / Active  | `text-emerald-600 dark:text-emerald-400` + `bg-emerald-50 dark:bg-emerald-950/30` |
| Warning / Pending | `text-amber-600 dark:text-amber-400` + `bg-amber-50 dark:bg-amber-950/30`         |
| Info              | `text-blue-600 dark:text-blue-400` + `bg-blue-50 dark:bg-blue-950/30`             |
| Secondary text    | `text-muted-foreground`                                                           |

### Implementing tokens

- Define in `app/globals.css` using `:root` and `.dark`
- Tailwind config maps to `hsl(var(--token))` (shadcn convention)
- `cn()` helper for className composition — no manual string concatenation

---

## TypeScript rules (ZERO type issues)

- No `any`, no `unknown` without narrowing, no `as SomeType` unless justified
- Props must be explicitly typed
- Use `z.infer<typeof Schema>` for validated data
- Data from APIs, Route Handlers, localStorage, or searchParams must be validated at the boundary (Zod)
- Never scatter optional chaining to silence type errors — fix the root type

---

## Next.js best practices (App Router)

- Default to Server Components; `'use client'` only when needed
- Fetch data on the server when possible
- Parallel fetching to prevent waterfalls
- `error.tsx`, `loading.tsx`, `not-found.tsx` per route when appropriate

---

## Accessibility (required)

- All interactive elements keyboard-accessible
- Visible focus states (never remove `focus-visible` rings without replacing)
- Forms: proper `<Label>` associations, `aria-invalid`, `aria-describedby`
- Icon-only buttons: `aria-label` + `<Tooltip>`

---

## Folder structure

```
app/                        routes + layouts
app/[locale]/               locale segment routes
components/                 shared components
components/ui/              shadcn components (CLI-managed — do not hand-edit)
lib/                        utilities (cn, formatters, validators, fetchers)
messages/                   translation dictionaries (en.json, es.json, …)
skills/                     agent skill files
```

---

## Skills — Read Before Coding

| Skill                      | File                               | Use when…                                        |
| -------------------------- | ---------------------------------- | ------------------------------------------------ |
| **`ui-visual-polish`**     | `skills/ui-visual-polish/SKILL.md` | **Every UI task** — read this first, always      |
| `shadcn-ui`                | `skills/shadcn-ui/SKILL.md`        | Adding/replacing/installing any shadcn component |
| `next-best-practices`      | _(if present)_                     | Routes, layouts, metadata, fetch patterns        |
| `zustand-state-management` | _(if present)_                     | Shared client-side state, persist, devtools      |

> `ui-visual-polish` is the **first skill to read on any UI task**. No exceptions.

