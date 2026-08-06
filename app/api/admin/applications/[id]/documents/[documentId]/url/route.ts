/**
 * GET /api/admin/applications/{id}/documents/{documentId}/url
 *
 * Proxy → GET /api/v1/admin/applications/{id}/documents/{documentId}/url
 * Devuelve { url } — URL pre-firmada para ver el documento (DNI, selfie) en el navegador.
 *
 * A propósito NO es una Server Action: invocar una Server Action desde un Client
 * Component dispara un re-render del árbol de Server Components de la página, que
 * puede chocar con el setState local del botón que la llama (loading) y tirar
 * "insertBefore ... not a child of this node". Un fetch a una API route normal no
 * tiene ese efecto colateral.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '@/lib/backend-fetch';

type RouteContext = { params: Promise<{ id: string; documentId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id, documentId } = await context.params;
    const res = await backendFetch(`/api/v1/admin/applications/${id}/documents/${documentId}/url`, {
      context: 'ADMIN_DOCUMENT_URL',
    });
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/admin/applications/[id]/documents/[documentId]/url → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
