---
inclusion: manual
---

# Perfil Laboral — Guía de modificación

Este documento explica cómo está estructurado el formulario de perfil laboral y dónde tocar cada cosa cuando se necesite agregar, eliminar o modificar preguntas.

---

## Archivos involucrados

| Archivo | Responsabilidad |
|---------|----------------|
| `components/forms/solicitar/LaborProfileShadcn.tsx` | UI del formulario, schema de validación frontend, vista readonly |
| `app/actions/labor.actions.ts` | Server actions: guardar y leer los 3 recursos |
| `lib/types.ts` | Tipos TypeScript de los 3 recursos |
| `lib/constants.ts` | Opciones de selects y configuración (mínimos, longitudes) |
| `mock-db/labor-situation.json` | Mock DB — situación laboral por userId |
| `mock-db/labor-details.json` | Mock DB — detalles laborales por userId |
| `mock-db/labor-income.json` | Mock DB — ingresos por userId |

---

## Arquitectura: 3 recursos separados

El perfil laboral se divide en 3 recursos independientes que se guardan en secuencia:

```
Recurso 1: LaborSituation   → PUT /users/{id}/labor/situation
Recurso 2: LaborDetails     → PUT /users/{id}/labor/details
Recurso 3: LaborIncome      → PUT /users/{id}/labor/income
```

El estado global `overall_verified = true` solo cuando los 3 están `verified: true`.

**Regla importante:** Si el usuario cambia el `employment_status` (Recurso 1), los `details` (Recurso 2) se invalidan automáticamente porque el shape de preguntas cambia según el tipo.

---

## Campos por tipo de empleo

### EMPLEADO_DEPENDIENTE
- Sector/industria ✅ obligatorio

### INDEPENDIENTE
- Sector/industria ✅ obligatorio
- Años de actividad ✅ obligatorio (acepta 0)

### FREELANCE
- Sector/industria ✅ obligatorio
- Años de actividad ✅ obligatorio (acepta 0)

### EMPRESARIO
- Sector/industria ✅ obligatorio
- Años con el negocio ✅ obligatorio (acepta 0)
- RUC del negocio ✅ obligatorio (11 dígitos)

### PENSIONISTA
- Sin detalles laborales (sección 2 no se muestra)
- Solo ingresos (sección 3)

### Todos los tipos
- Ingreso mensual neto ✅ obligatorio (mínimo configurable en `LABOR_CONFIG`)
- Ingresos adicionales ⬜ opcional (switch), pero si se activa debe tener al menos uno

---

## Cómo agregar un campo nuevo

### Ejemplo: agregar "Fecha de inicio" para EMPLEADO_DEPENDIENTE

**Paso 1 — Tipo** (`lib/types.ts`, interfaz `LaborDetails`):
```ts
export interface LaborDetails {
  // ... campos existentes ...
  start_date?: string; // agregar aquí
}
```

**Paso 2 — Schema frontend** (`LaborProfileShadcn.tsx`, `laborFormSchema`):
```ts
const laborFormSchema = z.object({
  // ... campos existentes ...
  start_date: z.string().optional(),
})
```

Si es obligatorio para un tipo específico, agregar en `superRefine`:
```ts
if (data.employment_status === 'EMPLEADO_DEPENDIENTE' && !data.start_date) {
  ctx.addIssue({ code: 'custom', message: 'Ingresa la fecha de inicio', path: ['start_date'] });
}
```

**Paso 3 — defaultValues** (`LaborProfileShadcn.tsx`, `useForm`):
```ts
defaultValues: {
  // ... valores existentes ...
  start_date: prevDetails?.start_date ?? '',
}
```

**Paso 4 — Campo en el formulario** (`LaborProfileShadcn.tsx`, dentro del bloque `{employmentStatus === 'EMPLEADO_DEPENDIENTE' && (...)}`):
```tsx
<FormField
  control={form.control}
  name="start_date"
  render={({ field }) => (
    <FormItem className="flex flex-col gap-1">
      <FormLabel>Fecha de inicio</FormLabel>
      <Input type="date" {...field} className="w-full" />
      <FormMessage />
    </FormItem>
  )}
/>
```

**Paso 5 — Vista readonly** (`LaborProfileShadcn.tsx`, `verifiedView`):
```tsx
{prevDetails?.start_date && <DataRow label="Fecha de inicio" value={prevDetails.start_date} />}
```

**Paso 6 — Validación servidor** (`labor.actions.ts`, `saveLaborDetails`):
```ts
if (situation.employment_status === 'EMPLEADO_DEPENDIENTE') {
  // ... validaciones existentes ...
  if (!details.start_date) {
    return { success: false, error: 'Ingresa la fecha de inicio.' };
  }
}
```

**Paso 7 — Reset al cambiar tipo** (`LaborProfileShadcn.tsx`, `handleEmploymentChange`):
```ts
form.setValue('start_date', '');
```

---

## Cómo eliminar un campo

Ejemplo: eliminar "Cargo/puesto" de EMPLEADO_DEPENDIENTE.

