import { getLogtoContext, getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '../logto';
import { cookies } from 'next/headers';
import ServerValidationTest from '@/components/test/ServerValidationTest';
import ApiExample from '@/components/examples/ApiExample';

// Forzar renderizado dinámico - NO cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Página de prueba para validar el comportamiento de autenticación
 * Accede a: http://localhost:3000/test-auth
 */
export default async function TestAuthPage() {
  console.log('[TEST] Iniciando prueba de autenticación...');
  
  // Mostrar todas las cookies presentes
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log('[TEST] Cookies presentes:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));
  
  try {
    // Verificar contexto local
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);
    console.log('[TEST] Contexto local:', { isAuthenticated, userId: claims?.sub });
    
    if (!isAuthenticated) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-error-600">❌ NO AUTENTICADO</h1>
          <p>No hay sesión local - esto debería redirigir</p>
          <div className="mt-4">
            <h3 className="font-bold">Cookies presentes:</h3>
            <ul className="list-disc list-inside">
              {allCookies.map(cookie => (
                <li key={cookie.name}>{cookie.name}: {cookie.value.substring(0, 50)}...</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    
    // Verificar token contra Logto
    try {
      await getAccessTokenRSC(logtoConfig);
      console.log('[TEST] Token válido contra Logto');
      
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-success-600">✅ AUTENTICADO</h1>
          <div className="mt-4 space-y-2">
            <p><strong>Usuario:</strong> {claims?.sub}</p>
            <p><strong>Email:</strong> {claims?.email}</p>
            <p><strong>Nombre:</strong> {claims?.name}</p>
            <p><strong>Sesión creada:</strong> {claims?.iat ? new Date(claims.iat * 1000).toLocaleString() : 'N/A'}</p>
          </div>
          
          <div className="mt-6">
            <h3 className="font-bold">Cookies presentes:</h3>
            <ul className="list-disc list-inside">
              {allCookies.map(cookie => (
                <li key={cookie.name} className={cookie.name.includes('logto') ? 'text-primary font-semibold' : ''}>
                  {cookie.name}: {cookie.value.substring(0, 50)}...
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-6 space-x-4">
            <a 
              href="/api/test/clear-session" 
              className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90"
            >
              Limpiar Sesión
            </a>
            <a 
              href="/test-auth" 
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Recargar Página (Hard Refresh)
            </a>
          </div>
          
          <ServerValidationTest />
          
          <div className="mt-8">
            <ApiExample />
          </div>
        </div>
      );
    } catch (tokenError: any) {
      console.log('[TEST] Error validando token:', tokenError?.message);
      
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-warning-600">⚠️ TOKEN INVÁLIDO</h1>
          <p>Hay sesión local pero el token es inválido</p>
          <p><strong>Error:</strong> {tokenError?.message}</p>
          
          <div className="mt-4">
            <h3 className="font-bold">Cookies presentes:</h3>
            <ul className="list-disc list-inside">
              {allCookies.map(cookie => (
                <li key={cookie.name} className={cookie.name.includes('logto') ? 'text-primary font-semibold' : ''}>
                  {cookie.name}: {cookie.value.substring(0, 50)}...
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    
  } catch (error: any) {
    console.error('[TEST] Error general:', error);
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-error-600">❌ ERROR</h1>
        <p><strong>Error:</strong> {error?.message}</p>
        
        <div className="mt-4">
          <h3 className="font-bold">Cookies presentes:</h3>
          <ul className="list-disc list-inside">
            {allCookies.map(cookie => (
              <li key={cookie.name}>{cookie.name}: {cookie.value.substring(0, 50)}...</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}