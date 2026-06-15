'use server';

import * as passportService from '@/modules/passport/passport.service';

export async function getPassportSummary() {
  return passportService.getPassportSummary();
}

export async function getPointsHistory() {
  return passportService.getPointsHistory();
}
