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
}

export interface LaborData {
  situation?: string;
  employment_status?: string;
  employmentStatus?: string;
  industry?: string;
  company?: string;
  companyName?: string;
  position?: string;
  contractType?: string;
  startDate?: string;
  monthly_income?: number | string;
  monthlyIncome?: number;
  has_additional_income?: boolean;
  hasAdditionalIncome?: boolean;
  additionalIncomeAmount?: number;
  additionalIncomeSource?: string;
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
