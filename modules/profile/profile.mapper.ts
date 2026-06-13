/**
 * Mapper de Perfil — transforma datos de la fuente al formato del frontend.
 *
 * HOY: transforma claims de Logto (JWT decoded).
 * MAÑANA: si migras a otro provider o backend, solo cambias este archivo.
 *
 * Regla: el mapper NUNCA lanza excepciones. Si un campo falta, usa valor default.
 */

import type {
  UserProfile,
  UserContact,
  UserSecurity,
  LinkedAccount,
  FullUserProfile,
  UserSummary,
} from './profile.types';

/**
 * Logto claims → FullUserProfile (perfil completo).
 */
export function mapFullProfileFromClaims(claims: Record<string, unknown>): FullUserProfile {
  return {
    profile: mapProfileFromClaims(claims),
    contact: mapContactFromClaims(claims),
    security: mapSecurityFromClaims(claims),
  };
}

/**
 * Logto claims → UserProfile.
 */
export function mapProfileFromClaims(claims: Record<string, unknown>): UserProfile {
  const name = String(claims.name || claims.username || '');
  const nameParts = name.split(' ');

  return {
    firstName: nameParts[0] || null,
    secondName: nameParts.length > 2 ? nameParts[1] : null,
    firstLastName: nameParts.length > 2 ? nameParts[2] : (nameParts[1] || null),
    secondLastName: nameParts.length > 3 ? nameParts[3] : null,
    dni: null, // Logto no tiene DNI — vendrá del backend/expediente
    dniVerified: false,
    avatar: claims.picture ? String(claims.picture) : null,
    createdAt: claims.created_at
      ? new Date(Number(claims.created_at) * 1000).toISOString()
      : null,
    lastLogin: null,
  };
}

/**
 * Logto claims → UserContact.
 */
export function mapContactFromClaims(claims: Record<string, unknown>): UserContact {
  return {
    email: claims.email ? String(claims.email) : null,
    emailVerified: !!claims.email_verified,
    phone: claims.phone_number ? String(claims.phone_number) : null,
    phoneVerified: !!claims.phone_number_verified,
  };
}

/**
 * Logto claims → UserSecurity.
 */
export function mapSecurityFromClaims(claims: Record<string, unknown>): UserSecurity {
  const linkedAccounts: LinkedAccount[] = [];

  if (claims.identities && typeof claims.identities === 'object') {
    const identities = claims.identities as Record<string, { userId?: string; details?: { email?: string } }>;
    for (const [provider, data] of Object.entries(identities)) {
      linkedAccounts.push({
        provider,
        email: data?.details?.email || String(claims.email || ''),
        connectedAt: '',
      });
    }
  }

  return {
    // Logto no expone si tiene password desde claims — asumimos true si no tiene social login
    hasPassword: linkedAccounts.length === 0,
    linkedAccounts,
  };
}

/**
 * Logto claims → UserSummary (lightweight, para navbar).
 */
export function mapSummaryFromClaims(claims: Record<string, unknown>): UserSummary {
  return {
    id: String(claims.sub || ''),
    name: String(claims.name || claims.username || 'Usuario'),
    email: String(claims.email || ''),
    avatar: claims.picture ? String(claims.picture) : null,
    dni: null,
  };
}
