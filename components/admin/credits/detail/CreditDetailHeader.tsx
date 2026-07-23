'use client';

import Link from 'next/link';
import { ArrowLeft, CreditCard, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminCreditFullDetail, CreditStatus } from '@/modules/admin/admin-credit-detail.service';

const STATUS_CONFIG: Record<CreditStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  OVERDUE: { label: 'En mora', variant: 'warning' },
  DEFAULTED: { label: 'Default', variant: 'destructive' },
  PAID_OFF: { label: 'Liquidado', variant: 'secondary' },
};

interface CreditDetailHeaderProps {
  data: AdminCreditFullDetail;
}

export function CreditDetailHeader({ data }: CreditDetailHeaderProps) {
  const statusCfg = STATUS_CONFIG[data.status];

  return (
    <div className="space-y-4">
      <Link
        href="/admin/credits"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Cartera de Préstamos
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">Crédito</h1>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{data.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data.client && (
            <Link href={`/admin/users/${data.client.user_id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                Ver cliente
              </Button>
            </Link>
          )}
          <Link href={`/admin/lifecycle/${data.id}`}>
            <Button variant="outline" size="sm">
              Ver ciclo de vida
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
