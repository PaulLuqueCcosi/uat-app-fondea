import { TrendingUp } from 'lucide-react';
import { ActiveLoansKpiCard } from '@/components/admin/kpis/ActiveLoansKpiCard';
import { CapitalKpiCard } from '@/components/admin/kpis/CapitalKpiCard';
import { IncomeKpiCard } from '@/components/admin/kpis/IncomeKpiCard';
import { NpsKpiCard } from '@/components/admin/kpis/NpsKpiCard';
import { NplKpiCard } from '@/components/admin/kpis/NplKpiCard';
import { FunnelKpiCard } from '@/components/admin/kpis/FunnelKpiCard';
import { ActiveClientsKpiCard } from '@/components/admin/kpis/ActiveClientsKpiCard';
import { RepurchaseRateKpiCard } from '@/components/admin/kpis/RepurchaseRateKpiCard';
import { CityDistributionKpiCard } from '@/components/admin/kpis/CityDistributionKpiCard';

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
            Cada card carga de forma independiente. Hover para refrescar un KPI individual.
          </p>
        </div>
      </div>

      {/* Row 1: Préstamos + Capital + Ingresos + NPS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActiveLoansKpiCard />
        <CapitalKpiCard />
        <IncomeKpiCard days={30} />
        <NpsKpiCard days={30} />
      </div>

      {/* Row 2: NPL (ancho) + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <NplKpiCard />
        <FunnelKpiCard days={30} />
      </div>

      {/* Row 3: Clientes + Recompra + Ciudad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ActiveClientsKpiCard days={30} />
        <RepurchaseRateKpiCard days={30} />
        <CityDistributionKpiCard />
      </div>
    </div>
  );
}
