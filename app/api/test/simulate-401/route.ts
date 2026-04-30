import { NextResponse } from 'next/server';

/**
 * Endpoint de prueba que siempre devuelve 401
 * Útil para probar el manejo de sesiones expiradas
 */
export async function GET() {
  return NextResponse.json({
    error: 'Unauthorized',
    message: 'Token is invalid or expired'
  }, { status: 401 });
}

export async function POST() {
  return NextResponse.json({
    error: 'Unauthorized', 
    message: 'Token is invalid or expired'
  }, { status: 401 });
}