/**
 * GET /api/solicitudes/{id}/contract
 *
 * Proxy → GET /api/v1/applications/{id}/contract (backend Java, módulo contracts)
 * Devuelve info del contrato (status, fechas, contractId).
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../../helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/v1/applications/${id}/contract`);
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/solicitudes/[id]/contract → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
