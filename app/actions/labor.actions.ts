'use server';

import {
  LaborSituation,
  LaborDetails,
  LaborIncome,
  LaborProfileStatus,
  EmploymentStatus,
} from '@/lib/types';
import { requireValidSession } from './auth.actions';
import { LABOR_CONFIG } from '@/lib/constants';
import fs from 'fs/promises';
import path from 'path';

// ── Paths ─────────────────────────────────────────────────────────────────────

const SITUATION_DB = path.join(process.cwd(), 'mock-db', 'labor-situation.json');
const DETAILS_DB = path.join(process.cwd(), 'mock-db', 'labor-details.json');
const INCOME_DB = path.join(process.cwd(), 'mock-db', 'labor-income.json');

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
 * Obtiene el estado completo del perfil laboral del usuario.
 * Retorna qué recursos están completos y si el perfil está verificado globalmente.
 */
export async function getLaborProfileStatus(): Promise<LaborProfileStatus> {
  const user = await requireValidSession();

  try {
    const [situationDB, detailsDB, incomeDB] = await Promise.all([
      readJSON<LaborSituation>(SITUATION_DB),
      readJSON<LaborDetails>(DETAILS_DB),
      readJSON<LaborIncome>(INCOME_DB),
    ]);

    const situation = situationDB[user.id] ?? null;
    const details = detailsDB[user.id] ?? null;
    const income = incomeDB[user.id] ?? null;

    const overall_verified =
      situation?.verified === true &&
      details?.verified === true &&
      income?.verified === true;

    return {
      situation: situation ? { ...situation, verified: situation.verified ?? false } : null,
      details: details ? { ...details, verified: details.verified ?? false } : null,
      income: income ? { ...income, verified: income.verified ?? false } : null,
      overall_verified,
    };
  } catch (error) {
    console.error('[LABOR] Error al leer estado:', error);
    return { situation: null, details: null, income: null, overall_verified: false };
  }
}

// ── PUT: Situación laboral ────────────────────────────────────────────────────

export async function saveLaborSituation(
  employment_status: EmploymentStatus
): Promise<{ success: boolean; error?: string }> {
  const user = await requireValidSession();

  try {
    await new Promise((r) => setTimeout(r, 300));

    if (!employment_status) {
      return { success: false, error: 'Selecciona tu situación laboral.' };
    }

    const db = await readJSON<LaborSituation>(SITUATION_DB);
    const previous = db[user.id];

    // Si cambió el tipo de empleo, invalidar details (el shape ya no aplica)
    if (previous && previous.employment_status !== employment_status) {
      console.log('[LABOR] Tipo de empleo cambió, invalidando details');
      const detailsDB = await readJSON<LaborDetails>(DETAILS_DB);
      delete detailsDB[user.id];
      await writeJSON(DETAILS_DB, detailsDB);
    }

    db[user.id] = { employment_status, verified: true };
    await writeJSON(SITUATION_DB, db);

    console.log('[LABOR] Situación guardada:', user.id, employment_status);
    return { success: true };
  } catch (error) {
    console.error('[LABOR] Error al guardar situación:', error);
    return { success: false, error: 'Error al guardar.' };
  }
}

// ── PUT: Detalles laborales ───────────────────────────────────────────────────

export async function saveLaborDetails(
  details: Omit<LaborDetails, 'verified'>
): Promise<{ success: boolean; error?: string }> {
  const user = await requireValidSession();

  try {
    await new Promise((r) => setTimeout(r, 400));

    // Verificar que la situación esté guardada primero
    const situationDB = await readJSON<LaborSituation>(SITUATION_DB);
    const situation = situationDB[user.id];
    if (!situation) {
      return { success: false, error: 'Primero debes seleccionar tu situación laboral.' };
    }

    // Validaciones según tipo
    if (situation.employment_status !== 'PENSIONISTA' && !details.industry) {
      return { success: false, error: 'Selecciona el sector o industria.' };
    }

    if (situation.employment_status === 'EMPLEADO_DEPENDIENTE') {
      // Validar años de actividad para empleado dependiente (mínimo 1 año)
      if (details.years_of_activity === undefined || details.years_of_activity === null || details.years_of_activity < 1) {
        return { success: false, error: 'Debes tener al menos 1 año en la empresa.' };
      }
    }

    if (['INDEPENDIENTE', 'FREELANCE', 'EMPRESARIO'].includes(situation.employment_status)) {
      if (details.years_of_activity === undefined || details.years_of_activity === null || details.years_of_activity < 0) {
        return { success: false, error: 'Ingresa los años de actividad.' };
      }
    }

    if (situation.employment_status === 'EMPRESARIO') {
      if (!details.business_ruc || String(details.business_ruc).length !== LABOR_CONFIG.RUC_LENGTH) {
        return { success: false, error: `El RUC debe tener ${LABOR_CONFIG.RUC_LENGTH} dígitos.` };
      }
    }

    const db = await readJSON<LaborDetails>(DETAILS_DB);
    db[user.id] = { ...details, verified: true };
    await writeJSON(DETAILS_DB, db);

    console.log('[LABOR] Detalles guardados:', user.id);
    return { success: true };
  } catch (error) {
    console.error('[LABOR] Error al guardar detalles:', error);
    return { success: false, error: 'Error al guardar.' };
  }
}

