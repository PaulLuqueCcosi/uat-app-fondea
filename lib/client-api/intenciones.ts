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

import type { IntencionConfig } from '../types';
import { mapIntencionFromBackend } from '../mappers/intencion.mapper';

// ── GET /api/intenciones/active ──────────────────────────────────────────────

export async function getActiveIntencion(): Promise<IntencionConfig | null> {
  const res = await fetch('/api/intenciones/active', { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error('[intencion-api] getActive →', res.status, await res.text());
    return null;
  }
  return mapIntencionFromBackend(await res.json());
}

// ── GET /api/intenciones/{id} ────────────────────────────────────────────────

export async function getIntencionById(id: string): Promise<IntencionConfig | null> {
  if (!id?.trim()) return null;
  const res = await fetch(`/api/intenciones/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error('[intencion-api] getById →', res.status, await res.text());
    return null;
  }
  return mapIntencionFromBackend(await res.json());
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
  const res = await fetch(`/api/intenciones/${calcId}/register`, { 
    method: 'POST',
    cache: 'no-store'
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error('[intencion-api] register →', res.status, await res.text());
    return null;
  }
  return mapIntencionFromBackend(await res.json());
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
    cache: 'no-store'
  });
  if (!res.ok) {
    console.error('[intencion-api] create →', res.status, await res.text());
    return null;
  }
  return mapIntencionFromBackend(await res.json());
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
    cache: 'no-store'
  });
  if (res.status === 409) return null; // locked
  if (!res.ok) {
    console.error('[intencion-api] update →', res.status, await res.text());
    return null;
  }
  return mapIntencionFromBackend(await res.json());
}

// ── DELETE /api/intenciones/{id} ─────────────────────────────────────────────

export async function deleteIntencion(id: string): Promise<boolean> {
  const res = await fetch(`/api/intenciones/${id}`, { 
    method: 'DELETE',
    cache: 'no-store'
  });
  if (res.status === 409 || res.status === 404) return false;
  return res.status === 204 || res.ok;
}
