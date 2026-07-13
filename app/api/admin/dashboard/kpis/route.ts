/**
 * GET /api/admin/dashboard/kpis?days=30
 *
 * Proxy para KPIs del dashboard admin.
 * Obtiene el token server-side y reenvía la petición al backend Java.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

export async function GET(request: NextRequest) {
  const days = request.nextUrl.searchParams.get('days') ?? '30';

  let token: string | undefined;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch (err) {
    console.error('[ADMIN-DASHBOARD-API] ❌ Error al obtener access token:', err);
    return NextResponse.json({ error: 'token_error' }, { status: 401 });
  }

  if (!token) {
    return NextResponse.json({ error: 'no_token' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/dashboard/kpis?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'backend_error', detail: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[ADMIN-DASHBOARD-API] ❌ Network error:', err);
    return NextResponse.json({ error: 'network_error' }, { status: 503 });
  }
}
