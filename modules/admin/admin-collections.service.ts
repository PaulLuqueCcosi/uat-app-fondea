/**
 * Service para la sección de Cobranza (M3 — Collections).
 * Endpoints: /api/v1/admin/collections/*
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { SpringPage, Pagination } from './admin-users.types';
import type {
  AdminMoraClientRow,
  MoraClientsFilters,
  PaymentAgreement,
  AgreementInstallment,
} from './admin-collections.types';

// ── Resultado paginado ───────────────────────────────────────────────────────

export interface AdminMoraClientsResult {
  data: AdminMoraClientRow[];
  pagination: Pagination;
}

// ── R24 — Mora Clients (server-side) ─────────────────────────────────────────

export async function getAdminMoraClients(
  page: number,
  pageSize: number,
  filters: MoraClientsFilters = {},
): Promise<AdminMoraClientsResult> {
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: String(backendPage),
    size: String(pageSize),
  });

  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.city) params.set('city', filters.city);
  if (filters.managementStatus) params.set('managementStatus', filters.managementStatus);
  if (filters.minDaysOverdue) params.set('minDaysOverdue', String(filters.minDaysOverdue));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortDir) params.set('sortDir', filters.sortDir);

  const res = await backendFetch(`/api/v1/admin/collections/mora-clients?${params.toString()}`, {
    context: 'COLLECTIONS_MORA',
  });

  if (!res.ok) {
    console.error(`[COLLECTIONS] Error ${res.status} al listar clientes en mora`);
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
    };
  }

  const body: SpringPage<any> = await res.json();

  const totalItems = body.page?.totalElements ?? body.totalElements ?? 0;
  const totalPages = body.page?.totalPages ?? body.totalPages ?? 0;

  const data: AdminMoraClientRow[] = (body.content || []).map((row: any) => ({
    creditId: row.credit_id,
    userId: row.user_id,
    clientName: row.client_name ?? 'Sin nombre',
    clientDocument: row.client_document ?? '',
    originalAmount: row.original_amount ?? 0,
    pendingBalance: row.pending_balance ?? 0,
    accruedPenalty: row.accrued_penalty ?? 0,
    daysOverdue: row.days_overdue ?? 0,
    managementStatus: row.management_status ?? null,
  }));

  return {
    data,
    pagination: { page, pageSize, totalItems, totalPages },
  };
}

// ── R25 — Payment Agreements (server-side) ───────────────────────────────────

export async function getAdminPaymentAgreements(): Promise<PaymentAgreement[]> {
  const res = await backendFetch('/api/v1/admin/collections/payment-agreements', {
    context: 'COLLECTIONS_AGREEMENTS',
  });

  if (!res.ok) {
    console.error(`[COLLECTIONS] Error ${res.status} al listar acuerdos de pago`);
    return [];
  }

  const body: any[] = await res.json();

  return body.map((row: any) => ({
    agreementId: row.agreement_id,
    creditId: row.credit_id,
    clientName: row.client_name ?? 'Sin nombre',
    clientDocument: row.client_document ?? '',
    totalAmount: row.total_amount ?? 0,
    installments: (row.installments || []).map((inst: any): AgreementInstallment => ({
      installmentNo: inst.installment_no,
      amount: inst.amount ?? 0,
      dueDate: inst.due_date,
      daysUntilDue: inst.days_until_due ?? null,
      paid: inst.paid ?? false,
    })),
  }));
}
