/**
 * Service para administrar la configuración del motor de pricing.
 * Usa CALCULATOR_API_URL + JWT del admin.
 */

import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const CALCULATOR_URL = process.env.CALCULATOR_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  const fullUrl = `${CALCULATOR_URL}${path}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string> ?? {}),
    },
  });

  return res;
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface ConfigEntry<T> {
  version: number;
  updatedBy: string;
  updatedAt: string;
  data: T;
}

// ── GET endpoints ─────────────────────────────────────────────────────────────

export async function getAvailability(): Promise<ConfigEntry<AvailabilityConfig> | null> {
  const res = await adminFetch('/api/admin/pricing/config/AVAILABILITY');
  if (!res.ok) return null;
  const json = await res.json();
  return json.AVAILABILITY ?? json;
}

export async function getFeeGroups(): Promise<ConfigEntry<FeeGroup[]> | null> {
  const res = await adminFetch('/api/admin/pricing/config/FEE_GROUPS');
  if (!res.ok) return null;
  const json = await res.json();
  return json.FEE_GROUPS ?? json;
}

export async function getPricingRules(): Promise<ConfigEntry<PricingRulesConfig> | null> {
  const res = await adminFetch('/api/admin/pricing/config/PRICING_RULES');
  if (!res.ok) return null;
  const json = await res.json();
  return json.PRICING_RULES ?? json;
}

export async function getAllConfig() {
  const res = await adminFetch('/api/admin/pricing/config');
  if (!res.ok) return null;
  return res.json();
}

// ── PUT endpoints ─────────────────────────────────────────────────────────────

export async function updateAvailability(data: AvailabilityConfig): Promise<{ ok: boolean; error?: string }> {
  const res = await adminFetch('/api/admin/pricing/config/AVAILABILITY', {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
  }
  return { ok: true };
}

export async function updateFeeGroups(data: FeeGroup[]): Promise<{ ok: boolean; error?: string }> {
  const res = await adminFetch('/api/admin/pricing/config/FEE_GROUPS', {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
  }
  return { ok: true };
}

export async function updatePricingRules(data: PricingRulesConfig): Promise<{ ok: boolean; error?: string }> {
  const res = await adminFetch('/api/admin/pricing/config/PRICING_RULES', {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
  }
  return { ok: true };
}
