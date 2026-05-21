'use server';

import { requireValidSession } from './auth.actions';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

// ── Config ────────────────────────────────────────────────────────────────────

const CONTRATOS_URL = process.env.CONTRATOS_API_URL ?? 'http://localhost:8081';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

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

// ── Helper fetch para el microservicio de contratos ────────────────────────────

async function contractsFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const method = options.method ?? 'GET';
  const fullUrl = `${CONTRATOS_URL}${path}`;

  console.log(`[CONTRACTS] → ${method} ${path}`);

  let token: string | undefined;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch (err) {
    console.error('[CONTRACTS] ❌ Error al obtener access token:', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: 'token_error' }), { status: 401 });
  }

  if (!token) {
    console.warn('[CONTRACTS] ⚠️ Token vacío');
    return new Response(JSON.stringify({ error: 'no_token' }), { status: 401 });
  }

  const startMs = Date.now();
  let res: Response;

  try {
    res = await fetch(fullUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> ?? {}),
      },
    });
  } catch (err) {
    const elapsed = Date.now() - startMs;
    console.error(`[CONTRACTS] ❌ Network error (${elapsed}ms):`, err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: 'network_error' }), { status: 503 });
  }

  const elapsed = Date.now() - startMs;
  const emoji = res.ok ? '✅' : '⚠️';
  console.log(`[CONTRACTS] ← ${emoji} ${res.status} ${res.statusText} (${elapsed}ms)`);

  return res;
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Obtiene el estado del contrato para una solicitud.
 * GET /contracts/application/{applicationId}
 *
 * Retorna null si no existe (404).
 */
export async function getContractInfoAction(applicationId: string): Promise<ContractInfo | null> {
  await requireValidSession();

  try {
    const res = await contractsFetch(`/contracts/application/${applicationId}`);

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
    console.error('[CONTRACTS] Error al obtener info del contrato:', err);
    return null;
  }
}

/**
 * Obtiene el HTML del contrato para renderizar en pantalla.
 * GET /contracts/{contractId}/html
 *
 * Retorna el HTML como string, o null si no existe.
 */
export async function getContractHtmlAction(contractId: string): Promise<string | null> {
  await requireValidSession();

  try {
    const res = await contractsFetch(`/contracts/${contractId}/html`);

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const html = await res.text();
    return html;
  } catch (err) {
    console.error('[CONTRACTS] Error al obtener HTML del contrato:', err);
    return null;
  }
}

/**
 * Obtiene la URL prefirmada del PDF del contrato.
 * GET /contracts/{contractId}/pdf
 *
 * Solo disponible después de firmar.
 * Retorna la URL o null si no está disponible.
 */
export async function getContractPdfUrlAction(contractId: string): Promise<string | null> {
  await requireValidSession();

  try {
    const res = await contractsFetch(`/contracts/${contractId}/pdf`);

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data = await res.json();
    return data.pdfUrl ?? null;
  } catch (err) {
    console.error('[CONTRACTS] Error al obtener PDF del contrato:', err);
    return null;
  }
}
