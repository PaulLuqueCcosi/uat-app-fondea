'use server';

import {
  EconomicProfile,
  EconomicProfileStatus,
  LoanPurpose,
  EducationLevel,
  Debt,
} from '@/lib/types';
import { requireValidSession } from './auth.actions';
import fs from 'fs/promises';
import path from 'path';

// ── Paths ─────────────────────────────────────────────────────────────────────

const ECONOMIC_DB = path.join(process.cwd(), 'mock-db', 'economic-profile.json');

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
 * Obtiene el estado completo del perfil económico del usuario.
 * Retorna el perfil y si está verificado.
 */
export async function getEconomicProfileStatus(): Promise<EconomicProfileStatus> {
  const user = await requireValidSession();

  try {
    const db = await readJSON<EconomicProfile>(ECONOMIC_DB);
    const profile = db[user.id] ?? null;

    const overall_verified = profile?.verified === true;

    return {
      profile: profile ? { ...profile, verified: profile.verified ?? false } : null,
      overall_verified,
    };
  } catch (error) {
    console.error('[ECONOMIC] Error al leer estado:', error);
    return { profile: null, overall_verified: false };
  }
}

// ── PUT: Guardar perfil económico ─────────────────────────────────────────────

export async function saveEconomicProfile(
  profile: Omit<EconomicProfile, 'verified'>
): Promise<{ success: boolean; error?: string }> {
  const user = await requireValidSession();

  try {
    await new Promise((r) => setTimeout(r, 400));

    // Validaciones
    if (!profile.loan_purpose) {
      return { success: false, error: 'Selecciona para qué usarás el dinero.' };
    }

    if (profile.monthly_expenses === undefined || profile.monthly_expenses === null || profile.monthly_expenses < 0) {
      return { success: false, error: 'Ingresa tus gastos mensuales.' };
    }

    // Validar deudas si las tiene
    if (profile.has_debts) {
      if (!profile.debts || profile.debts.length === 0) {
        return { success: false, error: 'Debes agregar al menos una deuda.' };
      }

      for (const debt of profile.debts) {
        if (!debt.entity?.trim()) {
          return { success: false, error: 'Todas las deudas deben tener una entidad.' };
        }
        if (!debt.type) {
          return { success: false, error: 'Selecciona el tipo de cada deuda.' };
        }
        if (!debt.amount || debt.amount <= 0) {
          return { success: false, error: 'Todas las deudas deben tener un monto válido.' };
        }
        if (!debt.monthlyPayment || debt.monthlyPayment <= 0) {
          return { success: false, error: 'Todas las deudas deben tener una cuota mensual válida.' };
        }
      }
    }

    if (!profile.education_level) {
      return { success: false, error: 'Selecciona tu grado de instrucción.' };
    }

    const db = await readJSON<EconomicProfile>(ECONOMIC_DB);

    // Guardar el perfil con las deudas limpias (solo si tiene deudas)
    db[user.id] = {
      loan_purpose: profile.loan_purpose,
      monthly_expenses: profile.monthly_expenses,
      has_debts: profile.has_debts,
      debts: profile.has_debts ? profile.debts : [],
      has_property: profile.has_property,
      has_vehicle: profile.has_vehicle,
      has_services: profile.has_services,
      education_level: profile.education_level,
      verified: true,
    };

    await writeJSON(ECONOMIC_DB, db);

    console.log('[ECONOMIC] Perfil guardado:', user.id);
    return { success: true };
  } catch (error) {
    console.error('[ECONOMIC] Error al guardar perfil:', error);
    return { success: false, error: 'Error al guardar.' };
  }
}
