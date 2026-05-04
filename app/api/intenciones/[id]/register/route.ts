/**
 * POST /api/intenciones/{id}/register
 *
 * Proxy autenticado → POST /api/v1/intentions/{id}/register
 * Asocia una intención de la landing al usuario autenticado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../../helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/v1/intentions/${id}/register`, {
      method: 'POST',
    });

    return proxyResponse(res);
  } catch (error) {
    console.error('[API] POST /api/intenciones/[id]/register → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
