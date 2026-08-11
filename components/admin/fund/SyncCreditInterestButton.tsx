'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Coins, Loader2 } from 'lucide-react';
import { syncCreditInterestAction } from '@/app/actions/admin-credits.actions';

interface Props {
  /** Se llama solo si se reportó al menos un crédito — para refrescar el estado del fondo. */
  onSynced?: () => void;
}

/**
 * Red de seguridad para el reporte de ganancia real al fondo — no es una operación
 * de uso diario. En el flujo normal, cada crédito reporta su ganancia solo al
 * cerrarse; este botón solo sirve para "ponerse al día" si ese disparo automático
 * se perdió por algún motivo. Si dice "todo al día", no hay nada que hacer.
 */
export function SyncCreditInterestButton({ onSynced }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncCreditInterestAction();
      if (result.ok) {
        toast.success(result.message);
        if (result.creditsReported && result.creditsReported > 0) {
          onSynced?.();
        }
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={isPending} className="gap-1.5 h-7 text-xs">
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Coins className="h-3.5 w-3.5" />
      )}
      Reportar ganancias pendientes
    </Button>
  );
}
