/**
 * GET /api/solicitudes/{id}/contract
 *
 * Proxy → GET /contracts/application/{id} (microservicio de contratos)
 * Devuelve info del contrato (status, fechas, contractId).
 */

import { NextRequest, NextResponse } from 'next/server';
import { contractsFetch, proxyContractsResponse } from '../../helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const res = await contractsFetch(`/contracts/application/${id}`);
    return proxyContractsResponse(res);
  } catch (error) {
    console.error('[API] GET /api/solicitudes/[id]/contract → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
