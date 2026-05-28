/**
 * GET /api/solicitudes/{id}/contract/pdf
 *
 * Proxy → GET /contracts/{contractId}/pdf (microservicio de contratos)
 * Devuelve la URL prefirmada del PDF del contrato.
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

    const res = await contractsFetch(`/contracts/${contractId}/pdf`);
    return proxyContractsResponse(res);
  } catch (error) {
    console.error('[API] GET /api/solicitudes/[id]/contract/pdf → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
