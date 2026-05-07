'use server';

import { IntencionConfig } from '@/lib/types';
import { backendFetch } from '@/lib/backend-fetch';
import { mapIntencionFromBackend } from '@/lib/mappers/intencion.mapper';

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
    const res = await backendFetch('/api/v1/intentions/active', { context: 'INTENCION' });

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
    return mapIntencionFromBackend(data);

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
      context: 'INTENCION',
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
    return mapIntencionFromBackend(data);

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
      context: 'INTENCION',
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
    return mapIntencionFromBackend(data);

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
      context: 'INTENCION',
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
    return mapIntencionFromBackend(data);

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
      context: 'INTENCION',
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
    const res = await backendFetch(`/api/v1/intentions/${intencionId}`, { context: 'INTENCION' });

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
    return mapIntencionFromBackend(data);

  } catch (error) {
    console.error('[INTENCION] getIntencionConfig → network error:', error);
    return null;
  }
}
