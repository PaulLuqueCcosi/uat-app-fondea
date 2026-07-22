/**
 * GET /api/admin/calculator-options?availabilityVersionId=xxx
 *
 * Proxy → GET /api/admin/pricing/products/{productId}/options?availabilityVersionId=xxx
 *
 * Espejo del endpoint público GET /api/products/{id}/options pero con versión elegible.
 * Sin availabilityVersionId → usa la versión ACTIVE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const CALCULATOR_URL = process.env.CALCULATOR_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;
const PRODUCT_ID = process.env.NEXT_PUBLIC_PRODUCT_ID ?? '550e8400-e29b-41d4-a716-446655440000';

export async function GET(request: NextRequest) {
  const availabilityVersionId = request.nextUrl.searchParams.get('availabilityVersionId');

  let token: string;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = new URLSearchParams();
    if (availabilityVersionId) params.set('availabilityVersionId', availabilityVersionId);

    const url = `${CALCULATOR_URL}/api/admin/pricing/products/${PRODUCT_ID}/options?${params}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[ADMIN:calculator-options] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
