'use server';

import { getAccessToken } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import { IntencionConfig } from '@/lib/types';

// ── Helper: fetch autenticado al backend ──────────────────────────────────────

async function backendFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const resource = process.env.LOGTO_API_RESOURCE;
  const baseUrl  = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
  const fullUrl  = `${baseUrl}${path}`;
  const method   = options.method ?? 'GET';

  console.log(`[BACKEND_FETCH] → ${method} ${fullUrl}`);
  console.log(`[BACKEND_FETCH] LOGTO_API_RESOURCE="${resource}" | BACKEND_API_URL="${baseUrl}"`);

  let token: string | undefined;
  try {
    token = await getAccessToken(logtoConfig, resource);
    if (!token) {
      console.error('[BACKEND_FETCH] ⚠️  getAccessToken devolvió undefined/null — ¿sesión expirada o resource incorrecto?');
    } else {
      // Loguear solo los primeros 40 chars para no exponer el JWT completo
      console.log(`[BACKEND_FETCH] token obtenido: ${token.slice(0, 40)}...`);
    }
  } catch (tokenError) {
    console.error('[BACKEND_FETCH] ❌ Error al obtener access token:', tokenError);
    throw tokenError;
  }

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  console.log(`[BACKEND_FETCH] ← ${res.status} ${res.statusText} | ${method} ${fullUrl}`);

  return res;
}

// ── Mapeo respuesta backend → IntencionConfig ─────────────────────────────────

function mapToConfig(data: any): IntencionConfig {
  return {
    intencionId:            data.id,
    productId:              data.productId,
    amount:                 data.amount,
    termDays:               data.termDays,
    installmentCount:       data.installmentCount,
    isFirstLoan:            data.isFirstLoan,
    status:                 data.status,
    calculatorIntentionId:  data.calculatorIntentionId,
    createdAt:              data.createdAt,
    updatedAt:              data.updatedAt,
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * Obtiene la intención activa del usuario autenticado.
 * Retorna null si no tiene ninguna (404).
 *
 * GET /api/v1/intentions/active
 */
export async function getActiveIntencion(): Promise<IntencionConfig | null> {
  console.log('[INTENCION] getActiveIntencion → consultando backend...');
  try {
    const res = await backendFetch('/api/v1/intentions/active');

    if (res.status === 404) {
      console.log('[INTENCION] getActiveIntencion → 404: sin intención activa');
      return null;
    }

    if (!res.ok) {
      let errorBody = '(sin body)';
      try { errorBody = await res.text(); } catch {}
      console.error(`[INTENCION] getActiveIntencion → error ${res.status}:`, errorBody);
      return null;
    }

    const data = await res.json();
    console.log('[INTENCION] getActiveIntencion → ✅ encontrada:', { id: data.id, status: data.status });
    return mapToConfig(data);

  } catch (error) {
    console.error('[INTENCION] getActiveIntencion → network error:', error);
    return null;
  }
}

/**
 * Registra una intención existente (generada en la landing) al usuario autenticado.
 * Si ya existe para ese usuario, la retorna sin duplicar (200).
 * Si es nueva, la crea y retorna (201).
 * Si el ID no existe en el sistema, retorna null (404).
 *
 * POST /api/v1/intentions/{calcId}/register
 */
export async function registerIntencion(intencionId: string): Promise<IntencionConfig | null> {
  if (!intencionId?.trim()) {
    console.warn('[INTENCION] registerIntencion → intencionId vacío, abortando');
    return null;
  }

  console.log('[INTENCION] registerIntencion → iniciando para ID:', intencionId);

  try {
    const res = await backendFetch(`/api/v1/intentions/${intencionId}/register`, {
      method: 'POST',
    });

    if (res.status === 404) {
      console.warn('[INTENCION] registerIntencion → 404: ID no existe en el sistema:', intencionId);
      return null;
    }

    if (!res.ok) {
      // Leer el body del error para saber qué devuelve el backend
      let errorBody = '(sin body)';
      try { errorBody = await res.text(); } catch {}
      console.error(`[INTENCION] registerIntencion → error ${res.status}:`, errorBody);
      return null;
    }

    const data = await res.json();
    const isNew = res.status === 201;
    console.log(`[INTENCION] registerIntencion → ✅ ${isNew ? 'NUEVA (201)' : 'EXISTENTE (200)'}`, {
      id: data.id,
      amount: data.amount,
      installmentCount: data.installmentCount,
      status: data.status,
    });
    return mapToConfig(data);

  } catch (error) {
    console.error('[INTENCION] registerIntencion → network error:', error);
    return null;
  }
}

/**
 * Crea una nueva intención desde la calculadora interna.
 * Si el usuario ya tiene una activa, el backend la reemplaza (REPLACED).
 *
 * POST /api/v1/intentions
 *
 * El backend requiere productId e isFirstLoan en el body.
 * productId se lee de NEXT_PUBLIC_PRODUCT_ID (misma variable que usa la calculadora pública).
 */
export async function createIntencion(
  amount: number,
  termDays: number,
  installmentCount: number,
): Promise<IntencionConfig | null> {
  const productId = process.env.NEXT_PUBLIC_PRODUCT_ID;
  if (!productId) {
    console.error('[INTENCION] createIntencion → NEXT_PUBLIC_PRODUCT_ID no está configurado');
    return null;
  }

  try {
    const res = await backendFetch('/api/v1/intentions', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        amount,
        termDays,
        installmentCount,
        isFirstLoan: true,
      }),
    });

    if (res.status === 422) {
      const err = await res.json();
      console.error('[INTENCION] createIntencion validación fallida:', err);
      return null;
    }

    if (!res.ok) {
      console.error('[INTENCION] createIntencion error →', res.status);
      return null;
    }

    const data = await res.json();
    console.log('[INTENCION] createIntencion → created:', data.id);
    return mapToConfig(data);

  } catch (error) {
    console.error('[INTENCION] createIntencion network error:', error);
    return null;
  }
}

