'use client';

import { LoanCalculatorPortal } from '@/components/LoanCalculator';
import { useSolicitarCalc } from './SolicitarCalcContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SolicitarCalcPanel() {
  const { isOpen, close, initialValues, handleSuccess } = useSolicitarCalc();

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-0 h-[calc(100vh-4rem)] flex flex-col bg-white border-l border-border z-40">
      {/* Header fijo dentro del panel */}
      <div className="bg-white border-b border-border p-4 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Editar Solicitud</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={close}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Solo esta parte scrollea */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex justify-center">
          <LoanCalculatorPortal
            dedicated
            detailMode="modal"
            initialValues={initialValues}
            onSubmitSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
