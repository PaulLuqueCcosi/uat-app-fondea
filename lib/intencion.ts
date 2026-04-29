/**
 * Clave para almacenar el ID de intención de préstamo en localStorage
 * Se usa para persistir el ID durante el flujo de autenticación
 */
export const INTENCION_STORAGE_KEY = 'fondea_intencion_id';

/**
 * Guarda el ID de intención en localStorage
 */
export function saveIntencionId(id: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(INTENCION_STORAGE_KEY, id);
  }
}

/**
 * Recupera el ID de intención desde localStorage
 */
export function getIntencionId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(INTENCION_STORAGE_KEY);
  }
  return null;
}

/**
 * Elimina el ID de intención de localStorage
 */
export function clearIntencionId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(INTENCION_STORAGE_KEY);
  }
}
