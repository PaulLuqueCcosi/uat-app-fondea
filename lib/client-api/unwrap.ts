import type { ActionResult } from '@/lib/types';
import { ApiError } from './api-error';

/**
 * Convierte un ActionResult del server action en:
 * - Datos limpios si success: true
 * - throw ApiError si success: false
 *
 * Esto permite que la capa client-api siempre retorne datos o haga throw,
 * lo cual es compatible con toast.promise() y try/catch en componentes.
 *
 * Uso:
 *   const result = await someServerAction(data);
 *   const data = unwrap(result);
 *   // Si llegó aquí, result.success === true
 *   // Si no, ya hizo throw ApiError
 *
 * Ejemplo completo:
 *   export async function saveLabor(data) {
 *     const result = await saveLaborAction(data);
 *     return unwrap(result); // throw si falla, retorna datos si OK
 *   }
 */
export function unwrap<T extends ActionResult>(result: T): Extract<T, { success: true }> {
  if (!result.success) {
    throw new ApiError(
      result.error,
      result.errorCategory,
      result.httpStatus,
    );
  }
  return result as Extract<T, { success: true }>;
}
