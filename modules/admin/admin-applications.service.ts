/**
 * Service para listar solicitudes desde el admin.
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { SpringPage, Pagination } from './admin-users.types';
import type { ApplicationStatus } from './mock-data';
export type { ApplicationStatus } from './mock-data';

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface AdminApplicationRow {
  id: string;
  userId: string;
  userName: string | null;
  userDocument: string | null;
  userIntentionId: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  evaluatedAt: string | null;
  creditScore: number | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface AdminApplicationsResult {
  data: AdminApplicationRow[];
  pagination: Pagination;
}

// ── Service ─────────────────────────────────────────────────────────────────

export interface ApplicationFilters {
  search?: string;
  status?: ApplicationStatus;
  submittedFrom?: string; // ISO date: YYYY-MM-DD
  submittedTo?: string;
  scoreMin?: number;
  scoreMax?: number;
}

export async function getAdminApplications(
  page: number,
  pageSize: number,
  filters: ApplicationFilters = {},
): Promise<AdminApplicationsResult> {
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: String(backendPage),
    size: String(pageSize),
  });

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.submittedFrom) {
    params.set('submittedFrom', filters.submittedFrom + 'T00:00:00');
  }
  if (filters.submittedTo) {
    params.set('submittedTo', filters.submittedTo + 'T23:59:59');
  }
  if (filters.scoreMin != null) {
    params.set('scoreMin', String(filters.scoreMin));
  }
  if (filters.scoreMax != null) {
    params.set('scoreMax', String(filters.scoreMax));
  }

  const res = await backendFetch(`/api/v1/admin/applications?${params.toString()}`, {
    context: 'ADMIN_APPLICATIONS',
  });

  if (!res.ok) {
    console.error(`[ADMIN_APPLICATIONS] Error ${res.status} al listar solicitudes`);
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
    };
  }

  const body: SpringPage<AdminApplicationRow> = await res.json();

  const responsePageSize = body.page?.size ?? body.size ?? 20;
  const totalItems = body.page?.totalElements ?? body.totalElements ?? 0;
  const totalPages = body.page?.totalPages ?? body.totalPages ?? 0;

  return {
    data: body.content,
    pagination: {
      page,
      pageSize: responsePageSize,
      totalItems,
      totalPages,
    },
  };
}
