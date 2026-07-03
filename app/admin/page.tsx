import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText, CreditCard, AlertTriangle, Clock, UserPlus, Target,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  mockApplications,
  mockCredits,
  mockUsers,
  mockCollections,
} from '@/modules/admin';
import { AdminDashboardCharts } from '@/components/admin/AdminDashboardCharts';

function StatCard({ title, value, description, icon: Icon, variant = 'default', trend }: {
  title: string; value: string | number; description: string; icon: React.ElementType;
  variant?: 'default' | 'warning' | 'success' | 'error';
  trend?: 'up' | 'down';
}) {
  const iconColors = {
    default: 'text-primary',
    warning: 'text-warning-600',
    success: 'text-success-600',
    error: 'text-destructive',
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColors[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <span className={`text-xs ${trend === 'up' ? 'text-success-600' : 'text-destructive'}`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  // Calcular métricas reales del mock
  const applications = mockApplications;
  const credits = mockCredits;
  const users = mockUsers;

  const applicationsToday = applications.filter((a) => {
    const date = new Date(a.submittedAt);
    const today = new Date('2026-06-30');
    return date.toDateString() === today.toDateString();
  }).length;

  const processingCount = applications.filter((a) => a.status === 'PROCESSING').length;
  const preApprovedCount = applications.filter((a) => a.status === 'PRE_APPROVED').length;
  const activeCreditsCount = credits.filter((c) => c.status === 'ACTIVE').length;
  const totalOverdue = credits.reduce((sum, c) => sum + (c.daysOverdue > 0 ? c.pendingBalance * 0.05 : 0), 0);
  const installmentsDueToday = mockCollections.dueToday.length;
  const newUsersToday = users.filter((u) => {
    const date = new Date(u.registeredAt);
    const today = new Date('2026-06-30');
    return date.toDateString() === today.toDateString();
  }).length;
  const conversionRate = Math.round((applications.length / (applications.length + 6)) * 100); // 6 intenciones pendientes

  // Datos para gráficos
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



  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Panel de Administración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumen operativo del día</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Solicitudes hoy" value={applicationsToday} description="Nuevas solicitudes" icon={FileText} />
        <StatCard title="En evaluación" value={processingCount} description="Procesando ahora" icon={Clock} />
        <StatCard title="Pre-aprobadas sin docs" value={preApprovedCount} description="Esperando documentos" icon={AlertTriangle} variant="warning" />
        <StatCard title="Créditos activos" value={activeCreditsCount} description="Préstamos vigentes" icon={CreditCard} variant="success" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total en mora" value={`S/ ${Math.round(totalOverdue).toLocaleString()}`} description="Mora acumulada" icon={AlertTriangle} variant="warning" />
        <StatCard title="Cuotas vencen hoy" value={installmentsDueToday} description="Para cobrar hoy" icon={Clock} />
        <StatCard title="Nuevos usuarios" value={newUsersToday} description="Registrados hoy" icon={UserPlus} />
        <StatCard title="Conversión" value={`${conversionRate}%`} description="Intención → solicitud" icon={Target} variant="success" />
      </div>

      {/* Gráficos */}
      <AdminDashboardCharts appByStatus={appByStatus} creditByStatus={creditByStatus} />


    </div>
  );
}
