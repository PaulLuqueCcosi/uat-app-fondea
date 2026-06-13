/**
 * Service de Educación — la ÚNICA puerta a los datos de este módulo.
 *
 * Hoy: lee data estática de education.data.ts
 * Mañana: fetch a CMS. Solo se toca ESTE archivo, nada más.
 *
 * Retorna Result<T> — los componentes nunca ven errores crudos.
 */

import type { Result } from '@/modules/shared/result';
import type { EducationModule, EducationModuleSummary } from './education.types';
import type { EducationError } from './education.errors';
import { errors } from './education.errors';
import { educationData } from './education.data';
import { getSimulatedError } from '@/lib/error-simulation';

// Re-tipamos Result con nuestro error específico
type EducationResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: EducationError }
);

/**
 * Verifica si hay un error siendo simulado y lo retorna.
 * Usado para testing/debugging sin modificar la data real.
 */
function checkSimulatedError(): EducationError | null {
  const simulated = getSimulatedError();
  
  switch (simulated) {
    case 'MODULES_EMPTY':
      console.log('🧪 [TEST] Simulando: MODULES_EMPTY');
      return errors.modulesEmpty();
    case 'CMS_UNAVAILABLE':
      console.log('🧪 [TEST] Simulando: CMS_UNAVAILABLE');
      return errors.cmsUnavailable('Test error simulation');
    case 'INVALID_MODULE_DATA':
      console.log('🧪 [TEST] Simulando: INVALID_MODULE_DATA');
      return errors.invalidData('Test error simulation');
    case 'MODULE_NOT_FOUND':
      console.log('🧪 [TEST] Simulando: MODULE_NOT_FOUND');
      return errors.moduleNotFound('test-id');
    default:
      return null;
  }
}

/**
 * Obtiene todos los módulos completos, ordenados.
 */
export async function getModules(): Promise<EducationResult<EducationModule[]>> {
  try {
    // Verifica si hay un error siendo simulado
    const simulatedError = checkSimulatedError();
    if (simulatedError) {
      return { ok: false, error: simulatedError };
    }

    const data = educationData.sort((a, b) => a.order - b.order);

    if (data.length === 0) {
      return { ok: false, error: errors.modulesEmpty() };
    }

    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errors.cmsUnavailable(String(err)) };
  }
}

/**
 * Obtiene resúmenes (para grids/carousels — menos payload por item).
 */
export async function getModuleSummaries(): Promise<EducationResult<EducationModuleSummary[]>> {
  const result = await getModules();
  if (!result.ok) return result;

  const summaries: EducationModuleSummary[] = result.data.map(m => ({
    id: m.id,
    order: m.order,
    title: m.title,
    mascot: m.mascot,
    description: m.description,
    thumbnail: m.thumbnail,
    videoDuration: m.videoDuration,
    videoUrl: m.videoUrl,
    downloadUrl: m.downloadUrl,
    externalLinks: m.externalLinks,
  }));

  return { ok: true, data: summaries };
}

/**
 * Obtiene un módulo por ID.
 * - ok + data → encontrado
 * - !ok + MODULE_NOT_FOUND → no existe
 */
export async function getModuleById(id: string): Promise<EducationResult<EducationModule>> {
  if (!id?.trim()) {
    return { ok: false, error: errors.moduleNotFound(id ?? '') };
  }

  try {
    // Verifica si hay un error siendo simulado
    const simulatedError = checkSimulatedError();
    if (simulatedError) {
      return { ok: false, error: simulatedError };
    }

    const found = educationData.find(m => m.id === id);

    if (!found) {
      return { ok: false, error: errors.moduleNotFound(id) };
    }

    return { ok: true, data: found };
  } catch (err) {
    return { ok: false, error: errors.cmsUnavailable(String(err)) };
  }
}

/**
 * IDs disponibles (para generateStaticParams en build time).
 */
export async function getAllModuleIds(): Promise<string[]> {
  return educationData.map(m => m.id);
}

/**
 * Obtiene los módulos adyacentes (prev/next) dado un ID.
 * Útil para la navegación en la página de detalle.
 */
export function getAdjacentModules(moduleId: string): {
  prev: EducationModule | null;
  next: EducationModule | null;
  total: number;
} {
  const sorted = educationData.sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex(m => m.id === moduleId);

  return {
    prev: currentIndex > 0 ? sorted[currentIndex - 1] : null,
    next: currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null,
    total: sorted.length,
  };
}
