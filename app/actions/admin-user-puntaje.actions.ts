'use server';

import { adjustAdminUserPuntaje } from '@/modules/admin/admin-user-puntaje.service';

/** Ajuste manual del puntaje de fidelización de un usuario (solo admin; el backend lo valida). */
export async function adjustUserPuntajeAction(userId: string, points: number, reason: string) {
  return adjustAdminUserPuntaje(userId, points, reason);
}
