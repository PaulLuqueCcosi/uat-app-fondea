/**
 * Service para el pasaporte de fidelización ("puntaje") de un usuario en admin.
 * OJO: NO confundir con el score crediticio (módulo `scoring`) — ver admin-user-puntaje.types.ts.
 *
 * Endpoints:
 * - GET /api/v1/admin/score/users/{userId}
 * - GET /api/v1/admin/score/users/{userId}/historial
 * - GET /api/v1/score/rangos
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { PageResponse } from './admin-user-detail.types';
import type {
  AdminUserPuntaje,
  AdminUserPuntajeBackend,
  PuntajeTransaction,
  PuntajeTransactionBackend,
  PuntajeRango,
  PuntajeRangoBackend,
} from './admin-user-puntaje.types';

export async function getAdminUserPuntaje(userId: string): Promise<AdminUserPuntaje | null> {
  const res = await backendFetch(`/api/v1/admin/score/users/${userId}`, {
    context: 'ADMIN_USER_PUNTAJE',
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    console.error(`[ADMIN_USER_PUNTAJE] Error ${res.status} al obtener puntaje de usuario ${userId}`);
    return null;
  }

  const raw: AdminUserPuntajeBackend = await res.json();
  return { points: raw.points, maxLoanAmount: raw.maxLoanAmount, categoryName: raw.categoryName };
}

export async function getAdminUserPuntajeHistorial(
  userId: string,
  page: number,
  size: number,
): Promise<PageResponse<PuntajeTransaction>> {
  const empty: PageResponse<PuntajeTransaction> = { content: [], totalElements: 0, totalPages: 0, number: page, size };

  const res = await backendFetch(
    `/api/v1/admin/score/users/${userId}/historial?page=${page}&size=${size}`,
    { context: 'ADMIN_USER_PUNTAJE' },
  );

  if (res.status === 404) return empty;
  if (!res.ok) {
    console.error(`[ADMIN_USER_PUNTAJE] Error ${res.status} al obtener historial de puntaje de usuario ${userId}`);
    return empty;
  }

  const raw = await res.json();
  const content: PuntajeTransactionBackend[] = raw.content ?? [];

  return {
    content: content.map((tx) => ({
      id: tx.id,
      points: tx.points,
      type: tx.type,
      reason: tx.reason,
      referenceId: tx.reference_id,
      createdAt: tx.created_at,
    })),
    totalElements: raw.page?.totalElements ?? raw.totalElements ?? 0,
    totalPages: raw.page?.totalPages ?? raw.totalPages ?? 0,
    number: raw.page?.number ?? raw.number ?? page,
    size: raw.page?.size ?? raw.size ?? size,
  };
}

export async function getPuntajeRangos(): Promise<PuntajeRango[]> {
  const res = await backendFetch('/api/v1/score/rangos', { context: 'ADMIN_USER_PUNTAJE' });

  if (!res.ok) {
    console.error(`[ADMIN_USER_PUNTAJE] Error ${res.status} al obtener rangos de puntaje`);
    return [];
  }

  const raw: PuntajeRangoBackend[] = await res.json();
  return raw.map((r) => ({
    id: r.id,
    categoryName: r.categoryName,
    imageUrl: r.imageUrl,
    minPoints: r.minPoints,
    maxPoints: r.maxPoints,
    maxLoanAmount: r.maxLoanAmount,
  }));
}
