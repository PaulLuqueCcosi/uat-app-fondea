'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import LoanCalculator from './LoanCalculator';
import type { InitialValues } from './LoanCalculator';

interface LoanCalculatorModalProps {
  /** Controla si el modal está abierto */
  open: boolean;
  /** Callback para cerrar el modal */
  onOpenChange: (open: boolean) => void;
  /** Datos de la intención activa para pre-llenar la calculadora */
  initialValues?: InitialValues;
  /** Callback después de guardar exitosamente — para refrescar datos */
  onSuccess?: () => void;
}

/**
 * Modal (Sheet/Drawer) que muestra la calculadora de préstamos.
 *
 * Se usa desde el sidebar y el banner del funnel para editar la intención
 * sin salir de la página actual. Después de guardar, cierra el modal
 * y llama a onSuccess() para que el sidebar refresque los datos.
 */
export function LoanCalculatorModal({
  open,
  onOpenChange,
  initialValues,
  onSuccess,
}: LoanCalculatorModalProps) {
  const router = useRouter();

  // Interceptar el router.push del LoanCalculator para que no navegue
  // sino que cierre el modal y refresque
  const handleSuccess = useCallback(() => {
    onOpenChange(false);
    onSuccess?.();
    // Refrescar la página actual para que los server components se actualicen
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
          <LoanCalculatorInSheet
            initialValues={initialValues}
            onSuccess={handleSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Wrapper interno que usa la calculadora pero intercepta la navegación
 * post-submit para cerrar el modal en lugar de navegar.
 */
function LoanCalculatorInSheet({
  initialValues,
  onSuccess,
}: {
  initialValues?: InitialValues;
  onSuccess: () => void;
}) {
  return (
    <LoanCalculator
      initialValues={initialValues}
      size="default"
      flexibleWidth
      detailMode="overlay"
      onSubmitSuccess={onSuccess}
    />
  );
}
