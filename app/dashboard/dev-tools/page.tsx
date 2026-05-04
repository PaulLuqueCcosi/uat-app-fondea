import { getAccessTokenRSC, getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import { DevToolsClient } from '@/components/dashboard/DevToolsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

export default async function DevToolsPage() {
  // Obtener todo lo que expone el SDK
  const context = await getLogtoContext(logtoConfig, { fetchUserInfo: true });

  const {
    isAuthenticated,
    claims,         // ID token claims (sub, email, name, iat, exp, etc.)
    userInfo,       // Datos del endpoint /oidc/me (más completos, requiere fetchUserInfo: true)
  } = context;

  // Access token para el backend (con aud = LOGTO_API_RESOURCE)
  let accessToken: string | null = null;
  let tokenError: string | null = null;
  try {
    accessToken = await getAccessTokenRSC(logtoConfig, process.env.LOGTO_API_RESOURCE);
  } catch (e: any) {
    tokenError = e?.message ?? 'Error al obtener el token';
  }

  // Decodificar el JWT del access token
  const tokenPayload = accessToken ? decodeJwt(accessToken) : null;

  // Config activa (sin secrets)
  const activeConfig = {
    appId: process.env.LOGTO_APP_ID,
    endpoint: process.env.LOGTO_ENDPOINT,
    baseUrl: process.env.LOGTO_BASE_URL,
    apiResource: process.env.LOGTO_API_RESOURCE,
    scopes: logtoConfig.scopes,
    resources: logtoConfig.resources,
    cookieSecure: logtoConfig.cookieSecure,
    nodeEnv: process.env.NODE_ENV,
  };

  return (
    <DevToolsClient
      isAuthenticated={isAuthenticated}
      claims={claims ?? null}
      userInfo={userInfo ?? null}
      accessToken={accessToken}
      tokenError={tokenError}
      tokenPayload={tokenPayload}
      activeConfig={activeConfig}
    />
  );
}
