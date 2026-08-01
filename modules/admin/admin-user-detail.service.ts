/**
 * Service para detalle de usuario y expedientes en admin.
 * Endpoints:
 * - GET /api/v1/admin/users/{userId}
 * - GET /api/v1/admin/users/{userId}/forms
 * - POST /api/v1/admin/users/{userId}/forms/{formType}/unlock
 */

import { backendFetch } from '@/lib/backend-fetch';
import type {
  AdminUserDetailBackend,
  AdminUserDetail,
  AdminFormStatusBackend,
  UserExpedientes,
  FormModuleStatus,
  FormExpediente,
  FormSubmission,
  FormSubmissionBackend,
  VerificationHistoryEntry,
  PageResponse,
} from './admin-user-detail.types';

// ── User Detail ───────────────────────────────────────────────────────────────

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const res = await backendFetch(`/api/v1/admin/users/${userId}`, {
    context: 'ADMIN_USER_DETAIL',
  });

  if (!res.ok) {
    console.error(`[ADMIN_USER_DETAIL] Error ${res.status} al obtener detalle de usuario ${userId}`);
    return null;
  }

  const raw: AdminUserDetailBackend = await res.json();
  return mapUserDetail(raw);
}

function mapUserDetail(raw: AdminUserDetailBackend): AdminUserDetail {
  const parts: string[] = [];
  if (raw.firstName) parts.push(raw.firstName);
  if (raw.secondName) parts.push(raw.secondName);
  if (raw.additionalNames) parts.push(raw.additionalNames);
  if (raw.paternalSurname) parts.push(raw.paternalSurname);
  if (raw.maternalSurname) parts.push(raw.maternalSurname);

  return {
    id: raw.id,
    name: parts.length > 0 ? parts.join(' ') : '(Sin nombre)',
    firstName: raw.firstName ?? null,
    secondName: raw.secondName ?? null,
    paternalSurname: raw.paternalSurname ?? null,
    maternalSurname: raw.maternalSurname ?? null,
    documentType: raw.documentType ?? null,
    documentNumber: raw.documentNumber ?? null,
    nationality: raw.nationality ?? null,
    registeredAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
  };
}

// ── Forms/Expedientes ─────────────────────────────────────────────────────────

export async function getAdminUserForms(userId: string): Promise<UserExpedientes | null> {
  const res = await backendFetch(`/api/v1/admin/users/${userId}/forms`, {
    context: 'ADMIN_USER_FORMS',
  });

  if (!res.ok) {
    console.error(`[ADMIN_USER_FORMS] Error ${res.status} al obtener formularios de usuario ${userId}`);
    return null;
  }

  const raw: AdminFormStatusBackend = await res.json();
  return {
    kyc: mapFormModule(raw.kyc),
    labor: mapFormModule(raw.labor),
    economic: mapFormModule(raw.economic),
    references: mapFormModule(raw.references),
    address: mapFormModule(raw.address),
    bankAccount: mapFormModule(raw.bankAccount),
  };
}

function mapFormModule(module: FormModuleStatus): FormExpediente {
  return {
    currentStatus: module.currentStatus,
    verifiedAt: module.verifiedAt,
    expiresAt: module.expiresAt,
    totalSubmissions: module.totalSubmissions,
    lock: {
      isBlocked: module.lock.isBlocked,
      failedAttempts: module.lock.failedAttempts,
      maxAttempts: module.lock.maxAttempts,
      blockedAt: module.lock.blockedAt,
      blockedUntil: module.lock.blockedUntil,
      hoursRemaining: module.lock.hoursRemaining,
    },
    submissions: module.submissions.map(mapSubmission),
  };
}

function mapSubmission(raw: FormSubmissionBackend): FormSubmission {
  let data: Record<string, any> = {};
  if (raw.submissionData) {
    try {
      data = JSON.parse(raw.submissionData);
    } catch {
      // Si no es JSON válido, poner como string raw
      data = { raw_data: raw.submissionData };
    }
  }

  return {
    id: raw.id,
    submittedAt: raw.submittedAt,
    verificationResult: raw.verificationResult ?? 'PENDING',
    submissionData: data,
    ruleOutcomes: raw.ruleOutcomes ?? [],
  };
}

// ── Unlock Form ───────────────────────────────────────────────────────────────

