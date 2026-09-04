/**
 * Proxy para analytics de Educación Financiera (M10 — R51, R52).
 * Rutea /api/admin/education/analytics/module-access-rate
 *     → backend /api/v1/admin/education/analytics/module-access-rate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const analyticsPath = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const query = searchParams ? `?${searchParams}` : '';

  let token: string | undefined;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch {
    return NextResponse.json({ error: 'token_error' }, { status: 401 });
  }

  if (!token) {
    return NextResponse.json({ error: 'no_token' }, { status: 401 });
  }

  try {
    const url = `${BACKEND_URL}/api/v1/admin/education/analytics/${analyticsPath}${query}`;
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
  } catch {
    return NextResponse.json({ error: 'network_error' }, { status: 503 });
  }
}
