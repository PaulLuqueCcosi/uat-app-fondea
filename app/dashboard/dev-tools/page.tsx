import { getAccessTokenRSC, getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import { DevToolsClient } from '@/components/dashboard/DevToolsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DevToolsPage() {
  const { claims } = await getLogtoContext(logtoConfig);

  let accessToken: string | null = null;
  let tokenError: string | null = null;

  try {
    // Pasar el resource para obtener un JWT con aud = tu backend
    // Sin este argumento Logto devuelve un opaque token sin audience
    accessToken = await getAccessTokenRSC(logtoConfig, process.env.LOGTO_API_RESOURCE);
  } catch (e: any) {
    tokenError = e?.message ?? 'Error al obtener el token';
  }

  // Decodificar el payload del JWT (sin verificar — solo para mostrar)
  let tokenPayload: Record<string, unknown> | null = null;
  if (accessToken) {
    try {
      const parts = accessToken.split('.');
      tokenPayload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8')
      );
    } catch {
      // ignore
    }
  }

  return (
    <DevToolsClient
      accessToken={accessToken}
      tokenError={tokenError}
      tokenPayload={tokenPayload}
      claims={claims}
    />
  );
}
