/**
 * Mapper: respuesta del backend → IntencionConfig del frontend.
 *
 * Usado por app/actions/intencion.actions.ts (server actions).
 */

import type { IntencionConfig, IntencionStatus } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapIntencionFromBackend(data: any): IntencionConfig {
  return {
    intencionId:           data.id as string,
    productId:             (data.productId ?? '') as string,
    amount:                data.amount as number,
    termDays:              data.termDays as number,
    installmentCount:      data.installmentCount as number,
    isFirstLoan:           (data.isFirstLoan ?? true) as boolean,
    status:                data.status as IntencionStatus,
    calculatorIntentionId: (data.calculatorIntentionId ?? '') as string,
    createdAt:             (data.createdAt ?? '') as string,
    updatedAt:             (data.updatedAt ?? '') as string,
  };
}
