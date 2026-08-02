/**
 * GET /api/solicitudes/{id}/contract/pdf?contractId=xxx
 *
 * Proxy → GET /api/v1/applications/{id}/contract/{contractId}/pdf
 * Devuelve { pdfUrl } — URL prefirmada del PDF firmado. 404 si aún no fue firmado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../../../helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const contractId = request.nextUrl.searchParams.get('contractId');
    if (!contractId) {
      return NextResponse.json({ error: 'contractId is required' }, { status: 400 });
    }
    const res = await backendFetch(`/api/v1/applications/${id}/contract/${contractId}/pdf`);
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/solicitudes/[id]/contract/pdf → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
