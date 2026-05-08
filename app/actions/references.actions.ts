'use server';

import { ReferencesProfile, ReferencesProfileStatus, ActionResult } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { backendFetch as _backendFetch } from '@/lib/backend-fetch';
import { parseBackendResponse, networkError } from '@/lib/action-utils';

const backendFetch = (path: string, options?: RequestInit) =>
  _backendFetch(path, { ...options, context: 'REFERENCES' });

// ── Helpers de teléfono E.164 ─────────────────────────────────────────────────

/** Convierte teléfono local (9 dígitos) a formato E.164 (+51XXXXXXXXX) */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('51') && digits.length === 11) return `+${digits}`;
  if (digits.length === 9) return `+51${digits}`;
  return phone.startsWith('+') ? phone : `+51${digits}`;
}

/** Extrae los 9 dígitos locales de un teléfono E.164 (+51XXXXXXXXX → XXXXXXXXX) */
function fromE164(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('51') && digits.length === 11) return digits.slice(2);
  if (digits.length === 9) return digits;
  return phone;
}

// ── Mappers: backend (camelCase) ↔ frontend (snake_case) ─────────────────────

function mapProfileFromBackend(raw: any): ReferencesProfile & { verified: boolean } {
  return {
    family_reference: {
      name:               raw.familyReference.name,
      phone:              fromE164(raw.familyReference.phone),
      relationship:       raw.familyReference.relationship,
      relationship_other: raw.familyReference.relationshipOther ?? undefined,
    },
    non_family_reference: {
      name:               raw.nonFamilyReference.name,
      phone:              fromE164(raw.nonFamilyReference.phone),
      relationship:       raw.nonFamilyReference.relationship,
      relationship_other: raw.nonFamilyReference.relationshipOther ?? undefined,
      years_known:        raw.nonFamilyReference.yearsKnown,
    },
    verified: raw.verified ?? false,
  };
}

// ── Manejo de errores del backend ─────────────────────────────────────────────

// ── GET: Estado completo ──────────────────────────────────────────────────────

export async function getReferencesProfileStatus(): Promise<ReferencesProfileStatus> {
  await requireValidSession();

  try {
    const res = await backendFetch('/api/v1/references/status');

    if (!res.ok) {
      console.error('[REFERENCES] Error al obtener estado:', res.status);
      return { profile: null, overall_verified: false };
    }

    const json = await res.json();

    console.log('[REFERENCES] GET status →', JSON.stringify(json)?.slice(0, 200));

    // El backend devuelve { profile: { familyReference, nonFamilyReference, verified } }
    if (!json?.profile || !json.profile.familyReference) {
      return { profile: null, overall_verified: false };
    }

    const profile = mapProfileFromBackend(json.profile);
    return {
      profile,
      overall_verified: json.profile.verified ?? false,
    };
  } catch (error) {
    console.error('[REFERENCES] Error de conexión al obtener estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── PUT: Guardar referencias ──────────────────────────────────────────────────

export async function saveReferencesProfile(
  profile: Omit<ReferencesProfile, 'verified'>
): Promise<ActionResult> {
  await requireValidSession();

  try {
    const body: Record<string, any> = {
      familyReference: {
        name:         profile.family_reference.name,
        phone:        toE164(profile.family_reference.phone),
        relationship: profile.family_reference.relationship,
        ...(profile.family_reference.relationship === 'OTRO' && {
          relationshipOther: profile.family_reference.relationship_other,
        }),
      },
      nonFamilyReference: {
        name:         profile.non_family_reference.name,
        phone:        toE164(profile.non_family_reference.phone),
        relationship: profile.non_family_reference.relationship,
        yearsKnown:   profile.non_family_reference.years_known,
        ...(profile.non_family_reference.relationship === 'OTRO' && {
          relationshipOther: profile.non_family_reference.relationship_other,
        }),
      },
    };

    const res = await backendFetch('/api/v1/references/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return parseBackendResponse(res);
  } catch {
    console.error('[REFERENCES] Error al guardar referencias');
    return networkError();
  }
}
