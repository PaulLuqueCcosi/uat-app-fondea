/**
 * Constants — Re-exports por dominio.
 *
 * Importar desde aquí: import { EMPLOYMENT_OPTIONS, ROUTES } from '@/lib/constants'
 * O importar directo del dominio: import { LABOR_CONFIG } from '@/lib/constants/labor'
 */

export * from './labor';
export * from './economic';
export * from './address';
export * from './bank-account';

// ─── Shared / App-level constants ────────────────────────────────────────────

export const PHONE_CONFIG = {
  COUNTRY_CODE: '51',
  MIN_LENGTH: 9,
  MAX_LENGTH: 9,
} as const;

export const OTP_CONFIG = {
  LENGTH: 6,
  MAX_ATTEMPTS: 3,
  EXPIRY_SECONDS: 300,
} as const;

export const ROUTES = {
  HOME: '/',
  DASHBOARD: {
    HOME: '/dashboard',
    PROFILE: '/dashboard/profile',
    LOANS: '/dashboard/loans',
    SETTINGS: '/dashboard/settings',
  },
  SOLICITAR: {
    START: '/solicitar',
    KYC_VALIDATION: '/solicitar/kyc-validation',
    LABOR: '/solicitar/labor',
    ECONOMIC: '/solicitar/economic',
    REFERENCES: '/solicitar/references',
    ADDITIONAL: '/solicitar/additional',
    SUMMARY: '/solicitar/summary',
    KYC_DOCUMENTS: '/solicitar/kyc-documents',
    KYC_SELFIE: '/solicitar/kyc-selfie',
    BANK_ACCOUNT: '/solicitar/bank-account',
    CONTRACT: '/solicitar/contract',
    CONTRACT_SIGNED: '/solicitar/contract-signed',
    WAITING: '/solicitar/waiting',
    APPROVED: '/solicitar/approved',
    MORE_INFO: '/solicitar/more-info',
    REJECTED: '/solicitar/rejected',
  },
} as const;
