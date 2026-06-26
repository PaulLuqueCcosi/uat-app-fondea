'use client';

/**
 * Modal (Sheet/Drawer) que muestra la calculadora del portal.
 * Después de guardar, la calculadora actualiza el store directamente.
 * Este modal solo maneja abrir/cerrar.
 */

import { useCallback, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import LoanCalculatorPortal from './LoanCalculatorPortal';
import type { PortalInitialValues } from './LoanCalculatorPortal';
import { useScoreStore } from '@/lib/stores/score-store';

interface LoanCalculatorPortalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: PortalInitialValues;
}

export function LoanCalculatorPortalModal({
  open,
  onOpenChange,
  initialValues,
}: LoanCalculatorPortalModalProps) {
  const handleDone = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const puntaje = useScoreStore(s => s.puntaje);
  const fetchPuntaje = useScoreStore(s => s.fetchPuntaje);

  useEffect(() => {
    fetchPuntaje();
  }, [fetchPuntaje]);

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
            onDone={handleDone}
            detailMode="modal"
            dedicated
            maxAmount={puntaje?.maxLoanAmount ?? null}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
