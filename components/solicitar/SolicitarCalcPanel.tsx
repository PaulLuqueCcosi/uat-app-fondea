'use client';

import { useEffect } from 'react';
import { LoanCalculatorPortal } from '@/components/LoanCalculator';
import { useSolicitarCalc } from './SolicitarCalcContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScoreStore } from '@/lib/stores/score-store';

/**
 * Panel con la calculadora para editar la intención.
 * La calculadora actualiza el store directamente al guardar.
 * Este componente solo maneja el UI del panel.
 */
export function SolicitarCalcPanel({ showClose = false }: { showClose?: boolean }) {
  const { close, initialValues } = useSolicitarCalc();
  const puntaje = useScoreStore(s => s.puntaje);
  const fetchPuntaje = useScoreStore(s => s.fetchPuntaje);

  useEffect(() => {
    fetchPuntaje();
  }, [fetchPuntaje]);

  return (
    <div className="py-4">
      {showClose && (
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border mb-4">
          <h2 className="text-lg font-semibold text-foreground">Editar Solicitud</h2>
          <Button variant="ghost" size="icon" onClick={close}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      <div className="flex justify-center">
        <LoanCalculatorPortal
          dedicated
          detailMode="modal"
          initialValues={initialValues}
          onDone={close}
          maxAmount={puntaje?.maxLoanAmount ?? null}
        />
      </div>
    </div>
  );
}
