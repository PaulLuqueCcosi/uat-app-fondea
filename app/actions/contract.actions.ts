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
  status: ContractStatus;
  generatedAt: string;
  signedAt: string | null;
  expiredAt: string | null;
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Obtiene el estado del contrato para una solicitud.
 * GET /api/v1/applications/{applicationId}/contract
 *
 * Retorna null si no existe (404).
 */
export async function getContractInfoAction(applicationId: string): Promise<ContractInfo | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/contract`);

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data = await res.json();
    return {
      contractId: data.contractId,
      applicationId: data.applicationId,
      status: data.status as ContractStatus,
      generatedAt: data.generatedAt,
      signedAt: data.signedAt,
      expiredAt: data.expiredAt,
    };
  } catch (err) {
    console.error('[CONTRACT] Error al obtener info del contrato:', err);
    return null;
  }
}

/**
 * Obtiene el HTML del contrato para renderizar en pantalla.
 * GET /api/v1/applications/{applicationId}/contract/html
 *
 * Retorna el HTML como string, o null si no existe.
 */
export async function getContractHtmlAction(applicationId: string): Promise<string | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/contract/html`);

    if (res.status === 404) return null;
    if (!res.ok) return null;

    return await res.text();
  } catch (err) {
    console.error('[CONTRACT] Error al obtener HTML del contrato:', err);
    return null;
  }
}

/**
 * Obtiene la URL prefirmada del PDF del contrato.
 * GET /api/v1/applications/{applicationId}/contract/pdf
 *
 * Solo disponible después de firmar.
 * Retorna la URL o null si no está disponible.
 */
export async function getContractPdfUrlAction(applicationId: string): Promise<string | null> {
  await requireValidSession();

  try {
    const res = await backendFetch(`/api/v1/applications/${applicationId}/contract/pdf`);

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data = await res.json();
    return data.pdfUrl ?? null;
  } catch (err) {
    console.error('[CONTRACT] Error al obtener PDF del contrato:', err);
    return null;
  }
}
