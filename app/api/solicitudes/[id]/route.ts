/**
 * GET /api/solicitudes/{id}
 *
 * Proxy → GET /api/v1/applications/{id}
 * Devuelve el detalle básico de una solicitud.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/v1/applications/${id}`);
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/solicitudes/[id] → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
