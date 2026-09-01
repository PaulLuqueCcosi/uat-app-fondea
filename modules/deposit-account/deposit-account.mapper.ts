import type { DepositAccountConfig } from './deposit-account.types';

/**
 * Backend (snake_case) → Frontend (camelCase).
 * Si el backend cambia un nombre de campo, solo se toca este archivo.
 */
export function mapDepositAccountConfigFromBackend(raw: any): DepositAccountConfig {
  return {
    id: raw.id,
    bankName: raw.bank_name,
    accountNumber: raw.account_number,
    accountType: raw.account_type ?? null,
    cci: raw.cci ?? null,
    holderName: raw.holder_name,
    description: raw.description ?? null,
    qrImageUrl: raw.qr_image_url ?? null,
    isActive: raw.is_active ?? false,
    createdBy: raw.created_by ?? null,
    createdAt: raw.created_at,
  };
}
