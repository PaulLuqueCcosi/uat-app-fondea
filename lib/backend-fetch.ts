/**
 * BACKEND FETCH — Cliente HTTP autenticado centralizado
 *
 * Unico punto de contacto con el backend Java.
 * Obtiene el JWT de Logto, lo inyecta, y loguea todo.
 *
 * Usado por:
 * - Server actions (app/actions/*.ts)
 * - API routes (app/api/ route handlers)
 */

import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

// ── Config ────────────────────────────────────────────────────────────────────

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
const RESOURCE    = process.env.LOGTO_API_RESOURCE;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface BackendFetchOptions extends RequestInit {
  /** Contexto para los logs — ej: 'INTENCION', 'KYC', 'LABOR' */
  context?: string;
}

// ── Implementación ────────────────────────────────────────────────────────────

/**
 * Fetch autenticado al backend.
 *
 * 1. Obtiene el access token de Logto (con el resource/audience correcto)
 * 2. Inyecta el Bearer token en el header
 * 3. Loguea request y response con contexto
 * 4. Si no hay token, retorna una Response sintética 401
 *
 * @param path - Ruta relativa al backend (ej: '/api/v1/intentions/active')
 * @param options - Opciones de fetch + contexto para logs
 * @returns Response del backend (o sintética si falla el token)
 */
export async function backendFetch(
  path: string,
  options: BackendFetchOptions = {},
): Promise<Response> {
  const { context = 'BACKEND', headers: extraHeaders, ...fetchOptions } = options;
  const method  = fetchOptions.method ?? 'GET';
  const fullUrl = `${BACKEND_URL}${path}`;
  const tag     = `[${context}]`;

  // 1. Log del request
  console.log(`${tag} → ${method} ${path}`);

  // 2. Obtener token
  let token: string | undefined;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch (err) {
    console.error(`${tag} ❌ Error al obtener access token:`, err instanceof Error ? err.message : err);
    return syntheticResponse(401, { error: 'token_error', detail: 'No se pudo obtener el access token' });
  }

  if (!token) {
    console.warn(`${tag} ⚠️  Token vacío — sesión expirada o LOGTO_API_RESOURCE incorrecto`);
    console.warn(`${tag}    LOGTO_API_RESOURCE="${RESOURCE}" | BACKEND_API_URL="${BACKEND_URL}"`);
    return syntheticResponse(401, { error: 'no_token', detail: 'Sesión expirada' });
  }

  // 3. Hacer el fetch
  const startMs = Date.now();
  let res: Response;

  // Si el body es FormData, no setear Content-Type (fetch lo pone con boundary)
  const isFormData = fetchOptions.body instanceof FormData;
  const defaultHeaders: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  };
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  try {
    res = await fetch(fullUrl, {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...(extraHeaders as Record<string, string> ?? {}),
      },
    });
  } catch (err) {
    const elapsed = Date.now() - startMs;
    console.error(`${tag} ❌ Network error (${elapsed}ms):`, err instanceof Error ? err.message : err);
    return syntheticResponse(0, { error: 'network_error', detail: 'No se pudo conectar al backend' });
  }

  // 4. Log de la respuesta
  const elapsed = Date.now() - startMs;
  const emoji   = res.ok ? '✅' : '⚠️';
  console.log(`${tag} ← ${emoji} ${res.status} ${res.statusText} (${elapsed}ms)`);

  // Log extra para errores del backend (sin consumir el body)
  if (!res.ok && res.status >= 400) {
    // Clonar para poder leer el body sin consumirlo
    const clone = res.clone();
    try {
      const errorBody = await clone.text();
      if (errorBody) {
        console.warn(`${tag}    Body: ${errorBody.slice(0, 500)}`);
      }
    } catch { /* ignorar si no se puede leer */ }
  }

  return res;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Crea una Response sintética para cuando no se puede contactar al backend.
 * Útil para errores de token o network.
 */
function syntheticResponse(status: number, body: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status: status || 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Proxy transparente: reenvía la respuesta del backend tal cual al cliente.
 * Para usar en API routes que solo hacen proxy.
 */
export async function proxyResponse(backendRes: Response): Promise<Response> {
  const body = await backendRes.text();
  return new Response(body, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
