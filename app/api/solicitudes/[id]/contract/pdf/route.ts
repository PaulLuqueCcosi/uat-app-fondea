/**
 * GET /api/solicitudes/{id}/contract/pdf
 *
 * Proxy → GET /api/v1/applications/{id}/contract/pdf (backend Java, módulo contracts)
 * Devuelve { pdfUrl } — URL prefirmada del PDF firmado. 404 si aún no fue firmado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../../../helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/v1/applications/${id}/contract/pdf`);
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/solicitudes/[id]/contract/pdf → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
