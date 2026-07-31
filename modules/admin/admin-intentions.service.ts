/**
 * Service para intenciones de préstamo (admin) — solo lectura.
 * Endpoints:
 * - GET /api/v1/admin/intentions — intenciones de usuario
 * - GET /api/v1/admin/calculator-intentions — intenciones anónimas (proxy)
 *
 * El embudo de conversión vive en admin-funnel.service.ts (funcionalidad separada).
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminIntentionResponse {
  id: string;
  userId: string;
  userName: string | null;
  productId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean;
  status: 'ACTIVE' | 'LOCKED' | 'CANCELLED' | 'REPLACED';
  calculatorIntentionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminIntentionsResult {
  data: AdminIntentionResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Lista intenciones con paginación y filtros opcionales.
 * Frontend usa page 1-based, backend 0-based.
 */
export async function getAdminIntentions(
  page: number,
  pageSize: number,
  options?: {
    status?: string;
    from?: string;
    to?: string;
    amountMin?: string;
    amountMax?: string;
    termDays?: string;
    installmentCount?: string;
    isFirstLoan?: string;
    sort?: string; // ej: amount,asc
    search?: string;
  },
): Promise<AdminIntentionsResult> {
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: String(backendPage),
    size: String(pageSize),
  });

  if (options?.status) params.set('status', options.status);
  if (options?.from) params.set('from', options.from);
  if (options?.to) params.set('to', options.to);
  if (options?.amountMin) params.set('amountMin', options.amountMin);
  if (options?.amountMax) params.set('amountMax', options.amountMax);
  if (options?.termDays) params.set('termDays', options.termDays);
  if (options?.installmentCount) params.set('installmentCount', options.installmentCount);
  if (options?.isFirstLoan) params.set('isFirstLoan', options.isFirstLoan);
  if (options?.sort) params.set('sort', options.sort);
  if (options?.search) params.set('search', options.search);

  const res = await backendFetch(`/api/v1/admin/intentions?${params.toString()}`, {
    context: 'ADMIN_INTENTIONS',
  });

  if (!res.ok) {
    console.error(`[ADMIN_INTENTIONS] Error ${res.status}`);
    return { data: [], pagination: { page, pageSize, totalItems: 0, totalPages: 0 } };
  }

  const body = await res.json();

  // Normalizar paginación: soporta PagedModel (VIA_DTO) y legacy Page
  const responsePageSize = body.page?.size ?? body.size ?? pageSize;
  const totalItems = body.page?.totalElements ?? body.totalElements ?? 0;
  const totalPages = body.page?.totalPages ?? body.totalPages ?? 0;

  return {
    data: (body.content ?? []) as AdminIntentionResponse[],
    pagination: {
      page,
      pageSize: responsePageSize,
      totalItems,
      totalPages,
    },
  };
}

// ── Intenciones anónimas (landing) ────────────────────────────────────────────

export interface AnonymousIntention {
  id: string;
  productId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean;
  selectedRangeCode: string | null;
  clientIp: string | null;
  createdAt: string;
}

export interface AnonymousIntentionsResult {
  data: AnonymousIntention[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export async function getAdminAnonymousIntentions(
  page: number,
  pageSize: number,
  options?: {
    from?: string;
    to?: string;
    amountMin?: string;
    amountMax?: string;
    termDays?: string;
    installmentCount?: string;
    clientIp?: string;
  },
): Promise<AnonymousIntentionsResult> {
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: String(backendPage),
    size: String(pageSize),
  });
  if (options?.from) params.set('from', options.from);
  if (options?.to) params.set('to', options.to);
  if (options?.amountMin) params.set('amountMin', options.amountMin);
  if (options?.amountMax) params.set('amountMax', options.amountMax);
  if (options?.termDays) params.set('termDays', options.termDays);
  if (options?.installmentCount) params.set('installmentCount', options.installmentCount);
  if (options?.clientIp) params.set('clientIp', options.clientIp);

  const res = await backendFetch(
    `/api/v1/admin/calculator-intentions?${params.toString()}`,
    { context: 'ADMIN_ANONYMOUS_INTENTIONS' },
  );

  if (!res.ok) {
    console.error(`[ADMIN_ANONYMOUS_INTENTIONS] Error ${res.status}`);
    return { data: [], pagination: { page, pageSize, totalItems: 0, totalPages: 0 } };
  }

  const body = await res.json();

  // Normalizar paginación Spring Data Page (VIA_DTO)
  const responsePageSize = body.page?.size ?? pageSize;
  const totalItems = body.page?.totalElements ?? 0;
  const totalPages = body.page?.totalPages ?? 0;

  return {
    data: (body.content ?? []) as AnonymousIntention[],
    pagination: {
      page,
      pageSize: responsePageSize,
      totalItems,
      totalPages,
    },
  };
}
