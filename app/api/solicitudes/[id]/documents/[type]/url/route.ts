/**
 * GET /api/solicitudes/{id}/documents/{type}/url
 *
 * Proxy → GET /api/v1/applications/{id}/documents/{type}/url
 * URL prefirmada de un documento para preview.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../../../../helpers';

type RouteContext = { params: Promise<{ id: string; type: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id, type } = await context.params;
    const res = await backendFetch(`/api/v1/applications/${id}/documents/${type}/url`);
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/solicitudes/[id]/documents/[type]/url → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
