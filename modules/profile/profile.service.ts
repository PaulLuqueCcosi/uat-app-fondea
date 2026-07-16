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
  mapUserDataFromBackend,
  mergeBackendDataIntoProfile,
  getNamesFromBackendData,
} from './profile.mapper';
import { backendFetch } from '@/lib/backend-fetch';
import type { BackendUserData } from './profile.mapper';

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
    return data;
  } catch (err) {
    console.log('[PROFILE:fetchAccountData] ❌ Error:', err);
    return null;
  }
}

/**
 * Obtiene datos del usuario desde el backend Java (nombres, documento).
 * GET /api/v1/users/me — autenticado con JWT.
 * Retorna null si falla (no bloquea el flujo).
 */
async function fetchUserData(): Promise<BackendUserData | null> {
  try {
    const res = await backendFetch('/api/v1/users/me', { context: 'PROFILE' });

    if (!res.ok) {
      console.log('[PROFILE:fetchUserData] ⚠️ Backend HTTP', res.status, '— usando fallback Logto');
      return null;
    }

    const raw = await res.json();
    return mapUserDataFromBackend(raw);
  } catch (err) {
    console.log('[PROFILE:fetchUserData] ⚠️ Error:', err, '— usando fallback Logto');
    return null;
  }
}

/**
 * Obtiene el perfil completo del usuario autenticado.
 * Combina: Logto Account API (email, phone, seguridad) + Backend Java (nombres, documento).
 * Usado por la profile page.
 */
export async function getFullProfile(): Promise<ProfileResult<FullUserProfile>> {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !claims) {
      return { ok: false, error: errors.sessionExpired() };
    }

    // Obtener datos de ambas fuentes en paralelo
    const [accountData, backendData] = await Promise.all([
      fetchAccountData(),
      fetchUserData(),
    ]);

    // Base: Logto Account API (email, phone, seguridad) + claims (identities, timestamps)
    const source = accountData
      ? { ...claims, ...accountData } as Record<string, unknown>
      : claims as Record<string, unknown>;

    const data = mapFullProfileFromClaims(source);

    // Sobreescribir nombres y documento con datos del backend (fuente de verdad)
    if (backendData) {
      data.profile = mergeBackendDataIntoProfile(data.profile, backendData);
    }

    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errors.serverError() };
  }
}

/**
 * Obtiene resumen ligero del usuario (para navbar, sidebar).
 * name = solo nombres (sin apellidos) — del backend si disponible.
 */
export async function getProfileSummary(): Promise<ProfileResult<UserSummary>> {
  try {
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !claims) {
      return { ok: false, error: errors.sessionExpired() };
    }

    // Obtener ambas fuentes en paralelo
    const [accountData, backendData] = await Promise.all([
      fetchAccountData(),
      fetchUserData(),
    ]);

    const source = accountData
      ? { ...claims, ...accountData } as Record<string, unknown>
      : claims as Record<string, unknown>;

    const summary = mapSummaryFromClaims(source);

    // Sobreescribir name con solo los nombres del backend (sin apellidos)
    // Sin fallback — si el backend no tiene nombres, queda vacío
    const backendNames = backendData ? getNamesFromBackendData(backendData) : null;
    if (backendNames) {
      summary.name = backendNames;
    } else {
      console.error('[PROFILE:getProfileSummary] ⚠️ Backend no tiene nombres para este usuario');
      summary.name = '';
    }

    // Sobreescribir DNI con datos del backend
    if (backendData?.documentNumber) {
      summary.dni = backendData.documentNumber;
    }

    return { ok: true, data: summary };
  } catch (err) {
    return { ok: false, error: errors.serverError() };
  }
}

/**
 * Obtiene nombre y email del usuario autenticado.
 * name = solo nombres (sin apellidos) del backend.
 * Fallback: Logto claims si el backend no responde.
 */
export async function getUserInfo(): Promise<{ name: string | null; email: string | null }> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return { name: null, email: null };
  }

  // Obtener ambas fuentes en paralelo
  const [accountData, backendData] = await Promise.all([
    fetchAccountData(),
    fetchUserData(),
  ]);

  // Email siempre de Logto (es la fuente de verdad para auth)
  const email = (accountData?.primaryEmail || claims.email || null) as string | null;

  // Nombres SOLO del backend — sin fallback a Logto
  const backendNames = backendData ? getNamesFromBackendData(backendData) : null;
  if (!backendNames) {
    console.error('[PROFILE:getUserInfo] ⚠️ Backend no tiene nombres para este usuario');
  }
  return { name: backendNames, email };
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
 * DNI viene del backend Java.
 */
export async function getUserSupportData(): Promise<{ accountId: string | null; dni: string | null }> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return { accountId: null, dni: null };
  }

  const backendData = await fetchUserData();

  return {
    accountId: (claims.sub as string) || null,
    dni: backendData?.documentNumber ?? null,
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
 * Indica si el usuario ya tiene al menos un préstamo desembolsado.
 * Dato que viene del backend — se usa para que la calculadora muestre tasas correctas.
 * false = primer préstamo, true = recurrente.
 */
export async function getHasDisbursedLoan(): Promise<boolean> {
  const userData = await fetchUserData();
  return userData?.hasDisbursedLoan ?? false;
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
