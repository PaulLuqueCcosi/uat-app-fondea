'use server';

import { requireValidSession } from './auth.actions';
import { getKYCData } from './kyc.actions';
import { getLaborProfileStatus } from './labor.actions';
import { getEconomicProfileStatus } from './economic.actions';
import { getAddressProfileStatus } from './additional-address.actions';
import { getReferencesProfileStatus } from './references.actions';
import { getBankAccountProfileStatus } from './bank-account.actions';

/**
 * Evalúa el estado del funnel en dos bloques:
 *
 * Bloque 1 — KYC (prerequisito de todo lo demás).
 *   Si no está verificado, retorna inmediatamente sin llamar el resto.
 *
 * Bloque 2 — Los 5 perfiles restantes en paralelo.
 *   Solo se ejecuta si KYC ya está verificado.
 */
export async function getFunnelRedirect(): Promise<string> {
  await requireValidSession();

  // ── Bloque 1: KYC ────────────────────────────────────────────────────────
  const kyc = await getKYCData();
  // Solo VERIFIED permite avanzar; EXPIRED, REPLACED o sin datos → volver a KYC
  if (kyc.data?.status !== 'VERIFIED') return '/solicitar/kyc-validation';

  // ── Bloque 2: resto en paralelo ──────────────────────────────────────────
  const [labor, economic, address, references, bankAccount] = await Promise.all([
    getLaborProfileStatus(),
    getEconomicProfileStatus(),
    getAddressProfileStatus(),
    getReferencesProfileStatus(),
    getBankAccountProfileStatus(),
  ]);

  if (!labor.overall_verified)       return '/solicitar/labor';
  if (!economic.overall_verified)    return '/solicitar/economic';
  if (!address.overall_verified)     return '/solicitar/additional';
  if (!references.overall_verified)  return '/solicitar/references';
  if (!bankAccount.overall_verified) return '/solicitar/bank-account';

  return '/solicitar/summary';
}
