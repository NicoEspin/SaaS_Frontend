# UI Visual Polish Skill — Enterprise Dashboard Standard

> **Lee este archivo ANTES de escribir cualquier componente, página, formulario, tabla o diálogo.**
> El estándar es: shadcn elevado al nivel de Linear, Vercel Dashboard, o Planetscale.
> UI funcional no alcanza. Cada pantalla debe sentirse deliberada, densa-pero-respirable, y production-ready.

---

## 0. Mentalidad Enterprise Dashboard

Este no es un estilo marketing ni landing page. Es un dashboard de datos. Las reglas son:

- **Densidad controlada**: información densa pero con jerarquía clara. Nada de padding gigante sin razón.
- **Color como señal, no decoración**: el color existe para comunicar estado, urgencia, o acción. No para embellecer.
- **Interacciones predecibles**: hover, focus, active deben ser sutiles pero presentes en TODO elemento interactivo.
- **Tablas y listas son ciudadanos de primera clase**: deben verse profesionales, no como un `<table>` con estilos default.
- **El estado vacío y el estado de carga son parte del diseño**, no un afterthought.

---

## 1. Checklist — No Enviar Sin Esto

Antes de marcar cualquier tarea como hecha, verificar cada punto:

- [ ] Acciones destructivas (delete, remove, revoke, cancel irreversible) usan `variant="destructive"` — **siempre rojo**
- [ ] Hay al menos un uso de `bg-primary` o `text-primary` por pantalla (el CTA principal)
- [ ] Los estados de status usan badges semánticos (`Badge` con className de color, nunca `<span>`)
- [ ] Texto de soporte/metadata usa `text-muted-foreground` consistentemente
- [ ] Cada fila de tabla clickeable tiene `hover:bg-muted/50 cursor-pointer transition-colors`
- [ ] Cada botón deshabilitado durante carga muestra spinner + texto cambiado (`"Guardando..."`)
- [ ] Áreas de contenido en carga usan `<Skeleton>`, no spinner global
- [ ] Pantallas sin datos tienen empty state con ícono + título + descripción
- [ ] Focus visible en todos los elementos interactivos (no se eliminan outlines)
- [ ] Layout funciona en 1280px (desktop dashboard) y 768px (tablet)

---

## 2. Colores Semánticos — Regla de Oro

**El color comunica. Nunca lo uses solo para decorar.**

### Mapa de intención → token

| Intención              | Clase Tailwind / shadcn token                                        | Cuándo usarlo                                      |
|------------------------|----------------------------------------------------------------------|----------------------------------------------------|
| Acción principal       | `bg-primary text-primary-foreground`                                 | El único CTA importante por vista                  |
| Destructivo / Peligro  | `variant="destructive"` / `text-destructive` / `border-destructive` | Delete, remove, revoke, disable permanente         |
| Éxito / Activo         | `text-emerald-600 dark:text-emerald-400` + `bg-emerald-50 dark:bg-emerald-950/30` | Activo, publicado, completado, aprobado |
| Advertencia            | `text-amber-600 dark:text-amber-400` + `bg-amber-50 dark:bg-amber-950/30` | Pendiente, expirado pronto, degradado    |
| Info / Neutral         | `text-blue-600 dark:text-blue-400` + `bg-blue-50 dark:bg-blue-950/30` | Informativo, procesando, en revisión      |
| Texto secundario       | `text-muted-foreground`                                              | Descripciones, hints, metadata, timestamps         |
| Superficie de card     | `bg-card border-border`                                              | Todos los cards y paneles                          |

### Destructivo — Patrón Obligatorio

