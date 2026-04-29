'use server';

import { getLogtoContext, getAccessTokenRSC } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { logtoConfig } from '../logto';

export async function getUser() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    return null;
  }

  return {
    id: claims.sub || '',
    name: claims.name || claims.username || 'Usuario',
    email: claims.email || '',
    phone: claims.phone_number || '',
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  return isAuthenticated;
}

/**
 * Valida que la sesión esté activa contra Logto.
 *
 * Usa getAccessTokenRSC que intenta refrescar el token con el servidor de Logto.
 * Si el refresh token expiró o la sesión fue revocada, lanza una excepción
 * y redirigimos al login.
 *
 * Usar en layouts protegidos en lugar de solo verificar la cookie local.
 */
export async function requireValidSession() {
  // Primero verificación rápida local
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) {
    redirect('/');
  }

  // Verificación real contra Logto — refresca el token si está por vencer,
  // lanza error si la sesión expiró o fue revocada
  try {
    await getAccessTokenRSC(logtoConfig);
  } catch {
    // Token inválido, expirado o sesión revocada → forzar nuevo login
    console.warn('[AUTH] Sesión expirada o inválida, redirigiendo al login');
    redirect('/');
  }

  return {
    id: claims!.sub || '',
    name: claims!.name || claims!.username || 'Usuario',
    email: claims!.email || '',
    phone: claims!.phone_number || '',
  };
}
