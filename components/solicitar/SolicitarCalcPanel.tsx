'use client';

import { LoanCalculatorPortal } from '@/components/LoanCalculator';
import { useSolicitarCalc } from './SolicitarCalcContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SolicitarCalcPanelProps {
  /**
   * - "vertical": Panel alto y estrecho (mobile fullscreen, desktop sidebar)
   * - "horizontal": Panel ancho y corto (tablet, se muestra arriba del main)
   */
  variant?: 'vertical' | 'horizontal';
}

/**
 * Panel de edición de la calculadora.
 *
 * Variantes:
 * - vertical: ocupa toda la altura disponible, scrollea internamente
 * - horizontal: altura limitada, contenido centrado horizontalmente
 */
export function SolicitarCalcPanel({ variant = 'vertical' }: SolicitarCalcPanelProps) {
  const { close, initialValues, handleSuccess } = useSolicitarCalc();

  const isHorizontal = variant === 'horizontal';

  return (
    <div
      className={cn(
        'flex flex-col bg-white',
        isHorizontal
          ? 'max-h-[60vh]'
          : 'h-full lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16'
      )}
    >
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between shrink-0">
        <h2 className="text-base font-semibold text-foreground">Editar Solicitud</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={close}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Cuerpo scrolleable con la calculadora */}
      <div className={cn(
        'flex-1 overflow-y-auto p-4',
        isHorizontal ? 'md:p-4' : 'md:p-5'
      )}>
        <div className={cn(
          'flex justify-center',
          isHorizontal && 'max-w-2xl mx-auto'
        )}>
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
