// @ts-nocheck
/**
 * Adapter de API para Fondea (este proyecto)
 * Implementa el contrato LoanCalculatorApi usando el backend de Fondea
 *
 * NOTA: Este adapter usa process.env.NEXT_PUBLIC_* porque está diseñado
 * para la landing que corre en Next.js. En el portal se usa
 * fondeaPortalApi.ts en su lugar.
 */

import type {
  LoanCalculatorApi,
  LoanConfig,
  LoanConfigAmount,
  LoanConfigTerm,
  LoanConfigInstallment,
  LoanCalculation,
  ScoreResult,
  IntentionRequest,
  IntentionResponse,
  FeeItem,
  DiscountItem,
  ScheduleItem,
} from "../core";

// ── Config desde env ──────────────────────────────────────────────────────────

const PRODUCT_ID     = process.env.NEXT_PUBLIC_PRODUCT_ID         ?? "03d17890-251f-4946-bb91-49d35ff62800";
const CALCULATOR_URL = process.env.NEXT_PUBLIC_CALCULATOR_API_URL ?? "http://localhost:9599/api";
const PORTAL_URL     = process.env.NEXT_PUBLIC_LOAN_REQUEST_URL   ?? "https://solicitar.fondea.pe";

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToLightBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.08)`;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatDueDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${DAYS[d.getDay()]} - ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// ── Colores fijos por rango ───────────────────────────────────────────────────

const FIXED_COLORS: Record<number, { color: string; lightBg: string }> = {
  0: { color: "#EF4444", lightBg: "rgba(239,68,68,0.08)" },
  1: { color: "#F59E0B", lightBg: "rgba(245,158,11,0.08)" },
  2: { color: "#10B981", lightBg: "rgba(16,185,129,0.08)" },
};

// ── Implementación ────────────────────────────────────────────────────────────

async function fetchConfig(): Promise<LoanConfig> {
  const res = await fetch(`${CALCULATOR_URL}/products/${PRODUCT_ID}/options`);
  if (!res.ok) throw new Error(`fetchConfig: ${res.status}`);
  const data = await res.json();

  // Score ranges
  const rawRanges = data.scoreRanges ?? data.creditScoreRanges ?? [];
  const ranges = rawRanges
    .filter((r: any) => r.isActive !== false)
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
    .map((r: any, idx: number) => ({
      code: r.code,
      label: r.label,
      color: FIXED_COLORS[idx]?.color ?? r.color,
    }));

  // Amounts con estructura jerárquica (amounts → terms → installments)
  const amounts: LoanConfigAmount[] = (data.amounts ?? []).map((a: any) => ({
    value: a.value,
    label: a.label,
    terms: (a.terms ?? []).map((t: any): LoanConfigTerm => ({
      value: t.value,
      label: t.label,
      installments: (t.installments ?? []).map((i: any): LoanConfigInstallment => ({
        value: i.value,
        label: i.label,
      })),
    })),
  }));

  return {
    productId: data.product.id,
    amounts,
    creditScoreRanges: ranges,
  };
}

async function fetchCalculation(
  amount: number,
  termDays: number,
  installments: number,
  config: LoanConfig,
  signal?: AbortSignal
): Promise<LoanCalculation> {
  const res = await fetch(`${CALCULATOR_URL}/simulate/landing`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      productId: config.productId,
      amount,
      termDays,
      installmentCount: installments,
      isFirstLoan: true,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`fetchCalculation: ${res.status}`);

  const data: any[] = await res.json();
  const scores: Record<string, ScoreResult> = {};

  for (const item of data) {
    const sim = item.simulation;
    const idx = config.creditScoreRanges.findIndex(
      (r) => r.code.toLowerCase() === item.rangeCode.toLowerCase()
    );

    const fees: FeeItem[] = Object.entries(sim.fees).map(([key, f]: [string, any]) => ({
      key,
      name: f.name,
      label: f.label ?? f.name,
      originalAmount: f.originalAmount,
      discountAmount: f.discountAmount,
      finalAmount: f.finalAmount,
      discountHistory: (f.discountHistory ?? []).map((h: any) => ({
        code: h.code,
        label: h.label,
        amountBefore: h.amountBefore,
        discountAmount: h.discountAmount,
        amountAfter: h.amountAfter,
        value: h.value,
      })),
    }));

    // Aplanar discounts.percentage y discounts.fixed
    const allDiscounts: any[] = [];
    if (sim.discounts?.percentage) {
      allDiscounts.push(...Object.values(sim.discounts.percentage));
    }
    if (sim.discounts?.fixed) {
      allDiscounts.push(...Object.values(sim.discounts.fixed));
    }

    const discounts: DiscountItem[] = allDiscounts
      .map((d: any) => ({
        key: d.name,
        name: d.name,
        label: d.label ?? d.name,
        type: d.type,
        calculationType: d.calculationType,
        totalDiscountAmount: d.totalDiscountAmount,
        value: d.value,
      }))
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    const schedule: ScheduleItem[] = sim.schedule.map((s: any) => ({
      installmentNo: s.installmentNo,
      label: formatDueDate(s.dueDate),
      amount: s.amount,
    }));

    const total = sim.summary.totalToPay;
    const cuotaAmt = sim.installmentCount > 1 ? +(total / sim.installmentCount).toFixed(2) : total;

    scores[item.rangeCode.toLowerCase()] = {
      total,
      cuotaAmt,
      color: FIXED_COLORS[idx]?.color ?? item.rangeColor,
      lightBg: FIXED_COLORS[idx]?.lightBg ?? hexToLightBg(item.rangeColor),
      fees,
      discounts,
      totalFeesOriginal: sim.summary.totalFeesOriginal,
      totalPercentageDiscounts: sim.summary.totalPercentageDiscounts,
      totalFeesWithPercentageDiscounts: sim.summary.totalFeesWithPercentageDiscounts,
      totalFixedDiscounts: sim.summary.totalFixedDiscounts ?? 0,
      totalFeesWithFixedDiscounts: sim.summary.totalFeesWithFixedDiscounts ?? 0,
      totalFeesResult: sim.summary.totalFeesResult,
      igv: sim.summary.totalIgvFromTotalFeesResult,
      schedule,
    };
  }

  return { scores };
}

async function createIntention(data: IntentionRequest): Promise<IntentionResponse> {
  const res = await fetch(`${CALCULATOR_URL}/intentions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`createIntention: ${res.status}`);
  return res.json();
}

// ── Metadata ──────────────────────────────────────────────────────────────────

async function collectMetadata(): Promise<Record<string, unknown>> {
  const pageLoadTime = Date.now();
  const conn = (navigator as any).connection ?? (navigator as any).mozConnection;

  return {
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionDurationSeconds: Math.round((Date.now() - pageLoadTime) / 1000),
    userAgent: navigator.userAgent,
    deviceType: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : /iPad|Tablet/i.test(navigator.userAgent) ? "tablet" : "desktop",
    screenResolution: `${screen.width}x${screen.height}`,
    devicePixelRatio: window.devicePixelRatio ?? 1,
    language: navigator.language,
    currentUrl: window.location.href,
    referrer: document.referrer || null,
    ...(conn?.effectiveType && { connectionType: conn.effectiveType }),
  };
}

// ── Export del adapter ─────────────────────────────────────────────────────────

export const fondeaApi: LoanCalculatorApi = {
  fetchConfig,
  fetchCalculation,
  createIntention,
  portalUrl: PORTAL_URL,
  collectMetadata,
};
