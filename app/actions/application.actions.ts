'use server';

import { requireValidSession } from './auth.actions';
import { ApplicationRecord, ApplicationStatus, PEPDeclarations, ActionResult } from '@/lib/types';
import { backendFetch as _backendFetch } from '@/lib/backend-fetch';
import { parseBackendResponse, networkError } from '@/lib/action-utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'APPLICATION' });

function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Mapea la respuesta del backend (snake_case) a ApplicationRecord (camelCase).
 */
function mapApplicationFromBackend(data: any): ApplicationRecord {
  return {
    id: data.id,
    status: data.status as ApplicationStatus,
    submittedAt: data.submitted_at ?? undefined,
    evaluatedAt: data.evaluated_at ?? undefined,
    creditScore: data.credit_score ?? undefined,
    rejectionReason: data.rejection_reason ?? undefined,
    canRetryAt: data.can_retry_at ?? undefined,
    failureCode: data.failure_code ?? undefined,
  };
}

// ── Tipos de resultado ────────────────────────────────────────────────────────

/**
 * Resultado del submit.
 * En éxito incluye applicationId y status devueltos por el backend.
 */
export type SubmitApplicationResult = ActionResult & (
  | { success: true; applicationId: string; status: ApplicationStatus }
  | { success: false }
);

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Envía la solicitud de préstamo al backend.
 * POST /api/v1/applications/submit
 *
 * Body esperado por el backend:
 * {
 *   "intention_id": "uuid",
 *   "pep_declarations": { "not_pep": true, "not_pep_relative": true, "accept_terms": true }
 * }
 *
 * Response del backend:
 * {
 *   "success": true,
 *   "application_id": "uuid",
 *   "status": "SUBMITTED" | "PROCESSING" | "PRE_APPROVED" | "REJECTED" | "FAILED"
 * }
 */
export async function submitApplicationAction(
  pepDeclarations: PEPDeclarations,
  intentionId: string,
): Promise<SubmitApplicationResult> {
  await requireValidSession();

  try {
    if (!intentionId?.trim()) {
      return {
        success: false,
        httpStatus: 0,
        errorCategory: 'validation',
        error: 'No tienes un préstamo seleccionado. Ve a la calculadora para elegir monto y plazo.',
      };
    }

    if (!pepDeclarations.not_pep || !pepDeclarations.not_pep_relative || !pepDeclarations.accept_terms) {
      return {
        success: false,
        httpStatus: 0,
        errorCategory: 'validation',
        error: 'Debes aceptar todas las declaraciones para continuar.',
      };
    }

    const res = await backendFetch('/api/v1/applications/submit', {
      method: 'POST',
      body: JSON.stringify({
        intention_id: intentionId,
        pep_declarations: pepDeclarations,
      }),
    });

    if (!isSuccess(res.status)) {
      return await parseBackendResponse(res) as Extract<ActionResult, { success: false }>;
    }

    const data = await res.json();

    return {
      success: true,
      httpStatus: res.status,
      // El backend devuelve application_id (snake_case)
      applicationId: data.application_id,
      status: data.status as ApplicationStatus,
    };
  } catch {
    console.error('[APPLICATION] Error al enviar solicitud');
    return networkError() as SubmitApplicationResult;
  }
}

/**
 * Consulta el estado de una solicitud específica (para long polling).
 * GET /api/v1/applications/{id}/status
 *
 * Response del backend:
 * {
 *   "status": "SUBMITTED" | "PROCESSING" | "PRE_APPROVED" | "REJECTED" | "FAILED",
 *   "credit_score": 750,
 *   "rejection_reason": "...",
 *   "can_retry_at": "2026-06-01T00:00:00Z",
 *   "failure_code": "BUSINESS_VALIDATION_FAILED" | "SCORE_CALCULATION_FAILED" | "EVALUATION_ERROR"
 * }
 *
 * Usado por SolicitudView para polling cada N segundos.
 */
export async function getApplicationStatusAction(applicationId: string): Promise<{
  status: ApplicationStatus;
  creditScore?: number;
  rejectionReason?: string;
  canRetryAt?: string;
  failureCode?: string;
} | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/status`);

    if (res.status === 404) return null;
    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    return {
      status: data.status as ApplicationStatus,
      creditScore: data.credit_score ?? undefined,
      rejectionReason: data.rejection_reason ?? undefined,
      canRetryAt: data.can_retry_at ?? undefined,
      failureCode: data.failure_code ?? undefined,
    };
  } catch (error) {
    console.error('[APPLICATION] Error al consultar estado:', error);
    return null;
  }
}

/**
 * Obtiene todas las solicitudes del usuario.
 * GET /api/v1/applications
 */
export async function getApplicationsAction(): Promise<{
  applications: ApplicationRecord[];
  total: number;
} | null> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/applications');

    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    return {
      applications: (data.applications ?? []).map(mapApplicationFromBackend),
      total: data.total ?? 0,
    };
  } catch (error) {
    console.error('[APPLICATION] Error al obtener aplicaciones:', error);
    return null;
  }
}

/**
 * Obtiene la solicitud activa del usuario (la más reciente no terminal).
 * GET /api/v1/applications/active
 *
 * Retorna null si no hay solicitud activa (404 del backend).
 */
export async function getActiveApplicationAction(): Promise<ApplicationRecord | null> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/applications/active');

    if (res.status === 404) return null;
    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    if (!data) return null;

    return mapApplicationFromBackend(data);
  } catch (error) {
    console.error('[APPLICATION] Error al obtener aplicación activa:', error);
    return null;
  }
}

/**
 * Obtiene el detalle completo de una solicitud específica.
 * GET /api/v1/applications/{id}
 */
export async function getApplicationDetailAction(applicationId: string): Promise<ApplicationRecord | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}`);

    if (res.status === 404) return null;
    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    return mapApplicationFromBackend(data);
  } catch (error) {
    console.error('[APPLICATION] Error al obtener detalle:', error);
    return null;
  }
}