1. **`lib/types.ts`** — quitar `position?: string` de `LaborDetails`
2. **`laborFormSchema`** — quitar `position: z.string().optional()`
3. **`superRefine`** — quitar la validación de `position`
4. **`defaultValues`** — quitar `position: prevDetails?.position ?? ''`
5. **Formulario** — quitar el `<FormField name="position" ...>`
6. **Vista readonly** — quitar `{prevDetails?.position && <DataRow label="Cargo" ...>}`
7. **`labor.actions.ts`** — quitar la validación de `position` en `saveLaborDetails`
8. **`handleEmploymentChange`** — quitar `form.setValue('position', '')`

---

## Cómo agregar un nuevo tipo de empleo

Ejemplo: agregar `RENTISTA` (persona que vive de rentas).

**Paso 1 — Tipo** (`lib/types.ts`):
```ts
export type EmploymentStatus =
  | 'EMPLEADO_DEPENDIENTE'
  | 'INDEPENDIENTE'
  | 'EMPRESARIO'
  | 'FREELANCE'
  | 'PENSIONISTA'
  | 'RENTISTA'; // agregar aquí
```

**Paso 2 — Constante** (`lib/constants.ts`):
```ts
export const EMPLOYMENT_OPTIONS = [
  // ... opciones existentes ...
  { value: 'RENTISTA', label: 'Rentista' },
] as const;
```

**Paso 3 — Formulario** (`LaborProfileShadcn.tsx`):
- Decidir si `RENTISTA` tiene detalles o no (como `PENSIONISTA`)
- Si no tiene detalles: agregar `|| employmentStatus === 'RENTISTA'` en la condición que oculta la sección 2
- Si tiene detalles propios: agregar un bloque `{employmentStatus === 'RENTISTA' && (...)}` con sus campos

**Paso 4 — Server action** (`labor.actions.ts`):
- En `saveLaborProfile`: si no tiene detalles, agregar al bloque de `PENSIONISTA`:
  ```ts
  if (situation === 'PENSIONISTA' || situation === 'RENTISTA') { ... }
  ```
- En `saveLaborDetails`: agregar validaciones específicas si aplica

**Paso 5 — Vista readonly** (`LaborProfileShadcn.tsx`, `verifiedView`):
- Ocultar "Sector" si aplica: agregar `|| prevSituation?.employment_status === 'RENTISTA'` en la condición

---

## Cómo modificar opciones de selects

Todas las opciones están centralizadas en `lib/constants.ts`. **No modificar directamente en el componente.**

```ts
// Agregar sector
export const INDUSTRY_OPTIONS = [
  // ... opciones existentes ...
  { value: 'MINERIA', label: 'Minería' }, // agregar aquí
] as const;

// Agregar tipo de ingreso adicional
export const ADDITIONAL_INCOME_TYPE_OPTIONS = [
  // ... opciones existentes ...
  { value: 'BONO', label: 'Bono o gratificación' }, // agregar aquí
] as const;
```

Si agregas un valor nuevo al select, también agregar al tipo union en `lib/types.ts`:
```ts
export type LaborIndustry =
  | 'TECNOLOGIA'
  // ... valores existentes ...
  | 'MINERIA'; // agregar aquí
```

---

## Cómo cambiar reglas de negocio (mínimos, longitudes)

Todo en `lib/constants.ts`, sección `LABOR_CONFIG`:

```ts
export const LABOR_CONFIG = {
  MIN_MONTHLY_INCOME: 500,  // cambiar el mínimo de ingreso mensual
  RUC_LENGTH: 11,           // longitud del RUC (no cambiar salvo que SUNAT cambie)
} as const;
```

El valor se usa automáticamente en el schema del frontend y en las validaciones del servidor. No hay que tocar nada más.

---

## Flujo de guardado

```
onSubmit (frontend)
  │
  ├── saveLaborProfile(situation, details, income)  ← server action wrapper
  │     │
  │     ├── saveLaborSituation(employment_status)
  │     │     └── Si cambió el tipo → invalida details del usuario
  │     │
  │     ├── saveLaborDetails(details)   ← se salta si PENSIONISTA
  │     │     └── Valida según employment_status guardado
  │     │
  │     └── saveLaborIncome(income)
  │           └── Valida monto mínimo y array de adicionales
  │
  └── Si todo ok → setIsVerified(true) → vista readonly
      Si falla   → setSaveError(mensaje) → muestra error en form
```

---

## Estados del formulario

| Estado | Condición | UI |
|--------|-----------|-----|
| Vacío | `initialData = null` | Form vacío, todos los campos editables |
| Parcial | `overall_verified = false` | Form con datos pre-rellenos, editables |
| Verificado | `overall_verified = true` | Vista readonly con botón "Editar" |
| Editando | Usuario presionó "Editar" | Form con datos pre-rellenos, editables |

---

## Notas para el backend real

Cuando se conecte el backend real, reemplazar en `labor.actions.ts`:

- `readJSON` / `writeJSON` → `fetch` a los endpoints correspondientes
- Los 3 endpoints esperados:
  - `GET  /users/{id}/labor/status` → retorna `LaborProfileStatus`
  - `PUT  /users/{id}/labor/situation` → body: `LaborSituation`
  - `PUT  /users/{id}/labor/details` → body: `LaborDetails`
  - `PUT  /users/{id}/labor/income` → body: `LaborIncome`
- El backend es quien decide si los datos son válidos y marca `verified: true`
- Las validaciones en el frontend son solo UX — el backend siempre valida por su cuenta
