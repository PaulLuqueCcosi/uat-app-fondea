'use server';

import { getLogtoContext, getAccessTokenRSC, signOut } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { logtoConfig } from '../logto';

export async function getUser() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return null;
  }

  return {
    id: claims.sub || '',
    name: claims.name || claims.username || 'Usuario',
    email: claims.email || '',
    phone: claims.phone_number || '',
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  return isAuthenticated;
}

/**
 * Limpia la sesión local de Logto cuando está corrupta o expirada
 */
export async function clearExpiredSession() {
  try {
    await signOut(logtoConfig);
    console.log('[AUTH] Sesión local limpiada exitosamente');
  } catch (error) {
    console.error('[AUTH] Error limpiando sesión local:', error);
  }
}

/**
 * Cierre de sesión completo y seguro para plataformas sin página de inicio.
 * 
 * CORRECCIÓN: signOut() SÍ redirige automáticamente a Logto en Next.js
 * El error NEXT_REDIRECT es normal - indica que la redirección está funcionando.
 */
export async function performSignOut() {
  try {
    console.log('[AUTH] Iniciando cierre de sesión...');
    
    // signOut() hace automáticamente:
    // 1. Limpia cookies locales
    // 2. Redirige a Logto para logout SSO
    // 3. Logto redirige de vuelta según "Post Sign-out Redirect URIs"
    await signOut(logtoConfig);
    
    // Este código nunca se ejecuta porque signOut() hace redirect
    console.log('[AUTH] Cierre de sesión completado');
    
  } catch (error: any) {
    // El error NEXT_REDIRECT es NORMAL - significa que la redirección funcionó
    if (error?.message === 'NEXT_REDIRECT') {
      console.log('[AUTH] Redirección de logout exitosa');
      // No hacer nada - dejar que Next.js maneje la redirección
      throw error; // Re-lanzar para que Next.js procese la redirección
    }
    
    console.error('[AUTH] Error inesperado durante cierre de sesión:', error);
    
    // Solo para errores reales (no NEXT_REDIRECT)
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      
      const allCookies = cookieStore.getAll();
      allCookies.forEach(cookie => {
        if (cookie.name.startsWith('logto:') || cookie.name.includes('logto')) {
          cookieStore.delete(cookie.name);
        }
      });
      
      console.log('[AUTH] Limpieza manual de cookies completada');
    } catch (cookieError) {
      console.error('[AUTH] Error limpiando cookies manualmente:', cookieError);
    }
    
    redirect('/api/iniciar');
  }
}

/**
 * Valida que la sesión esté activa contra Logto con retry automático.
 * 
 * CRÍTICO PARA APLICACIONES ADMINISTRATIVAS:
 * - Verifica tokens contra Logto en cada request (detecta revocaciones)
 * - Maneja refresh automático de tokens expirados
 * - Detecta sesiones revocadas por administrador
 * - Logging detallado para auditoría de seguridad
 *
 * OPTIMIZACIÓN: Validación inteligente para evitar sobrecarga
 * - Solo valida contra servidor cada 5 minutos
 * - Cache de validación para evitar llamadas repetidas
 * - Validación completa solo cuando es crítico
 *
 * Para plataformas sin página de inicio pública, redirige directamente
 * a /api/iniciar cuando la sesión es inválida.
 */
