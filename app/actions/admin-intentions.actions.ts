'use server';

import {
  getAdminIntentions,
  cancelAdminIntention,
  unlockAdminIntention,
  getAdminAnonymousIntentions,
  getAdminFunnelMetrics,
  type AdminIntentionsResult,
  type AnonymousIntentionsResult,
  type FunnelMetrics,
} from '@/modules/admin/admin-intentions.service';

export async function getAdminIntentionsAction(
  page: number,
  pageSize: number,
  options?: { status?: string; search?: string },
): Promise<AdminIntentionsResult> {
  return getAdminIntentions(page, pageSize, options);
}

export async function cancelIntentionAction(id: string) {
  return cancelAdminIntention(id);
}

export async function unlockIntentionAction(id: string) {
  return unlockAdminIntention(id);
}

export async function getAnonymousIntentionsAction(
  page: number,
  pageSize: number,
): Promise<AnonymousIntentionsResult> {
  return getAdminAnonymousIntentions(page, pageSize);
}

export async function getFunnelMetricsAction(): Promise<FunnelMetrics | null> {
  return getAdminFunnelMetrics();
}
