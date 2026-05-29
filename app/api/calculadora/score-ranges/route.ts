/**
 * GET /api/calculadora/score-ranges
 *
 * Proxy → GET /api/products/{productId}/options (calculadora)
 * Extrae y devuelve únicamente el array scoreRanges.
 */

import { NextResponse } from 'next/server';
import { calculatorFetch } from '@/lib/calculator-fetch';

export async function GET() {
  const productId = process.env.NEXT_PUBLIC_PRODUCT_ID;
  if (!productId) {
    console.error('[API] GET /api/calculadora/score-ranges → NEXT_PUBLIC_PRODUCT_ID no configurado');
    return NextResponse.json(
      { error: 'Product ID not configured' },
      { status: 500 },
    );
  }

  try {
    const res = await calculatorFetch(`/api/products/${productId}/options`, {
      context: 'CALC_SCORE_RANGES',
    });

    if (!res.ok) {
      console.error('[API] GET /api/calculadora/score-ranges → calculadora error', res.status);
      return NextResponse.json(
        { error: 'Calculator service error' },
        { status: 502 },
      );
    }

    const data = await res.json();
    const scoreRanges = data.scoreRanges ?? [];

    return NextResponse.json({ scoreRanges });
  } catch (error) {
    console.error('[API] GET /api/calculadora/score-ranges → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
