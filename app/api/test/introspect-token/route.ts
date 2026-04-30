import { NextResponse } from 'next/server';
import { getLogtoContext, getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

/**
 * API endpoint para hacer introspección profunda del token
 * Intenta validar el token de múltiples formas para detectar inconsistencias
 */
export async function GET() {
  try {
    console.log('[INTROSPECT] Iniciando introspección profunda del token...');
    
    // 1. Verificar contexto local
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);
    console.log('[INTROSPECT] Contexto local:', { 
      isAuthenticated, 
      userId: claims?.sub,
      iat: claims?.iat,
      exp: claims?.exp,
      sessionAge: claims?.iat ? Math.floor((Date.now() / 1000) - claims.iat) : 'unknown'
    });
    
    if (!isAuthenticated || !claims) {
      return NextResponse.json({
        success: false,
        error: 'No local session found',
        tests: {
          localSession: false,
          tokenRetrieval: false,
          tokenIntrospection: false
        }
      });
    }
    
    // 2. Intentar obtener access token múltiples veces para ver consistencia
    const tokenTests = [];
    for (let i = 0; i < 3; i++) {
      try {
        const startTime = Date.now();
        const accessToken = await getAccessTokenRSC(logtoConfig);
        const validationTime = Date.now() - startTime;
        
        tokenTests.push({
          attempt: i + 1,
          success: true,
          tokenLength: accessToken?.length || 0,
          validationTimeMs: validationTime,
          tokenPreview: accessToken?.substring(0, 20) + '...'
        });
        
        console.log(`[INTROSPECT] Token test ${i + 1} exitoso:`, {
          tokenLength: accessToken?.length,
          validationTimeMs: validationTime
        });
        
        // Pequeña pausa entre intentos
        if (i < 2) await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (tokenError: any) {
        tokenTests.push({
          attempt: i + 1,
          success: false,
          error: tokenError?.message,
          code: tokenError?.code,
          status: tokenError?.status
        });
        
        console.log(`[INTROSPECT] Token test ${i + 1} falló:`, {
          message: tokenError?.message,
          code: tokenError?.code
        });
      }
    }
    
    // 3. Analizar resultados
    const successfulTests = tokenTests.filter(t => t.success);
    const failedTests = tokenTests.filter(t => !t.success);
    
    // 4. Intentar hacer una llamada HTTP directa al endpoint de userinfo si es posible
    let userinfoTest = null;
    if (successfulTests.length > 0) {
      try {
        // Usar el primer token exitoso para probar userinfo
        const accessToken = await getAccessTokenRSC(logtoConfig);
        
        // Intentar llamar al endpoint de userinfo de Logto
        const userinfoResponse = await fetch(`${logtoConfig.endpoint}/oidc/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userinfoResponse.ok) {
          const userinfo = await userinfoResponse.json();
          userinfoTest = {
            success: true,
            status: userinfoResponse.status,
            userinfo: userinfo
          };
          console.log('[INTROSPECT] Userinfo exitoso:', userinfo);
        } else {
          userinfoTest = {
            success: false,
            status: userinfoResponse.status,
            statusText: userinfoResponse.statusText
          };
          console.log('[INTROSPECT] Userinfo falló:', userinfoResponse.status);
        }
      } catch (userinfoError: any) {
        userinfoTest = {
          success: false,
          error: userinfoError?.message
        };
        console.log('[INTROSPECT] Error en userinfo:', userinfoError?.message);
      }
    }
    
    // 5. Determinar estado general
    const allTokensValid = successfulTests.length === 3;
    const someTokensValid = successfulTests.length > 0;
    const inconsistentResults = successfulTests.length > 0 && failedTests.length > 0;
    
    // DETECCIÓN CRÍTICA: Si los tokens se obtienen localmente pero Userinfo falla con 401,
    // esto indica sesión revocada por administrador
    const userinfoFailed401 = userinfoTest && !userinfoTest.success && userinfoTest.status === 401;
    const sessionRevokedByAdmin = allTokensValid && userinfoFailed401;
    
    let sessionStatus, message, recommendation;
    
    if (sessionRevokedByAdmin) {
      sessionStatus = 'revoked_by_admin';
      message = '⚠️ SESIÓN REVOCADA POR ADMINISTRADOR - Tokens locales válidos pero servidor rechaza con 401';
      recommendation = 'CRITICAL: Session was revoked by administrator. Force re-authentication immediately.';
    } else if (allTokensValid && userinfoTest?.success) {
      sessionStatus = 'fully_valid';
      message = 'Todos los tokens son válidos y servidor los acepta';
      recommendation = 'Session is healthy';
    } else if (inconsistentResults) {
      sessionStatus = 'potentially_revoked';
      message = 'Resultados inconsistentes - posible problema de sesión';
      recommendation = 'Session may have been revoked - recommend re-authentication';
    } else {
      sessionStatus = 'invalid';
      message = 'Todos los tokens son inválidos';
      recommendation = 'Session is invalid - require re-authentication';
    }
    
    return NextResponse.json({
      success: someTokensValid,
      message,
      user: {
        id: claims.sub,
        email: claims.email,
        name: claims.name,
        sessionCreated: claims.iat ? new Date(claims.iat * 1000).toISOString() : null,
        sessionExpires: claims.exp ? new Date(claims.exp * 1000).toISOString() : null
      },
      tests: {
        localSession: true,
        tokenRetrieval: {
          total: 3,
          successful: successfulTests.length,
          failed: failedTests.length,
          details: tokenTests
        },
        userinfo: userinfoTest,
        consistency: {
          allValid: allTokensValid,
          someValid: someTokensValid,
          inconsistent: inconsistentResults
        }
      },
      analysis: {
        sessionStatus,
        recommendation,
        adminRevocationDetected: sessionRevokedByAdmin,
        criticalSecurityIssue: sessionRevokedByAdmin
      }
    });
    
  } catch (error: any) {
    console.error('[INTROSPECT] Error general:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error general en introspección',
      errorDetails: {
        message: error?.message
      }
    }, { status: 500 });
  }
}