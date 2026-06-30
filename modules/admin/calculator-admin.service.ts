/**
 * Service para administrar la configuración del motor de pricing.
 * Usa CALCULATOR_API_URL + JWT del admin.
 *
 * Flujo: DRAFT → Simular → Publicar (o Descartar)
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

export type ConfigType = 'PRICING_RULES' | 'FEE_GROUPS' | 'AVAILABILITY' | 'PRODUCTS';

export interface ConfigVersion {
  version: number;
  updatedBy: string;
  updatedAt: string;
  data?: any;
}

export interface ConfigEntry {
  config_type: ConfigType;
  published: ConfigVersion;
  draft: ConfigVersion | null;
  hasPendingChanges: boolean;
}

/** Respuesta de GET /config (sin data, ligero) */
export interface ConfigSummary {
  PRICING_RULES: { published: ConfigVersion; draft: ConfigVersion | null; hasPendingChanges: boolean };
  FEE_GROUPS: { published: ConfigVersion; draft: ConfigVersion | null; hasPendingChanges: boolean };
  AVAILABILITY: { published: ConfigVersion; draft: ConfigVersion | null; hasPendingChanges: boolean };
  PRODUCTS: { published: ConfigVersion; draft: ConfigVersion | null; hasPendingChanges: boolean };
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
}

export interface PricingRulePackage {
  feeGroups: { groupCode: string; calculationType: string; value: number }[];
  discounts: Discount[];
}

export interface PricingRule {
  ruleId: string;
  priority: number;
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

/** Dashboard: todas las configs sin data (ligero) */
export async function getAllConfigSummary(): Promise<ConfigSummary | null> {
  const res = await adminFetch('/api/admin/pricing/config');
  if (!res.ok) return null;
  return res.json();
}

/** Config completa con data (published + draft) */
export async function getConfigByType(type: ConfigType): Promise<ConfigEntry | null> {
  const res = await adminFetch(`/api/admin/pricing/config/${type}`);
  if (!res.ok) return null;
  return res.json();
}

// ── DRAFT endpoints ───────────────────────────────────────────────────────────

export async function saveDraft(type: ConfigType, data: any): Promise<{ ok: boolean; error?: string }> {
  const res = await adminFetch(`/api/admin/pricing/config/${type}/draft`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
  }
  return { ok: true };
}

export async function publishDraft(type: ConfigType): Promise<{ ok: boolean; error?: string }> {
  const res = await adminFetch(`/api/admin/pricing/config/${type}/publish`, {
    method: 'POST',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
  }
  return { ok: true };
}

export async function discardDraft(type: ConfigType): Promise<{ ok: boolean; error?: string }> {
  const res = await adminFetch(`/api/admin/pricing/config/${type}/draft`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
  }
  return { ok: true };
}

// ── Simulate with DRAFT ───────────────────────────────────────────────────────

export interface SimulateDraftRequest {
  productId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean;
  creditScore: number;
}

export async function simulateWithDraft(body: SimulateDraftRequest): Promise<{ ok: boolean; data?: any; error?: string }> {
  const res = await adminFetch('/api/admin/pricing/simulate/draft', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: err.message ?? err.error ?? `Error ${res.status}` };
  }
  const data = await res.json();
  return { ok: true, data };
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getHistory(type: ConfigType): Promise<any[] | null> {
  const res = await adminFetch(`/api/admin/pricing/config/${type}/history`);
  if (!res.ok) return null;
  return res.json();
}
