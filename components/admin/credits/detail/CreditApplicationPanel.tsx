import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, AlertCircle } from 'lucide-react';
import type { AdminCreditFullDetail } from '@/modules/admin/admin-credit-detail.service';

interface CreditApplicationPanelProps {
  data: AdminCreditFullDetail;
}

const APP_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Enviada',
  PROCESSING: 'Evaluando',
  PRE_APPROVED: 'Pre-aprobada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  REJECTED_BY_USER: 'Rechazada por usuario',
  FAILED: 'Fallida',
  BLOCKED: 'Bloqueada',
  EXPIRED: 'Expirada',
};

export function CreditApplicationPanel({ data }: CreditApplicationPanelProps) {
  const app = data.application;
  if (!app) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" /> Solicitud de origen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ID</span>
            <span className="text-xs font-mono">{app.application_id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Estado</span>
            <Badge variant={app.status === 'APPROVED' ? 'success' : app.status === 'REJECTED' ? 'destructive' : 'warning'}>
              {app.status ? APP_STATUS_LABELS[app.status] ?? app.status : '—'}
            </Badge>
          </div>
          {app.submitted_at && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Enviada</span>
              <span className="text-sm">{new Date(app.submitted_at).toLocaleString('es-PE')}</span>
            </div>
          )}
          {app.evaluated_at && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Evaluada</span>
              <span className="text-sm">{new Date(app.evaluated_at).toLocaleString('es-PE')}</span>
            </div>
          )}
          {app.credit_score != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" /> Score
              </span>
              <span className="text-sm font-medium">{app.credit_score}</span>
            </div>
          )}
          {app.rejection_reason && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {app.rejection_reason}
            </p>
          )}
          {app.contract_status && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Contrato</span>
              <Badge variant="outline">{app.contract_status}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
