/**
 * Banderas de error para testing — solo código, sin UI.
 *
 * Para probar diferentes errores, modifica esta bandera directamente:
 * 
 * import { SIMULATE_ERROR } from '@/lib/error-simulation';
 * // SIMULATE_ERROR = 'MODULES_EMPTY'  // Uncomment para probar
 * 
 * Valores posibles:
 * - null (desactivado — comportamiento normal)
 * - 'MODULES_EMPTY' (no hay módulos)
 * - 'CMS_UNAVAILABLE' (servidor no disponible)
 * - 'INVALID_MODULE_DATA' (data corrupta)
 * - 'MODULE_NOT_FOUND' (módulo no existe)
 * 
 * Cambios se aplican automáticamente en la siguiente request.
 */

// BANDERA PRINCIPAL — Modifica aquí para simular errores
export const SIMULATE_ERROR:
  | 'MODULES_EMPTY'
  | 'CMS_UNAVAILABLE'
  | 'INVALID_MODULE_DATA'
  | 'MODULE_NOT_FOUND'
  | null = null;

/**
 * Verifica si hay un error siendo simulado.
 */
export function getSimulatedError() {
  return SIMULATE_ERROR;
}