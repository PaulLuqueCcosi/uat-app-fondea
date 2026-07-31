'use server';

import {
  getAdminIntentions,
  getAdminAnonymousIntentions,
  type AdminIntentionsResult,
  type AnonymousIntentionsResult,
} from '@/modules/admin/admin-intentions.service';

export async function getAdminIntentionsAction(
  page: number,
  pageSize: number,
  options?: { status?: string; search?: string },
): Promise<AdminIntentionsResult> {
  return getAdminIntentions(page, pageSize, options);
}

export async function getAnonymousIntentionsAction(
  page: number,
  pageSize: number,
  options?: {
    from?: string;
    to?: string;
    amountMin?: string;
    amountMax?: string;
    termDays?: string;
    installmentCount?: string;
    clientIp?: string;
  },
): Promise<AnonymousIntentionsResult> {
  return getAdminAnonymousIntentions(page, pageSize, options);
}
