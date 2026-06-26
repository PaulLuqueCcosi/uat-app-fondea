import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CreditCard, TrendingUp } from 'lucide-react';

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general de la plataforma Fondea
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Usuarios Registrados"
          value="—"
          description="Total de usuarios"
          icon={Users}
        />
        <StatCard
          title="Solicitudes Activas"
          value="—"
          description="En proceso"
          icon={FileText}
        />
        <StatCard
          title="Créditos Desembolsados"
          value="—"
          description="Total histórico"
          icon={CreditCard}
        />
        <StatCard
          title="Tasa de Aprobación"
          value="—"
          description="Últimos 30 días"
          icon={TrendingUp}
        />
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Solicitudes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aquí se mostrarán las últimas solicitudes de préstamo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuarios Nuevos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aquí se mostrarán los usuarios registrados recientemente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
