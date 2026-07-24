/**
 * Service para administrar las reglas del motor de evaluación (eliminatorias + scoring).
 * Usa BACKEND_API_URL + JWT del admin.
 */

import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

const DEFAULT_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440000';

async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  const fullUrl = `${BACKEND_URL}${path}`;

  return fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type RuleSetType = 'eliminatory' | 'scoring';

export interface RuleSetVersionResponse {
  id: string;
  productId: string;
  type: RuleSetType;
  version: string;
  description: string | null;
  active: boolean;
  rulesJson: any;
  createdAt: string;
  createdBy: string | null;
}

export interface CreateRuleSetVersionRequest {
  productId: string;
  type: RuleSetType;
  version: string;
  description?: string;
  rulesJson: any;
}

export interface PreviewEvaluationRequest {
  rulesJson: any;
  profileSnapshot: string;
  userIntentionSnapshot: string;
  currentScore: number | null;
}

export interface EvaluationError {
  ruleId: string;
  label: string;
  field: string;
  message: string;
}

export interface AppliedFactor {
  ruleId: string;
  label: string;
  points: number;
}

export interface EvaluationResponse {
  passed: boolean;
  decision: 'APPROVED' | 'REJECTED';
  detail: string;
  errors: EvaluationError[];
  baseScore: number | null;
  finalScore: number | null;
  appliedFactors: AppliedFactor[];
  evaluationTrace: any;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'number' | 'boolean' | 'text' | 'select';
  options: string[] | null;
  enumNumericMapping?: Record<string, number> | null;
}

export interface FieldGroup {
  group: string;
  label: string;
  fields: FieldDefinition[];
}

export interface AvailableFieldsResponse {
  groups: FieldGroup[];
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function listVersions(
  type?: RuleSetType,
  productId: string = DEFAULT_PRODUCT_ID
): Promise<{ ok: boolean; data?: RuleSetVersionResponse[]; error?: string }> {
  try {
    const params = new URLSearchParams({ productId });
    if (type) params.set('type', type);

    const res = await adminFetch(`/api/v1/admin/evaluation-rules?${params.toString()}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servicio de reglas.' };
  }
}

export async function getVersionById(
  id: string
): Promise<{ ok: boolean; data?: RuleSetVersionResponse; error?: string }> {
  try {
    const res = await adminFetch(`/api/v1/admin/evaluation-rules/${id}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'No se pudo obtener la versión.' };
  }
}

export async function createVersion(
  request: CreateRuleSetVersionRequest
): Promise<{ ok: boolean; data?: RuleSetVersionResponse; error?: string }> {
  try {
    const res = await adminFetch('/api/v1/admin/evaluation-rules', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'No se pudo crear la versión.' };
  }
}

export async function activateVersion(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await adminFetch(`/api/v1/admin/evaluation-rules/${id}/activate`, {
      method: 'PATCH',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo activar la versión.' };
  }
}

export async function deactivateVersion(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await adminFetch(`/api/v1/admin/evaluation-rules/${id}/deactivate`, {
      method: 'PATCH',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo desactivar la versión.' };
  }
}

export async function simulateEvaluation(
  request: PreviewEvaluationRequest
): Promise<{ ok: boolean; data?: EvaluationResponse; error?: string }> {
  try {
    const res = await adminFetch('/api/v1/admin/evaluation-rules/simulate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'No se pudo ejecutar la simulación.' };
  }
}

export async function getAvailableFields(): Promise<{ ok: boolean; data?: AvailableFieldsResponse; error?: string }> {
  try {
    const res = await adminFetch('/api/v1/admin/evaluation-rules/available-fields');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'No se pudo obtener campos disponibles.' };
  }
}


// ── Scoring Thresholds ────────────────────────────────────────────────────────

export interface ScoringThresholdsResponse {
  id: string;
  baseScore: number;
  approvedMin: number;
  active: boolean;
  description: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateScoringThresholdsRequest {
  baseScore: number;
  approvedMin: number;
  description?: string;
}

export async function listThresholds(): Promise<{ ok: boolean; data?: ScoringThresholdsResponse[]; error?: string }> {
  try {
    const res = await adminFetch('/api/v1/admin/evaluation-rules/thresholds');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, error: 'No se pudo cargar los umbrales.' };
  }
}

export async function createThresholds(
  request: CreateScoringThresholdsRequest
): Promise<{ ok: boolean; data?: ScoringThresholdsResponse; error?: string }> {
  try {
    const res = await adminFetch('/api/v1/admin/evaluation-rules/thresholds', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, error: 'No se pudo crear los umbrales.' };
  }
}

export async function activateThresholds(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await adminFetch(`/api/v1/admin/evaluation-rules/thresholds/${id}/activate`, {
      method: 'PATCH',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo activar los umbrales.' };
  }
}
