import type { LoanSimulation } from './intencion';
import type { KYCData } from './kyc';
import type { LaborData } from './labor';
import type { EconomicData } from './economic';
import type { ReferencesData } from './references';
import type { AdditionalData } from './address';
import type { AccountType } from './common';

// ─── Application ─────────────────────────────────────────────────────────────

/**
 * Status reales del backend (pipeline de evaluación):
 * - SUBMITTED: solicitud enviada, pendiente de procesamiento
 * - PROCESSING: evaluación en curso (business validation + scoring)
 * - PRE_APPROVED: pre-aprobada (pendiente de firma/desembolso)
 * - REJECTED: rechazada por scoring o validación de negocio
 * - FAILED: error técnico en el pipeline (puede reintentar)
 */
export type ApplicationStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'PRE_APPROVED'
  | 'REJECTED'
  | 'FAILED';

/**
 * Códigos de fallo técnico del pipeline.
 * Solo presentes cuando status === 'FAILED'.
 */
export type ApplicationFailureCode =
  | 'BUSINESS_VALIDATION_FAILED'
  | 'SCORE_CALCULATION_FAILED'
  | 'EVALUATION_ERROR';

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
  status: ApplicationStatus;
  submittedAt?: string;
  evaluatedAt?: string;
  creditScore?: number;
  rejectionReason?: string;
  canRetryAt?: string;
  failureCode?: ApplicationFailureCode;
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
