import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

/**
 * Obtiene nombre y email del usuario autenticado desde Logto.
 * Una sola llamada a getLogtoContext para evitar duplicar la operación.
 */
export async function getUserInfo(): Promise<{ name: string | null; email: string | null }> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return { name: null, email: null };
  }

  return {
    name: claims.name || claims.username || null,
    email: claims.email || null,
  };
}

/**
 * Obtiene el nombre del usuario desde Logto.
 * Usa los claims del token: name > username > null.
 */
export async function getUserName(): Promise<string | null> {
  const { name } = await getUserInfo();
  return name;
}

/**
 * Obtiene el email del usuario desde Logto.
 */
export async function getUserEmail(): Promise<string | null> {
  const { email } = await getUserInfo();
  return email;
}
