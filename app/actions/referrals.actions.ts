'use server';

import * as referralService from '@/modules/referrals/referral.service';

export async function getReferralData() {
  return referralService.getReferralData();
}
