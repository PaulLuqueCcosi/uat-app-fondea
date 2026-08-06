/**
 * Service para el score crediticio interno y el reporte de buró de un usuario en admin.
 * OJO: NO confundir con el "puntaje" de fidelización (ver admin-user-puntaje.service.ts).
 *
 * Endpoints:
 * - GET  /api/v1/admin/scoring/evaluations/{userId}
 * - POST /api/v1/admin/scoring/recalculate/{userId}
 * - GET  /api/v1/admin/buro/{userId}
 * - POST /api/v1/admin/buro/{userId}/consult
 */

import { backendFetch } from '@/lib/backend-fetch';
import type {
  ScoreEvaluation,
  ScoreRecalculateResult,
  BuroReport,
  BuroReportBackend,
  BuroHistoryEntry,
  BuroHistoryEntryBackend,
  ConsultBuroResult,
} from './admin-user-score.types';

// ── Score interno ────────────────────────────────────────────────────────────

export async function getUserScoreEvaluations(userId: string, limit = 20): Promise<ScoreEvaluation[]> {
  const res = await backendFetch(`/api/v1/admin/scoring/evaluations/${userId}?limit=${limit}`, {
    context: 'ADMIN_USER_SCORE',
  });

  if (!res.ok) {
    console.error(`[ADMIN_USER_SCORE] Error ${res.status} al obtener historial de score de usuario ${userId}`);
    return [];
  }

  return res.json();
}

export async function getEvaluationDetail(evaluationId: string): Promise<ScoreEvaluation | null> {
  const res = await backendFetch(`/api/v1/admin/scoring/evaluations/detail/${evaluationId}`, {
    context: 'ADMIN_USER_SCORE',
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    console.error(`[ADMIN_USER_SCORE] Error ${res.status} al obtener detalle de evaluación ${evaluationId}`);
    return null;
  }

  return res.json();
}

export async function recalculateUserScore(userId: string): Promise<ScoreRecalculateResult | null> {
  const res = await backendFetch(`/api/v1/admin/scoring/recalculate/${userId}`, {
    method: 'POST',
    context: 'ADMIN_USER_SCORE',
  });

  if (!res.ok) {
    console.error(`[ADMIN_USER_SCORE] Error ${res.status} al recalcular score de usuario ${userId}`);
    return null;
  }

  return res.json();
}

// ── Buró ──────────────────────────────────────────────────────────────────────

function mapBuroReport(raw: BuroReportBackend): BuroReport {
  return {
    id: raw.id,
    buroScore: raw.buro_score,
    worstClassification: raw.worst_classification,
    totalDebtsCount: raw.total_debts_count,
    totalDebtAmount: raw.total_debt_amount,
    overdueDebtsCount: raw.overdue_debts_count,
    overdueDebtAmount: raw.overdue_debt_amount,
    entitiesCount: raw.entities_count,
    protestsCount: raw.protests_count,
    inquiriesCount: raw.inquiries_count,
    provider: raw.provider,
    consultedAt: raw.consulted_at,
    expiresAt: raw.expires_at,
    isValid: raw.is_valid,
    debts: (raw.debts ?? []).map((d) => ({
      entityName: d.entity_name,
      creditType: d.credit_type,
      originalAmount: d.original_amount,
      outstandingAmount: d.outstanding_amount,
      daysOverdue: d.days_overdue,
      classification: d.classification,
      reportedAt: d.reported_at,
    })),
  };
}

export async function getUserBuroReport(userId: string): Promise<BuroReport | null> {
  const res = await backendFetch(`/api/v1/admin/buro/${userId}`, {
    context: 'ADMIN_USER_BURO',
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    console.error(`[ADMIN_USER_BURO] Error ${res.status} al obtener reporte de buró de usuario ${userId}`);
    return null;
  }

  const raw: BuroReportBackend = await res.json();
  return mapBuroReport(raw);
}

export async function consultUserBuro(userId: string): Promise<ConsultBuroResult> {
  const res = await backendFetch(`/api/v1/admin/buro/${userId}/consult`, {
    method: 'POST',
    context: 'ADMIN_USER_BURO',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ADMIN_USER_BURO] Error ${res.status} al consultar buró de usuario ${userId}: ${body}`);
    return { ok: false, report: null, message: `Error al consultar buró: ${res.status}` };
  }

  const raw: BuroReportBackend = await res.json();
  return { ok: true, report: mapBuroReport(raw) };
}

export async function getUserBuroHistory(userId: string): Promise<BuroHistoryEntry[]> {
  const res = await backendFetch(`/api/v1/admin/buro/${userId}/history`, {
    context: 'ADMIN_USER_BURO',
  });

  if (!res.ok) {
    console.error(`[ADMIN_USER_BURO] Error ${res.status} al obtener historial de buró de usuario ${userId}`);
    return [];
  }

  const raw = await res.json();
  const entries: BuroHistoryEntryBackend[] = raw.reports ?? [];
  return entries.map((e) => ({
    id: e.id,
    buroScore: e.buro_score,
    worstClassification: e.worst_classification,
    totalDebtAmount: e.total_debt_amount,
    provider: e.provider,
    consultedAt: e.consulted_at,
    isValid: e.is_valid,
  }));
}
