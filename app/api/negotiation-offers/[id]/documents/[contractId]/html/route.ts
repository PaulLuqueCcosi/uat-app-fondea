/**
 * GET /api/negotiation-offers/[id]/documents/[contractId]/html
 *
 * Proxy para obtener el HTML de un documento de negociación (pre-firma).
 * Backend: GET /api/v1/negotiation-offers/{id}/documents/{contractId}/html
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> },
) {
  const { id, contractId } = await params;

  let token: string | undefined;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch {
    return new NextResponse('No autorizado', { status: 401 });
  }

  if (!token) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  try {
    const url = `${BACKEND_URL}/api/v1/negotiation-offers/${id}/documents/${contractId}/html`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/html',
      },
    });

    if (!res.ok) {
      return new NextResponse('Documento no encontrado', { status: res.status });
    }

    const html = await res.text();
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch {
    return new NextResponse('Error de conexión', { status: 503 });
  }
}
