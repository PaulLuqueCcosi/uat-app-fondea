/**
 * Cliente de intenciones — llama a las API routes locales (/api/intenciones/...).
 *
 * Estas rutas son proxies autenticados al backend real.
 * Al ser fetch normales, las respuestas son visibles en la pestaña Network
 * del navegador, lo que facilita el debug.
 *
 * Para server components que necesiten datos en el render inicial,
 * seguir usando las server actions de app/actions/intencion.actions.ts.
 */

import type { IntencionConfig } from './types';

// ── Mapeo ────────────────────────────────────────────────────────────────────

function mapToConfig(data: Record<string, unknown>): IntencionConfig {
  return {
    intencionId:           data.id as string,
    productId:             data.productId as string,
    amount:                data.amount as number,
    termDays:              data.termDays as number,
    installmentCount:      data.installmentCount as number,
    isFirstLoan:           data.isFirstLoan as boolean,
    status:                data.status as string,
    calculatorIntentionId: data.calculatorIntentionId as string,
    createdAt:             data.createdAt as string,
    updatedAt:             data.updatedAt as string,
  };
}

// ── GET /api/intenciones/active ──────────────────────────────────────────────

export async function getActiveIntencion(): Promise<IntencionConfig | null> {
  const res = await fetch('/api/intenciones/active');
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error('[intencion-api] getActive →', res.status, await res.text());
    return null;
  }
  return mapToConfig(await res.json());
}

// ── GET /api/intenciones/{id} ────────────────────────────────────────────────

export async function getIntencionById(id: string): Promise<IntencionConfig | null> {
  if (!id?.trim()) return null;
  const res = await fetch(`/api/intenciones/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error('[intencion-api] getById →', res.status, await res.text());
    return null;
  }
  return mapToConfig(await res.json());
}

/**
 * Obtiene una intención por ID o la activa si se pasa 'active'.
 */
export async function getIntencionConfig(idOrActive: string): Promise<IntencionConfig | null> {
  if (idOrActive === 'active') return getActiveIntencion();
  return getIntencionById(idOrActive);
}

// ── POST /api/intenciones/{id}/register ──────────────────────────────────────

export async function registerIntencion(calcId: string): Promise<IntencionConfig | null> {
  if (!calcId?.trim()) return null;
  const res = await fetch(`/api/intenciones/${calcId}/register`, { method: 'POST' });
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error('[intencion-api] register →', res.status, await res.text());
    return null;
  }
  return mapToConfig(await res.json());
}

// ── POST /api/intenciones ────────────────────────────────────────────────────

export async function createIntencion(
  amount: number,
  termDays: number,
  installmentCount: number,
): Promise<IntencionConfig | null> {
  const res = await fetch('/api/intenciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, termDays, installmentCount }),
  });
  if (!res.ok) {
    console.error('[intencion-api] create →', res.status, await res.text());
    return null;
  }
  return mapToConfig(await res.json());
}

// ── PUT /api/intenciones/{id} ────────────────────────────────────────────────

export async function updateIntencion(
  id: string,
  amount: number,
  termDays: number,
  installmentCount: number,
): Promise<IntencionConfig | null> {
  const res = await fetch(`/api/intenciones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, termDays, installmentCount }),
  });
  if (res.status === 409) return null; // locked
  if (!res.ok) {
    console.error('[intencion-api] update →', res.status, await res.text());
    return null;
  }
  return mapToConfig(await res.json());
}

// ── DELETE /api/intenciones/{id} ─────────────────────────────────────────────

export async function deleteIntencion(id: string): Promise<boolean> {
  const res = await fetch(`/api/intenciones/${id}`, { method: 'DELETE' });
  if (res.status === 409 || res.status === 404) return false;
  return res.status === 204 || res.ok;
}
