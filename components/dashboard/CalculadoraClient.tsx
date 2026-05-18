'use client';

import { useMemo } from 'react';
import LoanCalculatorPortal from '@/components/LoanCalculator/LoanCalculatorPortal';
import { useContainerWidth } from '@/hooks/useContainerWidth';
import { DETAIL_SIDEBAR_BREAKPOINT } from '@/components/LoanCalculator/core/constants';

/**
 * CalculadoraClient — Wrapper responsivo de la calculadora del dashboard.
 *
 * Usa ResizeObserver para medir el contenedor en tiempo real y elegir automáticamente
 * entre modal y sidebar según el espacio disponible:
 * - Si contenedor ≥ 751px: detailMode="sidebar" (detalle al lado)
 * - Si contenedor < 751px: detailMode="modal" (detalle como overlay)
 */
export function CalculadoraClient() {
  const { ref, width } = useContainerWidth();

  // Calcular modo automáticamente según el ancho del contenedor
  const detailMode = useMemo(() => {
    return width >= DETAIL_SIDEBAR_BREAKPOINT ? 'sidebar' : undefined;
  }, [width]);

  return (
    <div ref={ref} className="w-full">
      <div className="flex justify-center">
        <LoanCalculatorPortal
          dedicated
          detailMode={detailMode}
          detailMaxWidth={420}
        />
      </div>
    </div>
  );
}
