---
name: shadcn-ui
description: >
  Use this skill whenever you need to install, use, or refactor components
  using the shadcn/ui library inside a Next.js (App Router) + TailwindCSS project.
  Triggers: any task that involves adding/replacing UI primitives, installing
  shadcn components via CLI, or migrating native HTML elements to shadcn equivalents.
---

# shadcn/ui — Agent Skill

## What is shadcn/ui?

shadcn/ui is NOT an npm package you import from — it is a **CLI-based component registry**.
Components are **copied into your codebase** at `components/ui/` and are fully owned by you.

> Source of truth: https://ui.shadcn.com/docs

---

## Installation (CLI)

### 1. Check if shadcn is already initialised

```bash
# Look for components.json in the project root
cat components.json
```

If it exists, shadcn is already set up. Skip to "Adding components".

### 2. Init (only if not already set up)

```bash
npx shadcn@latest init
```

Prompts will ask for:

- Style: **Default** (unless project already uses "New York")
- Base color: match the project's brand (e.g., `slate`, `zinc`, `blue`)
- CSS variables: **Yes** (required for theming)

### 3. Adding components

```bash
# Single component
npx shadcn@latest add button

# Multiple at once
npx shadcn@latest add button card dialog table badge input label select switch textarea

# Always say yes to overwrite prompts unless you have local customisations
```

> **Rule**: Before writing any `import { X } from "@/components/ui/X"`, confirm the
> component file exists OR run the add command. Never hand-write shadcn component files.

---

## Available components (common set)

| Component      | CLI name        | Import path                        |
| -------------- | --------------- | ---------------------------------- |
| Button         | `button`        | `@/components/ui/button`           |
| Card           | `card`          | `@/components/ui/card`             |
| Dialog         | `dialog`        | `@/components/ui/dialog`           |
| Table          | `table`         | `@/components/ui/table`            |
| Badge          | `badge`         | `@/components/ui/badge`            |
| Input          | `input`         | `@/components/ui/input`            |
| Label          | `label`         | `@/components/ui/label`            |
| Select         | `select`        | `@/components/ui/select`           |
| Switch         | `switch`        | `@/components/ui/switch`           |
| Textarea       | `textarea`      | `@/components/ui/textarea`         |
| Skeleton       | `skeleton`      | `@/components/ui/skeleton`         |
| Separator      | `separator`     | `@/components/ui/separator`        |
| Dropdown Menu  | `dropdown-menu` | `@/components/ui/dropdown-menu`    |
| Sheet          | `sheet`         | `@/components/ui/sheet`            |
| Tabs           | `tabs`          | `@/components/ui/tabs`             |
| Tooltip        | `tooltip`       | `@/components/ui/tooltip`          |
| Alert          | `alert`         | `@/components/ui/alert`            |
| Form           | `form`          | `@/components/ui/form`             |
| Checkbox       | `checkbox`      | `@/components/ui/checkbox`         |
| Radio Group    | `radio-group`   | `@/components/ui/radio-group`      |
| Popover        | `popover`       | `@/components/ui/popover`          |
| Command        | `command`       | `@/components/ui/command`          |
| Combobox       | `combobox`      | (built from `command` + `popover`) |
| Scroll Area    | `scroll-area`   | `@/components/ui/scroll-area`      |
| Avatar         | `avatar`        | `@/components/ui/avatar`           |
| Progress       | `progress`      | `@/components/ui/progress`         |
| Toast / Sonner | `sonner`        | `@/components/ui/sonner`           |

---

## Usage patterns

### Button

```tsx
import { Button } from "@/components/ui/button";

<Button variant="outline" size="sm" onClick={handler}>
  Click me
</Button>;
```

Variants: `default | destructive | outline | secondary | ghost | link`
Sizes: `default | sm | lg | icon`

### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>;
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* body content */}
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

> Note: If the project uses a custom `DialogBody` wrapper, keep it — but the rest
> must use the shadcn primitives above.

### Table

```tsx
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Value</TableCell>
    </TableRow>
  </TableBody>
</Table>;
```

