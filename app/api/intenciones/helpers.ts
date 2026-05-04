/**
 * Helper compartido para las API routes de intenciones.
 *
 * Centraliza la obtención del token JWT y el proxy al backend.
 * Todas las rutas /api/intenciones/* usan esto.
 */

import { getAccessToken } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
const RESOURCE    = process.env.LOGTO_API_RESOURCE;

/**
 * Hace un fetch autenticado al backend y devuelve la Response cruda.
 * El caller decide cómo mapear/devolver al cliente.
 */
export async function backendFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const fullUrl = `${BACKEND_URL}${path}`;
  const method  = options.method ?? 'GET';

  console.log(`[API_PROXY] → ${method} ${fullUrl}`);

  const token = await getAccessToken(logtoConfig, RESOURCE);
  if (!token) {
    console.error('[API_PROXY] ⚠️  Sin access token — sesión expirada o resource incorrecto');
    return new Response(JSON.stringify({ error: 'No access token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  console.log(`[API_PROXY] ← ${res.status} ${res.statusText} | ${method} ${fullUrl}`);
  return res;
}

/**
 * Proxy transparente: reenvía la respuesta del backend tal cual al cliente.
 * Preserva status code, headers de content-type, y body.
 */
export async function proxyResponse(backendRes: Response): Promise<Response> {
  const body = await backendRes.text();
  return new Response(body, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
