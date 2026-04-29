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

// ─── Labor profile configuration ─────────────────────────────────────────────
// Centralizado aquí para que el backend pueda dictar estos valores en el futuro

export const LABOR_CONFIG = {
  /** Ingreso mensual mínimo aceptado (S/) */
  MIN_MONTHLY_INCOME: 500,
  /** RUC debe tener exactamente 11 dígitos */
  RUC_LENGTH: 11,
} as const;

export const EMPLOYMENT_OPTIONS = [
  { value: 'EMPLEADO_DEPENDIENTE', label: 'Empleado en planilla' },
  { value: 'INDEPENDIENTE',        label: 'Trabajador independiente' },
  { value: 'EMPRESARIO',           label: 'Dueño de negocio' },
  { value: 'FREELANCE',            label: 'Freelancer / Consultor' },
  { value: 'PENSIONISTA',          label: 'Pensionista' },
] as const;

export const INDUSTRY_OPTIONS = [
  { value: 'TECNOLOGIA',              label: 'Tecnología' },
  { value: 'SALUD',                   label: 'Salud' },
  { value: 'EDUCACION',               label: 'Educación' },
  { value: 'CONSTRUCCION',            label: 'Construcción' },
  { value: 'COMERCIO',                label: 'Comercio' },
  { value: 'SERVICIOS_PROFESIONALES', label: 'Servicios profesionales' },
  { value: 'OTRO',                    label: 'Otro' },
] as const;

export const ADDITIONAL_INCOME_TYPE_OPTIONS = [
  { value: 'ALQUILER',            label: 'Alquiler de propiedad' },
  { value: 'DIVIDENDOS',          label: 'Dividendos / inversiones' },
  { value: 'PENSION',             label: 'Pensión' },
  { value: 'FREELANCE',           label: 'Trabajo freelance' },
  { value: 'NEGOCIO_SECUNDARIO',  label: 'Negocio secundario' },
  { value: 'OTRO',                label: 'Otro' },
] as const;

// Routes
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
