/**
 * Tipos para el módulo admin de Constancias de No Adeudo.
 * Reflejan los DTOs del backend (pe.com.fondea.backend.constancias).
 */

export type CertificateStatus = 'PENDING' | 'ISSUED' | 'FAILED';

export type CertificateDeliveryStatus = 'NOT_SENT' | 'SENT' | 'DELIVERY_FAILED';

export interface PayoffCertificate {
  id: string;
  creditId: string;
  userId: string;
  certificateCode: string;
  status: CertificateStatus;
  deliveryStatus: CertificateDeliveryStatus;
  failureReason: string | null;
  generationAttempts: number;
  sentAt: string | null;
  issuedAt: string | null;
  createdAt: string;
  downloadable: boolean;
  /** El cliente ya recibió un documento con este código — advertir antes de recrear. */
  alreadySent: boolean;
}

export interface CertificateStats {
  issued: number;
  pending: number;
  failed: number;
  notSent: number;
  sent: number;
  deliveryFailed: number;
}

export interface CertificateSearchParams {
  status?: CertificateStatus;
  deliveryStatus?: CertificateDeliveryStatus;
  userId?: string;
  /** 0-based, igual que el backend (Spring Data). */
  page?: number;
  size?: number;
}

/**
 * Respuesta paginada del backend. El backend serializa con
 * {@code PageSerializationMode.VIA_DTO} (PagedModel) — el total viene anidado en
 * {@code page.totalElements}, no en la raíz. Se soporta también el formato legado por si
 * algún endpoint no usa VIA_DTO.
 */
export interface SpringPage<T> {
  content: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

/** Paginación normalizada para el frontend (1-based, como el resto del admin). */
export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// ── Template ──────────────────────────────────────────────────────────────────

export interface CertificateTemplateVersion {
  id: string;
  code: string;
  name: string;
  version: number;
  htmlContent: string;
  cssContent: string | null;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export type CertificateVariableFormat = 'TEXT' | 'NUMBER' | 'CURRENCY' | 'DATE' | 'BOOLEAN';

export interface CertificateVariable {
  key: string;
  label: string;
  description: string;
  format: CertificateVariableFormat;
  usage: string;
}

export const CERTIFICATE_STATUS_LABELS: Record<CertificateStatus, string> = {
  PENDING: 'Pendiente',
  ISSUED: 'Emitida',
  FAILED: 'Fallida',
};

export const DELIVERY_STATUS_LABELS: Record<CertificateDeliveryStatus, string> = {
  NOT_SENT: 'No enviada',
  SENT: 'Enviada',
  DELIVERY_FAILED: 'Envío fallido',
};
