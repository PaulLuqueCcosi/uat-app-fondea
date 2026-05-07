/**
 * GET /api/calculadora/options
 *
 * Proxy autenticado → GET /api/products/{productId}/options
 * Devuelve las opciones de configuración del producto (montos, plazos, cuotas, rangos).
 */

import { NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from '../../intenciones/helpers';

export async function GET() {
  const productId = process.env.NEXT_PUBLIC_PRODUCT_ID;
  if (!productId) {
    console.error('[API] GET /api/calculadora/options → NEXT_PUBLIC_PRODUCT_ID no configurado');
    return NextResponse.json(
      { error: 'Product ID not configured' },
      { status: 500 },
    );
  }

  try {
    const res = await backendFetch(`/api/products/${productId}/options`);
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/calculadora/options → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
