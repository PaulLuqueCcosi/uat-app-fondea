/**
 * GET /api/admin/kpis/<kpi>[/<subpath>]?<query>
 *
 * Proxy único para todos los KPIs del dashboard admin (M1) — reemplaza los
 * 2 proxies duplicados que existían antes ([kpi]/route.ts + este archivo,
 * ambos resolviendo /api/admin/kpis/*). Rutea tal cual al backend:
 *   /api/admin/kpis/active-loans      -> /api/v1/admin/dashboard-kpis/active-loans
 *   /api/admin/kpis/income/history    -> /api/v1/admin/dashboard-kpis/income/history
 * Todos los query params se reenvían sin filtrar (days, termDays, year, month, etc.).
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

/** [...path] no soporta "/" dentro de un solo segmento de URL — mapeo explícito para el único caso que lo necesita. */
const BACKEND_PATH_OVERRIDES: Record<string, string> = {
  'npl-tranches': 'npl/tranches',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  if (path.length === 1 && !VALID_KPIS.includes(path[0])) {
    return NextResponse.json({ error: 'invalid_kpi' }, { status: 400 });
  }

  const backendPath = path.length === 1 ? (BACKEND_PATH_OVERRIDES[path[0]] ?? path[0]) : path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const query = searchParams ? `?${searchParams}` : '';

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
    const url = `${BACKEND_URL}/api/v1/admin/dashboard-kpis/${backendPath}${query}`;
    const res = await fetch(url, {
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
