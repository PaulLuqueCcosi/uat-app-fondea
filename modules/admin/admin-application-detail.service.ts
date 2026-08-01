/**
 * Service para obtener el detalle de una solicitud desde el admin.
 * Endpoints por sub-módulo:
 *   - GET /api/v1/admin/applications/{id}/core         → datos core + snapshots + eventos + cliente
 *   - GET /api/v1/admin/applications/{id}/detail       → detalle financiero + schedule
 *   - GET /api/v1/admin/applications/{id}/documents    → documentos + verificación
 *   - GET /api/v1/admin/applications/{id}/contract     → contrato + firma digital
 *   - GET /api/v1/admin/applications/{id}/evaluation   → traza evaluación pipeline
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Types: Core ─────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'SUBMITTED' | 'PROCESSING' | 'PRE_APPROVED' | 'APPROVED'
  | 'REJECTED' | 'REJECTED_BY_USER' | 'BLOCKED' | 'FAILED' | 'EXPIRED';

export type EvaluationStep =
  | 'VALIDATION_DISPATCHED' | 'VALIDATION_COMPLETED' | 'VALIDATION_FAILED'
  | 'SCORING_DISPATCHED' | 'SCORING_COMPLETED' | 'SCORING_FAILED'
  | 'COMPLETED';

export type ContractStatus = 'GENERATED' | 'SIGNED' | 'EXPIRED';

export type CreditCreationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface PepInfo {
  notPep: boolean | null;
  notPepRelative: boolean | null;
  acceptTerms: boolean | null;
}

export interface ClientInfo {
  id: string;
  firstName: string | null;
  secondName: string | null;
  paternalSurname: string | null;
  maternalSurname: string | null;
  documentNumber: string | null;
}

export interface EventItem {
  id: string;
  event: string | null;
  detail: string | null;
  createdAt: string;
}

export interface AdminApplicationCore {
  id: string;
  userId: string;
  userIntentionId: string | null;
  status: ApplicationStatus;
  pepDeclarations: PepInfo | null;
  submittedCreditScoreSnapshot: number | null;
  rejectionReason: string | null;
  canRetryAt: string | null;
  failureCode: string | null;
  evaluationStep: EvaluationStep | null;
  evaluationError: string | null;
  contractId: string | null;
  contractStatus: ContractStatus | null;
  creditCreationStatus: CreditCreationStatus | null;
  creditCreationError: string | null;
  creditId: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  evaluatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profileSnapshot: Record<string, any> | null;
  intentionSnapshot: Record<string, any> | null;
  puntajeSnapshot: Record<string, any> | null;
  deviceFingerprintSnapshot: Record<string, any> | null;
  client: ClientInfo | null;
  events: EventItem[];
}

// ── Types: Detail ───────────────────────────────────────────────────────────

export interface ScheduleEntry {
  installmentNo: number;
  dueDate: string;
  amount: number;
}

export interface AdminApplicationDetail {
  id: string;
  applicationId: string;
  productId: string | null;
  productName: string | null;
  principal: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean | null;
  creditScoreUsed: number | null;
  totalFeesOriginal: number;
  totalDiscounts: number;
  totalIgv: number;
  totalToPay: number;
  monthlyPayment: number;
  firstDueDate: string | null;
  schedule: ScheduleEntry[];
  requestedAmount: number | null;
  approvedAmount: number | null;
  wasLimitAdjusted: boolean | null;
  scoreLimitAmount: number | null;
  limitNote: string | null;
  simulationSnapshot: Record<string, any> | null;
}

// ── Types: Documents ────────────────────────────────────────────────────────

export interface DocumentItem {
  id: string;
  documentType: string | null;
  storageKey: string;
  storageUrl: string | null;
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
  checksum: string | null;
  uploadedBy: string;
  uploadedAt: string;
  status: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface VerificationInfo {
  id: string;
  userId: string;
  dniFrontStatus: string | null;
  dniBackStatus: string | null;
  selfieStatus: string | null;
  overallStatus: string | null;
  dniFrontResult: string | null;
  dniBackResult: string | null;
  selfieResult: string | null;
  dniFrontRejectionReason: string | null;
  dniBackRejectionReason: string | null;
  selfieRejectionReason: string | null;
  dniFrontAttempts: number | null;
  dniBackAttempts: number | null;
  selfieAttempts: number | null;
  dniFrontFailedAttempts: number | null;
  dniBackFailedAttempts: number | null;
  selfieFailedAttempts: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminApplicationDocuments {
  applicationId: string;
  documents: DocumentItem[];
  verification: VerificationInfo | null;
}

// ── Types: Contract ─────────────────────────────────────────────────────────

export interface SignatureInfo {
  id: string;
  contractId: string;
  signedName: string;
  signatureTimestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
  acceptanceStatement: string;
  signedBy: string;
  createdAt: string;
}

export interface AdminApplicationContract {
  applicationId: string;
  contractId: string | null;
  contractStatus: ContractStatus | null;
  signature: SignatureInfo | null;
}

// ── Types: Evaluation ───────────────────────────────────────────────────────

export interface EvaluationVersionInfo {
  id: string | null;
  version: string;
  source: string; // "database" | "json-fallback" | "default"
}

export interface EvaluationRuleTrace {
  ruleId: string;
  label: string;
  passed?: boolean;       // eliminatorias
  triggered?: boolean;    // scoring
  points?: number;        // scoring
  variables: Record<string, any>;
}

export interface EvaluationModuleTrace {
  module: string;
  label?: string;
  passed?: boolean;
  rules: EvaluationRuleTrace[];
}

export interface EvaluationSnapshotTrace {
  eliminatory?: {
    passed: boolean;
    failedModule: string | null;
    modules: EvaluationModuleTrace[];
  };
  scoring?: {
    baseScore: number;
    finalScore: number;
    approvedMin: number;
    decision: string;
    modules: EvaluationModuleTrace[];
    appliedFactors: { ruleId: string; label: string; points: number }[];
  };
  versions?: {
    eliminatory: EvaluationVersionInfo;
    scoring: EvaluationVersionInfo;
    thresholds: EvaluationVersionInfo & { baseScore?: number; approvedMin?: number };
  };
}

export interface EvaluationSnapshotItem {
  id: string;
  evaluatedAt: string;
  passed: boolean;
  decision: string;
  failedModule: string | null;
  baseScore: number | null;
  finalScore: number | null;
  approvedMin: number | null;
  eliminatoryVersion: EvaluationVersionInfo | null;
  scoringVersion: EvaluationVersionInfo | null;
  thresholds: EvaluationVersionInfo | null;
  trace: EvaluationSnapshotTrace | null;
}

export interface AdminApplicationEvaluation {
  applicationId: string;
  evaluationStep: EvaluationStep | null;
  evaluationError: string | null;
  failureCode: string | null;
  rejectionReason: string | null;
  evaluatedAt: string | null;
  evaluations: EvaluationSnapshotItem[] | null;
}

// ── Service functions ───────────────────────────────────────────────────────

export async function getAdminApplicationCore(id: string): Promise<AdminApplicationCore | null> {
  const res = await backendFetch(`/api/v1/admin/applications/${id}/core`, {
    context: 'ADMIN_APP_CORE',
  });
  if (!res.ok) {
    console.error(`[ADMIN_APP_CORE] Error ${res.status}`);
    return null;
  }
  return res.json();
}

export async function getAdminApplicationDetail(id: string): Promise<AdminApplicationDetail | null> {
  const res = await backendFetch(`/api/v1/admin/applications/${id}/detail`, {
    context: 'ADMIN_APP_DETAIL',
  });
  if (!res.ok) {
    console.error(`[ADMIN_APP_DETAIL] Error ${res.status}`);
    return null;
  }
  return res.json();
}

export async function getAdminApplicationDocuments(id: string): Promise<AdminApplicationDocuments | null> {
  const res = await backendFetch(`/api/v1/admin/applications/${id}/documents`, {
    context: 'ADMIN_APP_DOCUMENTS',
  });
  if (!res.ok) {
    console.error(`[ADMIN_APP_DOCUMENTS] Error ${res.status}`);
    return null;
  }
  return res.json();
}

export async function getAdminApplicationContract(id: string): Promise<AdminApplicationContract | null> {
  const res = await backendFetch(`/api/v1/admin/applications/${id}/contract`, {
    context: 'ADMIN_APP_CONTRACT',
  });
  if (!res.ok) {
    console.error(`[ADMIN_APP_CONTRACT] Error ${res.status}`);
    return null;
  }
  return res.json();
}

export async function getAdminApplicationEvaluation(id: string): Promise<AdminApplicationEvaluation | null> {
  const res = await backendFetch(`/api/v1/admin/applications/${id}/evaluation`, {
    context: 'ADMIN_APP_EVALUATION',
  });
  if (!res.ok) {
    console.error(`[ADMIN_APP_EVALUATION] Error ${res.status}`);
    return null;
  }
  return res.json();
}
