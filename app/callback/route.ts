import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirige al nuevo callback en /api/logto/callback.
 *
 * Esta ruta se mantiene por compatibilidad en caso de que Logto Console
 * todavía tenga configurada la URI antigua.
 *
 * IMPORTANTE: Actualizar la Redirect URI en Logto Console a:
 *   <LOGTO_BASE_URL>/api/logto/callback
 */
export async function GET(request: NextRequest) {
  const url = new URL('/api/logto/callback', request.url);
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url);
}
