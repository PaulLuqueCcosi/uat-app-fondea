/**
 * Service de Solicitudes.
 *
 * GET /api/v1/applications → devuelve todas las solicitudes del usuario.
 * Un usuario tiene como mucho ~20 solicitudes, no requiere paginación server-side.
 * Filtros, búsqueda y paginación se manejan en el cliente con TanStack Table.
 */

import type { Result } from '@/modules/shared/result';
import { backendFetch } from '@/lib/backend-fetch';
import type { ApplicationRecord } from './application.types';
import type { ApplicationError } from './application.errors';
import { errors } from './application.errors';
import { mapApplicationFromBackend } from './application.mapper';

type AppResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: ApplicationError }
);

// ── GET: Todas las solicitudes del usuario ────────────────────────────────────

export async function getApplications(): Promise<AppResult<ApplicationRecord[]>> {
  try {
    const res = await backendFetch('/api/v1/applications', { context: 'APPLICATIONS' });

    if (res.status === 401) {
      return { ok: false, error: errors.sessionExpired() };
    }

    if (res.status === 404) {
      return { ok: true, data: [] };
    }

    if (res.status >= 500) {
      return { ok: false, error: errors.serverError(res.status) };
    }

    if (!res.ok) {
      return { ok: false, error: errors.unavailable(`HTTP ${res.status}`) };
    }

    const raw = await res.json();
    const applications = (raw.applications ?? raw.content ?? raw)
      .map(mapApplicationFromBackend);

    return { ok: true, data: applications };
  } catch (err) {
    console.error('[APPLICATIONS] getApplications → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}
