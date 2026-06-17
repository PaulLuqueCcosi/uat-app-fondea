/**
 * SSE Proxy — reenvía el stream de notificaciones del backend al browser.
 *
 * GET /api/notifications/stream
 *
 * Usa backendFetch para obtener el token de la misma forma que el resto de endpoints.
 */

import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

export const dynamic = 'force-dynamic';

export async function GET() {
  // Obtener token de la misma forma que backendFetch
  let token: string | undefined;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch (err) {
    console.error('[SSE:proxy] ❌ Error obteniendo token:', err);
    return new Response('Unauthorized', { status: 401 });
  }

  if (!token) {
    console.error('[SSE:proxy] ❌ Token vacío');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[SSE:proxy] ✅ Token obtenido, conectando al backend...');

  // Conectar al SSE del backend
  const backendUrl = `${BACKEND_URL}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;

  let backendRes: Response;
  try {
    backendRes = await fetch(backendUrl, {
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[SSE:proxy] ❌ Backend no disponible:', err);
    return new Response('Backend unavailable', { status: 502 });
  }

  if (!backendRes.ok) {
    const body = await backendRes.text().catch(() => '');
    console.error('[SSE:proxy] ❌ Backend respondió:', backendRes.status, body.slice(0, 200));
    return new Response(`Backend error: ${backendRes.status}`, { status: backendRes.status });
  }

  if (!backendRes.body) {
    console.error('[SSE:proxy] ❌ Backend no devolvió body/stream');
    return new Response('No stream body', { status: 502 });
  }

  console.log('[SSE:proxy] ✅ Stream conectado, reenviando al browser');

  // Reenviar el stream tal cual al browser
  return new Response(backendRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
