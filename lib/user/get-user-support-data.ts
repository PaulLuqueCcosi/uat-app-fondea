import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

export interface UserSupportData {
  /** ID de la cuenta (logto sub/id) */
  accountId: string | null;
  /** DNI del usuario (viene del expediente/backend) */
  dni: string | null;
}

/**
 * Obtiene los datos de cuenta necesarios para soporte.
 *
 * HOY: accountId viene de Logto (sub), DNI es null (no disponible en claims).
 * MAÑANA: conectar con el backend para obtener el DNI real del expediente.
 */
export async function getUserSupportData(): Promise<UserSupportData> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return { accountId: null, dni: null };
  }

  return {
    accountId: claims.sub || null,
    // TODO: Obtener DNI del backend/expediente cuando esté disponible
    dni: null,
  };
}
