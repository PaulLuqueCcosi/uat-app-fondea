/**
 * Acciones de mutación del perfil.
 *
 * Cada función representa una operación que modifica datos del usuario.
 * Los componentes llaman a estas funciones via server actions.
 *
 * Usa la Account API de Logto para operaciones sensibles.
 * Flujo: verificar identidad (10 min TTL) → ejecutar operación.
 */

import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import type { ActionResult } from './profile.types';

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT!;

// ── Helper interno: fetch al Account API de Logto ─────────────────────────────

async function accountFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessTokenRSC(logtoConfig);
  const url = `${LOGTO_ENDPOINT}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json',
      ...options.headers,
    },
  });
}

// ── Verificación de identidad ─────────────────────────────────────────────────

/**
 * Verifica la identidad del usuario con contraseña.
 * Retorna un verificationRecordId válido por 10 minutos.
 */
export async function verifyIdentity(password: string): Promise<ActionResult & { verificationRecordId?: string }> {
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
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Envía código de verificación al email actual del usuario para verificar identidad.
 * Usado cuando el usuario NO tiene contraseña (solo social login).
 * Template: UserPermissionValidation.
 */
export async function sendIdentityVerificationCode(email: string): Promise<ActionResult & { verificationRecordId?: string }> {
  try {
    const res = await accountFetch('/api/verifications/verification-code', {
      method: 'POST',
      body: JSON.stringify({
        identifier: { type: 'email', value: email },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'No se pudo enviar el código' };
    }

    const data = await res.json();
    return { success: true, verificationRecordId: data.verificationRecordId };
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Verifica el código enviado al email actual para confirmar identidad.
 * Retorna el verificationRecordId actualizado (válido 10 min).
 */
export async function verifyIdentityCode(
  email: string,
  verificationId: string,
  code: string,
): Promise<ActionResult & { verificationRecordId?: string }> {
  try {
    const res = await accountFetch('/api/verifications/verification-code/verify', {
      method: 'POST',
      body: JSON.stringify({
        identifier: { type: 'email', value: email },
        verificationId,
        code,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Código incorrecto o expirado' };
    }

    // Después de verificar, el verificationRecordId sigue siendo el mismo
    return { success: true, verificationRecordId: verificationId };
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

// ── Email ─────────────────────────────────────────────────────────────────────

/**
 * Envía código de verificación al nuevo email.
 * Template: BindNewIdentifier.
 */
export async function sendEmailVerificationCode(newEmail: string): Promise<ActionResult & { verificationRecordId?: string }> {
  try {
    const res = await accountFetch('/api/verifications/verification-code', {
      method: 'POST',
      body: JSON.stringify({
        identifier: { type: 'email', value: newEmail },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'No se pudo enviar el código' };
    }

    const data = await res.json();
    return { success: true, verificationRecordId: data.verificationRecordId };
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Verifica el código recibido en el nuevo email.
 */
export async function verifyEmailCode(
  newEmail: string,
  verificationId: string,
  code: string,
): Promise<ActionResult> {
  try {
    const res = await accountFetch('/api/verifications/verification-code/verify', {
      method: 'POST',
      body: JSON.stringify({
        identifier: { type: 'email', value: newEmail },
        verificationId,
        code,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Código incorrecto o expirado' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Confirma el cambio de email.
 * Requiere:
 * - identityVerificationId: del paso de verificar identidad (contraseña)
 * - emailVerificationId: del paso de verificar el nuevo email (código)
 */
export async function confirmEmailChange(
  newEmail: string,
  identityVerificationId: string,
  emailVerificationId: string,
): Promise<ActionResult> {
  try {
    const res = await accountFetch('/api/my-account/primary-email', {
      method: 'POST',
      headers: {
        'logto-verification-id': identityVerificationId,
      },
      body: JSON.stringify({
        email: newEmail,
        newIdentifierVerificationRecordId: emailVerificationId,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'No se pudo actualizar el correo' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

// ── Teléfono ──────────────────────────────────────────────────────────────────

/**
 * Envía código SMS al nuevo número.
 */
export async function sendPhoneVerificationCode(newPhone: string): Promise<ActionResult & { verificationRecordId?: string }> {
  try {
    const res = await accountFetch('/api/verifications/verification-code', {
      method: 'POST',
      body: JSON.stringify({
        identifier: { type: 'phone', value: newPhone },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'No se pudo enviar el SMS' };
    }

    const data = await res.json();
    return { success: true, verificationRecordId: data.verificationRecordId };
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Verifica el código SMS recibido en el nuevo teléfono.
 */
export async function verifyPhoneCode(
  newPhone: string,
  verificationId: string,
  code: string,
): Promise<ActionResult> {
  try {
    const res = await accountFetch('/api/verifications/verification-code/verify', {
      method: 'POST',
      body: JSON.stringify({
        identifier: { type: 'phone', value: newPhone },
        verificationId,
        code,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Código incorrecto o expirado' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Confirma el cambio de teléfono.
 */
export async function confirmPhoneChange(
  newPhone: string,
  identityVerificationId: string,
  phoneVerificationId: string,
): Promise<ActionResult> {
  try {
    const res = await accountFetch('/api/my-account/primary-phone', {
      method: 'POST',
      headers: {
        'logto-verification-id': identityVerificationId,
      },
      body: JSON.stringify({
        phone: newPhone,
        newIdentifierVerificationRecordId: phoneVerificationId,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'No se pudo actualizar el teléfono' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

// ── Contraseña ────────────────────────────────────────────────────────────────

/**
 * Cambia la contraseña del usuario.
 * Requiere verificationRecordId de verificar identidad.
 */
export async function changePassword(
  newPassword: string,
  verificationRecordId: string,
): Promise<ActionResult> {
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
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Crea una contraseña (si el usuario solo tiene social login).
 * Mismo endpoint, pero usuario no tenía password antes.
 */
export async function createPassword(
  newPassword: string,
  verificationRecordId: string,
): Promise<ActionResult> {
  return changePassword(newPassword, verificationRecordId);
}

// ── Google / Social ───────────────────────────────────────────────────────────

/**
 * Desvincula la cuenta de Google.
 * Prerequisito: el usuario debe tener contraseña configurada.
 */
export async function unlinkGoogle(verificationRecordId: string): Promise<ActionResult> {
  try {
    const res = await accountFetch('/api/my-account/identities/google', {
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
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Vincula una cuenta de Google (inicia el flujo OAuth).
 */
export async function linkGoogle(): Promise<ActionResult> {
  // TODO: implementar flujo OAuth completo con redirectUri
  return { success: false, error: 'No implementado aún' };
}

// ── Avatar ────────────────────────────────────────────────────────────────────

/**
 * Actualiza el avatar del usuario.
 */
export async function updateAvatar(avatarUrl: string): Promise<ActionResult> {
  try {
    const res = await accountFetch('/api/my-account', {
      method: 'PATCH',
      body: JSON.stringify({ avatar: avatarUrl }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Error al actualizar avatar' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Error de conexión' };
  }
}

// ── Eliminar cuenta ───────────────────────────────────────────────────────────

/**
 * Elimina la cuenta del usuario permanentemente.
 * Requiere verificación de identidad previa.
 *
 * NOTA: Logto no expone DELETE /account en la Account API.
 * Se debe usar la Management API para esto.
 */
export async function deleteAccount(): Promise<ActionResult> {
  // TODO: implementar via Management API (requiere M2M token)
  return { success: false, error: 'No implementado aún — requiere Management API' };
}
