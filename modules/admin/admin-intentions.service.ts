/**
 * Service para intenciones de préstamo (admin).
 * Endpoints:
 * - GET /api/v1/admin/intentions — intenciones de usuario
 * - GET /api/v1/admin/calculator-intentions — intenciones anónimas (proxy)
 * - GET /api/v1/admin/calculator-intentions/funnel — embudo completo
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

/**
 * Cancela una intención (soft delete).
 */
export async function cancelAdminIntention(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await backendFetch(`/api/v1/admin/intentions/${id}`, {
    context: 'ADMIN_INTENTION_CANCEL',
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    return { ok: false, error: `Error ${res.status}` };
  }
  return { ok: true };
}

/**
 * Desbloquea una intención (LOCKED → ACTIVE).
 */
export async function unlockAdminIntention(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await backendFetch(`/api/v1/admin/intentions/${id}/unlock`, {
    context: 'ADMIN_INTENTION_UNLOCK',
    method: 'POST',
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: body || `Error ${res.status}` };
  }
  return { ok: true };
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
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getAdminAnonymousIntentions(
  page: number,
  pageSize: number,
): Promise<AnonymousIntentionsResult> {
  const backendPage = Math.max(0, page - 1);
  const res = await backendFetch(
    `/api/v1/admin/calculator-intentions?page=${backendPage}&limit=${pageSize}`,
    { context: 'ADMIN_ANONYMOUS_INTENTIONS' },
  );

  if (!res.ok) {
    console.error(`[ADMIN_ANONYMOUS_INTENTIONS] Error ${res.status}`);
    return { data: [], pagination: { page, limit: pageSize, total: 0, totalPages: 0 } };
  }

  const body = await res.json();
  return {
    data: body.data ?? [],
    pagination: body.pagination ?? { page, limit: pageSize, total: 0, totalPages: 0 },
  };
}

// ── Embudo de conversión ──────────────────────────────────────────────────────

export interface FunnelMetrics {
  period: { from: string; to: string };
  anonymousIntentions: number;
  linkedIntentions: number;
  portalIntentions: number;
  totalUserIntentions: number;
  applicationsSubmitted: number;
  applicationsApproved: number;
  conversionRates: {
    landingToRegister: number;
    intentionToApplication: number;
    applicationToApproval: number;
  };
}

export async function getAdminFunnelMetrics(): Promise<FunnelMetrics | null> {
  const res = await backendFetch('/api/v1/admin/calculator-intentions/funnel', {
    context: 'ADMIN_FUNNEL',
  });

  if (!res.ok) {
    console.error(`[ADMIN_FUNNEL] Error ${res.status}`);
    return null;
  }

  return res.json();
}
