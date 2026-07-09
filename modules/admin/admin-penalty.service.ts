/**
 * Service para configuración de penalidad/mora.
 * Endpoints:
 * - GET /api/v1/admin/penalty-config → Config activa
 * - GET /api/v1/admin/penalty-config/history → Historial
 * - POST /api/v1/admin/penalty-config → Crear nueva config
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PenaltyType = 'PERCENTAGE' | 'FIXED';
export type PenaltyBase = 'INSTALLMENT' | 'PRINCIPAL';

export interface PenaltyRangeResponse {
  id: string;
  fromDay: number;
  toDay: number | null;
  type: PenaltyType;
  value: number;
  base: PenaltyBase | null;
  sortOrder: number;
  color: string | null;
  icon: string | null;
  label: string | null;
}

export interface PenaltyConfigResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  ranges: PenaltyRangeResponse[];
}

export interface SavePenaltyRangeRequest {
  fromDay: number;
  toDay: number | null;
  type: PenaltyType;
  value: number;
  base: PenaltyBase | null;
  color?: string | null;
  icon?: string | null;
  label?: string | null;
}

export interface SavePenaltyConfigRequest {
  name: string;
  ranges: SavePenaltyRangeRequest[];
}

// ── API Calls ─────────────────────────────────────────────────────────────────

export async function getActivePenaltyConfig(): Promise<PenaltyConfigResponse | null> {
  const res = await backendFetch('/api/v1/admin/penalty-config', {
    context: 'ADMIN_PENALTY_CONFIG',
  });

  if (res.status === 204) return null; // No content
  if (!res.ok) {
    console.error(`[ADMIN_PENALTY_CONFIG] Error ${res.status}`);
    return null;
  }

  return res.json();
}

export async function getPenaltyConfigHistory(): Promise<PenaltyConfigResponse[]> {
  const res = await backendFetch('/api/v1/admin/penalty-config/history', {
    context: 'ADMIN_PENALTY_HISTORY',
  });

  if (!res.ok) {
    console.error(`[ADMIN_PENALTY_HISTORY] Error ${res.status}`);
    return [];
  }

  return res.json();
}

export async function createPenaltyConfig(
  request: SavePenaltyConfigRequest,
): Promise<{ ok: boolean; data?: PenaltyConfigResponse; error?: string }> {
  const res = await backendFetch('/api/v1/admin/penalty-config', {
    context: 'ADMIN_PENALTY_CREATE',
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ADMIN_PENALTY_CREATE] Error ${res.status}: ${body}`);
    return { ok: false, error: `Error al guardar: ${res.status}` };
  }

  const data = await res.json();
  return { ok: true, data };
}
