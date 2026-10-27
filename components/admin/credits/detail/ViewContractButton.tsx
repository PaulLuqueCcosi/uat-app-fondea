'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCreditContractUrlAction } from '@/app/actions/admin-credits.actions';

/**
 * Abre el PDF del contrato firmado del crédito. La URL es prefirmada y de corta vida, por eso
 * se pide al hacer clic y no al cargar la página.
 */
export function ViewContractButton({ creditId }: { creditId: string }) {
  const [pending, startTransition] = useTransition();

  function open() {
    startTransition(async () => {
      const result = await getCreditContractUrlAction(creditId);
      if (result.ok && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(result.message ?? 'No se pudo obtener el contrato.');
      }
    });
  }

  return (
    <Button size="sm" variant="outline" className="gap-1.5" onClick={open} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      Ver contrato
    </Button>
  );
}
