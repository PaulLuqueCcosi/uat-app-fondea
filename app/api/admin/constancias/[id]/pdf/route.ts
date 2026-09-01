/**
 * GET /api/admin/constancias/{id}/pdf
 *
 * Proxy → GET /api/v1/admin/constancias/{id}/pdf
 * Devuelve { pdfUrl } — URL pre-firmada del PDF. 409 si la constancia todavía no
 * está ISSUED.
 *
 * A propósito NO es una Server Action: invocar una Server Action desde un Client
 * Component dispara un re-render del árbol de Server Components de la página, que
 * puede chocar con el setState local del botón que la llama (loading) y tirar
 * "insertBefore ... not a child of this node". Un fetch a una API route normal no
 * tiene ese efecto colateral. Mismo patrón que el proxy de PDF de contratos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '@/lib/backend-fetch';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/api/v1/admin/constancias/${id}/pdf`, {
      context: 'ADMIN_CONSTANCIA_PDF',
    });
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/admin/constancias/[id]/pdf → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
