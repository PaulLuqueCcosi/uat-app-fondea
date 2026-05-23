'use client';

import { submitApplicationAction } from '@/app/actions/application.actions';
import type { ErrorCategory } from '@/lib/types';

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
 * Error con categoría para que el componente pueda mostrar el banner correcto.
 */
export class ApplicationError extends Error {
  category: ErrorCategory;

  constructor(message: string, category: ErrorCategory = 'unknown') {
    super(message);
    this.name = 'ApplicationError';
    this.category = category;
  }
}

/**
 * Envía la solicitud de préstamo.
 *
 * - Retorna { applicationId, status } si todo OK.
 * - Hace throw ApplicationError con mensaje y categoría si falla.
 *
 * Diseñado para usarse con toast.promise():
 *   const promise = submitApplication(pep, id);
 *   toast.promise(promise, { loading, success, error: (err) => err.message });
 *   const result = await promise;
 */
export async function submitApplication(
  pepDeclarations: PEPDeclarations,
  intentionId: string,
): Promise<SubmitResult> {
  const result = await submitApplicationAction(pepDeclarations, intentionId);

  if (!result.success) {
    throw new ApplicationError(
      result.error ?? 'Error al enviar la solicitud',
      result.errorCategory,
    );
  }

  if (!result.applicationId) {
    throw new ApplicationError('Error al procesar la solicitud', 'unknown');
  }

  return {
    applicationId: result.applicationId,
    status: result.status,
  };
}