### Select (shadcn — NOT native `<select>`)

shadcn Select is a **Radix-based** component, not a native `<select>`. Use it like:

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
    <SelectItem value="NUMBER">Number</SelectItem>
  </SelectContent>
</Select>;
```

⚠️ **Do NOT** use `onChange` + `e.target.value` — shadcn Select uses `onValueChange(value: string)`.

### Switch

```tsx
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

<div className="flex items-center gap-2">
  <Switch id="my-switch" checked={checked} onCheckedChange={setChecked} />
  <Label htmlFor="my-switch">Label text</Label>
</div>;
```

⚠️ shadcn Switch does NOT accept `onChange` or a `label` prop directly.
Use `onCheckedChange` and pair with `<Label>` manually.

### Form (with react-hook-form + zod)

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

const form = useForm({ resolver: zodResolver(schema) })

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

---

## Migration checklist: native HTML → shadcn

| Replace this…           | …with this                                  |
| ----------------------- | ------------------------------------------- |
| `<button>`              | `<Button>`                                  |
| `<input>`               | `<Input>`                                   |
| `<label>`               | `<Label>`                                   |
| `<select>` + `<option>` | `<Select>` + `<SelectTrigger/Content/Item>` |
| `<textarea>`            | `<Textarea>`                                |
| `<table>` raw           | `<Table>` + sub-components                  |
| Custom modal/overlay    | `<Dialog>`                                  |
| Custom switch/toggle    | `<Switch>` + `<Label>`                      |
| `<div role="alert">`    | `<Alert>` + `<AlertDescription>`            |
| Inline skeleton divs    | `<Skeleton>`                                |
| Custom badge `<span>`   | `<Badge>`                                   |

---

## API differences to remember

| Component | Native API    | shadcn API                       |
| --------- | ------------- | -------------------------------- |
| Switch    | `onChange(e)` | `onCheckedChange(checked: bool)` |
| Select    | `onChange(e)` | `onValueChange(value: string)`   |
| Checkbox  | `onChange(e)` | `onCheckedChange(checked: bool)` |
| Dialog    | `isOpen`      | `open` + `onOpenChange`          |

---

## Theming rules (must follow)

- All colors must use CSS variable tokens: `bg-primary`, `text-muted-foreground`, `border-border`, etc.
- Never hardcode Tailwind color classes like `bg-blue-900` or hex values in components.
- Dark mode is handled by toggling the `.dark` class on `<html>` — variables swap automatically.
- Token definitions live in `app/globals.css` under `:root` and `.dark`.

---

## cn() helper

Always use `cn()` for conditional/composed classNames:

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class", className)} />;
```

---

## Step-by-step agent workflow

When asked to refactor or build UI with shadcn:

1. **Check** `components.json` exists → shadcn is initialised.
2. **Identify** which components are needed for the task.
3. **Check** each component file exists at `components/ui/<name>.tsx`.
4. **Install missing** components: `npx shadcn@latest add <name>`.
5. **Refactor** the target file:
   - Replace native HTML with shadcn primitives.
   - Fix API differences (especially `Select`, `Switch`, `onValueChange`).
   - Use `cn()` for classNames.
   - Keep all `useTranslations` calls — never hardcode strings.
   - Keep CSS variable tokens — never hardcode colors.
6. **Run** `npm run typecheck` and `npm run lint` — fix all errors.
7. **Verify** the component renders correctly (no TS errors, no ESLint errors).

---

## Common mistakes to avoid

- ❌ Importing shadcn components that haven't been added yet (file won't exist).
- ❌ Using `onChange` on `<Switch>` — use `onCheckedChange`.
- ❌ Using `onChange` + `e.target.value` on shadcn `<Select>` — use `onValueChange`.
- ❌ Hardcoding colors (`text-blue-900`) instead of tokens (`text-primary`).
- ❌ Writing custom modal markup instead of using `<Dialog>`.
- ❌ Wrapping shadcn components in unnecessary extra divs that break spacing.
- ❌ Forgetting to handle the `asChild` prop when composing buttons as links.
