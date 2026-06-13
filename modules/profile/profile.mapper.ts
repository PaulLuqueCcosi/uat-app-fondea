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
 * Logto claims/Account API → UserProfile.
 * Account API devuelve: createdAt (ms), name (string o null), username (prefijo_numero)
 * Claims devuelven: name, created_at (seconds)
 */
export function mapProfileFromClaims(claims: Record<string, unknown>): UserProfile {
  const name = String(claims.name || '');
  const nameParts = name.split(' ');

  // createdAt puede ser milisegundos (Account API) o segundos (claims)
  let createdAt: string | null = null;
  if (claims.createdAt) {
    createdAt = new Date(Number(claims.createdAt)).toISOString();
  } else if (claims.created_at) {
    createdAt = new Date(Number(claims.created_at) * 1000).toISOString();
  }

  // Parsear username: "dni_73057755" → { type: "dni", number: "73057755" }
  const { documentType, documentNumber } = parseUsername(claims.username);

  return {
    firstName: nameParts[0] || null,
    secondName: nameParts.length > 2 ? nameParts[1] : null,
    firstLastName: nameParts.length > 2 ? nameParts[2] : (nameParts[1] || null),
    secondLastName: nameParts.length > 3 ? nameParts[3] : null,
    documentType,
    documentNumber,
    documentVerified: !!documentNumber,
    avatar: claims.picture ? String(claims.picture) : (claims.avatar ? String(claims.avatar) : null),
    createdAt,
    lastLogin: claims.lastSignInAt
      ? new Date(Number(claims.lastSignInAt)).toISOString()
      : null,
  };
}

/**
 * Logto claims/Account API → UserContact.
 * La Account API usa: primaryEmail, primaryPhone
 * Los claims usan: email, phone_number
 */
export function mapContactFromClaims(claims: Record<string, unknown>): UserContact {
  return {
    email: (claims.primaryEmail || claims.email || null) as string | null,
    emailVerified: !!claims.email_verified || !!claims.primaryEmail,
    phone: (claims.primaryPhone || claims.phone_number || null) as string | null,
    phoneVerified: !!claims.phone_number_verified || !!claims.primaryPhone,
  };
}

/**
 * Logto claims/Account API → UserSecurity.
 * La Account API devuelve: hasPassword (boolean), identities (object)
 */
export function mapSecurityFromClaims(claims: Record<string, unknown>): UserSecurity {
  const linkedAccounts: LinkedAccount[] = [];

  if (claims.identities && typeof claims.identities === 'object') {
    const identities = claims.identities as Record<string, { userId?: string; details?: { email?: string; name?: string } }>;
    for (const [provider, data] of Object.entries(identities)) {
      linkedAccounts.push({
        provider,
        email: data?.details?.email || String(claims.primaryEmail || claims.email || ''),
        connectedAt: '',
      });
    }
  }

  return {
    // Si la Account API devuelve hasPassword, usarlo directamente
    hasPassword: typeof claims.hasPassword === 'boolean'
      ? claims.hasPassword
      : linkedAccounts.length === 0, // fallback heurístico
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
    email: String(claims.primaryEmail || claims.email || ''),
    avatar: claims.picture ? String(claims.picture) : null,
    dni: null,
  };
}

// ── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Parsea el username con formato "prefijo_numero".
 * Ejemplos: "dni_73057755", "ce_001234567", "pasaporte_AB123456"
 */
function parseUsername(username: unknown): { documentType: string | null; documentNumber: string | null } {
  if (!username || typeof username !== 'string') {
    return { documentType: null, documentNumber: null };
  }

  const underscoreIndex = username.indexOf('_');
  if (underscoreIndex === -1) {
    return { documentType: null, documentNumber: null };
  }

  const type = username.slice(0, underscoreIndex).toLowerCase();
  const number = username.slice(underscoreIndex + 1);

  if (!type || !number) {
    return { documentType: null, documentNumber: null };
  }

  return { documentType: type, documentNumber: number };
}

/**
 * Mapa de prefijos a labels legibles para la UI.
 */
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  dni: 'DNI',
  ce: 'Carné de Extranjería',
  pasaporte: 'Pasaporte',
  ptp: 'PTP',
  ruc: 'RUC',
};

export function getDocumentLabel(type: string | null): string {
  if (!type) return 'Documento';
  return DOCUMENT_TYPE_LABELS[type] ?? type.toUpperCase();
}

/**
 * Formatea un teléfono para mostrar en la UI.
 * Usa libphonenumber-js para formateo internacional automático.
 * "51927539933" → "+51 927 539 933"
 */
export function formatPhoneForDisplay(phone: string | null): string {
  if (!phone) return '';

  try {
    const { parsePhoneNumberFromString } = require('libphonenumber-js');
    const parsed = parsePhoneNumberFromString(`+${phone.replace(/\D/g, '')}`);
    if (parsed) return parsed.formatInternational();
  } catch {
    // Fallback si la librería falla
  }

  return `+${phone.replace(/\D/g, '')}`;
}
