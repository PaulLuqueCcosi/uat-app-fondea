/**
 * GET /api/buro/me
 *
 * Proxy autenticado → GET /api/v1/buro/me
 * Devuelve el último reporte del buró crediticio del usuario.
 */

import { NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../../intenciones/helpers';

export async function GET() {
  try {
    const res = await backendFetch('/api/v1/buro/me');
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/buro/me → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
