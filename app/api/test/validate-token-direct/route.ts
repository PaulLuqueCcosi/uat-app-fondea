import { NextResponse } from 'next/server';
import { getLogtoContext, getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

/**
 * API endpoint para validar token directamente contra Logto
 * Esto debería fallar si la sesión fue revocada en el servidor
 */
export async function GET() {
  try {
    console.log('[DIRECT-TEST] Iniciando validación directa contra Logto...');
    
    // 1. Verificar contexto local (esto puede seguir siendo válido)
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);
    console.log('[DIRECT-TEST] Contexto local:', { isAuthenticated, userId: claims?.sub });
    
    if (!isAuthenticated || !claims) {
      return NextResponse.json({
        success: false,
        error: 'No local session found',
        localSession: false,
        serverValidation: false
      });
    }
    
    // 2. Intentar obtener access token (esto debería fallar si la sesión fue revocada)
    try {
      const startTime = Date.now();
      const accessToken = await getAccessTokenRSC(logtoConfig);
      const validationTime = Date.now() - startTime;
      
      console.log('[DIRECT-TEST] Token obtenido exitosamente:', {
        tokenLength: accessToken?.length || 0,
        validationTimeMs: validationTime,
        userId: claims.sub
      });
      
      // 3. Si llegamos aquí, el token es válido en el servidor
      return NextResponse.json({
        success: true,
        message: 'Token válido en servidor Logto',
        localSession: true,
        serverValidation: true,
        user: {
          id: claims.sub,
          email: claims.email,
          name: claims.name
        },
        tokenInfo: {
          length: accessToken?.length || 0,
          validationTimeMs: validationTime
        }
      });
      
    } catch (tokenError: any) {
      console.log('[DIRECT-TEST] Error obteniendo token:', {
        message: tokenError?.message,
        code: tokenError?.code,
        status: tokenError?.status,
        userId: claims.sub
      });
      
      // 4. Si falla aquí, la sesión fue revocada en el servidor
      return NextResponse.json({
        success: false,
        error: 'Token inválido en servidor Logto',
        localSession: true,
        serverValidation: false,
        errorDetails: {
          message: tokenError?.message,
          code: tokenError?.code,
          status: tokenError?.status
        },
        user: {
          id: claims.sub,
          email: claims.email,
          name: claims.name
        }
      }, { status: 401 });
    }
    
  } catch (error: any) {
    console.error('[DIRECT-TEST] Error general:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error general en validación',
      localSession: false,
      serverValidation: false,
      errorDetails: {
        message: error?.message
      }
    }, { status: 500 });
  }
}