/**
 * GET /api/solicitudes/{id}/contract/html
 *
 * Proxy → GET /api/v1/applications/{id}/contract/html (backend Java, módulo contracts)
 * Devuelve el HTML del contrato para renderizar (borrador sin firmar, o firmado).
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '../../../helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/v1/applications/${id}/contract/html`);
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
