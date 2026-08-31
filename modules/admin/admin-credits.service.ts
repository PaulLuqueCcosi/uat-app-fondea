/**
 * Service para listar créditos desde el admin (M2 Portfolio).
 * Usa el nuevo endpoint /api/v1/admin/portfolio/credits con filtros extendidos.
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { SpringPage, Pagination } from './admin-users.types';

// ── Tipos ───────────────────────────────────────────────────────────────────

// El enum vive en `credit-status-labels.ts` junto a sus etiquetas — se reexporta acá para
// no romper los imports existentes, pero no se redeclara.
import type { CreditStatus } from './credit-status-labels';
export type { CreditStatus } from './credit-status-labels';

export type CreditTypeFilter = 'STANDARD' | 'NEGOTIATION';

export interface AdminCreditRow {
  id: string;
  userId: string;
  // Cliente
  clientName: string | null;
  clientDocument: string | null;
  // Crédito
  principal: number;
  totalDue: number;
  pendingBalance: number;
  disbursedAt: string | null;
  maturityDate: string;
  daysRemaining: number;
  status: CreditStatus;
  termDays: number;
  interestRate: number;
  installmentCount: number;
  // Ubicación (códigos ubigeo)
  ubigeoRegion: string | null;
  ubigeoProvince: string | null;
  ubigeoDistrict: string | null;
  // Contexto
  fondeaScore: number | null;
  passportPoints: number | null;
}

export interface AdminCreditsResult {
  data: AdminCreditRow[];
  pagination: Pagination;
}

// ── Filtros ─────────────────────────────────────────────────────────────────

export interface CreditFilters {
  search?: string;
  status?: CreditStatus;
  creditType?: CreditTypeFilter;
  city?: string;
  termDays?: number;
  minAmount?: number;
  maxAmount?: number;
  disbursedFrom?: string; // ISO date
  disbursedTo?: string;
  overdueOnly?: boolean;
  minDaysMora?: number;
  passportLevel?: string;  // BRONCE, PLATA, ORO, MASTER
}

// ── Service ─────────────────────────────────────────────────────────────────

export async function getAdminCredits(
  page: number,
  pageSize: number,
  filters: CreditFilters = {},
): Promise<AdminCreditsResult> {
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: String(backendPage),
    size: String(pageSize),
  });

  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.status) params.set('status', filters.status);
  if (filters.creditType) params.set('creditType', filters.creditType);
  if (filters.city) params.set('city', filters.city);
  if (filters.termDays) params.set('termDays', String(filters.termDays));
  if (filters.minAmount) params.set('minAmount', String(filters.minAmount));
  if (filters.maxAmount) params.set('maxAmount', String(filters.maxAmount));
  if (filters.disbursedFrom) params.set('disbursedFrom', filters.disbursedFrom);
  if (filters.disbursedTo) params.set('disbursedTo', filters.disbursedTo);
  if (filters.overdueOnly) params.set('overdueOnly', 'true');
  if (filters.minDaysMora) params.set('minDaysMora', String(filters.minDaysMora));
  if (filters.passportLevel) params.set('passportLevel', filters.passportLevel);

  const res = await backendFetch(`/api/v1/admin/portfolio/credits?${params.toString()}`, {
    context: 'PORTFOLIO_CREDITS',
  });

  if (!res.ok) {
    console.error(`[PORTFOLIO] Error ${res.status} al listar créditos`);
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
    };
  }

  const body: SpringPage<any> = await res.json();

  const responsePageSize = body.page?.size ?? body.size ?? 20;
  const totalItems = body.page?.totalElements ?? body.totalElements ?? 0;
  const totalPages = body.page?.totalPages ?? body.totalPages ?? 0;

  // Mapear snake_case del backend a camelCase
  const data: AdminCreditRow[] = (body.content || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    clientName: row.client_name,
    clientDocument: row.client_document,
    principal: row.principal ?? 0,
    totalDue: row.total_due ?? 0,
    pendingBalance: row.pending_balance ?? 0,
    disbursedAt: row.disbursed_at,
    maturityDate: row.maturity_date,
    daysRemaining: row.days_remaining ?? 0,
    status: row.status,
    termDays: row.term_days ?? 0,
    interestRate: row.interest_rate ?? 0,
    installmentCount: row.installment_count ?? 0,
    // Ubicación: soporta nuevo (ubigeo_*) y viejo (city)
    ubigeoRegion: row.ubigeo_region ?? (row.city ? row.city.substring(0, 2) : null),
    ubigeoProvince: row.ubigeo_province ?? (row.city && row.city.length >= 4 ? row.city.substring(0, 4) : null),
    ubigeoDistrict: row.ubigeo_district ?? row.city ?? null,
    fondeaScore: row.fondea_score,
    passportPoints: row.passport_points,
  }));

  return {
    data,
    pagination: { page, pageSize: responsePageSize, totalItems, totalPages },
  };
}
