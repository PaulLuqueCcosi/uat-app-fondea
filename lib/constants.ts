/**
 * Constantes centralizadas de la aplicación
 */

// Phone configuration
export const PHONE_CONFIG = {
  COUNTRY_CODE: '51', // Perú
  MIN_LENGTH: 9,
  MAX_LENGTH: 9,
} as const;

// OTP configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  MAX_ATTEMPTS: 3,
  EXPIRY_SECONDS: 300, // 5 minutos
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: {
    HOME: '/dashboard',
    PROFILE: '/dashboard/profile',
    LOANS: '/dashboard/loans',
    SETTINGS: '/dashboard/settings',
  },
  FUNNEL: {
    START: '/funnel',
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
