/**
 * Service de Educación — conectado al backend real (antes leía data estática).
 *
 * Endpoints:
 * - GET  /api/v1/education/modules              → resúmenes (listado/grid)
 * - GET  /api/v1/education/modules/{id}          → detalle completo
 * - POST /api/v1/education/modules/{id}/access   → registrar que el usuario lo abrió
 *
 * Retorna Result<T> — los componentes nunca ven errores crudos.
 */

import type { Result } from '@/modules/shared/result';
import type { EducationModule, EducationModuleSummary } from './education.types';
import type { EducationError } from './education.errors';
import { errors } from './education.errors';
import { backendFetch } from '@/lib/backend-fetch';
import { mapModuleFromBackend, mapModuleToSummary } from './education.mapper';

type EducationResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: EducationError }
);

const CTX = 'EDUCATION';

// ─── Listado (resúmenes) ────────────────────────────────────────────────────

/**
 * Obtiene los resúmenes de los módulos, ordenados.
 * GET /api/v1/education/modules
 */
export async function getModuleSummaries(): Promise<EducationResult<EducationModuleSummary[]>> {
  try {
    const res = await backendFetch('/api/v1/education/modules', { context: CTX });

    if (res.status === 401) return { ok: false, error: errors.cmsUnavailable('Sesión expirada') };
    if (!res.ok) return { ok: false, error: errors.cmsUnavailable(`HTTP ${res.status}`) };

    const raw = await res.json();
    const modules: EducationModuleSummary[] = (Array.isArray(raw) ? raw : [])
      .map((r: Record<string, unknown>) => mapModuleToSummary(mapModuleFromBackend(r)))
      .sort((a, b) => a.order - b.order);

    if (modules.length === 0) return { ok: false, error: errors.modulesEmpty() };

    return { ok: true, data: modules };
  } catch (err) {
    return { ok: false, error: errors.cmsUnavailable(String(err)) };
  }
}

// ─── Detalle de un módulo ────────────────────────────────────────────────────

/**
 * Obtiene el detalle completo de un módulo.
 * GET /api/v1/education/modules/{id}
 */
export async function getModuleById(id: string): Promise<EducationResult<EducationModule>> {
  if (!id?.trim()) {
    return { ok: false, error: errors.moduleNotFound(id ?? '') };
  }

  try {
    const res = await backendFetch(`/api/v1/education/modules/${encodeURIComponent(id)}`, { context: CTX });

    if (res.status === 404) return { ok: false, error: errors.moduleNotFound(id) };
    if (res.status === 401) return { ok: false, error: errors.cmsUnavailable('Sesión expirada') };
    if (!res.ok) return { ok: false, error: errors.cmsUnavailable(`HTTP ${res.status}`) };

    const raw = await res.json();
    return { ok: true, data: mapModuleFromBackend(raw) };
  } catch (err) {
    return { ok: false, error: errors.cmsUnavailable(String(err)) };
  }
}

// ─── Registrar acceso ────────────────────────────────────────────────────────

/**
 * Registra que el usuario autenticado abrió este módulo.
 * POST /api/v1/education/modules/{id}/access
 * Fire-and-forget: nunca lanza — si falla, solo se pierde ese registro de KPI, no debe
 * afectar la experiencia del usuario leyendo el módulo.
 */
export async function recordModuleAccess(id: string): Promise<void> {
  try {
    await backendFetch(`/api/v1/education/modules/${encodeURIComponent(id)}/access`, {
      context: CTX,
      method: 'POST',
    });
  } catch {
    // swallow — ver comentario arriba
  }
}

// ─── Módulos adyacentes (prev/next) ──────────────────────────────────────────

/**
 * Calcula el módulo anterior/siguiente dado un ID, a partir de una lista de resúmenes YA
 * obtenida (no hace I/O). Antes operaba sobre el array estático completo — ahora recibe los
 * resúmenes que la page ya pidió, para no duplicar el fetch.
 */
export function getAdjacentModules(
  summaries: EducationModuleSummary[],
  moduleId: string,
): { prev: EducationModuleSummary | null; next: EducationModuleSummary | null; total: number } {
  const sorted = [...summaries].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex((m) => m.id === moduleId);

  return {
    prev: currentIndex > 0 ? sorted[currentIndex - 1] : null,
    next: currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null,
    total: sorted.length,
  };
}
