# MetricCard Component

Componente visual uniforme para mostrar métricas/KPIs en el dashboard admin.

## Uso básico

```tsx
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import { TrendingUp } from 'lucide-react';

function MyKpiCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch('/api/my-kpi');
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) return <MetricCardSkeleton />;
  if (!data) return null;

  return (
    <MetricCard
      icon={TrendingUp}
      title="Mi Métrica"
      description="Descripción opcional"
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
    >
      <p className="text-3xl font-bold">{data.value}</p>
      <p className="text-sm text-muted-foreground">Info adicional</p>
    </MetricCard>
  );
}
```

## Props

### MetricCard

- `icon?: LucideIcon` - Icono opcional (de lucide-react)
- `title: string` - Título del card (requerido)
- `description?: string` - Descripción/subtítulo opcional
- `onRefresh?: () => void` - Función para refrescar datos (muestra botón refresh si se provee)
- `isRefreshing?: boolean` - Estado de loading durante refresh
- `footer?: ReactNode` - Contenido opcional para el footer (botones, selectores, etc)
- `children: ReactNode` - Contenido principal del card
- `className?: string` - Clase CSS adicional

### MetricCardSkeleton

- `className?: string` - Clase CSS adicional

## Ejemplos

### Card simple

```tsx
<MetricCard
  icon={TrendingUp}
  title="Préstamos activos"
  onRefresh={fetchData}
  isRefreshing={loading}
>
  <p className="text-4xl font-bold">120</p>
  <p className="text-sm text-muted-foreground">S/ 50,000 colocados</p>
</MetricCard>
```

### Card con selector de período

```tsx
<MetricCard
  icon={DollarSign}
  title="Ingresos brutos"
  description="desde hace 30 días"
  onRefresh={() => fetchData(days)}
  isRefreshing={loading}
  footer={
    <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
      <SelectTrigger className="h-7 w-24 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">7 días</SelectItem>
        <SelectItem value="30">30 días</SelectItem>
      </SelectContent>
    </Select>
  }
>
  <p className="text-3xl font-bold">S/ 100,000</p>
</MetricCard>
```

### Card con botón de acción

```tsx
<MetricCard
  icon={MapPin}
  title="Distribución Geográfica"
  description="20 departamentos"
  onRefresh={fetchData}
  isRefreshing={loading}
  footer={
    <Link href="/admin/analytics/geo">
      <Button size="sm">Ver mapa</Button>
    </Link>
  }
>
  {/* Chart o contenido complejo */}
  <MyChart data={data} />
</MetricCard>
```

## Características

- ✅ Header con icon + title + description
- ✅ Botón refresh que aparece en hover
- ✅ Overlay de loading durante refresh
- ✅ Footer opcional para controles adicionales
- ✅ Skeleton component para loading state
- ✅ Usa shadcn/ui Card components
- ✅ Totalmente responsive
- ✅ Cada card maneja su propia lógica de fetch

## Notas

- El componente es **puramente visual** - cada card es responsable de su propia lógica de fetch
- El `children` define el tamaño del card - no hay altura fija
- El botón refresh solo aparece si se pasa `onRefresh`
- Usa `MetricCardSkeleton` para el estado de loading inicial
