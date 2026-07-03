'use server';

import { requireValidSession } from './auth.actions';
import * as referralService from '@/modules/referrals/referral.service';

/** Mi código de referido + estadísticas */
export async function getReferralData() {
  await requireValidSession();
  return referralService.getReferralData();
}

/** Lista de personas que usaron mi código */
export async function getReferralsList() {
  await requireValidSession();
  return referralService.getReferralsList();
}

/** Quién me refirió (null si nadie) */
export async function getMyReferrer() {
  await requireValidSession();
  return referralService.getMyReferrer();
}

/** Aplicar un código de referido manualmente */
export async function applyReferralCode(code: string) {
  await requireValidSession();
  return referralService.applyReferralCode(code);
}

/** Validar si un código existe (no requiere auth en el backend, pero protegemos la action) */
export async function validateReferralCode(code: string) {
  return referralService.validateReferralCode(code);
}
