# LoanCalculator — Componente Reutilizable

Calculadora de préstamos con gauge de perfil crediticio. Diseñada para ser portable entre proyectos.

---

## Estructura

```
LoanCalculator/
├── core/                          ← Lógica pura (NO tocar)
│   ├── types.ts                   ← Contrato: interfaces de API, theme, props
│   ├── LoanCalculatorProvider.tsx ← React Context que inyecta el adapter
│   ├── constants.ts               ← Anchos de paneles, valores del gauge
│   └── index.ts
│
├── ui/                            ← Componentes visuales (NO tocar)
│   ├── LoanCalculator.tsx         ← Componente principal
│   ├── CreditGauge.tsx            ← Gauge SVG semicircular
│   ├── CreditProfileGauge.tsx     ← Gauge + pills de monto
│   ├── LoanDetail.tsx             ← Panel lateral/modal de detalle
│   ├── CalculatorSkeleton.tsx     ← Estado de carga
│   ├── Skeleton.tsx               ← Componente base de skeleton
│   └── index.ts
│
├── sections/                      ← Secciones del formulario (NO tocar)
│   ├── AmountSlider.tsx           ← Selector de monto con slider
│   ├── TermSelector.tsx           ← Selector de plazo (7, 15, 30 días)
│   ├── InstallmentSelector.tsx    ← Selector de cuotas
│   ├── Schedule.tsx               ← Cronograma de pagos
│   ├── SubmitButton.tsx           ← Botón "Solicitar Préstamo"
│   └── index.ts
│
├── adapters/                      ← ESPECÍFICO de cada proyecto
│   ├── fondeaApi.ts               ← Adapter para el backend de Fondea
│   └── index.ts
│
├── theme.css                      ← Variables CSS del componente
├── LoanCalculatorWithProvider.tsx  ← Wrapper con adapter de Fondea (este proyecto)
└── index.ts                       ← Exports públicos
```

---

## Cómo usar en ESTE proyecto

```tsx
import { LoanCalculator } from "@/components/LoanCalculator";

// En el hero (embebida, decide sidebar/modal según espacio)
<LoanCalculator detailMode="modal" />

// En página dedicada (más grande)
<LoanCalculator dedicated detailMode="modal" />
```

No necesitas hacer nada más — el `LoanCalculator` exportado ya incluye el Provider con el adapter de Fondea.

---

## Cómo usar en OTRO proyecto

### 1. Copiar carpetas

Copia estas carpetas/archivos al nuevo proyecto:
- `core/`
- `ui/`
- `sections/`
- `theme.css`

NO copies `adapters/` ni `LoanCalculatorWithProvider.tsx` — esos son específicos de Fondea.

### 2. Dependencias requeridas

```json
{
  "dependencies": {
    "react": ">=18",
    "lucide-react": ">=0.300",
    "tailwindcss": ">=4",
    "clsx": ">=2",
    "tailwind-merge": ">=2"
  }
}
```

También necesitas la función `cn` (clsx + tailwind-merge):
```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

### 3. Crear tu adapter

Crea un archivo que implemente la interfaz `LoanCalculatorApi`:

```ts
import type { LoanCalculatorApi, LoanConfig, LoanCalculation, IntentionRequest, IntentionResponse } from "./LoanCalculator/core";

export const miApi: LoanCalculatorApi = {
  fetchConfig: async (): Promise<LoanConfig> => {
    const res = await fetch("/mi-api/config");
    const data = await res.json();
    return {
      productId: data.id,
      amounts: data.amounts,       // { value: number, label: string }[]
      terms: data.terms,           // { value: number, label: string }[]
      installments: data.cuotas,   // { value: number, label: string }[]
      creditScoreRanges: data.ranges, // { code: string, label: string, color: string }[]
    };
  },

  fetchCalculation: async (amount, termDays, installments, config, signal): Promise<LoanCalculation> => {
    const res = await fetch("/mi-api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, termDays, installments, productId: config.productId }),
      signal,
    });
    const data = await res.json();
    // Mapear al formato esperado:
    return {
      scores: {
        "bajo": { total: 150, cuotaAmt: 150, color: "#EF4444", lightBg: "rgba(239,68,68,0.08)", fees: [], discounts: [], totalFeesOriginal: 0, totalPercentageDiscounts: 0, totalFeesWithPercentageDiscounts: 0, totalFeesResult: 0, igv: 0, schedule: [] },
        "medio": { ... },
        "alto": { ... },
      }
    };
  },

  createIntention: async (data: IntentionRequest): Promise<IntentionResponse> => {
    const res = await fetch("/mi-api/solicitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json(); // debe devolver { id: string }
  },

  portalUrl: "https://mi-app.com/solicitud",

  // Opcional: recolectar metadata del dispositivo
  collectMetadata: async () => ({
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  }),
};
```

### 4. Usar con Provider

```tsx
import { LoanCalculatorProvider } from "./LoanCalculator/core";
import { LoanCalculator } from "./LoanCalculator/ui";
import { miApi } from "./miAdapter";