/**
 * Actualiza el monto, plazo y cuotas de una intención existente.
 * Retorna null si está bloqueada (409) o no existe (404).
 *
 * PUT /api/v1/intentions/{id}
 */
export async function updateIntencion(
  intencionId: string,
  amount: number,
  termDays: number,
  installmentCount: number,
): Promise<IntencionConfig | null> {
  try {
    const res = await backendFetch(`/api/v1/intentions/${intencionId}`, {
      method: 'PUT',
      body: JSON.stringify({ amount, termDays, installmentCount }),
    });

    if (res.status === 409) {
      console.warn('[INTENCION] updateIntencion → intención bloqueada (solicitud enviada)');
      return null;
    }

    if (!res.ok) {
      console.error('[INTENCION] updateIntencion error →', res.status);
      return null;
    }

    const data = await res.json();
    console.log('[INTENCION] updateIntencion → updated:', data.id);
    return mapToConfig(data);

  } catch (error) {
    console.error('[INTENCION] updateIntencion network error:', error);
    return null;
  }
}

/**
 * Cancela (soft delete) una intención.
 * Retorna false si está bloqueada (409) o no existe (404).
 *
 * DELETE /api/v1/intentions/{id}
 */
export async function deleteIntencion(intencionId: string): Promise<boolean> {
  try {
    const res = await backendFetch(`/api/v1/intentions/${intencionId}`, {
      method: 'DELETE',
    });

    if (res.status === 409) {
      console.warn('[INTENCION] deleteIntencion → intención bloqueada (solicitud enviada)');
      return false;
    }

    if (res.status === 404) {
      console.warn('[INTENCION] deleteIntencion → no encontrada:', intencionId);
      return false;
    }

    console.log('[INTENCION] deleteIntencion → cancelled:', intencionId);
    return res.status === 204;

  } catch (error) {
    console.error('[INTENCION] deleteIntencion network error:', error);
    return false;
  }
}

/**
 * Obtiene la config de una intención por ID.
 * Si se pasa 'active', retorna la intención activa del usuario.
 *
 * GET /api/v1/intentions/{id}
 * GET /api/v1/intentions/active
 */
export async function getIntencionConfig(intencionId: string): Promise<IntencionConfig | null> {
  if (intencionId === 'active') {
    return getActiveIntencion();
  }

  if (!intencionId?.trim()) {
    console.warn('[INTENCION] getIntencionConfig → intencionId vacío');
    return null;
  }

  console.log('[INTENCION] getIntencionConfig → buscando ID:', intencionId);

  try {
    const res = await backendFetch(`/api/v1/intentions/${intencionId}`);

    if (res.status === 404) {
      console.log('[INTENCION] getIntencionConfig → 404: no encontrada:', intencionId);
      return null;
    }

    if (!res.ok) {
      let errorBody = '(sin body)';
      try { errorBody = await res.text(); } catch {}
      console.error(`[INTENCION] getIntencionConfig → error ${res.status}:`, errorBody);
      return null;
    }

    const data = await res.json();
    console.log('[INTENCION] getIntencionConfig → ✅ encontrada:', { id: data.id, status: data.status });
    return mapToConfig(data);

  } catch (error) {
    console.error('[INTENCION] getIntencionConfig → network error:', error);
    return null;
  }
}
