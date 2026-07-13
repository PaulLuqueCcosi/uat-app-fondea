import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CreditCard, FileText, CheckCircle, Banknote, Wallet, CalendarClock,
  AlertTriangle, Clock, Users, TrendingUp, BookOpen, Hourglass,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  mockKPIsToday,
  mockKPIHistory,
  mockApplications,
  mockCredits,
} from '@/modules/admin';
import { AdminKPIHistory } from '@/components/admin/AdminKPIHistory';
import { AdminDashboardCharts } from '@/components/admin/AdminDashboardCharts';
import type { DashboardKPI } from '@/modules/admin';

const KPI_ICONS: Record<string, React.ElementType> = {
  active_loans: CreditCard,
  new_applications: FileText,
  approval_rate: CheckCircle,
  disbursements: Banknote,
  payments_received: Wallet,
  loans_due_today: CalendarClock,
  delinquency_rate: AlertTriangle,
  arrears_1_7: Clock,
  arrears_8_30: AlertTriangle,
  arrears_30_plus: AlertTriangle,
  new_users: Users,
  funnel_conversion: TrendingUp,
  pending_complaints: BookOpen,
  runway: Hourglass,
};

function formatKPIValue(kpi: DashboardKPI): string {
  if (kpi.format === 'currency') return `S/ ${kpi.value.toLocaleString()}`;
  if (kpi.format === 'percentage') return `${kpi.value}%`;
  return kpi.value.toString();
}

function KPICard({ kpi }: { kpi: DashboardKPI }) {
  const Icon = KPI_ICONS[kpi.id] ?? FileText;

  const variantColors = {
    default: 'text-primary',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-destructive',
    info: 'text-primary-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          {kpi.label}
        </CardTitle>
        <Icon className={`h-4 w-4 shrink-0 ${variantColors[kpi.variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{formatKPIValue(kpi)}</div>
          {kpi.trend && (
            <span className={`flex items-center text-xs font-medium ${
              kpi.trend.direction === 'up' ? 'text-success-600' : 'text-destructive'
            }`}>
              {kpi.trend.direction === 'up' ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {kpi.trend.value}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{kpi.description}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const kpis = mockKPIsToday;
  const history = mockKPIHistory;

  // Datos para gráficos existentes
  const applications = mockApplications;
  const credits = mockCredits;

  const appByStatus = [
    { name: 'Enviadas', value: applications.filter((a) => a.status === 'SUBMITTED').length, fill: '#94a3b8' },
    { name: 'Evaluando', value: applications.filter((a) => a.status === 'PROCESSING').length, fill: '#3b82f6' },
    { name: 'Pre-aprob', value: applications.filter((a) => a.status === 'PRE_APPROVED').length, fill: '#f59e0b' },
    { name: 'Aprobadas', value: applications.filter((a) => a.status === 'APPROVED').length, fill: '#22c55e' },
    { name: 'Rechazadas', value: applications.filter((a) => a.status === 'REJECTED').length, fill: '#ef4444' },
    { name: 'Bloqueadas', value: applications.filter((a) => a.status === 'BLOCKED').length, fill: '#dc2626' },
  ];

  const creditByStatus = [
    { name: 'Activos', value: credits.filter((c) => c.status === 'ACTIVE').length },
    { name: 'En mora', value: credits.filter((c) => c.status === 'IN_ARREARS').length },
    { name: 'Default', value: credits.filter((c) => c.status === 'DEFAULTED').length },
    { name: 'Liquidados', value: credits.filter((c) => c.status === 'SETTLED').length },
  ];

  // Agrupamos KPIs por categoría visual
  const operacionesDia = kpis.slice(0, 5);   // #1-5
  const moraCobranza = kpis.slice(5, 10);    // #6-10
  const crecimiento = kpis.slice(10);        // #11-14

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Panel de Administración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Resumen operativo — {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Operaciones del día (#1-5) */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Operaciones del día
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {operacionesDia.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </section>

      {/* Mora y Cobranza (#6-10) */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Mora y Cobranza
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {moraCobranza.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </section>

      {/* Crecimiento y Gobierno (#11-14) */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Crecimiento y Gobierno
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {crecimiento.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </section>

      {/* Historial (gráfico interactivo) */}
      <section>
        <AdminKPIHistory history={history} />
      </section>

      {/* Gráficos de distribución */}
      <AdminDashboardCharts appByStatus={appByStatus} creditByStatus={creditByStatus} />
    </div>
  );
}
