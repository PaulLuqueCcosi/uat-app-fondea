'use server';

import { unlockUserForm, resetUserFormAttempts, blockUserForm } from '@/modules/admin/admin-user-detail.service';

/**
 * Server Actions para operaciones admin sobre formularios.
 * Se ejecutan en el server — tienen acceso a cookies/sesión para obtener el JWT.
 */

export async function unlockFormAction(userId: string, formType: string) {
  return unlockUserForm(userId, formType);
}

export async function resetAttemptsAction(userId: string, formType: string) {
  return resetUserFormAttempts(userId, formType);
}

export async function blockFormAction(userId: string, formType: string) {
  return blockUserForm(userId, formType);
}
