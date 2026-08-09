'use server';

import { requestNpsResubmission } from '@/modules/admin/admin-nps.service';

/** Server Action para pedirle a un usuario que vuelva a responder NPS (admin). */
export async function requestNpsResubmissionAction(userId: string) {
  return requestNpsResubmission(userId);
}
