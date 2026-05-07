/**
 * Mapper: respuesta del backend → IntencionConfig del frontend.
 *
 * Compartido entre:
 * - app/actions/intencion.actions.ts (server actions)
 * - lib/intencion-api.ts (client API layer)
 */

import type { IntencionConfig } from '@/lib/types';

export function mapIntencionFromBackend(data: Record<string, unknown>): IntencionConfig {
  return {
    intencionId:           data.id as string,
    productId:             data.productId as string,
    amount:                data.amount as number,
    termDays:              data.termDays as number,
    installmentCount:      data.installmentCount as number,
    isFirstLoan:           data.isFirstLoan as boolean,
    status:                data.status as string,
    calculatorIntentionId: data.calculatorIntentionId as string,
    createdAt:             data.createdAt as string,
    updatedAt:             data.updatedAt as string,
  };
}
