/**
 * Service para el sistema de referidos de un usuario en admin.
 *
 * Endpoint: GET /api/v1/admin/users/{userId}/referrals
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { AdminReferralOverview, AdminReferralOverviewBackend } from './admin-user-referrals.types';

function mapOverview(raw: AdminReferralOverviewBackend): AdminReferralOverview {
  return {
    code: raw.code,
    totalReferred: raw.total_referred,
    totalCompleted: raw.total_completed,
    referredBy: raw.referred_by
      ? {
          userId: raw.referred_by.user_id,
          name: raw.referred_by.name,
          documentNumber: raw.referred_by.document_number,
          status: raw.referred_by.status,
          appliedAt: raw.referred_by.applied_at,
        }
      : null,
    referrals: raw.referrals.map((r) => ({
      id: r.id,
      referredUserId: r.referred_user_id,
      referredName: r.referred_name,
      referredDocumentNumber: r.referred_document_number,
      referredRegisteredAt: r.referred_registered_at,
      status: r.status,
      createdAt: r.created_at,
      completedAt: r.completed_at,
    })),
  };
}

export async function getUserReferralOverview(userId: string): Promise<AdminReferralOverview | null> {
  const res = await backendFetch(`/api/v1/admin/users/${userId}/referrals`, {
    context: 'ADMIN_USER_REFERRALS',
  });

  if (!res.ok) {
    console.error(`[ADMIN_USER_REFERRALS] Error ${res.status} al obtener referidos de usuario ${userId}`);
    return null;
  }

  const raw: AdminReferralOverviewBackend = await res.json();
  return mapOverview(raw);
}
