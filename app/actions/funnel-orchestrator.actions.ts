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
export async function getFunnelRedirect(): Promise<{ path: string; allCompleted: boolean }> {
  await requireValidSession();

  // ── Bloque 1: KYC ────────────────────────────────────────────────────────
  const kyc = await getKYCData();
  // Solo VERIFIED permite avanzar; EXPIRED, REPLACED o sin datos → volver a KYC
  if (kyc.data?.status !== 'VERIFIED') return { path: '/solicitar/kyc-validation', allCompleted: false };

  // ── Bloque 2: resto en paralelo ──────────────────────────────────────────
  const [labor, economic, address, references, bankAccount] = await Promise.all([
    getLaborProfileStatus(),
    getEconomicProfileStatus(),
    getAddressProfileStatus(),
    getReferencesProfileStatus(),
    getBankAccountProfileStatus(),
  ]);

  if (!labor.overall_verified)       return { path: '/solicitar/labor', allCompleted: false };
  if (!economic.overall_verified)    return { path: '/solicitar/economic', allCompleted: false };
  if (!address.overall_verified)     return { path: '/solicitar/additional', allCompleted: false };
  if (!references.overall_verified)  return { path: '/solicitar/references', allCompleted: false };
  if (!bankAccount.overall_verified) return { path: '/solicitar/bank-account', allCompleted: false };

  return { path: '/solicitar/summary', allCompleted: true };
}
