// ─── Auth & User ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dni?: string;
  profileProgress?: number;
  sections?: ProfileSections;
}

export interface ProfileSections {
  kyc: SectionStatus;
  labor: SectionStatus;
  economic: SectionStatus;
  references: SectionStatus;
  additional: SectionStatus;
}

export type SectionStatus = 'pending' | 'completed' | 'in_progress';

// ─── Loan / Funnel ───────────────────────────────────────────────────────────

export interface LoanSimulation {
  amount: number;
  months: number;
  monthlyPayment: number;
  monthlyRate: number;
  tea: number;
}

export interface KYCData {
  dni: string;
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
  verificationCode: string;
  birth_date?: string;
  /** El backend indica si los datos ya fueron validados exitosamente */
  verified?: boolean;
}

// ─── Labor ───────────────────────────────────────────────────────────────────

export type EmploymentStatus =
  | 'EMPLEADO_DEPENDIENTE'
  | 'INDEPENDIENTE'
  | 'EMPRESARIO'
  | 'FREELANCE'
  | 'PENSIONISTA';

export type LaborIndustry =
  | 'TECNOLOGIA'
  | 'SALUD'
  | 'EDUCACION'
  | 'CONSTRUCCION'
  | 'COMERCIO'
  | 'SERVICIOS_PROFESIONALES'
  | 'OTRO';

export type AdditionalIncomeType =
  | 'ALQUILER'
  | 'DIVIDENDOS'
  | 'PENSION'
  | 'FREELANCE'
  | 'NEGOCIO_SECUNDARIO'
  | 'OTRO';

export type IncomeReceiptMethod =
  | 'CUENTA_BANCARIA'
  | 'EFECTIVO'
  | 'BILLETERA_DIGITAL';

export type LoanPurpose =
  | 'EDUCACION'
  | 'SALUD'
  | 'NEGOCIO'
  | 'VIAJE'
  | 'HOGAR'
  | 'DEUDAS'
  | 'OTRO';

export type EducationLevel =
  | 'PRIMARIA'
  | 'SECUNDARIA'
  | 'TECNICA'
  | 'UNIVERSITARIA'
  | 'POSGRADO';

export type ReferralSource =
  | 'REDES_SOCIALES'
  | 'RECOMENDACION'
  | 'GOOGLE'
  | 'PUBLICIDAD'
  | 'OTRO';

export type AccountType = 'AHORROS' | 'CORRIENTE';

export interface AdditionalIncome {
  /** ID local para identificar el item en el array (UUID generado en frontend) */
  id: string;
  type: AdditionalIncomeType;
  /** Solo requerido cuando type === 'OTRO' */
  custom_type?: string;
  amount: number;
  /** Descripción opcional */
  description?: string;
}

/** Recurso 1: Situación laboral */
export interface LaborSituation {
  employment_status: EmploymentStatus;
  verified?: boolean;
}

/** Recurso 2: Detalles laborales — shape varía según employment_status */
export interface LaborDetails {
  industry: LaborIndustry;
  /** Solo EMPLEADO_DEPENDIENTE */
  company?: string;
  /** Solo EMPLEADO_DEPENDIENTE */
  position?: string;
  /** EMPLEADO_DEPENDIENTE (mín 1), INDEPENDIENTE, FREELANCE, EMPRESARIO */
  years_of_activity?: number;
  /** Solo EMPRESARIO */
  business_ruc?: string;
  verified?: boolean;
}

/** Recurso 3: Ingresos */
export interface LaborIncome {
  monthly_income: number;
  /** Cómo recibe sus ingresos — afecta scoring */
  income_receipt_method?: IncomeReceiptMethod;
  has_additional_income: boolean;
  additional_incomes: AdditionalIncome[];
  verified?: boolean;
}

/** Estado completo del perfil laboral — lo que devuelve GET /labor/status */
export interface LaborProfileStatus {
  situation: (LaborSituation & { verified: boolean }) | null;
  details: (LaborDetails & { verified: boolean }) | null;
  income: (LaborIncome & { verified: boolean }) | null;
  /** true solo cuando los 3 recursos están verified */
  overall_verified: boolean;
}

/** Shape completo para compatibilidad con LoanApplication */
export interface LaborData {
  situation?: LaborSituation;
  details?: LaborDetails;
  income?: LaborIncome;
  overall_verified?: boolean;
}

