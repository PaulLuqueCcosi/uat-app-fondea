/**
 * GET /api/solicitudes/{id}/contract/html
 *
 * Proxy → GET /contracts/{contractId}/html (microservicio de contratos)
 * Devuelve el HTML del contrato para renderizar.
 *
 * Requiere ?contractId=... como query param.
 */

import { NextRequest, NextResponse } from 'next/server';
import { contractsFetch, proxyContractsResponse } from '../../../helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const contractId = request.nextUrl.searchParams.get('contractId');
    if (!contractId) {
      return NextResponse.json({ error: 'contractId is required' }, { status: 400 });
    }

    const res = await contractsFetch(`/contracts/${contractId}/html`);
    return proxyContractsResponse(res, 'text/html');
  } catch (error) {
    console.error('[API] GET /api/solicitudes/[id]/contract/html → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
