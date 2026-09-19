/**
 * Service para configuración de intentos/bloqueo por módulo de formulario.
 * Endpoints:
 * - GET /api/v1/admin/config → Config activa de los 6 módulos
 * - GET /api/v1/admin/config/{module} → Config de un módulo
 * - PUT /api/v1/admin/config/{module} → Actualizar maxAttempts/blockHours/validDurationDays/active
 *
 * Módulos válidos: kyc, labor, economic, references, address, bank-account.
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminFormConfigResponse {
  id: string | null;
  module: string;
  maxAttempts: number;
  blockHours: number;
  validDurationDays: number;
  active: boolean;
  description: string | null;
  minAge: number | null;
  maxAge: number | null;
}

export interface UpdateFormConfigRequest {
  maxAttempts: number;
  blockHours: number;
  validDurationDays: number;
  active?: boolean | null;
  minAge?: number | null;
  maxAge?: number | null;
}

// ── API Calls ─────────────────────────────────────────────────────────────────

export async function getAllFormConfigs(): Promise<AdminFormConfigResponse[]> {
  const res = await backendFetch('/api/v1/admin/config', {
    context: 'ADMIN_FORM_CONFIG_LIST',
  });

  if (!res.ok) {
    console.error(`[ADMIN_FORM_CONFIG_LIST] Error ${res.status}`);
    return [];
  }

  return res.json();
}

export async function updateFormConfig(
  module: string,
  request: UpdateFormConfigRequest,
): Promise<{ ok: boolean; data?: AdminFormConfigResponse; error?: string }> {
  const res = await backendFetch(`/api/v1/admin/config/${module}`, {
    context: 'ADMIN_FORM_CONFIG_UPDATE',
    method: 'PUT',
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ADMIN_FORM_CONFIG_UPDATE] Error ${res.status}: ${body}`);
    return { ok: false, error: `Error al guardar: ${res.status}` };
  }

  const data = await res.json();
  return { ok: true, data };
}
