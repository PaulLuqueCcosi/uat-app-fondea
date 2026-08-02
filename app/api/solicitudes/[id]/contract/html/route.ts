/**
 * GET /api/solicitudes/{id}/contract/html?contractId=xxx
 *
 * Proxy → GET /api/v1/applications/{id}/contract/{contractId}/html
 * Devuelve el HTML del contrato para renderizar.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '../../../helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const contractId = request.nextUrl.searchParams.get('contractId');
    if (!contractId) {
      return NextResponse.json({ error: 'contractId is required' }, { status: 400 });
    }
    const res = await backendFetch(`/api/v1/applications/${id}/contract/${contractId}/html`);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'text/html' },
    });
  } catch (error) {
    console.error('[API] GET /api/solicitudes/[id]/contract/html → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
