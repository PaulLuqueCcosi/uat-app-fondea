'use server';

import { AddressProfile, AddressProfileStatus } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import fs from 'fs/promises';
import path from 'path';

// ── Paths ─────────────────────────────────────────────────────────────────────

const ADDRESS_DB = path.join(process.cwd(), 'mock-db', 'address-profile.json');

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

// ── GET ───────────────────────────────────────────────────────────────────────

/**
 * Obtiene el perfil de dirección del usuario.
 *
 * TODO: cuando el backend esté listo, reemplazar por:
 *   const res = await fetch(`${process.env.API_URL}/additional/status`, { headers: authHeaders });
 *   return res.json();
 */
export async function getAddressProfileStatus(): Promise<AddressProfileStatus> {
  const user = await requireValidSession();

  try {
    const db = await readJSON<AddressProfile>(ADDRESS_DB);
    const profile = db[user.id] ?? null;

    return {
      profile: profile ? { ...profile, verified: profile.verified ?? false } : null,
      overall_verified: profile?.verified === true,
    };
  } catch (error) {
    console.error('[ADDITIONAL] Error al leer estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

/**
 * Guarda el perfil de dirección del usuario.
 *
 * TODO: cuando el backend esté listo, reemplazar por:
 *   const res = await fetch(`${process.env.API_URL}/additional`, {
 *     method: 'POST',
 *     headers: { ...authHeaders, 'Content-Type': 'application/json' },
 *     body: JSON.stringify(profile),
 *   });
 *   return res.json();
 */
export async function saveAddressProfile(
  profile: Omit<AddressProfile, 'verified'>
): Promise<{ success: boolean; error?: string }> {
  const user = await requireValidSession();

  try {
    await new Promise((r) => setTimeout(r, 400)); // simula latencia

    // Validaciones básicas de negocio
    if (profile.address_type === 'google' && !profile.google_address?.trim()) {
      return { success: false, error: 'Ingresa tu dirección.' };
    }
    if (profile.address_type === 'manual' && !profile.street_address?.trim()) {
      return { success: false, error: 'Ingresa la calle y número.' };
    }
    if (!profile.region) {
      return { success: false, error: 'Selecciona el departamento.' };
    }
    if (!profile.province) {
      return { success: false, error: 'Selecciona la provincia.' };
    }
    if (!profile.district) {
      return { success: false, error: 'Selecciona el distrito.' };
    }
    if (!profile.referral_source) {
      return { success: false, error: 'Selecciona cómo nos conociste.' };
    }

    const db = await readJSON<AddressProfile>(ADDRESS_DB);
    db[user.id] = { ...profile, verified: true };
    await writeJSON(ADDRESS_DB, db);

    console.log('[ADDITIONAL] Perfil guardado:', user.id);
    return { success: true };
  } catch (error) {
    console.error('[ADDITIONAL] Error al guardar:', error);
    return { success: false, error: 'Error al guardar. Intenta nuevamente.' };
  }
}
