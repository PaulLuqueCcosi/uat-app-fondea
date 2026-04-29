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
  /** INDEPENDIENTE, FREELANCE, EMPRESARIO */
  years_of_activity?: number;
  /** Solo EMPRESARIO */
  business_ruc?: string;
  verified?: boolean;
}

/** Recurso 3: Ingresos */
export interface LaborIncome {
  monthly_income: number;
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
}

export interface Debt {
  id: string;
  entity: string;
  type: string;
  amount: number;
  monthlyPayment: number;
}

export interface Reference {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface ReferencesData {
  references: Reference[];
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
  accountType: string;
  cci: string;
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
