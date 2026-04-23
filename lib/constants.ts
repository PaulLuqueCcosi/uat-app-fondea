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
    LABOR: '/funnel/labor',
    ECONOMIC: '/funnel/economic',
    REFERENCES: '/funnel/references',
    ADDITIONAL: '/funnel/additional',
    SUMMARY: '/funnel/summary',
    KYC_DOCUMENTS: '/funnel/kyc-documents',
    KYC_SELFIE: '/funnel/kyc-selfie',
    BANK_ACCOUNT: '/funnel/bank-account',
    CONTRACT: '/funnel/contract',
    CONTRACT_SIGNED: '/funnel/contract-signed',
    WAITING: '/funnel/waiting',
    APPROVED: '/funnel/approved',
    MORE_INFO: '/funnel/more-info',
    REJECTED: '/funnel/rejected',
  },
} as const;
