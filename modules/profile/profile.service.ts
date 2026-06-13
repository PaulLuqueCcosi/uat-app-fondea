/**
 * Service de Perfil — la ÚNICA puerta a los datos del usuario.
 *
 * ESTRATEGIA DE DATOS:
 * - getProfileSummary() → desde claims (rápido, para navbar)
 * - getFullProfile() → desde Account API (fresco, para profile page)
 *
 * Retorna Result<T> — los componentes nunca ven errores crudos.
 */

import { getLogtoContext, getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import type { Result } from '@/modules/shared/result';
import type { FullUserProfile, UserSummary, UserSecurity } from './profile.types';
import type { ProfileError } from './profile.errors';
import { errors } from './profile.errors';
import {
  mapFullProfileFromClaims,
  mapSummaryFromClaims,
  mapSecurityFromClaims,
  mapContactFromClaims,
  mapProfileFromClaims,
} from './profile.mapper';

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT!;

// Re-tipamos Result con nuestro error específico
type ProfileResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: ProfileError }
);

/**
 * Obtiene datos frescos desde la Account API de Logto.
 * Siempre devuelve la info actualizada (no depende del JWT cache).
 */
async function fetchAccountData(): Promise<Record<string, unknown> | null> {
  try {
    const token = await getAccessTokenRSC(logtoConfig);
    const res = await fetch(`${LOGTO_ENDPOINT}/api/my-account`, {
      headers: {
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.log('[PROFILE:fetchAccountData] ❌ HTTP', res.status);
      return null;
    }

    const data = await res.json();
    console.log('[PROFILE:fetchAccountData] ✅ Respuesta:', JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.log('[PROFILE:fetchAccountData] ❌ Error:', err);
    return null;
  }
}

/**
 * Obtiene el perfil completo del usuario autenticado.
 * USA LA ACCOUNT API → siempre datos frescos.
 * Usado por la profile page.
 */
export async function getFullProfile(): Promise<ProfileResult<FullUserProfile>> {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !claims) {
      return { ok: false, error: errors.sessionExpired() };
    }

    // Intentar obtener datos frescos de la Account API
    const accountData = await fetchAccountData();

    if (accountData) {
      // Merge: Account API (email, phone, name frescos) + claims (identities, timestamps)
      const merged = { ...claims, ...accountData } as Record<string, unknown>;
      const data = mapFullProfileFromClaims(merged);
      return { ok: true, data };
    }

    // Fallback: usar claims (pueden estar desactualizados)
    const data = mapFullProfileFromClaims(claims as Record<string, unknown>);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errors.serverError() };
  }
}

/**
 * Obtiene resumen ligero del usuario (para navbar, headers, etc.)
 * USA CLAIMS → rápido, no hace request extra.
 * El navbar no necesita datos ultra-frescos.
 */
export async function getProfileSummary(): Promise<ProfileResult<UserSummary>> {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !claims) {
      return { ok: false, error: errors.sessionExpired() };
    }

    const summary = mapSummaryFromClaims(claims as Record<string, unknown>);
    return { ok: true, data: summary };
  } catch (err) {
    return { ok: false, error: errors.serverError() };
  }
}

/**
 * Obtiene nombre y email del usuario autenticado.
 * USA ACCOUNT API → siempre datos frescos (usado por el layout/navbar).
 */
export async function getUserInfo(): Promise<{ name: string | null; email: string | null }> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return { name: null, email: null };
  }

  // Intentar datos frescos
  const accountData = await fetchAccountData();

  if (accountData) {
    return {
      name: (accountData.name || claims.name || claims.username || null) as string | null,
      email: (accountData.primaryEmail || claims.email || null) as string | null,
    };
  }

  // Fallback: claims
  return {
    name: (claims.name || claims.username || null) as string | null,
    email: (claims.email || null) as string | null,
  };
}

/**
 * Obtiene el nombre del usuario.
 */
export async function getUserName(): Promise<string | null> {
  const { name } = await getUserInfo();
  return name;
}

/**
 * Obtiene datos de soporte (accountId + DNI).
 * Reemplaza a getUserSupportData de lib/user/get-user-support-data.ts
 */
export async function getUserSupportData(): Promise<{ accountId: string | null; dni: string | null }> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return { accountId: null, dni: null };
  }

  return {
    accountId: (claims.sub as string) || null,
    // TODO: Obtener DNI del backend/expediente cuando esté disponible
    dni: null,
  };
}

/**
 * Obtiene el subtítulo/mensaje personalizado del dashboard.
 * HOY: mock estático.
 * MAÑANA: dependerá del estado del usuario.
 */
export async function getUserSubtitle(): Promise<string | null> {
  // TODO: reemplazar por lógica real basada en el estado del usuario
  return 'Tienes una solicitud en curso. Continúa donde lo dejaste.';
}

/**
 * Obtiene solo los datos de seguridad (password, cuentas vinculadas).
 * USA ACCOUNT API → datos frescos.
 * Usado por la página de settings.
 */
export async function getUserSecurity(): Promise<ProfileResult<UserSecurity>> {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !claims) {
      return { ok: false, error: errors.sessionExpired() };
    }

    // Intentar datos frescos
    const accountData = await fetchAccountData();
    const source = accountData
      ? { ...claims, ...accountData } as Record<string, unknown>
      : claims as Record<string, unknown>;

    const security = mapSecurityFromClaims(source);
    return { ok: true, data: security };
  } catch (err) {
    return { ok: false, error: errors.serverError() };
  }
}
