/**
 * POST /api/admin/simulate
 *
 * Proxy para simulación admin con versiones específicas.
 * Acepta en el body: pricingRulesVersionId, feeGroupsVersionId, availabilityVersionId
 *
 * Llama a POST /api/admin/pricing/simulate/landing (simula para todos los rangos)
 * → Devuelve el mismo formato que POST /api/simulate/landing (público)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const CALCULATOR_URL = process.env.CALCULATOR_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

export async function POST(request: NextRequest) {
  const body = await request.json();

  let token: string;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Llamar al endpoint admin que simula para todos los rangos con versiones
    const res = await fetch(`${CALCULATOR_URL}/api/admin/pricing/simulate/landing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[ADMIN:simulate] Error:', error);
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}
