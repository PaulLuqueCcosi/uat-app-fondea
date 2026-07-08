/**
 * Service para listar usuarios desde el admin.
 * Usa backendFetch (JWT con ROLE_ADMIN requerido en backend).
 */

import { backendFetch } from '@/lib/backend-fetch';
import { mapUserFromBackend } from './admin-users.mapper';
import type {
  AdminUserSummaryBackend,
  AdminUsersResult,
  SpringPage,
} from './admin-users.types';

/**
 * Lista usuarios paginados desde el backend admin.
 *
 * Backend espera page 0-based, frontend usa 1-based.
 * Si search está presente, el backend filtra por nombre/documento.
 */
export async function getAdminUsers(
  page: number,
  pageSize: number,
  search?: string,
): Promise<AdminUsersResult> {
  // Frontend envía page 1-based → backend espera 0-based
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: String(backendPage),
    size: String(pageSize),
  });

  if (search?.trim()) {
    params.set('search', search.trim());
  }

  const res = await backendFetch(`/api/v1/admin/users?${params.toString()}`, {
    context: 'ADMIN_USERS',
  });

  if (!res.ok) {
    console.error(`[ADMIN_USERS] Error ${res.status} al listar usuarios`);
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
    };
  }

  const body: SpringPage<AdminUserSummaryBackend> = await res.json();

  return {
    data: body.content.map(mapUserFromBackend),
    pagination: {
      page,
      pageSize: body.size,
      totalItems: body.totalElements,
      totalPages: body.totalPages,
    },
  };
}
