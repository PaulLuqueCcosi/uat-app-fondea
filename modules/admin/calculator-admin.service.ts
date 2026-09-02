/**
 * Service para administrar la configuración del motor de pricing.
 * Usa CALCULATOR_API_URL + JWT del admin.
 *
 * Patrones: Memento (versiones), Strategy (simular con cualquier versión), Prototype (duplicar)
 * Ciclo de vida: DRAFT → ACTIVE → ARCHIVED
 */

import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const CALCULATOR_URL = process.env.CALCULATOR_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  const fullUrl = `${CALCULATOR_URL}${path}`;

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

export type ConfigType = 'PRICING_RULES' | 'FEE_GROUPS' | 'AVAILABILITY';

export interface ConfigVersion {
  id: string;
  config_type: ConfigType;
  version: number;
  name: string | null;
  description: string | null;
  isActive: boolean;
  data?: any;
  createdBy: string | null;
  createdAt: string;
  activatedAt: string | null;
}

/** Resumen: versión activa de cada tipo */
export interface ActiveSummary {
  PRICING_RULES: ConfigVersion | null;
  FEE_GROUPS: ConfigVersion | null;
  AVAILABILITY: ConfigVersion | null;
}

// ── Availability types ────────────────────────────────────────────────────────

export interface ScoreRange {
  code: string;
  label: string;
  color: string;
  minScore: number;
  maxScore: number;
  displayOrder: number;
}

export interface AvailabilityTerm {
  terms: number[];
  installments: number[];
}

export interface AvailabilityGroup {
  amounts: number[];
  terms: AvailabilityTerm[];
}

export interface AvailabilityConfig {
  productId: string;
  scoreRanges: ScoreRange[];
  availability: AvailabilityGroup[];
}

// ── Fee Groups types ──────────────────────────────────────────────────────────

export interface FeeSplit {
  feeCode: string;
  percentage: number;
  label: string;
}

export interface FeeGroup {
  groupCode: string;
  name: string;
  description: string;
  splits: FeeSplit[];
}

// ── Pricing Rules types ───────────────────────────────────────────────────────

export interface Discount {
  code: string;
  label: string;
  calculationType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  appliesTo: string;
  order: number;
  /**
   * Mismo mecanismo que PricingRule.conditions: sin definir, el descuento se
   * aplica siempre; con isFirstLoan definido, solo aplica cuando coincide con
   * el request (primer préstamo vs. recurrente).
   */
  conditions?: { isFirstLoan?: boolean };
}

export interface PricingRulePackage {
  feeGroups: { groupCode: string; calculationType: string; value: number }[];
  discounts: Discount[];
}

export interface PricingRule {
  ruleId: string;
  name?: string;
  priority: number;
  isDefault?: boolean;
  selectors: {
    amounts: number[];
    terms: number[];
    installments: number[];
    scoreRanges: string[];
  };
  conditions: Record<string, unknown>;
  package: PricingRulePackage;
}

export interface PricingRulesConfig {
  productId: string;
  rules: PricingRule[];
}

// ── GET endpoints ─────────────────────────────────────────────────────────────

/** Resumen: versión activa de cada tipo (ligero, sin data) */
export async function getActiveSummary(): Promise<ActiveSummary | null> {
  try {
    const res = await adminFetch('/api/admin/pricing/versions');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Lista de versiones de un tipo */
export async function getVersions(type: ConfigType, limit = 20): Promise<ConfigVersion[]> {
  try {
    const res = await adminFetch(`/api/admin/pricing/versions/${type}?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.versions ?? [];
  } catch {
    return [];
  }
}

/** Detalle de una versión con data */
export async function getVersionById(type: ConfigType, id: string): Promise<ConfigVersion | null> {
  try {
    const res = await adminFetch(`/api/admin/pricing/versions/${type}/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Crear nueva versión DRAFT */
export async function createVersion(
  type: ConfigType,
  data: any,
  name: string,
  description?: string
): Promise<{ ok: boolean; data?: ConfigVersion; error?: string }> {
  try {
    const res = await adminFetch(`/api/admin/pricing/versions/${type}`, {
      method: 'POST',
      body: JSON.stringify({ data, name, description }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? `Error ${res.status}` };
    }
    const result = await res.json();
    return { ok: true, data: result };
  } catch {
    return { ok: false, error: 'Error de conexión' };
  }
}

/** Editar un DRAFT existente */
export async function updateVersion(
  type: ConfigType,
  id: string,
  data: any,
  name?: string,
  description?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await adminFetch(`/api/admin/pricing/versions/${type}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data, name, description }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? `Error ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Error de conexión' };
  }
}

/** Activar un DRAFT (DRAFT→ACTIVE, la anterior→ARCHIVED) */
export async function activateVersion(
  type: ConfigType,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await adminFetch(`/api/admin/pricing/versions/${type}/${id}/activate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? `Error ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Error de conexión' };
  }
}

/** Duplicar cualquier versión como nuevo DRAFT (Prototype) */
export async function duplicateVersion(
  type: ConfigType,
  id: string,
  newName?: string
): Promise<{ ok: boolean; data?: ConfigVersion; error?: string }> {
  try {
    const res = await adminFetch(`/api/admin/pricing/versions/${type}/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name: newName ?? null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? `Error ${res.status}` };
    }
    const result = await res.json();
    return { ok: true, data: result };
  } catch {
    return { ok: false, error: 'Error de conexión' };
  }
}

// ── Simulate ──────────────────────────────────────────────────────────────────

export interface SimulateRequest {
  productId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean;
  creditScore: number;
  pricingRulesVersionId?: string;
  feeGroupsVersionId?: string;
  availabilityVersionId?: string;
}

export async function simulateWithVersions(body: SimulateRequest): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await adminFetch('/api/admin/pricing/simulate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.message ?? `Error ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Error de conexión' };
  }
}
