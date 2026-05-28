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

export type { IntencionConfig };

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

// ── POST /api/intenciones/{id}/register ──────────────────────────────────────

export type RegisterResult =
  | { ok: true; data: IntencionConfig }
  | { ok: false; code: 'NOT_FOUND' | 'USER_NOT_SYNCED' | 'ERROR' };

export async function registerIntencion(calcId: string): Promise<RegisterResult> {
  if (!calcId?.trim()) return { ok: false, code: 'ERROR' };
  const res = await fetch(`/api/intenciones/${calcId}/register`, { 
    method: 'POST',
    cache: 'no-store'
  });
  if (res.status === 404) return { ok: false, code: 'NOT_FOUND' };

  // 425 Too Early — el usuario aún no fue sincronizado en el backend
  if (res.status === 425) {
    return { ok: false, code: 'USER_NOT_SYNCED' };
  }

  if (!res.ok) {
    console.error('[intencion-api] register →', res.status, await res.text());
    return { ok: false, code: 'ERROR' };
  }
  return { ok: true, data: mapIntencionFromBackend(await res.json()) };
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
