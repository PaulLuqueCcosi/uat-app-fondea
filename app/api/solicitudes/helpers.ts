/**
 * Helpers compartidos para las API routes de solicitudes.
 * Proxy transparente al backend Java y al microservicio de contratos.
 */

import { backendFetch as centralBackendFetch, proxyResponse, type BackendFetchOptions } from '@/lib/backend-fetch';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

export { proxyResponse };

const CONTRATOS_URL = process.env.CONTRATOS_API_URL ?? 'http://localhost:8081';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

/**
 * Fetch autenticado al backend principal (solicitudes, documentos).
 */
export async function backendFetch(
  path: string,
  options: Omit<BackendFetchOptions, 'context'> = {},
): Promise<Response> {
  return centralBackendFetch(path, { ...options, context: 'API_SOLICITUDES' });
}

/**
 * Fetch autenticado al microservicio de contratos.
 */
export async function contractsFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const fullUrl = `${CONTRATOS_URL}${path}`;

  let token: string | undefined;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch {
    return new Response(JSON.stringify({ error: 'token_error' }), { status: 401 });
  }

  if (!token) {
    return new Response(JSON.stringify({ error: 'no_token' }), { status: 401 });
  }

  try {
    return await fetch(fullUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> ?? {}),
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'network_error' }), { status: 503 });
  }
}

/**
 * Proxy transparente para el microservicio de contratos.
 * Devuelve la respuesta tal cual (incluyendo HTML o JSON).
 */
export async function proxyContractsResponse(res: Response, contentType?: string): Promise<Response> {
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { 'Content-Type': contentType ?? res.headers.get('Content-Type') ?? 'application/json' },
  });
}
