import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; variant: string }> = {
  SUBMITTED: { label: 'Enviada', variant: 'secondary' },
  PROCESSING: { label: 'Evaluando', variant: 'default' },
  PRE_APPROVED: { label: 'Pre-aprobada', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'error' },
  BLOCKED: { label: 'Bloqueada', variant: 'error' },
  FAILED: { label: 'Fallida', variant: 'error' },
  EXPIRED: { label: 'Expirada', variant: 'secondary' },
};

interface UserApplicationsTabProps {
  userId: string;
  applications: any[];
}

export function UserApplicationsTab({ userId, applications }: UserApplicationsTabProps) {
  const userApps = applications.filter((a) => a.userId === userId);

  if (userApps.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">El usuario no tiene solicitudes registradas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Solicitudes del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monto</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Origen</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {userApps.map((app) => {
                const cfg = statusConfig[app.status] || statusConfig.SUBMITTED;
                return (
                  <tr key={app.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/applications/${app.id}`} className="font-mono text-xs text-primary hover:underline">
                        {app.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cfg.variant as any} className="text-[10px]">{cfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">S/ {app.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono">{app.score}</td>
                    <td className="px-4 py-3 text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {app.origin === 'external' ? 'Calculadora' : 'Interna'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(app.submittedAt).toLocaleDateString('es-PE')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
