'use server';

import { BankAccountProfile, BankAccountProfileStatus, AccountType } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import fs from 'fs/promises';
import path from 'path';

// ── Paths ─────────────────────────────────────────────────────────────────────

const BANK_ACCOUNT_DB = path.join(process.cwd(), 'mock-db', 'bank-account-profile.json');

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
 * Obtiene el estado completo de la cuenta bancaria del usuario.
 * Retorna el perfil y si está verificado.
 */
export async function getBankAccountProfileStatus(): Promise<BankAccountProfileStatus> {
  const user = await requireValidSession();

  try {
    const db = await readJSON<BankAccountProfile>(BANK_ACCOUNT_DB);
    const profile = db[user.id] ?? null;

    const overall_verified = profile?.verified === true;

    return {
      profile: profile ? { ...profile, verified: profile.verified ?? false } : null,
      overall_verified,
    };
  } catch (error) {
    console.error('[BANK_ACCOUNT] Error al leer estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── PUT: Guardar cuenta bancaria ──────────────────────────────────────────────

export async function saveBankAccountProfile(
  profile: Omit<BankAccountProfile, 'verified'>
): Promise<{ success: boolean; error?: string }> {
  const user = await requireValidSession();

  try {
    await new Promise((r) => setTimeout(r, 400));

    // Validaciones
    if (!profile.bank || profile.bank.trim().length === 0) {
      return { success: false, error: 'Selecciona tu banco.' };
    }

    if (!profile.account_type || !['AHORROS', 'CORRIENTE'].includes(profile.account_type)) {
      return { success: false, error: 'Selecciona el tipo de cuenta.' };
    }

    if (!profile.cci || !/^\d{20}$/.test(profile.cci)) {
      return { success: false, error: 'El CCI debe tener exactamente 20 dígitos.' };
    }

    const db = await readJSON<BankAccountProfile>(BANK_ACCOUNT_DB);

    db[user.id] = {
      bank: profile.bank.trim(),
      account_type: profile.account_type,
      cci: profile.cci,
      verified: true,
    };

    await writeJSON(BANK_ACCOUNT_DB, db);

    console.log('[BANK_ACCOUNT] Perfil guardado:', user.id);
    return { success: true };
  } catch (error) {
    console.error('[BANK_ACCOUNT] Error al guardar perfil:', error);
    return { success: false, error: 'Error al guardar.' };
  }
}
