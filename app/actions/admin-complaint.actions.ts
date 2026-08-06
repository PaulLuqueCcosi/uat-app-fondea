'use server';

import {
  markComplaintInReview,
  respondComplaint,
} from '@/modules/admin/admin-complaints.service';

/**
 * Server Actions para operaciones admin sobre el Libro de Reclamaciones (M4 / R32).
 */

export async function markComplaintInReviewAction(id: string) {
  return markComplaintInReview(id);
}

export async function respondComplaintAction(id: string, responseText: string) {
  return respondComplaint(id, responseText);
}
