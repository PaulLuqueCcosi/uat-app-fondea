'use server';

/**
 * Wrappers de servidor para la cuenta de depósito.
 *
 * <p>Thin: solo delegan al service. La autorización la resuelve el backend — las rutas
 * `/api/v1/admin/**` exigen ROLE_ADMIN en SecurityConfig, así que no hace falta duplicar
 * el chequeo acá.
 */

import * as depositAccountService from '@/modules/deposit-account/deposit-account.service';
import type { SaveDepositAccountConfigRequest } from '@/modules/deposit-account';

// ── Cliente ──────────────────────────────────────────────────────────────────

export async function getActiveDepositAccountAction() {
  return depositAccountService.getActiveDepositAccount();
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminActiveDepositAccountAction() {
  return depositAccountService.getAdminActiveDepositAccount();
}

export async function getDepositAccountHistoryAction() {
  return depositAccountService.getDepositAccountHistory();
}

export async function createDepositAccountAction(request: SaveDepositAccountConfigRequest) {
  return depositAccountService.createDepositAccount(request);
}

export async function uploadDepositAccountQrAction(configId: string, formData: FormData) {
  return depositAccountService.uploadDepositAccountQr(configId, formData);
}
