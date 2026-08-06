'use server';

import {
  addAdminComplaintHoliday,
  removeAdminComplaintHoliday,
} from '@/modules/admin/admin-complaint-holidays.service';
import type { AddHolidayRequest } from '@/modules/admin/admin-complaint-holidays.types';

/**
 * Server Actions para el calendario de feriados del Libro de Reclamaciones (M4 / R32).
 */

export async function addComplaintHolidayAction(request: AddHolidayRequest) {
  return addAdminComplaintHoliday(request);
}

export async function removeComplaintHolidayAction(id: string) {
  return removeAdminComplaintHoliday(id);
}
