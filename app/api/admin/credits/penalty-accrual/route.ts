/**
 * Proxy para disparar manualmente el proceso diario de mora.
 *
 * POST /api/admin/credits/penalty-accrual → POST /api/v1/admin/credits/penalty-accrual
 *
 * <p>El backend ya corre esto solo por cron (`credit.config.scheduler-cron`, 6 AM Perú).
 * Este endpoint existe para el caso en que el cron no haya corrido — servidor apagado a esa
 * hora, o una corrida que falló y dejó cuotas sin vencer. Es seguro llamarlo más de una vez
 * el mismo día: `Installment.canAccruePenalty(today)` evita cobrar la misma mora dos veces.
 *
 * <p><b>Ojo:</b> si hay cuotas vencidas que nunca acumularon mora (`last_penalty_date` en
 * NULL), esta corrida cobra el rango completo de días de atraso de una sola vez — no solo
 * el día de hoy. Es el mismo mecanismo que recupera los días saltados tras una caída del
 * scheduler.
 */

import { NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '@/lib/backend-fetch';

export async function POST() {
  try {
    const res = await backendFetch('/api/v1/admin/credits/penalty-accrual', {
      method: 'POST',
      context: 'ADMIN_PENALTY_ACCRUAL',
    });
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] POST /api/admin/credits/penalty-accrual → error:', error);
    return NextResponse.json(
      { error: 'internal_error', detail: 'No se pudo ejecutar el proceso de mora' },
      { status: 500 },
    );
  }
}
