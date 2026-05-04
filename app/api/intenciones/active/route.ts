/**
 * GET /api/intenciones/active
 *
 * Proxy autenticado → GET /api/v1/intentions/active
 * Devuelve la intención activa del usuario o 404 si no tiene.
 */

import { NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../helpers';

export async function GET() {
  try {
    const res = await backendFetch('/api/v1/intentions/active');
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/intenciones/active → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
