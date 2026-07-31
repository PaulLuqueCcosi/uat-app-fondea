/**
 * Opciones reales de plazo/cuotas del producto, para poblar los filtros
 * de las vistas admin de intenciones (en vez de una lista fija hardcodeada).
 *
 * Fuente: GET /api/products/{productId}/options (fondea-calculator-service),
 * el mismo endpoint que usa la calculadora del portal/landing.
 */

import { calculatorFetch } from '@/lib/calculator-fetch';

const DEFAULT_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440000';

export interface ProductFilterOptions {
  termDays: number[];
  installmentCounts: number[];
}

export async function getProductFilterOptions(): Promise<ProductFilterOptions> {
  const productId = process.env.NEXT_PUBLIC_PRODUCT_ID ?? DEFAULT_PRODUCT_ID;

  const res = await calculatorFetch(`/api/products/${productId}/options`, {
    context: 'ADMIN_PRODUCT_OPTIONS',
  });

  if (!res.ok) {
    console.error(`[ADMIN_PRODUCT_OPTIONS] Error ${res.status}`);
    return { termDays: [], installmentCounts: [] };
  }

  const data = await res.json();
  const amounts: Array<{ terms?: Array<{ value: number; installments?: Array<{ value: number }> }> }> =
    data.amounts ?? [];

  const termDaysSet = new Set<number>();
  const installmentSet = new Set<number>();

  for (const amount of amounts) {
    for (const term of amount.terms ?? []) {
      termDaysSet.add(term.value);
      for (const installment of term.installments ?? []) {
        installmentSet.add(installment.value);
      }
    }
  }

  return {
    termDays: [...termDaysSet].sort((a, b) => a - b),
    installmentCounts: [...installmentSet].sort((a, b) => a - b),
  };
}
