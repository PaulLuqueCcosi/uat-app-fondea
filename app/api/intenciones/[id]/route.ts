/**
 * API routes para una intención específica.
 *
 * GET    /api/intenciones/{id}  → GET    /api/v1/intentions/{id}
 * PUT    /api/intenciones/{id}  → PUT    /api/v1/intentions/{id}
 * DELETE /api/intenciones/{id}  → DELETE /api/v1/intentions/{id}
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/v1/intentions/${id}`);
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/intenciones/[id] → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const res = await backendFetch(`/api/v1/intentions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    return proxyResponse(res);
  } catch (error) {
    console.error('[API] PUT /api/intenciones/[id] → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/v1/intentions/${id}`, {
      method: 'DELETE',
    });

    return proxyResponse(res);
  } catch (error) {
    console.error('[API] DELETE /api/intenciones/[id] → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
