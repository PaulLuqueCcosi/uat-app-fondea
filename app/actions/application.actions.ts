'use server';

import { requireValidSession } from './auth.actions';
import { ApplicationRecord, PEPDeclarations, ActionResult } from '@/lib/types';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import { parseBackendResponse, networkError } from '@/lib/action-utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function backendFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessTokenRSC(logtoConfig, process.env.LOGTO_API_RESOURCE);
  const baseUrl = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}

function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Extiende ActionResult con los datos de la solicitud creada.
 * En éxito incluye applicationId y status devueltos por el backend.
 */
export type SubmitApplicationResult =
  | { success: true; httpStatus: number; applicationId: string; status: string }
  | Extract<ActionResult, { success: false }>;

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Envía la solicitud de préstamo al backend.
 * POST /api/v1/applications/submit
 */
export async function submitApplicationAction(pepDeclarations: PEPDeclarations): Promise<SubmitApplicationResult> {
  await requireValidSession();

  try {
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
      body: JSON.stringify({ pep_declarations: pepDeclarations }),
    });

    if (!isSuccess(res.status)) {
      return await parseBackendResponse(res) as Extract<ActionResult, { success: false }>;
    }

    const data = await res.json();
    return {
      success: true,
      httpStatus: res.status,
      applicationId: data.applicationId,
      status: data.status,
    };
  } catch {
    console.error('[APPLICATION] Error al enviar solicitud');
    return networkError();
  }
}

/**
 * Consulta el estado de una solicitud específica (para polling).
 * GET /api/v1/applications/{id}/status
 */
export async function getApplicationStatusAction(applicationId: string): Promise<{
  status: string;
  result?: string;
  canRetryAt?: string | null;
} | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/status`);

    if (res.status === 404) return null;
    if (!isSuccess(res.status)) return null;

    const data = await res.json();
    return {
      status: data.status,
      result: data.result,
      canRetryAt: data.canRetryAt,
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
      applications: data.applications ?? [],
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
 */
export async function getActiveApplicationAction(): Promise<ApplicationRecord | null> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/applications/active');

    if (res.status === 404) return null;
    if (!isSuccess(res.status)) return null;

    const data = await res.json();

    // El backend puede retornar null si no hay aplicación activa
    if (!data) return null;

    return {
      id: data.id,
      userId: data.userId ?? '',
      status: data.status,
      result: data.result,
      submittedAt: data.submittedAt,
      evaluatedAt: data.evaluatedAt,
      canRetryAt: data.canRetryAt,
    };
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
    console.log('[APPLICATION] Fetching detail for ID:', applicationId);
    const res = await backendFetch(`/api/v1/applications/${applicationId}`);
    console.log('[APPLICATION] Response status:', res.status);

    if (res.status === 404) {
      console.log('[APPLICATION] 404 - Aplicación no encontrada');
      return null;
    }
    if (!isSuccess(res.status)) {
      console.log('[APPLICATION] Error status:', res.status);
      const errorText = await res.text();
      console.log('[APPLICATION] Error response:', errorText);
      return null;
    }

    const data = await res.json();
    console.log('[APPLICATION] Data recibida:', data);

    return {
      id: data.id,
      userId: data.userId ?? '',
      status: data.status,
      result: data.result,
      submittedAt: data.submittedAt,
      evaluatedAt: data.evaluatedAt,
      canRetryAt: data.canRetryAt,
    };
  } catch (error) {
    console.error('[APPLICATION] Error al obtener detalle:', error);
    return null;
  }
}
