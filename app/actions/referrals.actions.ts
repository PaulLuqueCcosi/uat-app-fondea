'use server';

import { requireValidSession } from './auth.actions';
import * as referralService from '@/modules/referrals/referral.service';

export async function getReferralData() {
  await requireValidSession();
  return referralService.getReferralData();
}

export async function getReferralsList() {
  await requireValidSession();
  return referralService.getReferralsList();
}
