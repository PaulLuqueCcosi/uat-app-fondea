'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { retryCreditCreationAction } from '@/app/actions/admin-credits.actions';

interface Props {
  applicationId: string;
}

/**
 * Reintenta la Fase 2 (creación del crédito) para una solicitud APPROVED cuyo
 * creditCreationStatus quedó en FAILED. Pega al mismo endpoint idempotente que
 * usa el scheduler automático (OrphanCreditCreationScheduler), pero on-demand.
 */
export function CreditCreationRetryButton({ applicationId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRetry = () => {
    startTransition(async () => {
      const result = await retryCreditCreationAction(applicationId);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Button size="sm" variant="destructive" onClick={handleRetry} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5 mr-2" />
      )}
      Reintentar creación de crédito
    </Button>
  );
}
