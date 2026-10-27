import { NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

/**
 * SOLO DESARROLLO — devuelve el access token real de la sesión actual para que las pruebas
 * automatizadas (e2e/) llamen directo a la API del backend.
 *
 * Fuera de `next dev` responde 404, así que nunca se expone en staging ni producción.
 * Requiere una sesión de Logto válida: no existe forma de obtener el token sin iniciar sesión.
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const token = await getAccessTokenRSC(logtoConfig, process.env.LOGTO_API_RESOURCE);
    if (!token) return NextResponse.json({ error: 'no_token' }, { status: 401 });
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: 'token_error' }, { status: 401 });
  }
}
