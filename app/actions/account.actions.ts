'use server';

import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT!;

/**
 * Helper: obtiene el opaque access token para el Account API de Logto.
 * Sin resource = token para /api/my-account/*.
 */
async function getAccountToken(): Promise<string> {
  return await getAccessTokenRSC(logtoConfig);
}

/**
 * Helper: hace fetch al Account API de Logto.
 */
async function accountFetch(path: string, options: RequestInit = {}) {
  const token = await getAccountToken();
  const url = `${LOGTO_ENDPOINT}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json',
      ...options.headers,
    },
  });

  return res;
}

// ─── Verificación de identidad ────────────────────────────────────────────────

/**
 * Verifica la contraseña del usuario y devuelve un verification record ID.
 * Este ID es válido por 10 minutos y se necesita para operaciones sensibles.
 */
export async function verifyPassword(password: string): Promise<{
  success: boolean;
  verificationRecordId?: string;
  error?: string;
}> {
  try {
    const res = await accountFetch('/api/verifications/password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Contraseña incorrecta' };
    }

    const data = await res.json();
    return { success: true, verificationRecordId: data.verificationRecordId };
  } catch (error) {
    console.error('[ACCOUNT] verifyPassword error:', error);
    return { success: false, error: 'Error de red' };
  }
}

// ─── Identidades sociales ─────────────────────────────────────────────────────

/**
 * Obtiene las identidades sociales vinculadas al usuario.
 */
export async function getLinkedIdentities(): Promise<{
  success: boolean;
  identities?: Record<string, { userId: string; details?: Record<string, unknown> }>;
  error?: string;
}> {
  try {
    const res = await accountFetch('/api/my-account');

    if (!res.ok) {
      return { success: false, error: 'No se pudo obtener la información' };
    }

    const data = await res.json();
    return { success: true, identities: data.identities || {} };
  } catch (error) {
    console.error('[ACCOUNT] getLinkedIdentities error:', error);
    return { success: false, error: 'Error de red' };
  }
}

/**
 * Inicia el flujo para vincular una nueva cuenta social (Google).
 * Retorna la URL de autorización a la que se debe redirigir al usuario.
 */
export async function startLinkSocial(
  connectorId: string,
  redirectUri: string,
  state: string,
): Promise<{
  success: boolean;
  authorizationUrl?: string;
  verificationRecordId?: string;
  error?: string;
}> {
  try {
    const res = await accountFetch('/api/verifications/social', {
      method: 'POST',
      body: JSON.stringify({ connectorId, redirectUri, state }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Error al iniciar vinculación' };
    }

    const data = await res.json();
    return {
      success: true,
      authorizationUrl: data.authorizationUri,
      verificationRecordId: data.verificationRecordId,
    };
  } catch (error) {
    console.error('[ACCOUNT] startLinkSocial error:', error);
    return { success: false, error: 'Error de red' };
  }
}

/**
 * Verifica la respuesta del proveedor social después de la autorización.
 */
export async function verifySocialCallback(
  connectorData: Record<string, string>,
  verificationRecordId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const res = await accountFetch('/api/verifications/social/verify', {
      method: 'POST',
      body: JSON.stringify({ connectorData, verificationRecordId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Error al verificar' };
    }

    return { success: true };
  } catch (error) {
    console.error('[ACCOUNT] verifySocialCallback error:', error);
    return { success: false, error: 'Error de red' };
  }
}

/**
 * Completa la vinculación de una nueva identidad social.
 * Requiere verification record ID (de verificar contraseña) + social verification record ID.
 */
export async function linkSocialIdentity(
  identityVerificationRecordId: string,
  socialVerificationRecordId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const res = await accountFetch('/api/my-account/identities', {
      method: 'POST',
      headers: {
        'logto-verification-id': identityVerificationRecordId,
      },
      body: JSON.stringify({
        newIdentifierVerificationRecordId: socialVerificationRecordId,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Error al vincular' };
    }

    return { success: true };
  } catch (error) {
    console.error('[ACCOUNT] linkSocialIdentity error:', error);
    return { success: false, error: 'Error de red' };
  }
}

/**
 * Desvincula una identidad social del usuario.
 * Requiere verification record ID (de verificar contraseña).
 * El target es el identificador del proveedor (ej: "google").
 */
export async function unlinkSocialIdentity(
  target: string,
  verificationRecordId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const res = await accountFetch(`/api/my-account/identities/${target}`, {
      method: 'DELETE',
      headers: {
        'logto-verification-id': verificationRecordId,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'No se pudo desvincular' };
    }

    return { success: true };
  } catch (error) {
    console.error('[ACCOUNT] unlinkSocialIdentity error:', error);
    return { success: false, error: 'Error de red' };
  }
}

// ─── Contraseña ───────────────────────────────────────────────────────────────

/**
 * Actualiza la contraseña del usuario.
 * Requiere verification record ID.
 */
export async function updatePassword(
  newPassword: string,
  verificationRecordId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const res = await accountFetch('/api/my-account/password', {
      method: 'POST',
      headers: {
        'logto-verification-id': verificationRecordId,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Error al cambiar contraseña' };
    }

    return { success: true };
  } catch (error) {
    console.error('[ACCOUNT] updatePassword error:', error);
    return { success: false, error: 'Error de red' };
  }
}
