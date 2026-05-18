/**
 * CALCULATOR FETCH — Cliente HTTP para el servicio de calculadora
 *
 * Servidor separado del backend principal. No usa JWT de Logto.
 * Opcionalmente envía X-API-Key si está configurado.
 *
 * Usado por:
 * - app/api/calculadora/options/route.ts
 * - app/api/calculadora/simulate/route.ts
 */

// ── Config ────────────────────────────────────────────────────────────────────

const CALCULATOR_URL = process.env.CALCULATOR_API_URL ?? 'http://localhost:8080';
const CALCULATOR_KEY = process.env.CALCULATOR_API_KEY;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface CalculatorFetchOptions extends RequestInit {
  /** Contexto para los logs — ej: 'OPTIONS', 'SIMULATE' */
  context?: string;
}

// ── Implementación ────────────────────────────────────────────────────────────

/**
 * Fetch al servicio de calculadora.
 *
 * 1. Construye la URL completa con CALCULATOR_API_URL
 * 2. Si CALCULATOR_API_KEY está configurado, lo envía como X-API-Key
 * 3. Loguea request y response con contexto
 *
 * @param path - Ruta relativa (ej: '/api/products/{id}/options')
 * @param options - Opciones de fetch + contexto para logs
 * @returns Response del servidor de calculadora
 */
export async function calculatorFetch(
  path: string,
  options: CalculatorFetchOptions = {},
): Promise<Response> {
  const { context = 'CALCULATOR', headers: extraHeaders, ...fetchOptions } = options;
  const method  = fetchOptions.method ?? 'GET';
  const fullUrl = `${CALCULATOR_URL}${path}`;
  const tag     = `[${context}]`;

  console.log(method, fullUrl, tag)
  // 1. Log del request
  console.log(`${tag} → ${fullUrl} -> ${path}`);

  // 2. Construir headers
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // API Key opcional
  if (CALCULATOR_KEY) {
    defaultHeaders['X-API-Key'] = CALCULATOR_KEY;
  }

  // 3. Hacer el fetch
  const startMs = Date.now();
  let res: Response;

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
    return new Response(
      JSON.stringify({ error: 'network_error', detail: 'No se pudo conectar al servicio de calculadora' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 4. Log de la respuesta
  const elapsed = Date.now() - startMs;
  const emoji   = res.ok ? '✅' : '⚠️';
  console.log(`${tag} ← ${emoji} ${res.status} ${res.statusText} (${elapsed}ms)`);

  if (!res.ok && res.status >= 400) {
    const clone = res.clone();
    try {
      const errorBody = await clone.text();
      if (errorBody) {
        console.warn(`${tag}    Body: ${errorBody.slice(0, 500)}`);
      }
    } catch { /* ignorar */ }
  }

  return res;
}
