/**
 * Service para obtener el detalle de un crédito desde el admin.
 */

import { backendFetch } from '@/lib/backend-fetch';

// ── Types ───────────────────────────────────────────────────────────────────

export type CreditStatus = 'ACTIVE' | 'OVERDUE' | 'DEFAULTED' | 'PAID_OFF';
export type InstallmentStatus = 'PENDING' | 'CURRENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export interface CreditDetail {
  id: string;
  status: CreditStatus;
  principal: number;
  total_due: number;
  total_paid: number;
  total_penalty: number;
  total_outstanding: number;
  installment_count: number;
  installments_completed: number;
  installments_overdue: number;
  disbursed_at: string | null;
  first_due_date: string;
  maturity_date: string;
  overdue_since: string | null;
  closed_at: string | null;
  penalty_config?: {
    id: string;
    name: string;
    is_active: boolean;
    ranges: { fromDay: number; toDay: number | null; type: string; value: number; base: string | null; label: string | null; color: string | null }[];
  };
}

export interface InstallmentItem {
  id: string;
  installment_no: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  penalty_accrued: number;
  penalty_paid: number;
  outstanding: number;
  status: InstallmentStatus;
  days_overdue: number;
  paid_at: string | null;
}

export interface CreditAuditEvent {
  id: string;
  loanId: string;
  eventType: string;
  description: string;
  snapshotBefore: string | null;
  snapshotAfter: string | null;
  triggeredBy: string;
  createdAt: string;
}

export interface InstallmentAuditEvent {
  id: string;
  loanId: string;
  installmentId: string;
  installmentNo: number;
  eventType: string;
  description: string;
  snapshotBefore: string | null;
  snapshotAfter: string | null;
  triggeredBy: string;
  createdAt: string;
}

export interface AdminCreditFullDetail {
  credit: CreditDetail;
  installments: InstallmentItem[];
  creditAudit: CreditAuditEvent[];
  installmentAudit: InstallmentAuditEvent[];
}

// ── Service ─────────────────────────────────────────────────────────────────

export async function getAdminCreditDetail(creditId: string): Promise<AdminCreditFullDetail | null> {
  const [creditRes, installmentsRes, creditAuditRes, installmentAuditRes] = await Promise.all([
    backendFetch(`/api/v1/admin/credits/${creditId}/detail`, { context: 'ADMIN_CREDIT_DETAIL' }),
    backendFetch(`/api/v1/admin/credits/${creditId}/installments`, { context: 'ADMIN_CREDIT_INSTALLMENTS' }),
    backendFetch(`/api/v1/admin/credits/${creditId}/audit`, { context: 'ADMIN_CREDIT_AUDIT' }),
    backendFetch(`/api/v1/admin/credits/${creditId}/installments/audit`, { context: 'ADMIN_INSTALLMENT_AUDIT' }),
  ]);

  if (!creditRes.ok) {
    console.error(`[ADMIN_CREDIT_DETAIL] Error ${creditRes.status}`);
    return null;
  }

  const credit: CreditDetail = await creditRes.json();
  const installmentsBody = installmentsRes.ok ? await installmentsRes.json() : { installments: [] };
  const creditAudit: CreditAuditEvent[] = creditAuditRes.ok ? await creditAuditRes.json() : [];
  const installmentAudit: InstallmentAuditEvent[] = installmentAuditRes.ok ? await installmentAuditRes.json() : [];

  return {
    credit,
    installments: installmentsBody.installments ?? [],
    creditAudit,
    installmentAudit,
  };
}
