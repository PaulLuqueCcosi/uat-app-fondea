import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirige al nuevo sign-in handler en /api/logto/sign-in.
 *
 * Esta ruta se mantiene por compatibilidad con código existente
 * que todavía apunte a /api/iniciar.
 */
export const INTENCION_COOKIE = 'fondea_intencion_id';
export const RETURN_TO_COOKIE = 'fondea_return_to';

export async function GET(request: NextRequest) {
  const url = new URL('/api/logto/sign-in', request.url);
  return NextResponse.redirect(url);
}
