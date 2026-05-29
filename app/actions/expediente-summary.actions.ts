'use server';

import { requireValidSession } from './auth.actions';
import { getKYCData } from './kyc.actions';
import { getLaborProfileStatus } from './labor.actions';
import { getEconomicProfileStatus } from './economic.actions';
import { getAddressProfileStatus } from './additional-address.actions';
import { getReferencesProfileStatus } from './references.actions';
import { getBankAccountProfileStatus } from './bank-account.actions';

/**
 * Retorna true si todos los expedientes del usuario están verificados.
 * Se consulta KYC primero; si falla, no se hacen las demás llamadas.
 */
export async function isExpedienteComplete(): Promise<boolean> {
  await requireValidSession();

  // KYC es prerequisito
  const kyc = await getKYCData();
  if (kyc.data?.status !== 'VERIFIED') return false;

  // Resto en paralelo
  const [labor, economic, address, references, bankAccount] = await Promise.all([
    getLaborProfileStatus(),
    getEconomicProfileStatus(),
    getAddressProfileStatus(),
    getReferencesProfileStatus(),
    getBankAccountProfileStatus(),
  ]);

  if (!labor.overall_verified)       return false;
  if (!economic.overall_verified)    return false;
  if (!address.overall_verified)     return false;
  if (!references.overall_verified)  return false;
  if (!bankAccount.overall_verified) return false;

  return true;
}
