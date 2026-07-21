/**
 * Service para administrar la configuración del scorecard.
 * Usa backendFetch con JWT del admin.
 */

import { backendFetch } from '@/lib/backend-fetch';
import type {
  ScorecardConfig,
  ScorecardMetadata,
  EvaluationOutcome,
  EvaluationRecord,
} from './scoring-config.types';

// ─── Configs ─────────────────────────────────────────────────────────────────

export async function getScorecardConfigs(): Promise<ScorecardConfig[]> {
  const res = await backendFetch('/api/v1/admin/scoring/configs', { context: 'SCORECARD' });
  if (!res.ok) return [];
  return res.json();
}

export async function getActiveConfig(): Promise<ScorecardConfig | null> {
  const res = await backendFetch('/api/v1/admin/scoring/configs/active', { context: 'SCORECARD' });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function getConfigById(id: string): Promise<ScorecardConfig | null> {
  const res = await backendFetch(`/api/v1/admin/scoring/configs/${id}`, { context: 'SCORECARD' });
  if (!res.ok) return null;
  return res.json();
}

export async function createConfig(data: {
  name: string;
  description: string;
  maxScore: number;
  dimensionsJson: string;
}): Promise<ScorecardConfig | null> {
  const res = await backendFetch('/api/v1/admin/scoring/configs', {
    method: 'POST',
    body: JSON.stringify(data),
    context: 'SCORECARD',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateConfig(id: string, data: {
  name: string;
  description: string;
  maxScore: number;
  dimensionsJson: string;
}): Promise<ScorecardConfig | null> {
  const res = await backendFetch(`/api/v1/admin/scoring/configs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    context: 'SCORECARD',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function activateConfig(id: string): Promise<ScorecardConfig | null> {
  const res = await backendFetch(`/api/v1/admin/scoring/configs/${id}/activate`, {
    method: 'POST',
    context: 'SCORECARD',
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function getScorecardMetadata(): Promise<ScorecardMetadata | null> {
  const res = await backendFetch('/api/v1/admin/scoring/metadata', { context: 'SCORECARD' });
  if (!res.ok) return null;
  return res.json();
}

// ─── Evaluations ─────────────────────────────────────────────────────────────

export async function recalculateScore(userId: string): Promise<EvaluationOutcome | null> {
  const res = await backendFetch(`/api/v1/admin/scoring/recalculate/${userId}`, {
    method: 'POST',
    context: 'SCORECARD',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function simulateScore(userId: string, configId: string): Promise<EvaluationOutcome | null> {
  const res = await backendFetch(`/api/v1/admin/scoring/simulate/${userId}?configId=${configId}`, {
    method: 'POST',
    context: 'SCORECARD',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getEvaluationHistory(userId: string, limit = 20): Promise<EvaluationRecord[]> {
  const res = await backendFetch(`/api/v1/admin/scoring/evaluations/${userId}?limit=${limit}`, { context: 'SCORECARD' });
  if (!res.ok) return [];
  return res.json();
}

export async function getEvaluationDetail(id: string): Promise<EvaluationRecord | null> {
  const res = await backendFetch(`/api/v1/admin/scoring/evaluations/detail/${id}`, { context: 'SCORECARD' });
  if (!res.ok) return null;
  return res.json();
}
