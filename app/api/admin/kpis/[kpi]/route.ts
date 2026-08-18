/**
 * GET /api/admin/kpis/[kpi]?days=30
 *
 * Proxy dinámico para cada KPI individual del dashboard admin.
 * [kpi] = active-loans | capital | npl | income | nps | funnel | active-clients | repurchase-rate | city-distribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

const VALID_KPIS = [
  'active-loans', 'capital', 'npl', 'npl-tranches', 'income', 'cashflow', 'nps',
  'funnel', 'active-clients', 'repurchase-rate', 'city-distribution',
  'geo-distribution',
];

/** [kpi] no soporta segmentos con "/" — mapeo explícito para los que sí los necesitan en el backend. */
const BACKEND_PATH_OVERRIDES: Record<string, string> = {
  'npl-tranches': 'npl/tranches',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ kpi: string }> }) {
  const { kpi } = await params;

  if (!VALID_KPIS.includes(kpi)) {
    return NextResponse.json({ error: 'invalid_kpi' }, { status: 400 });
  }

  const days = request.nextUrl.searchParams.get('days') ?? '30';

  let token: string | undefined;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch (err) {
    return NextResponse.json({ error: 'token_error' }, { status: 401 });
  }

  if (!token) {
    return NextResponse.json({ error: 'no_token' }, { status: 401 });
  }

  try {
    // Build backend URL with days param for KPIs that need it
    const needsDays = ['income', 'cashflow', 'nps', 'funnel', 'active-clients', 'repurchase-rate'];
    let queryStr = needsDays.includes(kpi) ? `?days=${days}` : '';

    // npl acepta termDays=7,15,30 (o repetido) — se reenvía tal cual si vino del front.
    if (kpi === 'npl') {
      const termDays = request.nextUrl.searchParams.get('termDays');
      if (termDays) queryStr = `?termDays=${encodeURIComponent(termDays)}`;
    }

    const backendPath = BACKEND_PATH_OVERRIDES[kpi] ?? kpi;
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/dashboard-kpis/${backendPath}${queryStr}`, {
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
    return NextResponse.json({ error: 'network_error' }, { status: 503 });
  }
}
