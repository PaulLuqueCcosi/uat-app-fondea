'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCreditByApplicationAction } from '@/app/actions/credit.actions';
import type { Credit } from '@/modules/credits';
import { formatBackendDateLong } from '@/modules/shared/backend-date';

type State =
  | { kind: 'loading' }
  | { kind: 'preparing' }
  | { kind: 'pending'; credit: Credit }
  | { kind: 'disbursed'; credit: Credit }
  | { kind: 'unavailable' };

/**
 * Estado real del desembolso de una solicitud aprobada, leído del crédito que se generó
 * a partir de ella (nada de datos de ejemplo):
 *   - sin crédito todavía → se está preparando
 *   - PENDING_DISBURSEMENT → el desembolso está en proceso
 *   - cualquier otro estado → ya se desembolsó (con la fecha)
 */
export function DisbursementStatusCard({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    getCreditByApplicationAction(applicationId).then((result) => {
      if (cancelled) return;
      if (!result.ok) return setState({ kind: 'unavailable' });
      const credit = result.data;
      if (!credit) return setState({ kind: 'preparing' });
      setState(credit.status === 'PENDING_DISBURSEMENT' ? { kind: 'pending', credit } : { kind: 'disbursed', credit });
    });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (state.kind === 'unavailable') return null;

  const done = state.kind === 'disbursed';
  const title = done ? 'Desembolso completado' : 'Desembolso en proceso';
  const detail =
    state.kind === 'disbursed'
      ? state.credit.disbursedAt
        ? `Tu dinero fue desembolsado el ${formatBackendDateLong(state.credit.disbursedAt)}.`
        : 'Tu dinero ya fue desembolsado.'
      : state.kind === 'pending'
        ? 'Tu crédito está listo y estamos enviando el dinero a tu cuenta.'
        : 'Estamos preparando tu crédito. Esto puede tardar unos minutos.';

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h3 className="font-semibold text-foreground">Estado del desembolso</h3>
        {state.kind === 'loading' ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <div className="flex items-center gap-3" data-testid="disbursement-status" data-state={state.kind}>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                done ? 'bg-secondary' : 'border-2 border-warning-400 bg-warning-50'
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-dark" />
              ) : state.kind === 'pending' ? (
                <DollarSign className="h-5 w-5 text-warning-700" />
              ) : (
                <Clock className="h-5 w-5 text-warning-700" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </div>
          </div>
        )}
        {(state.kind === 'pending' || state.kind === 'disbursed') && (
          <Button variant="outline" onClick={() => router.push(`/dashboard/creditos/${state.credit.id}`)}>
            Ver mi crédito
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
