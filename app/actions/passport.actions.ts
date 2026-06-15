'use server';

import * as passportService from '@/modules/passport/passport.service';
import * as transparencyService from '@/modules/passport/transparency.service';

export async function getPassportSummary() {
  return passportService.getPassportSummary();
}

export async function getPointsHistory() {
  return passportService.getPointsHistory();
}

export async function getTransparencyConfig(productId?: string) {
  return transparencyService.getTransparencyConfig(productId);
}
