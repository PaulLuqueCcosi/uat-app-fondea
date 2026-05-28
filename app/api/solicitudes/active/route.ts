/**
 * GET /api/solicitudes/active
 *
 * Proxy → GET /api/v1/applications/active
 * Devuelve la solicitud activa del usuario o 404 si no tiene.
 */

import { NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../helpers';

export async function GET() {
  try {
    const res = await backendFetch('/api/v1/applications/active');
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/solicitudes/active → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
