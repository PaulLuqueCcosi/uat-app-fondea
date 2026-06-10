import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import type { UserProfile, UserContact, UserSecurity } from './types';

export interface FullUserProfile {
  profile: UserProfile;
  contact: UserContact;
  security: UserSecurity;
}

/**
 * Obtiene el perfil completo del usuario autenticado.
 *
 * HOY: desde los claims de Logto (getLogtoContext).
 * MAÑANA: puede cambiar a backend, Supabase, lo que sea. Solo se cambia aquí.
 */
export async function getFullUserProfile(): Promise<FullUserProfile | null> {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !claims) return null;

  // Extraer nombre — Logto puede dar "name" como string completo
  // o campos individuales según custom claims
  const nameParts = (claims.name || claims.username || '').split(' ');

  const profile: UserProfile = {
    firstName: nameParts[0] || null,
    secondName: nameParts.length > 2 ? nameParts[1] : null,
    firstLastName: nameParts.length > 2 ? nameParts[2] : (nameParts[1] || null),
    secondLastName: nameParts.length > 3 ? nameParts[3] : null,
    dni: null, // Logto no tiene DNI — vendrá del backend/expediente
    dniVerified: false,
    avatar: claims.picture || null,
    createdAt: claims.created_at
      ? new Date(Number(claims.created_at) * 1000).toISOString()
      : null,
    lastLogin: null,
  };

  const contact: UserContact = {
    email: claims.email || null,
    emailVerified: !!claims.email_verified,
    phone: claims.phone_number || null,
    phoneVerified: !!claims.phone_number_verified,
  };

  // Detectar si tiene cuentas vinculadas (Google, etc.)
  const linkedAccounts: UserSecurity['linkedAccounts'] = [];
  if (claims.identities && typeof claims.identities === 'object') {
    const identities = claims.identities as Record<string, { userId?: string; details?: { email?: string } }>;
    for (const [provider, data] of Object.entries(identities)) {
      linkedAccounts.push({
        provider,
        email: data?.details?.email || claims.email || '',
        connectedAt: '', // Logto no expone fecha de vinculación en claims
      });
    }
  }

  const security: UserSecurity = {
    // Logto no expone si tiene password desde claims — asumimos true si no tiene social login
    // o false si solo tiene social login. Esto se puede refinar con Account API.
    hasPassword: linkedAccounts.length === 0,
    linkedAccounts,
  };

  return { profile, contact, security };
}

/**
 * Obtiene solo el perfil (nombre, avatar, DNI, etc.)
 */
export async function getUserProfile(): Promise<UserProfile> {
  const data = await getFullUserProfile();
  return data?.profile ?? {
    firstName: null,
    secondName: null,
    firstLastName: null,
    secondLastName: null,
    dni: null,
    dniVerified: false,
    avatar: null,
    createdAt: null,
    lastLogin: null,
  };
}

/**
 * Obtiene solo los datos de contacto (email, teléfono).
 */
export async function getUserContact(): Promise<UserContact> {
  const data = await getFullUserProfile();
  return data?.contact ?? {
    email: null,
    emailVerified: false,
    phone: null,
    phoneVerified: false,
  };
}

/**
 * Obtiene solo los datos de seguridad (password, cuentas vinculadas).
 */
export async function getUserSecurity(): Promise<UserSecurity> {
  const data = await getFullUserProfile();
  return data?.security ?? {
    hasPassword: false,
    linkedAccounts: [],
  };
}
