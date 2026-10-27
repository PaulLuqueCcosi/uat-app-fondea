/**
 * Service para configuración de penalidad/mora.
 * Endpoints (base /api/v1/admin/penalty-config):
 * - GET  /                → Config activa
 * - GET  /history         → Historial
 * - POST /                → Crear nueva config (modo SIMPLE o POR_CONCEPTOS)
 * - GET  /concepts        → Conceptos, métodos permitidos y límites
 * - GET  /compliance      → Perfil de cumplimiento + historial
 * - PUT  /compliance      → Cambiar perfil (exige motivo)
 * - POST /simulate        → Simulador de mora por día
 */

import { backendFetch } from '@/lib/backend-fetch';
import type {
  ChargeConcept,
  ChargeMethod,
  ChargeValueKind,
} from '@/modules/shared/charge-concepts';
import { DEFAULT_ALLOCATION_ORDER } from '@/modules/shared/charge-concepts';
import type {
  ComplianceHistoryEntry,
  ComplianceProfile,
  ComplianceState,
  ConceptAmounts,
  ConceptsCatalog,
  PenaltyConfigResponse,
  PenaltyMode,
  PenaltyMutationError,
  PenaltyRangeResponse,
  PenaltyResult,
  PenaltyRule,
  PenaltyStage,
  SavePenaltyConfigRequest,
  SimulatePenaltyRequest,
  SimulatePenaltyResponse,
} from './admin-penalty.types';
import type { PenaltyBase } from '@/modules/shared/penalty-base';

// Los tipos siguen saliendo de este módulo para no romper los imports existentes.
export type { PenaltyBase };
export type {
  PenaltyType,
  PenaltyMode,
  PenaltyRangeResponse,
  PenaltyConfigResponse,
  SavePenaltyRangeRequest,
  SavePenaltyConfigRequest,
  PenaltyRule,
  PenaltyStage,
  ConceptsCatalog,
  ConceptSpec,
  ConceptMethodSpec,
  ComplianceProfile,
  ComplianceState,
  ComplianceHistoryEntry,
  SimulatePenaltyRequest,
  SimulatePenaltyResponse,
  PenaltyResult,
  PenaltyMutationError,
} from './admin-penalty.types';

const BASE = '/api/v1/admin/penalty-config';

// ── Mappers (JSON del backend → tipos del front, tolerantes a campos faltantes) ─

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  return toNumber(value, 0);
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function mapRange(raw: Json): PenaltyRangeResponse {
  return {
    id: String(raw.id ?? ''),
    fromDay: toNumber(raw.fromDay),
    toDay: toNullableNumber(raw.toDay),
    type: raw.type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
    value: toNumber(raw.value),
    base: (raw.base as PenaltyBase | null | undefined) ?? null,
    sortOrder: toNumber(raw.sortOrder),
    color: toNullableString(raw.color),
    icon: toNullableString(raw.icon),
    label: toNullableString(raw.label),
  };
}

function mapRule(raw: Json): PenaltyRule {
  return {
    concept: raw.concept as ChargeConcept,
    method: raw.method as ChargeMethod,
    value: toNumber(raw.value),
  };
}

function mapStage(raw: Json): PenaltyStage {
  return {
    id: raw.id === undefined || raw.id === null ? undefined : String(raw.id),
    fromDay: toNumber(raw.fromDay, 1),
    toDay: toNullableNumber(raw.toDay),
    label: toNullableString(raw.label),
    color: toNullableString(raw.color),
    icon: toNullableString(raw.icon),
    rules: Array.isArray(raw.rules) ? raw.rules.filter(isObject).map(mapRule) : [],
  };
}

/** Un `mode` ausente o desconocido es una configuración anterior: SIMPLE. */
function mapMode(value: unknown): PenaltyMode {
  return value === 'POR_CONCEPTOS' ? 'POR_CONCEPTOS' : 'SIMPLE';
}

export function mapPenaltyConfig(raw: unknown): PenaltyConfigResponse | null {
  if (!isObject(raw)) return null;
  const order = Array.isArray(raw.allocationOrder)
    ? (raw.allocationOrder.filter((c): c is ChargeConcept => typeof c === 'string'))
    : [];
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    isActive: raw.isActive === true,
    createdBy: String(raw.createdBy ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    mode: mapMode(raw.mode),
    ranges: Array.isArray(raw.ranges) ? raw.ranges.filter(isObject).map(mapRange) : [],
    stages: Array.isArray(raw.stages) ? raw.stages.filter(isObject).map(mapStage) : [],
    allocationOrder: order.length > 0 ? order : [...DEFAULT_ALLOCATION_ORDER],
    includeIgv: raw.includeIgv === true,
  };
}

export function mapConceptsCatalog(raw: unknown): ConceptsCatalog | null {
  if (!isObject(raw) || !Array.isArray(raw.concepts)) return null;
  const concepts = raw.concepts.filter(isObject).map((c) => ({
    code: c.code as ChargeConcept,
    label: String(c.label ?? c.code ?? ''),
    allowedMethods: (Array.isArray(c.allowedMethods) ? c.allowedMethods : [])
      .filter(isObject)
      .map((m) => ({
        method: m.method as ChargeMethod,
        valueKind: m.valueKind as ChargeValueKind,
        min: toNumber(m.min, 0),
        max: toNumber(m.max, 0),
      })),
  }));
  return { concepts, maxTnaPercent: toNullableNumber(raw.maxTnaPercent) };
}

function mapProfile(value: unknown): ComplianceProfile {
  return value === 'UNREGULATED' ? 'UNREGULATED' : 'REGULATED';
}