function App() {
  return (
    <LoanCalculatorProvider api={miApi}>
      <LoanCalculator detailMode="modal" />
    </LoanCalculatorProvider>
  );
}
```

---

## Inyectar colores (theme)

### Opción A: Variables CSS (recomendado)

Sobreescribe las variables en `theme.css` o en tu CSS global:

```css
:root {
  --lc-primary:       #00A1CD;
  --lc-primary-dark:  #0087AD;
  --lc-primary-light: #E0F7FD;
  --lc-text:          #2D373D;
  --lc-muted:         #7A8E9A;
  --lc-border:        #DDE4EA;
  --lc-bg:            #ffffff;
  --lc-header-bg:     #00A1CD;
  --lc-header-text:   #ffffff;
}
```

### Opción B: Prop `theme` en el Provider

```tsx
const miTheme: LoanCalculatorTheme = {
  primary: "#00A1CD",
  primaryDark: "#0087AD",
  primaryLight: "#E0F7FD",
  text: "#2D373D",
  muted: "#7A8E9A",
  border: "#DDE4EA",
  background: "#ffffff",
  headerBg: "#00A1CD",
  headerText: "#ffffff",
};

<LoanCalculatorProvider api={miApi} theme={miTheme}>
  <LoanCalculator />
</LoanCalculatorProvider>
```

El Provider aplica los colores como CSS variables inline automáticamente.

---

## Props del componente

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `dedicated` | `boolean` | `false` | Página dedicada: más padding y espacio |
| `detailMode` | `"sidebar" \| "modal"` | `"modal"` | Cómo mostrar el panel de detalle |
| `submitLabel` | `string` | `"Solicitar Préstamo →"` | Texto del botón de acción |
| `onDetailToggle` | `(isOpen: boolean) => void` | — | Callback al abrir/cerrar detalle |
| `className` | `string` | — | Clases CSS adicionales |

---

## Contrato de la API (core/types.ts)

### `LoanCalculatorApi`

| Método | Descripción |
|--------|-------------|
| `fetchConfig()` | Devuelve montos, plazos, cuotas y rangos crediticios |
| `fetchCalculation(amount, term, inst, config, signal?)` | Calcula scores por perfil |
| `createIntention(data)` | Crea solicitud de préstamo, devuelve `{ id }` |
| `portalUrl` | URL donde redirigir después de crear la intención |
| `collectMetadata?()` | (Opcional) Recolecta info del dispositivo |

### `LoanConfig` (lo que devuelve `fetchConfig`)

```ts
{
  productId: string;
  amounts: { value: number; label: string }[];
  terms: { value: number; label: string }[];
  installments: { value: number; label: string }[];
  creditScoreRanges: { code: string; label: string; color: string }[];
}
```

### `ScoreResult` (cada score en `LoanCalculation.scores`)

```ts
{
  total: number;
  cuotaAmt: number;
  color: string;
  lightBg: string;
  fees: FeeItem[];
  discounts: DiscountItem[];
  totalFeesOriginal: number;
  totalPercentageDiscounts: number;
  totalFeesWithPercentageDiscounts: number;
  totalFeesResult: number;
  igv: number;
  schedule: ScheduleItem[];
}
```

---

## Constantes configurables (core/constants.ts)

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `CARD_MAX_WIDTH` | 350px | Ancho máximo de la tarjeta |
| `DETAIL_MAX_WIDTH` | 380px | Ancho máximo del panel de detalle |
| `DETAIL_GAP` | 16px | Espacio entre tarjeta y detalle |
| `DETAIL_SIDEBAR_BREAKPOINT` | 746px | Mínimo para mostrar sidebar (calculado) |
| `GAUGE_VALUES` | [0.05, 0.50, 0.95] | Posiciones del gauge por perfil |

---

## Tailwind CSS

El componente usa clases de Tailwind. Asegúrate de que tu `tailwind.config` incluya la carpeta del componente en `content`:

```js
content: [
  "./src/components/LoanCalculator/**/*.{ts,tsx}",
]
```

También usa estas clases de color que debes tener definidas:
- `bg-primary-500`, `text-primary-600`, `border-primary-500`, etc.
- `border-neutral-200`, `text-neutral-400`, `text-neutral-500`, etc.

Si tu proyecto no tiene estos colores, defínelos en tu config de Tailwind o usa la opción B (theme via Provider).
