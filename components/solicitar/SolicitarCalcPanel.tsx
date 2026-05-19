'use client';

import { LoanCalculatorPortal } from '@/components/LoanCalculator';
import { useSolicitarCalc } from './SolicitarCalcContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Panel con la calculadora para editar la intención.
 *
 * - showClose=true (mobile): muestra header con título y botón cerrar
 * - showClose=false (tablet/desktop): solo la calculadora, sin fondo ni header
 */
export function SolicitarCalcPanel({ showClose = false }: { showClose?: boolean }) {
  const { close, initialValues, handleSuccess } = useSolicitarCalc();

  return (
    <div className="py-4">
      {/* Header con título y botón cerrar — solo mobile */}
      {showClose && (
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border mb-4">
          <h2 className="text-lg font-semibold text-foreground">Editar Solicitud</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="h-8 w-8 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      <div className="flex justify-center">
        <LoanCalculatorPortal
          dedicated
          detailMode="modal"
          initialValues={initialValues}
          onSubmitSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
