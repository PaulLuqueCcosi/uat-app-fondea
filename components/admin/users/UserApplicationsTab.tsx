'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { ApplicationStatus } from '@/modules/admin';

interface Application {
  id: string;
  status: ApplicationStatus;
  amount: number;
  submittedAt: string;
  score: number;
  updatedAt: string;
}

interface UserApplicationsTabProps {
  applications: Application[];
}

const statusConfig: Record<ApplicationStatus, { label: string; variant: string }> = {
  SUBMITTED: { label: 'Enviada', variant: 'secondary' },
  PROCESSING: { label: 'Evaluando', variant: 'default' },
  PRE_APPROVED: { label: 'Pre-aprobada', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'error' },
  REJECTED_BY_USER: { label: 'Rechazada (usr)', variant: 'secondary' },
  BLOCKED: { label: 'Bloqueada', variant: 'error' },
  FAILED: { label: 'Fallida', variant: 'error' },
  EXPIRED: { label: 'Expirada', variant: 'secondary' },
};

export function UserApplicationsTab({ applications }: UserApplicationsTabProps) {
  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Este usuario no tiene solicitudes registradas.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monto</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Enviada</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Última actualización</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const cfg = statusConfig[app.status];
                return (
                  <tr key={app.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
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
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(app.submittedAt).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(app.updatedAt).toLocaleDateString('es-PE')}
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
