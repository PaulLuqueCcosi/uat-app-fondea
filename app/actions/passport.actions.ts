'use server';

import type { PaginatedRequest } from '@/modules/shared/pagination';
import * as passportService from '@/modules/passport/passport.service';
import * as transparencyService from '@/modules/passport/transparency.service';

export async function getPassportSummary() {
  return passportService.getPassportSummary();
}

export async function getPointsHistory(request?: PaginatedRequest) {
  return passportService.getPointsHistory(request);
}

export async function getTransparencyConfig(productId?: string) {
  return transparencyService.getTransparencyConfig(productId);
}
