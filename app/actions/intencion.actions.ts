'use server';

/**
 * INTENCION ACTIONS — Estandarizado con ApiResult<T>
 *
 * Todas las funciones retornan ApiResult<T>:
 * - { ok: true, data: T }     → éxito
 * - { ok: false, error: {...} } → error con mensaje, categoría, fields, meta
 *
 * Para GET que pueden no encontrar datos (404):
 * - { ok: true, data: null }  → "no tiene" es un dato válido, no un error
 *
 * El frontend siempre puede hacer:
 *   if (!result.ok) { showError(result.error.message); return; }
 *   // usar result.data con seguridad
 */

import { IntencionConfig } from '@/lib/types';
import { backendFetch } from '@/lib/backend-fetch';
import { mapIntencionFromBackend } from '@/lib/mappers/intencion.mapper';
import { parseResponse, apiNetworkError } from '@/lib/api-result';
import type { ApiResult } from '@/lib/api-result';

// ── GET: Intención activa ─────────────────────────────────────────────────────

/**
 * Obtiene la intención activa del usuario.
 * - ok + data: IntencionConfig → tiene intención activa
 * - ok + data: null → no tiene intención activa (404 es dato válido)
 * - !ok → error real (500, 401, network)
 */
export async function getActiveIntencion(): Promise<ApiResult<IntencionConfig | null>> {
  try {
    const res = await backendFetch('/api/v1/intentions/active', { context: 'INTENCION' });

    // 404 = sin intención activa — NO es un error, es un estado válido
    if (res.status === 404) {
      return { ok: true, data: null };
    }

    if (!res.ok) {
      return parseResponse<IntencionConfig | null>(res, 'intención');
    }

    const data = await res.json();
    return { ok: true, data: mapIntencionFromBackend(data) };

  } catch (error) {
    console.error('[INTENCION] getActiveIntencion → network error:', error);
    return apiNetworkError();
  }
}

// ── POST: Registrar intención de la landing ───────────────────────────────────

/**
 * Registra una intención de la landing al usuario autenticado.
 * - ok + data: IntencionConfig → registrada o ya existente
 * - !ok → error (404 = ID no existe, 401 = sesión expirada, etc.)
 */
export async function registerIntencion(intencionId: string): Promise<ApiResult<IntencionConfig>> {
  if (!intencionId?.trim()) {
    return {
      ok: false,
      error: {
        category: 'validation',
        message: 'ID de intención vacío.',
        status: 0,
      },
    };
  }

  try {
    const res = await backendFetch(`/api/v1/intentions/${intencionId}/register`, {
      method: 'POST',
      context: 'INTENCION',
    });

    if (!res.ok) {
      return parseResponse<IntencionConfig>(res, 'intención');
    }

    const data = await res.json();
    return { ok: true, data: mapIntencionFromBackend(data) };

  } catch (error) {
    console.error('[INTENCION] registerIntencion → network error:', error);
    return apiNetworkError();
  }
}

// ── POST: Crear intención desde calculadora interna ───────────────────────────

/**
 * Crea una nueva intención.
 * - ok + data: IntencionConfig → creada
 * - !ok → error (422 = datos inválidos, 401 = sesión, etc.)
 */
export async function createIntencion(
  amount: number,
  termDays: number,
  installmentCount: number,
): Promise<ApiResult<IntencionConfig>> {
  const productId = process.env.NEXT_PUBLIC_PRODUCT_ID;
  if (!productId) {
    return {
      ok: false,
      error: {
        category: 'server',
        message: 'Error de configuración del servidor. Contacta a soporte.',
        status: 0,
      },
    };
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

    if (!res.ok) {
      return parseResponse<IntencionConfig>(res, 'intención');
    }

    const data = await res.json();
    return { ok: true, data: mapIntencionFromBackend(data) };

  } catch (error) {
    console.error('[INTENCION] createIntencion → network error:', error);
    return apiNetworkError();
  }
}

// ── PUT: Actualizar intención ─────────────────────────────────────────────────

/**
 * Actualiza monto/plazo/cuotas.
 * - ok + data: IntencionConfig → actualizada
 * - !ok → error (409 = bloqueada, 404 = no existe, etc.)
 */
export async function updateIntencion(
  intencionId: string,
  amount: number,
  termDays: number,
  installmentCount: number,
): Promise<ApiResult<IntencionConfig>> {
  try {
    const res = await backendFetch(`/api/v1/intentions/${intencionId}`, {
      method: 'PUT',
      context: 'INTENCION',
      body: JSON.stringify({ amount, termDays, installmentCount }),
    });

    if (!res.ok) {
      return parseResponse<IntencionConfig>(res, 'intención');
    }

    const data = await res.json();
    return { ok: true, data: mapIntencionFromBackend(data) };

  } catch (error) {
    console.error('[INTENCION] updateIntencion → network error:', error);
    return apiNetworkError();
  }
}

// ── DELETE: Cancelar intención ────────────────────────────────────────────────

/**
 * Cancela (soft delete) una intención.
 * - ok → cancelada exitosamente
 * - !ok → error (409 = bloqueada, 404 = no existe)
 */
export async function deleteIntencion(intencionId: string): Promise<ApiResult<void>> {
  try {
    const res = await backendFetch(`/api/v1/intentions/${intencionId}`, {
      method: 'DELETE',
      context: 'INTENCION',
    });

    if (!res.ok) {
      return parseResponse<void>(res, 'intención');
    }

    return { ok: true, data: undefined };

  } catch (error) {
    console.error('[INTENCION] deleteIntencion → network error:', error);
    return apiNetworkError();
  }
}

// ── GET: Intención por ID ─────────────────────────────────────────────────────

/**
 * Obtiene una intención por ID, o la activa si se pasa 'active'.
 * - ok + data: IntencionConfig → encontrada
 * - ok + data: null → no existe (404)
 * - !ok → error real
 */
export async function getIntencionConfig(intencionId: string): Promise<ApiResult<IntencionConfig | null>> {
  if (intencionId === 'active') {
    return getActiveIntencion();
  }

  if (!intencionId?.trim()) {
    return {
      ok: false,
      error: {
        category: 'validation',
        message: 'ID de intención vacío.',
        status: 0,
      },
    };
  }

  try {
    const res = await backendFetch(`/api/v1/intentions/${intencionId}`, { context: 'INTENCION' });

    if (res.status === 404) {
      return { ok: true, data: null };
    }

    if (!res.ok) {
      return parseResponse<IntencionConfig | null>(res, 'intención');
    }

    const data = await res.json();
    return { ok: true, data: mapIntencionFromBackend(data) };

  } catch (error) {
    console.error('[INTENCION] getIntencionConfig → network error:', error);
    return apiNetworkError();
  }
}
