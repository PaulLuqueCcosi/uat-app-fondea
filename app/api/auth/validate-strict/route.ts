import { NextResponse } from 'next/server';
import { requireValidSessionStrict } from '@/app/actions/auth.actions';

/**
 * Endpoint para validación estricta de sesión (fuerza validación contra servidor)
 * Útil para:
 * - Operaciones críticas de seguridad
 * - Cuando se sospecha que la sesión puede estar revocada
 * - Validación manual desde el frontend
 */
export async function GET() {
  try {
    const user = await requireValidSessionStrict();
    
    return NextResponse.json({
      success: true,
      message: 'Session validated against server',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error: any) {
    console.error('[API] Strict validation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Session validation failed',
      message: error?.message || 'Unknown error'
    }, { status: 401 });
  }
}