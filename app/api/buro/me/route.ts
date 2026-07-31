/**
 * GET /api/buro/me
 *
 * Proxy autenticado → GET /api/v1/buro/me
 * Devuelve el último reporte del buró crediticio del usuario.
 */

import { NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '@/lib/backend-fetch';

export async function GET() {
  try {
    const res = await backendFetch('/api/v1/buro/me', { context: 'API_PROXY' });
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/buro/me → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
