/**
 * POST /api/intenciones
 *
 * Proxy autenticado → POST /api/v1/intentions
 * Crea una nueva intención desde la calculadora interna.
 *
 * Body esperado del cliente: { amount, termDays, installmentCount }
 * Este proxy agrega productId e isFirstLoan antes de enviar al backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, proxyResponse } from './helpers';

export async function POST(request: NextRequest) {
  const productId = process.env.NEXT_PUBLIC_PRODUCT_ID;
  if (!productId) {
    console.error('[API] POST /api/intenciones → NEXT_PUBLIC_PRODUCT_ID no configurado');
    return NextResponse.json(
      { error: 'Product ID not configured' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { amount, termDays, installmentCount } = body;

    const res = await backendFetch('/api/v1/intentions', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        amount,
        termDays,
        installmentCount,
        isFirstLoan: true,
      }),
    });

    return proxyResponse(res);
  } catch (error) {
    console.error('[API] POST /api/intenciones → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
