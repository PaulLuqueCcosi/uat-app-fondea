/**
 * Helper compartido para las API routes de intenciones.
 *
 * Re-exporta backendFetch y proxyResponse desde lib/backend-fetch.ts
 * con el contexto 'API_PROXY' por defecto.
 */

import { backendFetch as centralBackendFetch, proxyResponse, type BackendFetchOptions } from '@/lib/backend-fetch';

export { proxyResponse };

/**
 * Wrapper de backendFetch con contexto 'API_PROXY' para las rutas de intenciones.
 */
export async function backendFetch(
  path: string,
  options: Omit<BackendFetchOptions, 'context'> = {},
): Promise<Response> {
  return centralBackendFetch(path, { ...options, context: 'API_PROXY' });
}
