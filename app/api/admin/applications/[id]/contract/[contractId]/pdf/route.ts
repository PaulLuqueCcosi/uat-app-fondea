/**
 * GET /api/admin/applications/{id}/contract/{contractId}/pdf
 *
 * Proxy → GET /api/v1/admin/applications/{id}/contract/{contractId}/pdf
 * Devuelve { pdfUrl } — URL pre-firmada del PDF firmado. 404 si aún no fue firmado.
 *
 * A propósito NO es una Server Action: invocar una Server Action desde un Client
 * Component dispara un re-render del árbol de Server Components de la página, que
 * puede chocar con el setState local del botón que la llama (loading) y tirar
 * "insertBefore ... not a child of this node". Un fetch a una API route normal no
 * tiene ese efecto colateral.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '@/lib/backend-fetch';

type RouteContext = { params: Promise<{ id: string; contractId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id, contractId } = await context.params;
    const res = await backendFetch(`/api/v1/admin/applications/${id}/contract/${contractId}/pdf`, {
      context: 'ADMIN_CONTRACT_PDF',
    });
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/admin/applications/[id]/contract/[contractId]/pdf → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
