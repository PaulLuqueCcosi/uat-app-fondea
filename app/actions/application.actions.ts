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

    // Log completo de la respuesta del backend
    const resClone = res.clone();
    const rawBody = await resClone.text();
    console.log('[APPLICATION] Submit response:', {
      status: res.status,
      statusText: res.statusText,
      body: rawBody,
    });

    if (!isSuccess(res.status)) {
      return await parseBackendResponse(res) as Extract<ActionResult, { success: false }>;
    }

    const data = JSON.parse(rawBody);

    console.log('[APPLICATION] Submit parsed data:', data);

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
 * Solo devuelve el status — nada más.
 */
export async function getApplicationStatusAction(applicationId: string): Promise<ApplicationStatus | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/status`);

    if (res.status === 404) return null;
    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    return data.status as ApplicationStatus;
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

// ── Tipos para detalle completo ─────────────────────────────────────────────

export interface InstallmentDetail {
  installment_no: number;
  due_date: string;
  amount: number;
}

export interface ApplicationFullDetail {
  application_id: string;
  product_id: string;
  product_name: string;
  principal: number;
  term_days: number;
  installment_count: number;
  is_first_loan: boolean;
  credit_score_used: number;
  total_fees_original: number;
  total_discounts: number;
  total_igv: number;
  total_to_pay: number;
  monthly_payment: number;
  first_due_date: string;
  schedule: InstallmentDetail[];
}

// ── GET: Detalle completo de una solicitud (datos financieros) ────────────────

export async function getApplicationFullDetailAction(
  applicationId: string
): Promise<ApplicationFullDetail | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/detail`);

    if (res.status === 404) return null;
    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    return {
      application_id: data.application_id,
      product_id: data.product_id,
      product_name: data.product_name,
      principal: data.principal,
      term_days: data.term_days,
      installment_count: data.installment_count,
      is_first_loan: data.is_first_loan,
      credit_score_used: data.credit_score_used,
      total_fees_original: data.total_fees_original,
      total_discounts: data.total_discounts,
      total_igv: data.total_igv,
      total_to_pay: data.total_to_pay,
      monthly_payment: data.monthly_payment,
      first_due_date: data.first_due_date,
      schedule: data.schedule ?? [],
    };
  } catch (error) {
    console.error('[APPLICATION] Error al obtener detalle completo:', error);
    return null;
  }
}

// ── DELETE: Cancelar/rechazar solicitud activa ──────────────────────────────

export interface CancelApplicationResult {
  success: boolean;
  error?: string;
}

export async function cancelApplicationAction(
  reason: string
): Promise<CancelApplicationResult> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/applications/active', {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });

    if (res.status === 204 || res.status === 200) {
      return { success: true };
    }

    let json: any = {};
    try { json = await res.json(); } catch { /* body vacío */ }

    return {
      success: false,
      error: json.message ?? json.detail ?? 'No se pudo cancelar la solicitud',
    };
  } catch {
    console.error('[APPLICATION] Error al cancelar solicitud');
    return { success: false, error: 'Error de conexión al cancelar la solicitud' };
  }
}

// ── POST: Firmar contrato ───────────────────────────────────────────────────

export async function signContractAction(
  applicationId: string,
  signedName: string,
): Promise<ActionResult> {
  await requireValidSession();

  try {
    const res = await backendFetch(
      `/api/v1/applications/${applicationId}/signature`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signed_name: signedName }),
      },
    );

    if (!isSuccess(res.status)) {
      return await parseBackendResponse(res);
    }

    return { success: true, httpStatus: res.status };
  } catch {
    console.error('[APPLICATION] Error al firmar contrato');
    return networkError();
  }
}

// ── GET: Obtener contrato ─────────────────────────────────────────────────────

export async function getContractAction(applicationId: string): Promise<{
  contractText: string;
  downloadUrl?: string;
} | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/contract`);

    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    return {
      contractText: data.contract_text ?? data.text ?? '',
      downloadUrl: data.download_url ?? data.url ?? undefined,
    };
  } catch {
    console.error('[APPLICATION] Error al obtener contrato');
    return null;
  }
}

// ── POST: Generar contrato ────────────────────────────────────────────────────

export async function generateContractAction(applicationId: string): Promise<ActionResult> {
  await requireValidSession();

  try {
    const res = await backendFetch(
      `/api/v1/applications/${applicationId}/contract/generate`,
      { method: 'POST' },
    );

    if (!isSuccess(res.status)) {
      return await parseBackendResponse(res);
    }

    return { success: true, httpStatus: res.status };
  } catch {
    console.error('[APPLICATION] Error al generar contrato');
    return networkError();
  }
}

/**
 * Obtiene el detalle básico de una solicitud específica.
 * GET /api/v1/applications/{id}
 */
export async function getApplicationDetailAction(applicationId: string): Promise<ApplicationRecord | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}`);

    if (res.status === 404) return null;
    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    console.log("data");
    console.log(data);
    return mapApplicationFromBackend(data);
  } catch (error) {
    console.error('[APPLICATION] Error al obtener detalle:', error);
    return null;
  }
}
