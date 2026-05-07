import type { LoanSimulation } from './intencion';
import type { KYCData } from './kyc';
import type { LaborData } from './labor';
import type { EconomicData } from './economic';
import type { ReferencesData } from './references';
import type { AdditionalData } from './address';
import type { AccountType } from './common';

// ─── Application ─────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'evaluating'
  | 'approved'
  | 'more_info'
  | 'rejected'
  | 'signed'
  | 'disbursing';

export type EvaluationResult = 'approved' | 'rejected' | 'more_info';

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

export interface ApplicationRecord {
  id: string;
  userId: string;
  status: ApplicationStatus;
  result?: EvaluationResult;
  submittedAt: string;
  evaluatedAt?: string;
  canRetryAt?: string;
}

// ─── Bank Account ────────────────────────────────────────────────────────────

export interface BankAccount {
  bank: string;
  accountNumber: string;
  account_type?: AccountType;
  cci: string;
}

export interface BankAccountProfile {
  bank: string;
  account_type: AccountType;
  cci: string;
  verified?: boolean;
}

export interface BankAccountProfileStatus {
  profile: (BankAccountProfile & { verified: boolean }) | null;
  overall_verified: boolean;
}

// ─── PEP Declarations ────────────────────────────────────────────────────────

export interface PEPDeclarations {
  not_pep: boolean;
  not_pep_relative: boolean;
  accept_terms: boolean;
}
