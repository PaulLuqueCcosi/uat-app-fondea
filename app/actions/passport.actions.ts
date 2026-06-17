'use server';

import { requireValidSession } from './auth.actions';
import * as passportService from '@/modules/passport/passport.service';
import * as transparencyService from '@/modules/passport/transparency.service';

export async function getPassportSummary() {
  await requireValidSession();
  return passportService.getPassportSummary();
}

export async function getPointsHistory() {
  await requireValidSession();
  return passportService.getPointsHistory();
}

export async function getTransparencyConfig(productId?: string) {
  await requireValidSession();
  return transparencyService.getTransparencyConfig(productId);
}
