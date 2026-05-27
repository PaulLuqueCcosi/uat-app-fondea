'use client';

import { submitApplicationAction } from '@/app/actions/application.actions';
import { unwrap } from './unwrap';
import { ApiError } from './api-error';
import { useIntencionStore } from '@/lib/stores/intencion-store';
import { useCreditScoreStore } from '@/lib/stores/credit-score-store';

interface PEPDeclarations {
  not_pep: boolean;
  not_pep_relative: boolean;
  accept_terms: boolean;
}

interface SubmitResult {
  applicationId: string;
  status: string;
}

/**
 * Envía la solicitud de préstamo.
 *
 * - Retorna { applicationId, status } si todo OK.
 * - Hace throw ApiError con mensaje y categoría si falla.
 * - Recarga la intención y el credit score frescos del backend después del submit.
 *
 * Uso en componente:
 *   const promise = submitApplication(pep, id);
 *   toast.promise(promise, {
 *     loading: 'Enviando solicitud...',
 *     success: 'Solicitud enviada',
 *     error: (err) => err.message,
 *   });
 *   const result = await promise;
 *   router.push(`/solicitudes/${result.applicationId}`);
 */
export async function submitApplication(
  pepDeclarations: PEPDeclarations,
  intentionId: string,
): Promise<SubmitResult> {
  const result = await submitApplicationAction(pepDeclarations, intentionId);
  const data = unwrap(result);

  if (!data.applicationId) {
    throw new ApiError('Error al procesar la solicitud', 'unknown');
  }

  // Recargar datos frescos del backend (fire-and-forget)
  // No esperamos a que terminen — el redirect es inmediato
  // La intención anterior ahora está LOCKED, así que getActiveIntencion() devolverá null
  useIntencionStore.getState().refetch().catch(() => {});
  // El credit score se recalcula después del submit
  useCreditScoreStore.getState().refetch().catch(() => {});

  return {
    applicationId: data.applicationId,
    status: data.status,
  };
}

// Re-export para que los componentes importen todo de un lugar
export { ApiError };
