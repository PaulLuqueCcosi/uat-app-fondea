/**
 * Service de Perfil — la ÚNICA puerta a los datos del usuario.
 *
 * HOY: lee desde Logto claims (getLogtoContext).
 * MAÑANA: puede leer de backend, Supabase, etc. Solo se toca ESTE archivo.
 *
 * Retorna Result<T> — los componentes nunca ven errores crudos.
 */

import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import type { Result } from '@/modules/shared/result';
import type { FullUserProfile, UserSummary, UserSecurity } from './profile.types';
import type { ProfileError } from './profile.errors';
import { errors } from './profile.errors';
import {
  mapFullProfileFromClaims,
  mapSummaryFromClaims,
  mapSecurityFromClaims,
} from './profile.mapper';

// Re-tipamos Result con nuestro error específico
type ProfileResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: ProfileError }
);

/**
 * Obtiene el perfil completo del usuario autenticado.
 * Usado por la profile page.
 */
export async function getFullProfile(): Promise<ProfileResult<FullUserProfile>> {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !claims) {
      return { ok: false, error: errors.sessionExpired() };
    }

    const data = mapFullProfileFromClaims(claims as Record<string, unknown>);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errors.serverError() };
  }
}

/**
 * Obtiene resumen ligero del usuario (para navbar, headers, etc.)
 * Solo name + email + avatar + id.
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
 * Reemplaza a getUserInfo/getUserName de lib/user/get-user-name.ts
 */
export async function getUserInfo(): Promise<{ name: string | null; email: string | null }> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return { name: null, email: null };
  }

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
 * Usado por la página de settings.
 */
export async function getUserSecurity(): Promise<ProfileResult<UserSecurity>> {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !claims) {
      return { ok: false, error: errors.sessionExpired() };
    }

    const security = mapSecurityFromClaims(claims as Record<string, unknown>);
    return { ok: true, data: security };
  } catch (err) {
    return { ok: false, error: errors.serverError() };
  }
}