```tsx
// ❌ NUNCA así
<Button onClick={handleDelete}>Eliminar</Button>
<Button className="bg-red-500">Eliminar</Button>

// ✅ SIEMPRE así para acciones destructivas
<Button variant="destructive">
  <Trash2 className="mr-2 h-4 w-4" />
  {t('Common.delete')}
</Button>

// ✅ Con confirmación (para eliminaciones irreversibles — SIEMPRE usar AlertDialog)
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">
      <Trash2 className="mr-2 h-4 w-4" />
      {t('Common.delete')}
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('Common.confirmDeleteTitle')}</AlertDialogTitle>
      <AlertDialogDescription>{t('Common.confirmDeleteDescription')}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('Common.cancel')}</AlertDialogCancel>
      <AlertDialogAction
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={handleDelete}
      >
        {t('Common.confirmDelete')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Danger Zone en Settings

```tsx
// Card de zona peligrosa — siempre al final de la página de settings
<Card className="border-destructive/40">
  <CardHeader className="pb-3">
    <CardTitle className="text-base text-destructive">{t('Settings.dangerZone')}</CardTitle>
    <CardDescription>{t('Settings.dangerZoneDescription')}</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between rounded-md border border-destructive/30 p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{t('Settings.deleteOrg')}</p>
        <p className="text-xs text-muted-foreground">{t('Settings.deleteOrgWarning')}</p>
      </div>
      <Button variant="destructive" size="sm">{t('Settings.deleteOrg')}</Button>
    </div>
  </CardContent>
</Card>
```

---

## 3. Tipografía — Jerarquía en Dashboard

En un dashboard la jerarquía no viene del tamaño enorme de fuente, sino del peso, tracking, y contraste de color.

```tsx
// Título de página — uno por página, nunca más
<h1 className="text-xl font-semibold tracking-tight">{t('Page.title')}</h1>
// Con descripción debajo
<p className="text-sm text-muted-foreground">{t('Page.description')}</p>

// Header de sección dentro de una página
<h2 className="text-base font-semibold">{t('Section.title')}</h2>

// Título de card / panel
<h3 className="text-sm font-medium">{t('Card.title')}</h3>

// Label de dato (key-value en detail views)
<dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
  {t('Detail.label')}
</dt>
<dd className="text-sm font-medium mt-0.5">{value}</dd>

