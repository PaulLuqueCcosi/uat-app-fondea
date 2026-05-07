'use client';

/**
 * Wrapper que incluye el Provider con el adapter de Fondea.
 * Úsalo directamente en las páginas de este proyecto.
 * En otro proyecto, usa <LoanCalculatorProvider api={tuAdapter}> + <LoanCalculator />
 */

import { LoanCalculatorProvider } from "./core";
import { LoanCalculator } from "./ui";
import { fondeaApi } from "./adapters";
import type { LoanCalculatorProps } from "./core";

export default function LoanCalculatorWithProvider(props: LoanCalculatorProps) {
  return (
    <LoanCalculatorProvider api={fondeaApi}>
      <LoanCalculator {...props} />
    </LoanCalculatorProvider>
  );
}
