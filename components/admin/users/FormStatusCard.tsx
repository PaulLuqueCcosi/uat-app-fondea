'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FormExpediente } from '@/modules/admin';

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  VERIFIED: { label: 'Verificado', variant: 'success' },
  EXPIRED: { label: 'Expirado', variant: 'warning' },
  PENDING: { label: 'Pendiente', variant: 'secondary' },
  BLOCKED: { label: 'Bloqueado', variant: 'error' },
  REPLACED: { label: 'Reemplazado', variant: 'secondary' },
};

interface FormStatusCardProps {
  form: FormExpediente;
}

export function FormStatusCard({ form }: FormStatusCardProps) {
  const cfg = STATUS_CONFIG[form.currentStatus] || { label: form.currentStatus, variant: 'secondary' };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Estado de verificación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Estado actual</span>
          <Badge variant={cfg.variant as any}>{cfg.label}</Badge>
        </div>
        {form.verifiedAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Verificado el</span>
            <span className="text-sm font-mono">{new Date(form.verifiedAt).toLocaleDateString('es-PE')}</span>
          </div>
        )}
        {form.expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expira el</span>
            <span className="text-sm font-mono">{new Date(form.expiresAt).toLocaleDateString('es-PE')}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total de envíos</span>
          <span className="text-sm font-medium">{form.totalSubmissions}</span>
        </div>
      </CardContent>
    </Card>
  );
}