// Metadata / timestamps / IDs
<span className="text-xs text-muted-foreground font-mono">{id}</span>
<time className="text-xs text-muted-foreground">{formattedDate}</time>
```

**Reglas de peso:**
- `font-semibold`: títulos de página y sección
- `font-medium`: títulos de card, labels importantes, valores en key-value
- (sin modificador, `font-normal`): body text, contenido de tabla
- Nunca `font-bold` en UI de dashboard — es demasiado agresivo
- Nunca `text-2xl` o mayor para UI interna (reservar para marketing)

---

## 4. Espaciado — Sistema para Dashboard

El dashboard usa espaciado más compacto que un sitio marketing. Las unidades base:

```
gap entre ícono y texto:          gap-2     (8px)
gap entre campos de formulario:   gap-4     (16px) / space-y-4
gap entre secciones de card:      gap-6     (24px)
gap entre cards/secciones:        gap-6     (24px)
padding interno de página:        p-6       (24px) — nunca menos en desktop
padding de card:                  p-5 o p-6
padding de tabla (th/td):         px-4 py-3 (default shadcn, no tocar)
```

**Patrón de página estándar:**

```tsx
// Layout de página con header + contenido
<div className="flex flex-col gap-6 p-6">
  {/* Page header */}
  <div className="flex items-start justify-between">
    <div className="space-y-1">
      <h1 className="text-xl font-semibold tracking-tight">{t('Page.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('Page.description')}</p>
    </div>
    {/* Primary action — solo uno */}
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      {t('Page.primaryAction')}
    </Button>
  </div>

  {/* Filters / search bar si aplica */}
  <div className="flex items-center gap-3">
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input className="pl-9" placeholder={t('Common.search')} />
    </div>
    {/* Filtros adicionales */}
  </div>

  {/* Contenido principal */}
  <Card>
    {/* ... */}
  </Card>
</div>
```

---

## 5. Tablas — El Corazón del Dashboard

Las tablas son el componente más importante en un dashboard enterprise. Deben verse profesionales.

```tsx
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table"

// Patrón completo de tabla enterprise
<div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="w-[300px]">{t('Table.name')}</TableHead>
        <TableHead>{t('Table.status')}</TableHead>
        <TableHead>{t('Table.created')}</TableHead>
        <TableHead className="text-right">{t('Table.actions')}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={4}>
            <TableEmptyState />
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => (
          <TableRow
            key={row.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push(`/items/${row.id}`)}
          >
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{row.name}</span>
                <span className="text-xs text-muted-foreground">{row.id}</span>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell>
              <time className="text-sm text-muted-foreground">
                {formatDate(row.createdAt)}
              </time>
            </TableCell>
            <TableCell className="text-right">
              <RowActions row={row} />
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>
```

### Acciones de fila — DropdownMenu pattern

```tsx
function RowActions({ row }: { row: Row }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('Common.openMenu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => handleView(row)}>
          <Eye className="mr-2 h-4 w-4" />
          {t('Common.view')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleEdit(row)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t('Common.edit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Destructivo SIEMPRE separado y con color rojo */}
        <DropdownMenuItem
          onSelect={() => handleDelete(row)}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('Common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 6. Status Badges — Patrón Semántico

Nunca usar `<span>` con clases para status. Siempre `<Badge>` con className semántica.

```tsx
type Status = 'active' | 'inactive' | 'pending' | 'error' | 'draft'

const statusConfig: Record<Status, { className: string }> = {
  active:   { className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  inactive: { className: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' },
  pending:  { className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  error:    { className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
  draft:    { className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' },
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusConfig[status].className)}>
      {t(`Status.${status}`)}
    </Badge>
  )
}
```

---

## 7. Micro-interacciones — Estados Interactivos

**Todos** los elementos interactivos necesitan feedback visual. No hay excepciones.

### Loading state de botón
```tsx
<Button disabled={isPending}>
  {isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {t('Common.saving')}
    </>
  ) : (
    t('Common.save')
  )}
</Button>
```

### Inputs con error
```tsx
<Input
  className={cn(
    "transition-colors",
    error && "border-destructive focus-visible:ring-destructive"
  )}
  aria-invalid={!!error}
/>
{error && <p className="text-xs text-destructive mt-1">{error.message}</p>}
```

### Cards clickeables
```tsx
<Card className="cursor-pointer transition-all duration-150 hover:shadow-md hover:border-primary/40 active:scale-[0.99]">
```

### Links de navegación activos/inactivos
```tsx
<Link
  className={cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )}
>
  <Icon className="h-4 w-4 shrink-0" />
  {label}
</Link>
```

### Íconos de acción con hover destructivo
```tsx
// Siempre Tooltip en icon-only buttons
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent side="top">{t('Common.delete')}</TooltipContent>
</Tooltip>
```

---

## 8. Empty States — Diseñados, No Improvisados

```tsx
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full border border-dashed p-6 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">{description}</p>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Dentro de tabla sin datos
<TableRow>
  <TableCell colSpan={columnCount} className="h-64">
    <EmptyState
      icon={PackageOpen}
      title={t('Resource.emptyTitle')}
      description={t('Resource.emptyDescription')}
      action={{ label: t('Resource.create'), onClick: handleCreate }}
    />
  </TableCell>
</TableRow>

// Sin resultados de búsqueda (distinto al vacío real)
<EmptyState
  icon={SearchX}
  title={t('Common.noResultsTitle')}
  description={t('Common.noResultsDescription')}
  action={{ label: t('Common.clearFilters'), onClick: handleClear }}
/>
```

---

## 9. Loading States — Skeletons, No Spinners Globales

Los spinners son solo para botones submit. Todo lo demás usa `<Skeleton>`.

```tsx
// Skeleton de tabla
function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i}><Skeleton className="h-4 w-24" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              {Array.from({ length: cols }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className={cn("h-4", j === 0 ? "w-48" : "w-24")} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Skeleton de KPI card
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

// Con Suspense en App Router
export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader />
      <Suspense fallback={<TableSkeleton rows={8} cols={4} />}>
        <DataTable />
      </Suspense>
    </div>
  )
}
```

---

## 10. Formularios

```tsx
<Card className="max-w-2xl">
  <CardHeader>
    <CardTitle>{t('Form.title')}</CardTitle>
    <CardDescription>{t('Form.description')}</CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="name">{t('Forms.name')}</Label>
      <Input
        id="name"
        placeholder={t('Forms.namePlaceholder')}
        className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
        {...register('name')}
      />
      {errors.name
        ? <p className="text-xs text-destructive">{errors.name.message}</p>
        : <p className="text-xs text-muted-foreground">{t('Forms.nameHint')}</p>
      }
    </div>
  </CardContent>
  <CardFooter className="flex justify-end gap-2 border-t pt-5">
    <Button variant="outline" onClick={onCancel} disabled={isPending}>
      {t('Common.cancel')}
    </Button>
    <Button type="submit" disabled={isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? t('Common.saving') : t('Common.save')}
    </Button>
  </CardFooter>
</Card>
```

---

## 11. KPI / Stat Cards

```tsx
function StatCard({ title, value, trend, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {trend && (
          <p className={cn(
            "text-xs mt-1 flex items-center gap-1",
            trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 12. Toasts — Feedback de Acciones

Toda acción del usuario debe tener confirmación visual.

```tsx
toast.success(t('Common.savedSuccessfully'))
toast.error(t('Common.saveFailed'))

// Con descripción
toast.success(t('Products.created'), {
  description: t('Products.createdDescription', { name: product.name }),
})

// Con undo para destructivos
toast(t('Products.deleted'), {
  action: { label: t('Common.undo'), onClick: () => handleUndo() },
})
```

---

## 13. Íconos — Referencia Rápida

**Tamaños:** `h-4 w-4` inline, `h-5 w-5` standalone, `h-8 w-8` empty state hero.

**Íconos estándar por acción (ser consistente en toda la app):**

| Acción          | Ícono             |
|-----------------|-------------------|
| Crear / Agregar | `Plus`            |
| Editar          | `Pencil`          |
| Eliminar        | `Trash2`          |
| Ver detalle     | `Eye`             |
| Más opciones    | `MoreHorizontal`  |
| Buscar          | `Search`          |
| Filtrar         | `Filter`          |
| Exportar        | `Download`        |
| Sin resultados  | `SearchX`         |
| Vacío           | `PackageOpen`     |
| Alerta          | `AlertTriangle`   |
| Éxito           | `CheckCircle2`    |

---

## 14. Auditoría Visual Final

| Pregunta                                                                 | Fix si es "no"                                  |
|--------------------------------------------------------------------------|-------------------------------------------------|
| ¿Las acciones destructivas usan `variant="destructive"`?                | Cambiar variant                                 |
| ¿El CTA principal usa `bg-primary` (Button default)?                    | Usar `<Button>` sin variant override            |
| ¿Los status usan `<Badge>` con className semántica, no `<span>`?        | Reemplazar por `<StatusBadge />`                |
| ¿El texto secundario usa `text-muted-foreground`?                       | Agregar la clase                                |
| ¿Las filas de tabla tienen `hover:bg-muted/50 transition-colors`?       | Agregar a `<TableRow>`                          |
| ¿Los botones en loading muestran spinner + texto contextual?            | Agregar estado isPending al botón               |
| ¿Las áreas de carga usan `<Skeleton>` en lugar de spinner global?       | Crear skeleton para esa vista                   |
| ¿La vista sin datos tiene `<EmptyState>` con ícono + texto + acción?    | Implementar componente                          |
| ¿Los icon-only buttons tienen `<Tooltip>`?                              | Envolver en `<Tooltip>`                         |
| ¿Las acciones muestran `toast.success()` / `toast.error()`?             | Agregar feedback de toast                       |