'use server';

import { ReferencesProfile, ReferencesProfileStatus } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import fs from 'fs/promises';
import path from 'path';

// ── Paths ─────────────────────────────────────────────────────────────────────

const REFERENCES_DB = path.join(process.cwd(), 'mock-db', 'references-profile.json');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function readJSON<T>(filePath: string): Promise<Record<string, T>> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

async function writeJSON<T>(filePath: string, data: Record<string, T>): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── GET: Estado completo ──────────────────────────────────────────────────────

/**
 * Obtiene el estado completo de las referencias del usuario.
 * Retorna el perfil y si está verificado.
 */
export async function getReferencesProfileStatus(): Promise<ReferencesProfileStatus> {
  const user = await requireValidSession();

  try {
    const db = await readJSON<ReferencesProfile>(REFERENCES_DB);
    const profile = db[user.id] ?? null;

    const overall_verified = profile?.verified === true;

    return {
      profile: profile ? { ...profile, verified: profile.verified ?? false } : null,
      overall_verified,
    };
  } catch (error) {
    console.error('[REFERENCES] Error al leer estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── PUT: Guardar referencias ──────────────────────────────────────────────────

export async function saveReferencesProfile(
  profile: Omit<ReferencesProfile, 'verified'>
): Promise<{ success: boolean; error?: string }> {
  const user = await requireValidSession();

  try {
    await new Promise((r) => setTimeout(r, 400));

    // Validaciones - Referencia Familiar
    if (!profile.family_reference.name || profile.family_reference.name.trim().length < 3) {
      return { success: false, error: 'El nombre de la referencia familiar debe tener al menos 3 caracteres.' };
    }

    if (!profile.family_reference.relationship) {
      return { success: false, error: 'Selecciona la relación con la referencia familiar.' };
    }

    if (!profile.family_reference.phone || !/^9\d{8}$/.test(profile.family_reference.phone)) {
      return { success: false, error: 'El teléfono de la referencia familiar debe comenzar con 9 y tener 9 dígitos.' };
    }

    // Validaciones - Referencia No Familiar
    if (!profile.non_family_reference.name || profile.non_family_reference.name.trim().length < 3) {
      return { success: false, error: 'El nombre de la referencia no familiar debe tener al menos 3 caracteres.' };
    }

    if (!profile.non_family_reference.relationship) {
      return { success: false, error: 'Selecciona la relación con la referencia no familiar.' };
    }

    if (!profile.non_family_reference.phone || !/^9\d{8}$/.test(profile.non_family_reference.phone)) {
      return { success: false, error: 'El teléfono de la referencia no familiar debe comenzar con 9 y tener 9 dígitos.' };
    }

    if (!profile.non_family_reference.years_known || profile.non_family_reference.years_known < 1) {
      return { success: false, error: 'Ingresa al menos 1 año de conocer a la referencia no familiar.' };
    }

    // Validar que los teléfonos no sean iguales
    if (profile.family_reference.phone === profile.non_family_reference.phone) {
      return { success: false, error: 'Los teléfonos de las referencias no pueden ser iguales.' };
    }

    const db = await readJSON<ReferencesProfile>(REFERENCES_DB);

    db[user.id] = {
      family_reference: {
        name: profile.family_reference.name.trim(),
        phone: profile.family_reference.phone,
        relationship: profile.family_reference.relationship,
      },
      non_family_reference: {
        name: profile.non_family_reference.name.trim(),
        phone: profile.non_family_reference.phone,
        relationship: profile.non_family_reference.relationship,
        years_known: profile.non_family_reference.years_known,
      },
      verified: true,
    };

    await writeJSON(REFERENCES_DB, db);

    console.log('[REFERENCES] Perfil guardado:', user.id);
    return { success: true };
  } catch (error) {
    console.error('[REFERENCES] Error al guardar perfil:', error);
    return { success: false, error: 'Error al guardar.' };
  }
}