// ── PUT: Ingresos ─────────────────────────────────────────────────────────────

export async function saveLaborIncome(
  income: Omit<LaborIncome, 'verified'>
): Promise<{ success: boolean; error?: string }> {
  const user = await requireValidSession();

  try {
    await new Promise((r) => setTimeout(r, 400));

    if (income.monthly_income === undefined || income.monthly_income === null || income.monthly_income < LABOR_CONFIG.MIN_MONTHLY_INCOME) {
      return {
        success: false,
        error: `El ingreso mensual mínimo es S/ ${LABOR_CONFIG.MIN_MONTHLY_INCOME}.`,
      };
    }

    if (!income.income_receipt_method) {
      return { success: false, error: 'Selecciona cómo recibes tus ingresos.' };
    }

    // Validar ingresos adicionales si los hay
    if (income.has_additional_income) {
      if (!income.additional_incomes || income.additional_incomes.length === 0) {
        return { success: false, error: 'Agrega al menos un ingreso adicional.' };
      }
      for (const item of income.additional_incomes) {
        if (!item.amount || item.amount <= 0) {
          return { success: false, error: 'Todos los ingresos adicionales deben tener un monto válido.' };
        }
        if (!item.type) {
          return { success: false, error: 'Selecciona el tipo de cada ingreso adicional.' };
        }
        if (item.type === 'OTRO' && !item.custom_type?.trim()) {
          return { success: false, error: 'Especifica el tipo de ingreso cuando seleccionas "Otro".' };
        }
      }
    }

    const db = await readJSON<LaborIncome>(INCOME_DB);
    db[user.id] = {
      monthly_income: income.monthly_income,
      income_receipt_method: income.income_receipt_method,
      has_additional_income: income.has_additional_income,
      additional_incomes: income.has_additional_income ? income.additional_incomes : [],
      verified: true,
    };
    await writeJSON(INCOME_DB, db);

    console.log('[LABOR] Ingresos guardados:', user.id);
    return { success: true };
  } catch (error) {
    console.error('[LABOR] Error al guardar ingresos:', error);
    return { success: false, error: 'Error al guardar.' };
  }
}

// ── Guardar todo (wrapper para el formulario) ────────────────────────────────

/**
 * Guarda los 3 recursos en secuencia.
 * Si alguno falla, se detiene y retorna el error.
 * Solo marca overall_verified cuando los 3 pasan.
 */
export async function saveLaborProfile(
  situation: EmploymentStatus,
  details: Omit<LaborDetails, 'verified'>,
  income: Omit<LaborIncome, 'verified'>
): Promise<{ success: boolean; error?: string }> {
  // Paso 1: Situación
  const situationResult = await saveLaborSituation(situation);
  if (!situationResult.success) return situationResult;

  // Paso 2: Detalles — PENSIONISTA no tiene detalles laborales
  if (situation !== 'PENSIONISTA') {
    const detailsResult = await saveLaborDetails(details);
    if (!detailsResult.success) return detailsResult;
  } else {
    // Para PENSIONISTA guardamos un details marcado como verificado sin campos extra
    const user = await requireValidSession();
    const detailsDB = await readJSON<LaborDetails>(DETAILS_DB);
    detailsDB[user.id] = { industry: 'OTRO', verified: true };
    await writeJSON(DETAILS_DB, detailsDB);
  }

  // Paso 3: Ingresos
  const incomeResult = await saveLaborIncome(income);
  if (!incomeResult.success) return incomeResult;

  return { success: true };
}
