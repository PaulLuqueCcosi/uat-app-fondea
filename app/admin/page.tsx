import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, CreditCard, TrendingUp, AlertTriangle, Clock, UserPlus, Target } from 'lucide-react';
import { mockDashboardMetrics } from '@/modules/admin';

function StatCard({ title, value, description, icon: Icon, variant = 'default' }: {
  title: string; value: string | number; description: string; icon: React.ElementType;
  variant?: 'default' | 'warning' | 'success';
}) {
  const iconColors = { default: 'text-primary', warning: 'text-warning-600', success: 'text-success-600' };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColors[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  // TODO: reemplazar con fetch al backend
  const metrics = mockDashboardMetrics;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Panel de Administración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumen operativo del día</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Solicitudes hoy" value={metrics.applicationsToday} description="Nuevas solicitudes" icon={FileText} />
        <StatCard title="En evaluación" value={metrics.applicationsProcessing} description="Procesando ahora" icon={Clock} />
        <StatCard title="Pre-aprobadas sin docs" value={metrics.preApprovedPendingDocs} description="Esperando documentos" icon={AlertTriangle} variant="warning" />
        <StatCard title="Créditos activos" value={metrics.activeCredits} description="Préstamos vigentes" icon={CreditCard} variant="success" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total en mora" value={`S/ ${metrics.totalOverdue.toLocaleString()}`} description="Mora acumulada" icon={AlertTriangle} variant="warning" />
        <StatCard title="Cuotas vencen hoy" value={metrics.installmentsDueToday} description="Para cobrar hoy" icon={Clock} />
        <StatCard title="Nuevos usuarios" value={metrics.newUsersToday} description="Registrados hoy" icon={UserPlus} />
        <StatCard title="Conversión" value={`${metrics.conversionRate}%`} description="Calculadora → solicitud" icon={Target} variant="success" />
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Acciones pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Documentos por revisar</span>
              <Badge variant="warning">3</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Solicitudes bloqueadas</span>
              <Badge variant="error">1</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pagos pendientes confirmar</span>
              <Badge variant="secondary">2</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Últimas solicitudes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>María García</span>
              <Badge variant="success" className="text-[10px]">APROBADA</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Carlos Ruiz</span>
              <Badge variant="warning" className="text-[10px]">PRE-APROBADA</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Ana Flores</span>
              <Badge variant="secondary" className="text-[10px]">PROCESANDO</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cobranza del día</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Vencen hoy</span>
              <span className="font-medium">{metrics.installmentsDueToday} cuotas</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">En mora leve (1-15d)</span>
              <span className="font-medium text-warning-600">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">En default</span>
              <span className="font-medium text-destructive">1</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
