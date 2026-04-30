'use server';

import { ReferencesProfile, ReferencesProfileStatus } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

// ── Helper: fetch autenticado al backend ──────────────────────────────────────

async function backendFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessTokenRSC(logtoConfig, process.env.LOGTO_API_RESOURCE);
  const baseUrl = process.env.BACKEND_API_URL ?? 'http://localhost:8080';

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// ── Mappers: backend (camelCase) ↔ frontend (snake_case) ─────────────────────

function mapProfileFromBackend(raw: any): ReferencesProfile & { verified: boolean } {
  return {
    family_reference: {
      name:               raw.familyReference.name,
      phone:              raw.familyReference.phone,
      relationship:       raw.familyReference.relationship,
      relationship_other: raw.familyReference.relationshipOther ?? undefined,
    },
    non_family_reference: {
      name:               raw.nonFamilyReference.name,
      phone:              raw.nonFamilyReference.phone,
      relationship:       raw.nonFamilyReference.relationship,
      relationship_other: raw.nonFamilyReference.relationshipOther ?? undefined,
      years_known:        raw.nonFamilyReference.yearsKnown,
    },
    verified: raw.verified ?? false,
  };
}

// ── Manejo de errores del backend ─────────────────────────────────────────────

async function parseBackendError(res: Response): Promise<string> {
  try {
    const json = await res.json();
    return json.detail ?? json.error ?? 'Error al guardar.';
  } catch {
    return 'Error al guardar.';
  }
}

function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

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

    return {
      profile:          json.profile ? mapProfileFromBackend(json.profile) : null,
      overall_verified: json.overallVerified ?? false,
    };
  } catch (error) {
    console.error('[REFERENCES] Error de conexión al obtener estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── PUT: Guardar referencias ──────────────────────────────────────────────────

export async function saveReferencesProfile(
  profile: Omit<ReferencesProfile, 'verified'>
): Promise<{ success: boolean; error?: string }> {
  await requireValidSession();

  try {
    const body: Record<string, any> = {
      familyReference: {
        name:         profile.family_reference.name,
        phone:        profile.family_reference.phone,
        relationship: profile.family_reference.relationship,
        ...(profile.family_reference.relationship === 'OTRO' && {
          relationshipOther: profile.family_reference.relationship_other,
        }),
      },
      nonFamilyReference: {
        name:         profile.non_family_reference.name,
        phone:        profile.non_family_reference.phone,
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

    if (isSuccess(res.status)) return { success: true };

    const error = await parseBackendError(res);
    return { success: false, error };
  } catch (error) {
    console.error('[REFERENCES] Error al guardar referencias:', error);
    return { success: false, error: 'Error de conexión.' };
  }
}
