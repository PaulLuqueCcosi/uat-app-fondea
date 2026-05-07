/**
 * Adapter de API para el Portal de Fondea (usuario autenticado)
 *
 * Diferencias con fondeaApi.ts (landing):
 * - fetchConfig y fetchCalculation → mismos endpoints públicos
 * - createIntention → llama a las API routes autenticadas (/api/intenciones)
 *   que son proxies al backend real con JWT
 * - Soporta modo "editar" (updateIntencion) además de "crear" (createIntencion)
 * - No redirige a una URL externa — el componente wrapper maneja la navegación
 */

import type {
  LoanCalculatorApi,
  LoanConfig,
  LoanCalculation,
  ScoreResult,
  IntentionRequest,
  IntentionResponse,
  FeeItem,
  DiscountItem,
  ScheduleItem,
} from "../core";

// ── Config desde env ──────────────────────────────────────────────────────────

const PRODUCT_ID = process.env.NEXT_PUBLIC_PRODUCT_ID ?? "03d17890-251f-4946-bb91-49d35ff62800";

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

// ── fetchConfig (autenticado, via API route del portal) ───────────────────────

async function fetchConfig(): Promise<LoanConfig> {
  const res = await fetch("/api/calculadora/options");
  if (!res.ok) throw new Error(`fetchConfig: ${res.status}`);
  const data = await res.json();

  const ranges = data.creditScoreRanges
    .filter((r: any) => r.isActive)
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
    .map((r: any, idx: number) => ({
      code: r.code,
      label: r.label,
      color: FIXED_COLORS[idx]?.color ?? r.color,
    }));

  return {
    productId: data.product.id,
    amounts: data.amounts,
    terms: data.terms,
    installments: data.installments,
    creditScoreRanges: ranges,
  };
}

// ── fetchCalculation (autenticado, via API route del portal) ──────────────────

async function fetchCalculation(
  amount: number,
  termDays: number,
  installments: number,
  config: LoanConfig,
  signal?: AbortSignal
): Promise<LoanCalculation> {
  const res = await fetch("/api/calculadora/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
      originalAmount: f.originalAmount,
      discountAmount: f.discountAmount,
      finalAmount: f.finalAmount,
    }));

    const discounts: DiscountItem[] = Object.entries(sim.discounts)
      .map(([key, d]: [string, any]) => ({
        key,
        name: d.name,
        calculationType: d.calculationType,
        totalDiscountAmount: d.totalDiscountAmount,
      }))
      .sort((a: any, b: any) => a.order - b.order);

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
      totalFeesResult: sim.summary.totalFeesResult,
      igv: sim.summary.totalIgvFromTotalFeesResult,
      schedule,
    };
  }

  return { scores };
}

// ── createIntention (autenticado, via API routes del portal) ──────────────────

async function createIntention(_data: IntentionRequest): Promise<IntentionResponse> {
  // En el portal, createIntention se llama desde el wrapper que decide
  // si crear o editar. Este método solo crea.
  const res = await fetch("/api/intenciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: _data.amount,
      termDays: _data.termDays,
      installmentCount: _data.installmentCount,
    }),
  });
  if (!res.ok) throw new Error(`createIntention: ${res.status}`);
  const result = await res.json();
  return { id: result.id };
}

// ── updateIntention (autenticado, via API routes del portal) ──────────────────

export async function updateIntention(
  intencionId: string,
  amount: number,
  termDays: number,
  installmentCount: number,
): Promise<IntentionResponse> {
  const res = await fetch(`/api/intenciones/${intencionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, termDays, installmentCount }),
  });
  if (res.status === 409) throw new Error("locked");
  if (!res.ok) throw new Error(`updateIntention: ${res.status}`);
  const result = await res.json();
  return { id: result.id };
}

// ── Export del adapter ─────────────────────────────────────────────────────────

export const fondeaPortalApi: LoanCalculatorApi = {
  fetchConfig,
  fetchCalculation,
  createIntention,
  // No se usa para redirigir — el wrapper maneja la navegación
  portalUrl: "",
};
