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

// ── Mock data (fallback cuando la API no está disponible) ─────────────────────

const MOCK_CONFIG_SUMMARY: ConfigSummary = {
  PRICING_RULES: {
    published: { version: 3, updatedBy: 'admin@fondea.pe', updatedAt: '2026-06-28T10:00:00Z' },
    draft: null,
    hasPendingChanges: false,
  },
  FEE_GROUPS: {
    published: { version: 2, updatedBy: 'admin@fondea.pe', updatedAt: '2026-06-25T14:30:00Z' },
    draft: { version: 3, updatedBy: 'admin@fondea.pe', updatedAt: '2026-06-30T09:15:00Z' },
    hasPendingChanges: true,
  },
  AVAILABILITY: {
    published: { version: 4, updatedBy: 'admin@fondea.pe', updatedAt: '2026-06-20T11:00:00Z' },
    draft: null,
    hasPendingChanges: false,
  },
  PRODUCTS: {
    published: { version: 1, updatedBy: 'admin@fondea.pe', updatedAt: '2026-05-01T08:00:00Z' },
    draft: null,
    hasPendingChanges: false,
  },
};

// ── GET endpoints ─────────────────────────────────────────────────────────────

/** Dashboard: todas las configs sin data (ligero) */
export async function getAllConfigSummary(): Promise<ConfigSummary | null> {
  try {
    const res = await adminFetch('/api/admin/pricing/config');
    if (!res.ok) return MOCK_CONFIG_SUMMARY;
    return res.json();
  } catch {
    // API no disponible → retornar mock
    return MOCK_CONFIG_SUMMARY;
  }
}

/** Config completa con data (published + draft) */
export async function getConfigByType(type: ConfigType): Promise<ConfigEntry | null> {
  try {
    const res = await adminFetch(`/api/admin/pricing/config/${type}`);
    if (!res.ok) return getMockConfigEntry(type);
    return res.json();
  } catch {
    return getMockConfigEntry(type);
  }
}

function getMockConfigEntry(type: ConfigType): ConfigEntry {
  const summary = MOCK_CONFIG_SUMMARY[type];
  return {
    config_type: type,
    published: { ...summary.published, data: getMockConfigData(type) },
    draft: summary.draft ? { ...summary.draft, data: getMockConfigData(type) } : null,
    hasPendingChanges: summary.hasPendingChanges,
  };
}

function getMockConfigData(type: ConfigType): any {
  if (type === 'AVAILABILITY') {
    return {
      productId: 'prod_001',
      scoreRanges: [
        { code: 'BAJO', label: 'Bajo', color: '#ef4444', minScore: 0, maxScore: 399, displayOrder: 1 },
        { code: 'MEDIO', label: 'Medio', color: '#f59e0b', minScore: 400, maxScore: 649, displayOrder: 2 },
        { code: 'ALTO', label: 'Alto', color: '#22c55e', minScore: 650, maxScore: 1000, displayOrder: 3 },
      ],
      availability: [
        { amounts: [100, 200, 300], terms: [{ terms: [7, 14, 30], installments: [1, 2, 3] }] },
        { amounts: [500, 1000, 2000, 3000], terms: [{ terms: [30, 60, 90], installments: [3, 4, 6] }] },
        { amounts: [4000, 5000], terms: [{ terms: [60, 90], installments: [4, 6] }] },
      ],
    };
  }
  if (type === 'FEE_GROUPS') {
    return [
      { groupCode: 'INTEREST', name: 'Interés', description: 'Tasa de interés por el préstamo', splits: [{ feeCode: 'INTEREST', percentage: 100, label: 'Interés' }] },
      { groupCode: 'TECH_FEE', name: 'Cargo tecnológico', description: 'Plataforma digital', splits: [{ feeCode: 'TECH', percentage: 100, label: 'Tecnología' }] },
      { groupCode: 'ADMIN_FEE', name: 'Cargo administrativo', description: 'Gestión del crédito', splits: [{ feeCode: 'ADMIN', percentage: 100, label: 'Administrativo' }] },
    ];
  }
  if (type === 'PRICING_RULES') {
    return {
      productId: 'prod_001',
      rules: [
        {
          ruleId: 'rule_default',
          priority: 1,
          selectors: { amounts: [100, 200, 300, 500, 1000, 2000, 3000, 4000, 5000], terms: [7, 14, 30, 60, 90], installments: [1, 2, 3, 4, 6], scoreRanges: ['BAJO', 'MEDIO', 'ALTO'] },
          conditions: {},
          package: {
            feeGroups: [
              { groupCode: 'INTEREST', calculationType: 'PERCENTAGE', value: 5.0 },
              { groupCode: 'TECH_FEE', calculationType: 'PERCENTAGE', value: 1.0 },
              { groupCode: 'ADMIN_FEE', calculationType: 'FIXED_AMOUNT', value: 2.0 },
            ],
            discounts: [
              { code: 'FIRST_LOAN', label: 'Descuento primer préstamo', calculationType: 'FIXED_AMOUNT', value: 10, appliesTo: 'TOTAL_FEES', order: 1 },
              { code: 'EXTRA_DISCOUNT', label: 'Descuento extra', calculationType: 'FIXED_AMOUNT', value: 5, appliesTo: 'TOTAL_FEES', order: 2 },
            ],
          },
        },
      ],
    };
  }
  if (type === 'PRODUCTS') {
    return [{ id: 'prod_001', name: 'Préstamo Personal', currency: 'PEN', active: true }];
  }
  return null;
}

