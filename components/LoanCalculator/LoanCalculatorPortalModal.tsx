'use client';

/**
 * Modal (Sheet/Drawer) que muestra la calculadora del portal.
 *
 * Se usa desde el sidebar y el banner del funnel para editar la intención
 * sin salir de la página actual. Después de guardar, cierra el modal
 * y llama a onSuccess() para que el sidebar refresque los datos.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import LoanCalculatorPortal from './LoanCalculatorPortal';
import type { PortalInitialValues } from './LoanCalculatorPortal';

interface LoanCalculatorPortalModalProps {
  /** Controla si el modal está abierto */
  open: boolean;
  /** Callback para cerrar el modal */
  onOpenChange: (open: boolean) => void;
  /** Datos de la intención activa para pre-llenar la calculadora */
  initialValues?: PortalInitialValues;
  /** Callback después de guardar exitosamente — para refrescar datos */
  onSuccess?: () => void;
}

export function LoanCalculatorPortalModal({
  open,
  onOpenChange,
  initialValues,
  onSuccess,
}: LoanCalculatorPortalModalProps) {
  const router = useRouter();

  const handleSuccess = useCallback(() => {
    onOpenChange(false);
    onSuccess?.();
    router.refresh();
  }, [onOpenChange, onSuccess, router]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={true}
        className="w-full sm:max-w-[540px] overflow-y-auto p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="text-lg font-bold text-neutral-900">
            {initialValues ? 'Modifica tu préstamo' : 'Calculadora de préstamo'}
          </SheetTitle>
          <SheetDescription className="text-sm text-neutral-600">
            {initialValues
              ? 'Ajusta el monto, plazo o cuotas y guarda los cambios.'
              : 'Elige el monto y plazo que mejor se adapte a ti.'}
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 py-4">
          <LoanCalculatorPortal
            initialValues={initialValues}
            onSubmitSuccess={handleSuccess}
            detailMode="modal"
            dedicated
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
