/**
 * POST /api/calculadora/simulate
 *
 * Proxy → POST /api/simulate/landing (servidor de calculadora)
 * Ejecuta la simulación del préstamo con los parámetros dados.
 *
 * Body esperado: { productId, amount, termDays, installmentCount, isFirstLoan }
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculatorFetch } from '@/lib/calculator-fetch';
import { proxyResponse } from '@/lib/backend-fetch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, amount, termDays, installmentCount, isFirstLoan } = body;

    if (!productId || !amount || !termDays || !installmentCount) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, amount, termDays, installmentCount' },
        { status: 400 },
      );
    }

    const res = await calculatorFetch('/api/simulate/landing', {
      method: 'POST',
      context: 'CALCULADORA',
      body: JSON.stringify({
        productId,
        amount,
        termDays,
        installmentCount,
        isFirstLoan: isFirstLoan ?? true,
      }),
    });

    return proxyResponse(res);
  } catch (error) {
    console.error('[API] POST /api/calculadora/simulate → error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
