/**
 * POST /api/buro/me/consult
 *
 * Proxy autenticado → POST /api/v1/buro/me/consult
 * Solicita una nueva consulta al buró crediticio.
 */

import { NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '@/lib/backend-fetch';

export async function POST() {
  try {
    const res = await backendFetch('/api/v1/buro/me/consult', { method: 'POST', context: 'API_PROXY' });
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] POST /api/buro/me/consult → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
