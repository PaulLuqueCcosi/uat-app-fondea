/**
 * Service para los datos de autenticación de un usuario en admin.
 *
 * Endpoint: GET /api/v1/admin/users/{userId}/auth
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { AdminUserAuth } from './admin-user-auth.types';

export async function getAdminUserAuth(userId: string): Promise<AdminUserAuth | null> {
  const res = await backendFetch(`/api/v1/admin/users/${userId}/auth`, {
    context: 'ADMIN_USER_AUTH',
  });

  if (!res.ok) {
    console.error(`[ADMIN_USER_AUTH] Error ${res.status} al obtener datos de autenticación de usuario ${userId}`);
    return null;
  }

  return res.json();
}