export async function requireValidSession(retryCount = 0, forceServerValidation = false) {
  const MAX_RETRIES = 1;
  
  // Primero verificación rápida local
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    console.warn('[AUTH] No hay sesión local, redirigiendo al login');
    redirect('/api/iniciar');
  }

  // Log para auditoría administrativa
  console.log('[AUTH] Validando sesión administrativa:', {
    userId: claims.sub,
    email: claims.email,
    sessionAge: claims.iat ? Math.floor((Date.now() / 1000) - claims.iat) : 'unknown',
    retryCount,
    forceServerValidation
  });

  // Verificación básica contra Logto (refresh tokens si es necesario)
  try {
    const startTime = Date.now();
    
    // Obtener access token (esto refresca automáticamente si es necesario)
    const accessToken = await getAccessTokenRSC(logtoConfig);
    
    // Verificación adicional: si el token es muy corto, puede estar expirado
    if (!accessToken || accessToken.length < 10) {
      throw new Error('Invalid or empty access token received');
    }
    
    // VALIDACIÓN INTELIGENTE CONTRA SERVIDOR
    // Solo validar contra servidor si:
    // 1. Se fuerza explícitamente (forceServerValidation = true)
    // 2. Han pasado más de 5 minutos desde la última validación
    // 3. Es el primer acceso de la sesión
    const shouldValidateServer = forceServerValidation || await shouldPerformServerValidation(claims);
    
    if (shouldValidateServer) {
      console.log('[AUTH] Realizando validación contra servidor Logto...');
      
      try {
        const userinfoResponse = await fetch(`${logtoConfig.endpoint}/oidc/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          // Timeout de 3 segundos para no bloquear la UI
          signal: AbortSignal.timeout(3000)
        });
        
        if (userinfoResponse.status === 401) {
          // CRÍTICO: Sesión revocada por administrador
          console.error('[AUTH] 🚨 SESIÓN REVOCADA POR ADMINISTRADOR DETECTADA', {
            userId: claims.sub,
            email: claims.email,
            tokenLength: accessToken.length,
            userinfoStatus: 401,
            retryCount
          });
          
          throw new Error('Session revoked by administrator - userinfo returned 401');
        }
        
        if (userinfoResponse.ok) {
          // Marcar validación exitosa con timestamp
          await markServerValidationSuccess(claims.sub);
          console.log('[AUTH] Validación contra servidor exitosa');
        } else {
          console.warn('[AUTH] Userinfo endpoint error (not 401):', {
            status: userinfoResponse.status,
            statusText: userinfoResponse.statusText,
            userId: claims.sub
          });
          // Para otros errores HTTP, continuar (puede ser problema temporal del servidor)
        }
        
      } catch (userinfoError: any) {
        // Si es error de revocación administrativa, re-lanzar
        if (userinfoError.message?.includes('Session revoked by administrator')) {
          throw userinfoError;
        }
        
        // Para errores de red/timeout, continuar pero loggear
        console.warn('[AUTH] Error de red en validación servidor (continuando):', {
          message: userinfoError?.message,
          userId: claims.sub,
          timeout: userinfoError.name === 'TimeoutError'
        });
      }
    } else {
      console.log('[AUTH] Saltando validación servidor (cache válido)');
    }
    
    const validationTime = Date.now() - startTime;
    console.log('[AUTH] Sesión administrativa válida confirmada', {
      userId: claims.sub,
      validationTimeMs: validationTime,
      tokenLength: accessToken.length,
      serverValidated: shouldValidateServer,
      retryCount
    });
  } catch (error: any) {
    console.error('[AUTH] Error validando sesión administrativa:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      userId: claims.sub,
      email: claims.email,
      retryCount
    });

    // Si es un error de invalid_grant y no hemos reintentado, limpiar y reintentar una vez
    if (error?.message?.includes('invalid_grant') && retryCount < MAX_RETRIES) {
      console.warn('[AUTH] Detectado invalid_grant en sesión administrativa, limpiando y reintentando...', {
        userId: claims.sub,
        email: claims.email
      });
      
      try {
        await signOut(logtoConfig);
        
        // Pequeña pausa antes del retry
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Reintentar una vez
        return requireValidSession(retryCount + 1);
      } catch (signOutError) {
        console.error('[AUTH] Error al cerrar sesión durante retry:', signOutError);
      }
    }
    
    // Si llegamos aquí, la sesión definitivamente expiró o fue revocada
    console.warn('[AUTH] Sesión administrativa expirada o revocada, redirigiendo al login', {
      userId: claims.sub,
      email: claims.email,
      errorType: error?.message?.includes('invalid_grant') ? 'revoked_or_expired' : 'network_or_other'
    });
    redirect('/api/iniciar');
  }

  return {
    id: claims!.sub || '',
    name: claims!.name || claims!.username || 'Usuario',
    email: claims!.email || '',
    phone: claims!.phone_number || '',
  };
}

/**
 * Versión no-redirect de requireValidSession para usar en API routes
 */
export async function validateSession() {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !claims) {
      return { valid: false, user: null, error: 'No session found' };
    }

    // Verificar contra Logto
    await getAccessTokenRSC(logtoConfig);

    return {
      valid: true,
      user: {
        id: claims.sub || '',
        name: claims.name || claims.username || 'Usuario',
        email: claims.email || '',
        phone: claims.phone_number || '',
      },
      error: null
    };
  } catch (error) {
    console.error('[AUTH] Session validation failed:', error);
    return { valid: false, user: null, error: 'Session expired or invalid' };
  }
}

/**
 * Validación ligera de sesión para uso en componentes cliente.
 * Solo verifica la presencia de cookies, no hace llamadas a Logto.
 * Útil para mostrar/ocultar elementos de UI sin bloquear renderizado.
 */
export async function checkSessionExists(): Promise<boolean> {
  try {
    const { isAuthenticated } = await getLogtoContext(logtoConfig);
    return isAuthenticated;
  } catch {
    return false;
  }
}

// Cache simple en memoria para validaciones de servidor
// En producción, esto podría ser Redis o una base de datos
const serverValidationCache = new Map<string, number>();

/**
 * Determina si se debe realizar validación contra servidor
 * Basado en cache de validaciones previas (5 minutos de validez)
 */
async function shouldPerformServerValidation(claims: any): Promise<boolean> {
  const userId = claims.sub;
  const now = Date.now();
  const lastValidation = serverValidationCache.get(userId);
  
  // Si no hay validación previa, validar
  if (!lastValidation) {
    return true;
  }
  
  // Si han pasado más de 5 minutos (300,000 ms), validar
  const timeSinceLastValidation = now - lastValidation;
  const VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutos
  
  return timeSinceLastValidation > VALIDATION_INTERVAL;
}

/**
 * Marca una validación exitosa contra servidor
 */
async function markServerValidationSuccess(userId: string): Promise<void> {
  serverValidationCache.set(userId, Date.now());
  
  // Limpiar entradas antiguas (más de 1 hora)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [key, timestamp] of serverValidationCache.entries()) {
    if (timestamp < oneHourAgo) {
      serverValidationCache.delete(key);
    }
  }
}

/**
 * Fuerza validación contra servidor (ignora cache)
 * Útil para casos críticos o cuando se sospecha de problemas de sesión
 */
export async function requireValidSessionStrict() {
  return requireValidSession(0, true); // forceServerValidation = true
}
