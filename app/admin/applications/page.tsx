import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { mockApplications } from '@/modules/admin';
import type { ApplicationStatus } from '@/modules/admin';

const statusConfig: Record<ApplicationStatus, { label: string; variant: string }> = {
  SUBMITTED: { label: 'Enviada', variant: 'secondary' },
  PROCESSING: { label: 'Evaluando', variant: 'default' },
  PRE_APPROVED: { label: 'Pre-aprobada', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'error' },
  BLOCKED: { label: 'Bloqueada', variant: 'error' },
  FAILED: { label: 'Fallida', variant: 'error' },
  EXPIRED: { label: 'Expirada', variant: 'secondary' },
};

export default async function AdminApplicationsPage() {
  const applications = mockApplications;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Solicitudes</h1>
          <p className="text-sm text-muted-foreground">{applications.length} solicitudes totales</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monto</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const cfg = statusConfig[app.status];
                  return (
                    <tr key={app.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/applications/${app.id}`} className="font-mono text-xs text-primary hover:underline">
                          {app.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{app.userName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant as any} className="text-[10px]">{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">S/ {app.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">{app.score}</td>
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
    </div>
  );
}
