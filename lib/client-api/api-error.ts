import type { ErrorCategory } from '@/lib/types';

/**
 * Error estándar para la capa client-api.
 *
 * Transporta el mensaje legible + la categoría del error para que
 * el componente pueda mostrar el banner/toast correcto.
 *
 * Uso:
 *   throw new ApiError('Ya tienes una solicitud activa', 'conflict', 409);
 *
 * En el componente:
 *   catch (err) {
 *     if (err instanceof ApiError) {
 *       setSaveError(err.message);
 *       setSaveErrorCategory(err.category);
 *     }
 *   }
 */
export class ApiError extends Error {
  category: ErrorCategory;
  httpStatus: number;

  constructor(message: string, category: ErrorCategory = 'unknown', httpStatus = 0) {
    super(message);
    this.name = 'ApiError';
    this.category = category;
    this.httpStatus = httpStatus;
  }
}
