'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, ShieldX, Clock } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import type { FormExpediente } from '@/modules/admin';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export const FORM_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  VERIFIED: { label: 'Verificado', variant: 'success' },
  EXPIRED: { label: 'Expirado', variant: 'warning' },
  PENDING: { label: 'Pendiente', variant: 'secondary' },
  BLOCKED: { label: 'Bloqueado', variant: 'error' },
  BLOCK_EXPIRED: { label: 'Bloqueo expirado', variant: 'secondary' },
  REPLACED: { label: 'Reemplazado', variant: 'secondary' },
};

const STATUS_ICONS: Record<string, typeof ShieldCheck> = {
  VERIFIED: ShieldCheck,
  EXPIRED: Clock,
  PENDING: ShieldAlert,
  BLOCKED: ShieldX,
  BLOCK_EXPIRED: ShieldAlert,
  REPLACED: ShieldAlert,
};

interface FormStatusCardProps {
  form: FormExpediente;
}

export function FormStatusCard({ form }: FormStatusCardProps) {
  const cfg = FORM_STATUS_CONFIG[form.currentStatus] || { label: form.currentStatus, variant: 'secondary' };
  const Icon = STATUS_ICONS[form.currentStatus] || ShieldAlert;
  const isVerified = form.currentStatus === 'VERIFIED';

  return (
    <Card className={isVerified ? 'border-success-200 bg-success-50/30' : undefined}>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isVerified ? 'bg-success-100' : 'bg-muted'
          }`}>
            <Icon className={`h-5 w-5 ${isVerified ? 'text-success-600' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isVerified ? 'Verificación vigente' : cfg.label}
                </p>
                {isVerified && form.verifiedAt && (
                  <p className="text-xs text-muted-foreground">
                    Verificado el {new Date(form.verifiedAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>

            {form.expiresAt && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {isVerified ? 'Vigente hasta' : 'Expiró el'}{' '}
                  {new Date(form.expiresAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {form.totalSubmissions} {form.totalSubmissions === 1 ? 'envío' : 'envíos'} registrados
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
