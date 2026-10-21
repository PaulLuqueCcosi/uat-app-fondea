import type { PenaltyMutationError } from '@/modules/admin/admin-penalty.types';

/** Mensajes en español para los `code` estables del backend. */
const ERROR_MESSAGES: Record<string, string> = {
  COMPLIANCE_FEES_ON_DELAY:
    'Con el perfil REGULADO no se pueden cobrar gastos ni tarifa por el atraso. Pon esas celdas en "No se cobra" o cambia el perfil de cumplimiento.',
};

/** Texto para mostrar al admin: el del `code` si lo conocemos, si no el mensaje del backend. */
export function penaltyErrorMessage(error: PenaltyMutationError, fallback: string): string {
  if (error.code && ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
  if (error.status === 401 || error.status === 403) return 'No tienes permiso para realizar esta acción.';
  if (error.status === 404) return 'El servicio de mora no está disponible todavía en el servidor.';
  if (error.status && error.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.';
  return error.message || fallback;
}
