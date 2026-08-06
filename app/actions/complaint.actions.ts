'use server';

/**
 * Server Actions de Reclamaciones — thin wrappers con autenticación.
 */

import { requireValidSession } from './auth.actions';
import * as complaintService from '@/modules/complaints/complaint.service';
import type { SubmitComplaintRequest } from '@/modules/complaints';

/** Mis reclamaciones — paginado (Spring Page<T>) */
export async function getMyComplaintsAction(page = 1, pageSize = 10) {
  await requireValidSession();
  return complaintService.getMyComplaints(page, pageSize);
}

/** Detalle de un reclamo */
export async function getMyComplaintByIdAction(id: string) {
  await requireValidSession();
  return complaintService.getMyComplaintById(id);
}

/** Registrar un reclamo nuevo */
export async function submitComplaintAction(request: SubmitComplaintRequest) {
  await requireValidSession();
  return complaintService.submitComplaint(request);
}
