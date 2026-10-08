import { headers } from 'next/headers';

/**
 * Evidencia del navegador real para firmas electrónicas.
 *
 * Las llamadas al backend son server-to-server, así que el backend vería la IP
 * y el user-agent de este servidor. Los leemos del request entrante del navegador
 * y los reenviamos como X-Client-IP / X-Client-User-Agent.
 * Si no se puede determinar un valor, el header se omite (nunca se inventa).
 */
export async function getClientEvidenceHeaders(): Promise<Record<string, string>> {
  const h = await headers();
  const result: Record<string, string> = {};

  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || '';
  if (ip) result['X-Client-IP'] = ip;

  const userAgent = h.get('user-agent')?.trim();
  if (userAgent) result['X-Client-User-Agent'] = userAgent;

  return result;
}
