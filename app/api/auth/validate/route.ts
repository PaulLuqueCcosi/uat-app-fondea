import { validateSession } from '@/app/actions/auth.actions';
import { NextResponse } from 'next/server';

/**
 * API endpoint para validar sesión desde el cliente.
 * 
 * Útil para:
 * - Validaciones periódicas en SPA
 * - Verificar sesión antes de operaciones críticas
 * - Mostrar alertas de sesión expirada
 * 
 * Retorna:
 * - 200: Sesión válida con datos del usuario
 * - 401: Sesión inválida o expirada
 */
export async function GET() {
  try {
    const result = await validateSession();
    
    if (result.valid) {
      return NextResponse.json({
        valid: true,
        user: result.user
      });
    } else {
      return NextResponse.json({
        valid: false,
        error: result.error
      }, { status: 401 });
    }
  } catch (error) {
    console.error('[API] Error validating session:', error);
    return NextResponse.json({
      valid: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}