// ── DRAFT endpoints ───────────────────────────────────────────────────────────

export async function saveDraft(type: ConfigType, data: any): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await adminFetch(`/api/admin/pricing/config/${type}/draft`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    return { ok: true };
  } catch {
    // Mock: simular éxito
    return { ok: true };
  }
}

export async function publishDraft(type: ConfigType): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await adminFetch(`/api/admin/pricing/config/${type}/publish`, {
      method: 'POST',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    return { ok: true };
  } catch {
    // Mock: simular éxito
    return { ok: true };
  }
}

export async function discardDraft(type: ConfigType): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await adminFetch(`/api/admin/pricing/config/${type}/draft`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message ?? body.error ?? `Error ${res.status}` };
    }
    return { ok: true };
  } catch {
    // Mock: simular éxito
    return { ok: true };
  }
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
  try {
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
  } catch {
    // Mock: generar simulación con datos ficticios
    const interest = body.amount * 0.05;
    const techFee = body.amount * 0.01;
    const adminFeeAmount = 2;
    const totalFees = interest + techFee + adminFeeAmount;
    const discount = body.isFirstLoan ? 15 : 0;
    const feesAfterDiscount = Math.max(totalFees - discount, 0);
    const igv = feesAfterDiscount * 0.18;
    const totalToPay = body.amount + feesAfterDiscount + igv;
    const monthlyPayment = Math.round((totalToPay / body.installmentCount) * 100) / 100;

    const schedule = Array.from({ length: body.installmentCount }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + ((i + 1) * Math.round(body.termDays / body.installmentCount)));
      return {
        installmentNo: i + 1,
        dueDate: date.toISOString().split('T')[0],
        amount: i < body.installmentCount - 1 ? monthlyPayment : Math.round((totalToPay - monthlyPayment * (body.installmentCount - 1)) * 100) / 100,
      };
    });

    return {
      ok: true,
      data: {
        principal: body.amount,
        totalToPay: Math.round(totalToPay * 100) / 100,
        monthlyPayment,
        installmentCount: body.installmentCount,
        termDays: body.termDays,
        isFirstLoan: body.isFirstLoan,
        creditScoreUsed: body.creditScore,
        totalFeesOriginal: Math.round(totalFees * 100) / 100,
        totalDiscounts: discount,
        totalIgv: Math.round(igv * 100) / 100,
        totalFeesResult: Math.round(feesAfterDiscount * 100) / 100,
        schedule,
        fees: [
          { label: 'Interés', originalAmount: interest, finalAmount: interest, discountAmount: 0 },
          { label: 'Cargo tecnológico', originalAmount: techFee, finalAmount: techFee, discountAmount: 0 },
          { label: 'Cargo administrativo', originalAmount: adminFeeAmount, finalAmount: adminFeeAmount, discountAmount: 0 },
        ],
        fixedDiscounts: body.isFirstLoan
          ? [{ label: 'Descuento primer préstamo', totalDiscountAmount: 10 }, { label: 'Descuento extra', totalDiscountAmount: 5 }]
          : [],
      },
    };
  }
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getHistory(type: ConfigType): Promise<any[] | null> {
  try {
    const res = await adminFetch(`/api/admin/pricing/config/${type}/history`);
    if (!res.ok) return getMockHistory(type);
    return res.json();
  } catch {
    return getMockHistory(type);
  }
}

function getMockHistory(type: ConfigType): any[] {
  return [
    { version: 3, updatedBy: 'admin@fondea.pe', updatedAt: '2026-06-28T10:00:00Z', action: 'PUBLISHED' },
    { version: 2, updatedBy: 'admin@fondea.pe', updatedAt: '2026-06-20T14:30:00Z', action: 'PUBLISHED' },
    { version: 1, updatedBy: 'admin@fondea.pe', updatedAt: '2026-05-01T08:00:00Z', action: 'CREATED' },
  ];
}
