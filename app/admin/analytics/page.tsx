import { TrendingUp } from 'lucide-react';
import { ActiveLoansKpiCard } from '@/components/admin/kpis/ActiveLoansKpiCard';
import { CapitalDisponibleKpiCard } from '@/components/admin/kpis/CapitalDisponibleKpiCard';
import { UtilizacionKpiCard } from '@/components/admin/kpis/UtilizacionKpiCard';
import { IncomeKpiCard } from '@/components/admin/kpis/IncomeKpiCard';
import { NpsKpiCard } from '@/components/admin/kpis/NpsKpiCard';
import { NplKpiCard } from '@/components/admin/kpis/NplKpiCard';
import { FunnelKpiCard } from '@/components/admin/kpis/FunnelKpiCard';
import { ActiveClientsKpiCard } from '@/components/admin/kpis/ActiveClientsKpiCard';
import { RepurchaseRateKpiCard } from '@/components/admin/kpis/RepurchaseRateKpiCard';
import { CityDistributionKpiCard } from '@/components/admin/kpis/CityDistributionKpiCard';

/**
 * Página de KPIs Globales (M1) del Dashboard Admin.
 * Cada card es independiente: fetch propio, skeleton propio, refresh propio.
 */
export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">KPIs Globales</h1>
          <p className="text-sm text-muted-foreground">
            Resumen operativo — hover sobre cualquier card para refrescar
          </p>
        </div>
      </div>

      {/* Fila 1: Préstamos activos + Capital disponible + Utilización */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ActiveLoansKpiCard />
        <CapitalDisponibleKpiCard />
        <UtilizacionKpiCard />
      </div>

      {/* Fila 2: NPL (ancho) */}
      <NplKpiCard />

      {/* Fila 3: Ingresos + NPS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <IncomeKpiCard days={30} />
        <NpsKpiCard days={30} />
      </div>

      {/* Fila 4: Funnel */}
      <FunnelKpiCard days={30} />

      {/* Fila 5: Clientes activos + Tasa de recompra */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ActiveClientsKpiCard days={30} />
        <RepurchaseRateKpiCard days={30} />
      </div>

      {/* Fila 6: Distribución por ciudad */}
      <CityDistributionKpiCard />
    </div>
  );
}