export async function unlockUserForm(
  userId: string,
  formType: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await backendFetch(`/api/v1/admin/users/${userId}/forms/${formType}/unlock`, {
    context: 'ADMIN_UNLOCK_FORM',
    method: 'POST',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ADMIN_UNLOCK_FORM] Error ${res.status}: ${body}`);
    return { ok: false, message: `Error al desbloquear: ${res.status}` };
  }

  const body = await res.json().catch(() => ({}));
  return { ok: true, message: body.message };
}

// ── Reset Attempts ────────────────────────────────────────────────────────────

export async function resetUserFormAttempts(
  userId: string,
  formType: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await backendFetch(`/api/v1/admin/users/${userId}/forms/${formType}/reset-attempts`, {
    context: 'ADMIN_RESET_ATTEMPTS',
    method: 'POST',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ADMIN_RESET_ATTEMPTS] Error ${res.status}: ${body}`);
    return { ok: false, message: `Error al resetear intentos: ${res.status}` };
  }

  const body = await res.json().catch(() => ({}));
  return { ok: true, message: body.message };
}

// ── Block Form ────────────────────────────────────────────────────────────────

export async function blockUserForm(
  userId: string,
  formType: string,
): Promise<{ ok: boolean; message?: string }> {
  const res = await backendFetch(`/api/v1/admin/users/${userId}/forms/${formType}/block`, {
    context: 'ADMIN_BLOCK_FORM',
    method: 'POST',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[ADMIN_BLOCK_FORM] Error ${res.status}: ${body}`);
    return { ok: false, message: `Error al bloquear: ${res.status}` };
  }

  const body = await res.json().catch(() => ({}));
  return { ok: true, message: body.message };
}

// ── Historiales paginados (envíos / verificaciones) ───────────────────────────

const EMPTY_PAGE = <T,>(page: number, size: number): PageResponse<T> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: page,
  size,
});

/**
 * Normaliza la respuesta paginada de Spring Data — soporta tanto el formato
 * legacy (number, size, totalElements en root) como el nuevo PagedModel
 * (con los datos dentro de .page).
 */
function normalizePageResponse<T>(raw: any, fallbackPage: number, fallbackSize: number): PageResponse<T> {
  return {
    content: raw.content ?? [],
    totalElements: raw.page?.totalElements ?? raw.totalElements ?? 0,
    totalPages: raw.page?.totalPages ?? raw.totalPages ?? 0,
    number: raw.page?.number ?? raw.number ?? fallbackPage,
    size: raw.page?.size ?? raw.size ?? fallbackSize,
  };
}

/**
 * Historial de envíos de un formulario, paginado server-side.
 * @param page 0-based, igual que Spring Data.
 */
export async function getFormSubmissionsPage(
  userId: string,
  formType: string,
  page: number,
  size: number,
): Promise<PageResponse<FormSubmission>> {
  const res = await backendFetch(
    `/api/v1/admin/users/${userId}/forms/${formType}/submissions?page=${page}&size=${size}`,
    { context: 'ADMIN_USER_FORMS' },
  );

  if (!res.ok) {
    console.error(`[ADMIN_USER_FORMS] Error ${res.status} al obtener historial de envíos (${formType})`);
    return EMPTY_PAGE(page, size);
  }

  const raw: PageResponse<FormSubmissionBackend> = await res.json();
  const normalized = normalizePageResponse<FormSubmissionBackend>(raw, page, size);
  return { ...normalized, content: normalized.content.map(mapSubmission) };
}

/**
 * Historial de verificaciones de un formulario, paginado server-side.
 * @param page 0-based, igual que Spring Data.
 */
export async function getFormVerificationsPage(
  userId: string,
  formType: string,
  page: number,
  size: number,
): Promise<PageResponse<VerificationHistoryEntry>> {
  const res = await backendFetch(
    `/api/v1/admin/users/${userId}/forms/${formType}/verifications?page=${page}&size=${size}`,
    { context: 'ADMIN_USER_FORMS' },
  );

  if (!res.ok) {
    console.error(`[ADMIN_USER_FORMS] Error ${res.status} al obtener historial de verificaciones (${formType})`);
    return EMPTY_PAGE(page, size);
  }

  const raw = await res.json();
  return normalizePageResponse<VerificationHistoryEntry>(raw, page, size);
}

// ── Bank Account Sensitive Data ───────────────────────────────────────────────

export interface BankAccountFullData {
  bankName: string;
  accountType: string;
  cci: string;
  accountNumber: string;
  accountNumberLastDigits: string;
}

export async function getAdminBankAccountFullData(userId: string): Promise<BankAccountFullData | null> {
  const res = await backendFetch(`/api/v1/admin/users/${userId}/forms/bank-account/sensitive`, {
    context: 'ADMIN_BANK_SENSITIVE',
  });

  if (!res.ok) {
    console.error(`[ADMIN_BANK_SENSITIVE] Error ${res.status}`);
    return null;
  }

  return res.json();
}
