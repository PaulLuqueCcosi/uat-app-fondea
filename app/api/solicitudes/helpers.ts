/**
 * Helpers compartidos para las API routes de solicitudes.
 * Proxy transparente al backend Java.
 */

import { backendFetch as centralBackendFetch, proxyResponse, type BackendFetchOptions } from '@/lib/backend-fetch';

export { proxyResponse };

/**
 * Fetch autenticado al backend principal (solicitudes, documentos, contratos).
 */
export async function backendFetch(
  path: string,
  options: Omit<BackendFetchOptions, 'context'> = {},
): Promise<Response> {
  return centralBackendFetch(path, { ...options, context: 'API_SOLICITUDES' });
}
