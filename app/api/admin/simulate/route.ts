/**
 * POST /api/admin/simulate?mode=draft|published
 *
 * Proxy para simulación admin. Requiere JWT con rol ADMIN.
 * - mode=draft → POST /api/admin/pricing/simulate/draft
 * - mode=published → POST /api/simulate (público)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const CALCULATOR_URL = process.env.CALCULATOR_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

export async function POST(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode') ?? 'draft';
  const body = await request.json();

  let token: string;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar rol ADMIN en el token
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
    if (!payload.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const endpoint = mode === 'draft'
    ? `${CALCULATOR_URL}/api/admin/pricing/simulate/draft`
    : `${CALCULATOR_URL}/api/simulate`;

  try {
    if (mode === 'draft') {
      // Draft requiere creditScore — simular para los 3 rangos
      const scores = [150, 450, 750]; // BAJO, MEDIO, ALTO
      const rangeCodes = ['BAJO', 'MEDIO', 'ALTO'];

      const results = await Promise.all(
        scores.map(async (creditScore, idx) => {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ...body, creditScore }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message ?? err.error ?? `Error ${res.status}`);
          }
          const data = await res.json();
          return {
            rangeCode: rangeCodes[idx],
            rangeColor: ['#EF4444', '#F59E0B', '#10B981'][idx],
            simulation: data.simulation ?? data,
          };
        })
      );

      return NextResponse.json(results);
    }

    // Published: endpoint público devuelve array de 3 rangos directamente
    const res = await fetch(endpoint, {
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
