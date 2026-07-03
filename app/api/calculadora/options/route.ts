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
  const calculatorUrl = process.env.CALCULATOR_API_URL ?? 'http://localhost:8080';

  if (!productId) {
    console.error('[CALC-OPTIONS] ❌ NEXT_PUBLIC_PRODUCT_ID no configurado');
    return NextResponse.json(
      { error: 'Product ID not configured' },
      { status: 500 },
    );
  }

  const path = `/api/products/${productId}/options`;
  console.log('[CALC-OPTIONS] → Full URL:', `${calculatorUrl}${path}`);

  try {
    const res = await calculatorFetch(path, {
      context: 'CALC-OPTIONS',
    });

    console.log('[CALC-OPTIONS] ← Status:', res.status, res.statusText);

    if (!res.ok) {
      const clone = res.clone();
      try {
        const errorBody = await clone.text();
        console.error('[CALC-OPTIONS] ❌ Response body:', errorBody.slice(0, 1000));
      } catch { /* ignorar */ }
    }

    return proxyResponse(res);
  } catch (error) {
    console.error('[CALC-OPTIONS] ❌ Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
