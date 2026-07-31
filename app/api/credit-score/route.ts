/**
 * GET /api/credit-score
 *
 * Proxy autenticado → GET /api/v1/credit-score
 * Devuelve el score crediticio del usuario (0-1000) o 404 si no tiene.
 */

import { NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '@/lib/backend-fetch';

export async function GET() {
  try {
    const res = await backendFetch('/api/v1/credit-score', { context: 'API_PROXY' });
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/credit-score → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
