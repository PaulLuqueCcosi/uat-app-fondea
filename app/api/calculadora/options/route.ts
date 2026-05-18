/**
 * GET /api/calculadora/options
 *
 * Proxy → GET /api/products/{productId}/options (servidor de calculadora)
 * Devuelve las opciones de configuración del producto (montos, plazos, cuotas, rangos).
 */

import { NextResponse } from 'next/server';
import { calculatorFetch } from '@/lib/calculator-fetch';
import { proxyResponse } from '@/lib/backend-fetch';

export async function GET() {
  const productId = process.env.NEXT_PUBLIC_PRODUCT_ID;
  if (!productId) {
    console.error('[API] GET /api/calculadora/options → NEXT_PUBLIC_PRODUCT_ID no configurado');
    return NextResponse.json(
      { error: 'Product ID not configured' },
      { status: 500 },
    );
  }
  console.log("Ingresa para pedir las opciones")
  try {
    const res = await calculatorFetch(`/api/products/${productId}/options`, {
      context: 'CALCULADORA',
    });
    return proxyResponse(res);
  } catch (error) {
    console.error('[API] GET /api/calculadora/options → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
