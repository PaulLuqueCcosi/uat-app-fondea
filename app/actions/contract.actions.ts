'use server';

import { requireValidSession } from './auth.actions';
import { backendFetch as _backendFetch } from '@/lib/backend-fetch';

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'CONTRACT' });

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type ContractStatus = 'GENERATED' | 'SIGNED' | 'EXPIRED';

export interface ContractInfo {
  contractId: string;
  applicationId: string;
  documentTypeCode: string | null;
  documentTypeName: string | null;
  status: ContractStatus;
  generatedAt: string;
  signedAt: string | null;
  expiredAt: string | null;
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Lista los documentos contractuales de una solicitud (puede haber más de uno).
 * GET /api/v1/applications/{applicationId}/contract
 *
 * Retorna [] si no hay documentos o si la consulta falla.
 */
export async function getContractsAction(applicationId: string): Promise<ContractInfo[]> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/contract`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((c) => ({
      contractId: c.contractId,
      applicationId: c.applicationId,
      documentTypeCode: c.documentTypeCode ?? null,
      documentTypeName: c.documentTypeName ?? null,
      status: c.status as ContractStatus,
      generatedAt: c.generatedAt,
      signedAt: c.signedAt ?? null,
      expiredAt: c.expiredAt ?? null,
    }));
  } catch (err) {
    console.error('[CONTRACT] Error al listar los documentos:', err);
    return [];
  }
}

/**
 * Obtiene el HTML de un documento para renderizar en pantalla.
 * GET /api/v1/applications/{applicationId}/contract/{contractId}/html
 *
 * Retorna el HTML como string, o null si no existe.
 */
export async function getContractHtmlAction(applicationId: string, contractId: string): Promise<string | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/contract/${contractId}/html`);
    if (!res.ok) return null;

    return await res.text();
  } catch (err) {
    console.error('[CONTRACT] Error al obtener HTML del documento:', err);
    return null;
  }
}

/**
 * Obtiene la URL prefirmada del PDF de un documento.
 * GET /api/v1/applications/{applicationId}/contract/{contractId}/pdf
 *
 * Solo disponible después de firmar.
 * Retorna la URL o null si no está disponible.
 */
export async function getContractPdfUrlAction(applicationId: string, contractId: string): Promise<string | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/contract/${contractId}/pdf`);
    if (!res.ok) return null;

    const data = await res.json();
    return data.pdfUrl ?? null;
  } catch (err) {
    console.error('[CONTRACT] Error al obtener PDF del documento:', err);
    return null;
  }
}
