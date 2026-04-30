import { LogtoNextConfig } from '@logto/next';

export const logtoConfig: LogtoNextConfig = {
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  endpoint: process.env.LOGTO_ENDPOINT!,
  baseUrl: process.env.LOGTO_BASE_URL!,
  cookieSecret: process.env.LOGTO_COOKIE_SECRET!,
  cookieSecure: process.env.NODE_ENV === 'production',
  
  // Configuraciones adicionales para mejor manejo de sesiones
  resources: process.env.LOGTO_API_RESOURCE ? [process.env.LOGTO_API_RESOURCE] : undefined,
  scopes: ['openid', 'profile', 'email', 'phone'],
};
