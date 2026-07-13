/**
 * Tipos para el módulo admin de usuarios.
 */

/** Respuesta del backend: resumen de usuario para listados admin. */
export interface AdminUserSummaryBackend {
  id: string;
  logtoId: string;
  firstName: string | null;
  secondName: string | null;
  paternalSurname: string | null;
  maternalSurname: string | null;
  additionalNames: string | null;
  documentType: string | null;
  documentNumber: string | null;
  createdAt: string;
}

/** Fila de usuario para la tabla del admin (lo que usa el frontend). */
export interface AdminUserRow {
  id: string;
  name: string;
  documentType: string | null;
  documentNumber: string | null;
  registeredAt: string;
}

/** Respuesta paginada del backend (Spring PagedModel con VIA_DTO). */
export interface SpringPage<T> {
  content: T[];
  /** Nuevo formato Spring Data Web PagedModel */
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  /** Legacy format (sin VIA_DTO) — mantenido para compatibilidad */
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

/** Paginación normalizada para el frontend. */
export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/** Resultado paginado de usuarios para el frontend. */
export interface AdminUsersResult {
  data: AdminUserRow[];
  pagination: Pagination;
}
