/**
 * Tipos para la sección Marketing y Adquisición (M5 — R37-R41).
 * Endpoints: /api/v1/admin/marketing/*
 */

// ── R37 — KYC primer intento ─────────────────────────────────────────────────

export interface KycFirstAttempt {
  totalAttempts: number;
  firstAttemptSuccess: number;
  successRate: number;
  targetRate: number;
}

export interface KycFirstAttemptBackend {
  total_attempts: number;
  first_attempt_success: number;
  success_rate: number;
  target_rate: number;
}

// ── R38 — Abandono por paso del formulario ───────────────────────────────────

export type FormStep =
  | 'INTENTION' | 'ADDRESS' | 'LABOR' | 'ECONOMIC' | 'BANK_ACCOUNT'
  | 'REFERENCES' | 'KYC' | 'APPLICATION_SUBMITTED' | 'PRE_APPROVED' | 'CONTRACT_SIGNED';

export interface FormStepEntry {
  step: FormStep;
  label: string;
  count: number;
  abandonmentRate: number | null; // null solo en INTENTION
}

export interface FormStepEntryBackend {
  step: FormStep;
  label: string;
  count: number;
  abandonment_rate: number | null;
}

// ── R39 — Rechazos por motivo ─────────────────────────────────────────────────

export interface RejectionReasonEntry {
  reason: string;
  count: number;
  percentage: number;
}

export interface RejectionBreakdown {
  totalRejections: number;
  reasons: RejectionReasonEntry[];
}

export interface RejectionBreakdownBackend {
  total_rejections: number;
  reasons: RejectionReasonEntry[];
}

// ── R41 — Leads por hora ──────────────────────────────────────────────────────

export interface LeadsByHourEntry {
  hour: number;
  count: number;
}

export interface LeadsByHourBackend {
  hours: LeadsByHourEntry[];
}

// ── R40 — Programa de referidos ───────────────────────────────────────────────

export interface ReferralSummary {
  codesShared: number;
  registrations: number;
  firstLoanCompleted: number;
  conversionRate: number;
  pointsAwarded: number;
}

export interface ReferralSummaryBackend {
  codes_shared: number;
  registrations: number;
  first_loan_completed: number;
  conversion_rate: number;
  points_awarded: number;
}

export type ReferralStatus = 'REGISTERED' | 'LOAN_COMPLETED';

export interface ReferralRow {
  referralUseId: string;
  referrerUserId: string;
  referrerName: string | null;
  referredUserId: string;
  referredName: string | null;
  status: ReferralStatus;
  registeredAt: string;
  completedAt: string | null;
}

export interface ReferralRowBackend {
  referral_use_id: string;
  referrer_user_id: string;
  referrer_name: string | null;
  referred_user_id: string;
  referred_name: string | null;
  status: ReferralStatus;
  registered_at: string;
  completed_at: string | null;
}
