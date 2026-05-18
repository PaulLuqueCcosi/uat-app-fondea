'use client';

import LoanCalculatorPortal from '@/components/LoanCalculator/LoanCalculatorPortal';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * CalculadoraClient — Wrapper responsivo de la calculadora del dashboard.
 *
 * - Mobile: detailMode="modal" → el detalle aparece como overlay
 * - Desktop: detailMode="sidebar" → el detalle aparece al lado de la calculadora
 */
export function CalculadoraClient() {
  const isMobile = useIsMobile();

  return (
    <div className="w-fit mx-auto">
      <LoanCalculatorPortal
        dedicated
        detailMode={isMobile ? undefined : 'sidebar'}
      />
    </div>
  );
}
