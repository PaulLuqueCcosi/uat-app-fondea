/**
 * GET /api/admin/calculator-options?mode=draft|published
 *
 * Proxy para obtener las opciones de la calculadora (montos, plazos, cuotas)
 * usando la config DRAFT o PUBLISHED del admin.
 *
 * - mode=draft → lee AVAILABILITY draft para armar las opciones
 * - mode=published → GET /api/products/{id}/options (normal)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const CALCULATOR_URL = process.env.CALCULATOR_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;
const PRODUCT_ID = process.env.NEXT_PUBLIC_PRODUCT_ID;

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode') ?? 'published';

  let token: string;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar rol ADMIN
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
    if (!payload.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    if (mode === 'published') {
      // Mismo endpoint público
      const res = await fetch(`${CALCULATOR_URL}/api/products/${PRODUCT_ID}/options`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Draft: leer AVAILABILITY del admin config para armar opciones
    const res = await fetch(`${CALCULATOR_URL}/api/admin/pricing/config/AVAILABILITY`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'No se pudo cargar AVAILABILITY' }, { status: res.status });
    }

    const configEntry = await res.json();
    // El draft tiene la data si existe, sino usar published
    const data = configEntry.draft?.data ?? configEntry.published?.data;

    if (!data) {
      return NextResponse.json({ error: 'No data available' }, { status: 404 });
    }

    // Retornar en el mismo formato que /api/products/{id}/options
    return NextResponse.json({
      product: { id: data.productId },
      scoreRanges: data.scoreRanges,
      amounts: buildAmountsHierarchy(data.availability),
    });
  } catch (error) {
    console.error('[ADMIN:calculator-options] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Transforma la estructura flat de availability a la jerarquía
 * amounts → terms → installments que espera el LoanCalculator.
 */
function buildAmountsHierarchy(availability: any[]) {
  const result: any[] = [];

  for (const group of availability) {
    for (const amount of group.amounts) {
      result.push({
        value: amount,
        label: `S/ ${amount.toLocaleString('es-PE')}`,
        terms: group.terms.map((t: any) => ({
          value: t.terms[0], // Primer término como valor principal
          label: `${t.terms[0]} días`,
          terms: t.terms,
          installments: t.installments.map((i: number) => ({
            value: i,
            label: `${i} ${i === 1 ? 'cuota' : 'cuotas'}`,
          })),
        })),
      });
    }
  }

  return result;
}