export function mapCompliance(raw: unknown): ComplianceState | null {
  if (!isObject(raw)) return null;
  const history: ComplianceHistoryEntry[] = Array.isArray(raw.history)
    ? raw.history.filter(isObject).map((h) => ({
        profile: mapProfile(h.profile),
        reason: String(h.reason ?? ''),
        changedBy: String(h.changedBy ?? ''),
        changedAt: String(h.changedAt ?? ''),
      }))
    : [];
  return { profile: mapProfile(raw.profile), history };
}

function mapAmounts(raw: unknown): ConceptAmounts {
  const out: ConceptAmounts = {};
  if (!isObject(raw)) return out;
  for (const [concept, amount] of Object.entries(raw)) {
    out[concept as ChargeConcept] = toNumber(amount);
  }
  return out;
}

export function mapSimulation(raw: unknown): SimulatePenaltyResponse | null {
  if (!isObject(raw)) return null;
  const perDay = Array.isArray(raw.perDay)
    ? raw.perDay.filter(isObject).map((d) => ({ day: toNumber(d.day), charges: mapAmounts(d.charges) }))
    : [];
  return { perDay, totals: mapAmounts(raw.totals) };
}

// ── Errores ───────────────────────────────────────────────────────────────────

async function readError(res: Response, fallback: string): Promise<PenaltyMutationError> {
  const text = await res.text().catch(() => '');
  let code: string | undefined;
  let message: string | undefined;
  try {
    const body: unknown = JSON.parse(text);
    if (isObject(body)) {
      if (typeof body.code === 'string') code = body.code;
      if (typeof body.message === 'string') message = body.message;
      // Por si el backend deja el código dentro del mapa `errors`.
      if (!code && isObject(body.errors) && typeof body.errors.code === 'string') {
        code = body.errors.code;
      }
    }
  } catch {
    /* cuerpo que no es JSON: se usa el texto de respaldo */
  }
  return { code, message: message ?? `${fallback}: ${res.status}`, status: res.status };
}

// ── API Calls ─────────────────────────────────────────────────────────────────

export async function getActivePenaltyConfig(): Promise<PenaltyConfigResponse | null> {
  const res = await backendFetch(BASE, { context: 'ADMIN_PENALTY_CONFIG' });

  if (res.status === 204) return null; // No content
  if (!res.ok) {
    console.error(`[ADMIN_PENALTY_CONFIG] Error ${res.status}`);
    return null;
  }

  return mapPenaltyConfig(await res.json().catch(() => null));
}

export async function getPenaltyConfigHistory(): Promise<PenaltyConfigResponse[]> {
  const res = await backendFetch(`${BASE}/history`, { context: 'ADMIN_PENALTY_HISTORY' });

  if (!res.ok) {
    console.error(`[ADMIN_PENALTY_HISTORY] Error ${res.status}`);
    return [];
  }

  const raw: unknown = await res.json().catch(() => []);
  if (!Array.isArray(raw)) return [];
  return raw.map(mapPenaltyConfig).filter((c): c is PenaltyConfigResponse => c !== null);
}

export async function createPenaltyConfig(
  request: SavePenaltyConfigRequest,
): Promise<PenaltyResult<PenaltyConfigResponse | null>> {
  const res = await backendFetch(BASE, {
    context: 'ADMIN_PENALTY_CREATE',
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await readError(res, 'Error al guardar');
    console.error(`[ADMIN_PENALTY_CREATE] Error ${res.status}: ${error.code ?? ''} ${error.message}`);
    return { ok: false, error };
  }

  return { ok: true, data: mapPenaltyConfig(await res.json().catch(() => null)) };
}

export async function getConceptsCatalog(): Promise<ConceptsCatalog | null> {
  const res = await backendFetch(`${BASE}/concepts`, { context: 'ADMIN_PENALTY_CONCEPTS' });
  if (!res.ok) {
    console.error(`[ADMIN_PENALTY_CONCEPTS] Error ${res.status}`);
    return null;
  }
  return mapConceptsCatalog(await res.json().catch(() => null));
}

export async function getComplianceState(): Promise<ComplianceState | null> {
  const res = await backendFetch(`${BASE}/compliance`, { context: 'ADMIN_PENALTY_COMPLIANCE' });
  if (!res.ok) {
    console.error(`[ADMIN_PENALTY_COMPLIANCE] Error ${res.status}`);
    return null;
  }
  return mapCompliance(await res.json().catch(() => null));
}

export async function updateComplianceProfile(
  profile: ComplianceProfile,
  reason: string,
): Promise<PenaltyResult<ComplianceState | null>> {
  const res = await backendFetch(`${BASE}/compliance`, {
    context: 'ADMIN_PENALTY_COMPLIANCE_UPDATE',
    method: 'PUT',
    body: JSON.stringify({ profile, reason }),
  });

  if (!res.ok) {
    return { ok: false, error: await readError(res, 'Error al cambiar el perfil') };
  }
  // El backend puede responder sin cuerpo; el front vuelve a pedir el estado.
  return { ok: true, data: mapCompliance(await res.json().catch(() => null)) };
}

export async function simulatePenalty(
  request: SimulatePenaltyRequest,
): Promise<PenaltyResult<SimulatePenaltyResponse>> {
  const res = await backendFetch(`${BASE}/simulate`, {
    context: 'ADMIN_PENALTY_SIMULATE',
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    return { ok: false, error: await readError(res, 'Error al simular') };
  }

  const data = mapSimulation(await res.json().catch(() => null));
  if (!data) {
    return { ok: false, error: { message: 'La respuesta del simulador no es válida' } };
  }
  return { ok: true, data };
}
