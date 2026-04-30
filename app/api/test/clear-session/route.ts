import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

/**
 * API endpoint para limpiar manualmente las cookies de sesión
 * Solo para pruebas - NO usar en producción
 * 
 * Accede a: GET /api/test/clear-session
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('[TEST] Todas las cookies antes de limpiar:', allCookies.map(c => c.name));
    
    // Limpiar todas las cookies de Logto
    const logtoCoookies = allCookies.filter(cookie => 
      cookie.name.includes('logto') || 
      cookie.name.startsWith('logto_')
    );
    
    // Crear respuesta con headers para limpiar cookies
    const response = NextResponse.json({
      success: true,
      message: 'Cookies de sesión limpiadas y cache revalidado',
      clearedCookies: logtoCoookies.map(c => c.name),
      allCookiesBefore: allCookies.map(c => c.name)
    });
    
    // Limpiar cookies tanto en el servidor como en el cliente
    logtoCoookies.forEach(cookie => {
      // Limpiar en el servidor
      cookieStore.delete({
        name: cookie.name,
        path: '/',
      });
      
      // Limpiar en el cliente con headers
      response.cookies.delete({
        name: cookie.name,
        path: '/',
      });
      
      // También intentar con dominio específico
      response.cookies.delete({
        name: cookie.name,
        path: '/',
        domain: 'localhost',
      });
      
      // Forzar expiración
      response.cookies.set({
        name: cookie.name,
        value: '',
        path: '/',
        expires: new Date(0),
        maxAge: 0,
      });
    });
    
    // CRÍTICO: Revalidar todo el cache para forzar nueva validación de sesión
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/test-auth');
    
    console.log('[TEST] Cookies de sesión limpiadas y cache revalidado:', logtoCoookies.map(c => c.name));
    
    // Headers adicionales para forzar limpieza
    response.headers.set('Clear-Site-Data', '"*"');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return response;
    
  } catch (error) {
    console.error('[TEST] Error limpiando cookies:', error);
    return NextResponse.json({
      success: false,
      error: 'Error limpiando cookies'
    }, { status: 500 });
  }
}