export interface EconomicData {
  monthlyIncome: number;
  otherIncome: number;
  monthlyExpenses: number;
  hasDebts: boolean;
  debts: Debt[];
  hasSavings: boolean;
  savingsAmount: number;
  /** Propósito del préstamo - afecta scoring */
  loan_purpose?: LoanPurpose;
  /** Grado de instrucción - afecta scoring */
  education_level?: EducationLevel;
  /** ¿Tiene servicios a su nombre? - afecta scoring */
  has_services?: boolean;
}

export interface Debt {
  id: string;
  entity: string;
  type: string;
  amount: number;
  monthlyPayment: number;
}

/** Perfil económico del usuario — solo campos del formulario visible */
export interface EconomicProfile {
  loan_purpose: LoanPurpose;
  monthly_expenses: number;
  has_debts: boolean;
  debts: Debt[];
  has_property: boolean;
  has_vehicle: boolean;
  has_services: boolean;
  education_level: EducationLevel;
  verified?: boolean;
}

/** Estado del perfil económico — lo que devuelve GET /economic/status */
export interface EconomicProfileStatus {
  profile: (EconomicProfile & { verified: boolean }) | null;
  overall_verified: boolean;
}

export interface Reference {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  yearsKnown?: number;
}

export interface ReferencesData {
  references: Reference[];
}

/** Referencias del usuario */
export interface ReferencesProfile {
  family_reference: {
    name: string;
    phone: string;
    relationship: string;
  };
  non_family_reference: {
    name: string;
    phone: string;
    relationship: string;
    years_known: number;
  };
  verified?: boolean;
}

/** Estado de referencias — lo que devuelve GET /references/status */
export interface ReferencesProfileStatus {
  profile: (ReferencesProfile & { verified: boolean }) | null;
  overall_verified: boolean;
}

export interface AdditionalData {
  address: string;
  district: string;
  city: string;
  department: string;
  housingType: 'own' | 'rent' | 'family' | 'mortgage' | 'other';
  yearsAtAddress: number;
  educationLevel: 'primary' | 'secondary' | 'technical' | 'university' | 'postgraduate';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'cohabiting';
  dependents: number;
  /** Canal de conocimiento - para marketing */
  referral_source?: ReferralSource;
  /** Especificación cuando referral_source es 'OTRO' */
  referral_other?: string;
}

export type ContactMethod = 'whatsapp' | 'sms' | 'email' | 'call';

export interface LoanApplication {
  id: string;
  simulation: LoanSimulation;
  kyc?: KYCData;
  labor?: LaborData;
  economic?: EconomicData;
  references?: ReferencesData;
  additional?: AdditionalData;
  status: ApplicationStatus;
  createdAt: string;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'evaluating'
  | 'approved'
  | 'more_info'
  | 'rejected'
  | 'signed'
  | 'disbursing';

export interface BankAccount {
  bank: string;
  accountNumber: string;
  account_type?: AccountType;
  cci: string;
}

/** Cuenta bancaria del usuario para desembolso */
export interface BankAccountProfile {
  bank: string;
  account_type: AccountType;
  cci: string;
  verified?: boolean;
}

/** Estado de cuenta bancaria — lo que devuelve GET /bank-account/status */
export interface BankAccountProfileStatus {
  profile: (BankAccountProfile & { verified: boolean }) | null;
  overall_verified: boolean;
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'disabled' | 'danger';

export type BadgeStatus = 'pending' | 'completed' | 'blocked' | 'warning' | 'active' | 'evaluating' | 'rejected' | 'disbursing';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export type StepState = 'completed' | 'active' | 'pending';

export interface Step {
  id: string;
  label: string;
  state: StepState;
}

export interface FunnelStep {
  id: number;
  label: string;
  state: StepState;
}

// ─── PEP Declarations ────────────────────────────────────────────────────────

export interface PEPDeclarations {
  /** Declaro que no soy Persona Expuesta Políticamente (PEP) */
  not_pep: boolean;
  /** Declaro que no soy pariente de una PEP hasta el 2do grado de consanguinidad o afinidad */
  not_pep_relative: boolean;
  /** Acepto los Términos y Condiciones y consiento el uso de mis datos personales */
  accept_terms: boolean;
}
