'use server';

import {
  recalculateUserScore,
  consultUserBuro,
} from '@/modules/admin/admin-user-score.service';

/**
 * Server Actions para operaciones admin sobre el score interno y el buró de un usuario.
 * Se ejecutan en el server — tienen acceso a cookies/sesión para obtener el JWT.
 */

export async function recalculateScoreAction(userId: string) {
  return recalculateUserScore(userId);
}

export async function consultBuroAction(userId: string) {
  return consultUserBuro(userId);
}
