import type { LoanPurpose, EducationLevel } from './common';

// ─── Economic ────────────────────────────────────────────────────────────────

import type { FormEditMetadata } from './form-edit-policy';

export type EconomicStatus = 'VERIFIED' | 'EXPIRED' | 'REPLACED' | 'PENDING';

export interface Debt {
  id: string;
  entity: string;
  type: string;
  amount: number;
  monthlyPayment: number;
}

export interface EconomicData {
  monthlyIncome: number;
  otherIncome: number;
  monthlyExpenses: number;
  hasDebts: boolean;
  debts: Debt[];
  hasSavings: boolean;
  savingsAmount: number;
  loan_purpose?: LoanPurpose;
  education_level?: EducationLevel;
  has_services?: boolean;
}

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

export interface EconomicProfileStatus {
  profile: (EconomicProfile & { verified: boolean }) | null;
  overall_verified: boolean;
  /** Estado del backend (VERIFIED, EXPIRED, REPLACED, PENDING) */
  status?: EconomicStatus;
  /** Metadatos de edición (permisos y políticas) */
  editMetadata?: FormEditMetadata;
}
