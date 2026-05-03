'use server';

import { requireValidSession } from './auth.actions';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';
import { IntencionConfig } from '@/lib/types';
import { calculateMonthlyPayment } from '@/lib/utils';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// ── Constantes ────────────────────────────────────────────────────────────────

const MONTHLY_RATE = 3.5;
const TEA = 51.1;
const DEFAULT_AMOUNT = 5000;
const DEFAULT_MONTHS = 12;

// ── JSON store (mock hasta que el backend lo implemente) ──────────────────────

const DB_PATH = path.join(process.cwd(), 'data', 'intenciones.json');

interface IntencionRecord {
  intencionId: string;
  userId: string;
  amount: number;
  months: number;
  monthlyPayment: number;
  monthlyRate: number;
  tea: number;
  createdAt: string;
  updatedAt: string;
}

interface IntencionesDB {
  intenciones: IntencionRecord[];
}

async function readDB(): Promise<IntencionesDB> {
  try {
    const raw = await readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw) as IntencionesDB;
  } catch {
    return { intenciones: [] };
  }
}

async function writeDB(db: IntencionesDB): Promise<void> {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function recordToConfig(r: IntencionRecord): IntencionConfig {
  return {
    intencionId:    r.intencionId,
    amount:         r.amount,
    months:         r.months,
    monthlyPayment: r.monthlyPayment,
    monthlyRate:    r.monthlyRate,
    tea:            r.tea,
  };
}

// ── Helper fetch autenticado (para cuando conectemos el backend) ──────────────

// async function backendFetch(path: string, options: RequestInit = {}): Promise<Response> {
//   const token = await getAccessTokenRSC(logtoConfig, process.env.LOGTO_API_RESOURCE);
//   const baseUrl = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
//   return fetch(`${baseUrl}${path}`, {
//     ...options,
//     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
//   });
// }

// ── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * Obtiene la intención activa del usuario autenticado.
 * Retorna null si no tiene ninguna.
 *
 * TODO: GET /api/v1/intentions/active
 */
export async function getActiveIntencion(): Promise<IntencionConfig | null> {
  const user = await requireValidSession();

  console.log('[INTENCION] getActiveIntencion → userId:', user.id);

  try {
    const db = await readDB();
    const record = db.intenciones.find((r) => r.userId === user.id);
    console.log('[INTENCION] getActiveIntencion result →', record ? `found: ${record.intencionId}` : 'not found');
    return record ? recordToConfig(record) : null;
  } catch (error) {
    console.error('[INTENCION] Error al obtener intención activa:', error);
    return null;
  }
}

/**
 * Registra una intención existente (generada en la landing) al usuario autenticado.
 * Si ya existe una intención con ese ID para el usuario, la retorna sin duplicar.
 *
 * TODO: POST /api/v1/intentions/{intencionId}/register
 */
export async function registerIntencion(intencionId: string): Promise<IntencionConfig | null> {
  const user = await requireValidSession();

  if (!intencionId?.trim()) return null;

  try {
    const db = await readDB();

    // Si ya existe este ID para este usuario, retornar sin duplicar
    const existing = db.intenciones.find(
      (r) => r.intencionId === intencionId && r.userId === user.id
    );
    if (existing) return recordToConfig(existing);

    // Crear nuevo registro
    const now = new Date().toISOString();
    const record: IntencionRecord = {
      intencionId,
      userId:         user.id,
      amount:         DEFAULT_AMOUNT,
      months:         DEFAULT_MONTHS,
      monthlyPayment: calculateMonthlyPayment(DEFAULT_AMOUNT, MONTHLY_RATE, DEFAULT_MONTHS),
      monthlyRate:    MONTHLY_RATE,
      tea:            TEA,
      createdAt:      now,
      updatedAt:      now,
    };

    db.intenciones.push(record);
    await writeDB(db);

    return recordToConfig(record);
  } catch (error) {
    console.error('[INTENCION] Error al registrar intención:', error);
    return null;
  }
}

/**
 * Crea una nueva intención para el usuario (desde la calculadora interna).
 * Si el usuario ya tiene una intención activa, la reemplaza.
 *
 * TODO: POST /api/v1/intentions
 */
export async function createIntencion(
  amount: number,
  months: number
): Promise<IntencionConfig | null> {
  const user = await requireValidSession();

  try {
    const db = await readDB();
    const now = new Date().toISOString();

    // Eliminar intención previa del usuario si existe
    db.intenciones = db.intenciones.filter((r) => r.userId !== user.id);

    const intencionId = `int-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: IntencionRecord = {
      intencionId,
      userId:         user.id,
      amount,
      months,
      monthlyPayment: calculateMonthlyPayment(amount, MONTHLY_RATE, months),
      monthlyRate:    MONTHLY_RATE,
      tea:            TEA,
      createdAt:      now,
      updatedAt:      now,
    };

    db.intenciones.push(record);
    await writeDB(db);

    return recordToConfig(record);
  } catch (error) {
    console.error('[INTENCION] Error al crear intención:', error);
    return null;
  }
}

/**
 * Actualiza el monto y/o plazo de una intención existente.
 *
 * TODO: PUT /api/v1/intentions/{intencionId}
 */
export async function updateIntencion(
  intencionId: string,
  amount: number,
  months: number
): Promise<IntencionConfig | null> {
  const user = await requireValidSession();

  try {
    const db = await readDB();
    const idx = db.intenciones.findIndex(
      (r) => r.intencionId === intencionId && r.userId === user.id
    );

    if (idx === -1) return null;

    const updated: IntencionRecord = {
      ...db.intenciones[idx],
      amount,
      months,
      monthlyPayment: calculateMonthlyPayment(amount, MONTHLY_RATE, months),
      updatedAt: new Date().toISOString(),
    };

    db.intenciones[idx] = updated;
    await writeDB(db);

    return recordToConfig(updated);
  } catch (error) {
    console.error('[INTENCION] Error al actualizar intención:', error);
    return null;
  }
}

/**
 * Elimina la intención del usuario.
 *
 * TODO: DELETE /api/v1/intentions/{intencionId}
 */
export async function deleteIntencion(intencionId: string): Promise<boolean> {
  const user = await requireValidSession();

  try {
    const db = await readDB();
    const before = db.intenciones.length;
    db.intenciones = db.intenciones.filter(
      (r) => !(r.intencionId === intencionId && r.userId === user.id)
    );

    if (db.intenciones.length === before) return false;

    await writeDB(db);
    return true;
  } catch (error) {
    console.error('[INTENCION] Error al eliminar intención:', error);
    return false;
  }
}

/**
 * Obtiene la config de una intención por ID.
 * Si se pasa 'active', retorna la intención activa del usuario.
 *
 * TODO: GET /api/v1/intentions/{intencionId}
 */
export async function getIntencionConfig(intencionId: string): Promise<IntencionConfig | null> {
  const user = await requireValidSession();

  console.log('[INTENCION] getIntencionConfig →', { intencionId, userId: user.id });

  // Alias especial: obtener la intención activa del usuario
  if (intencionId === 'active') {
    return getActiveIntencion();
  }

  if (!intencionId?.trim()) return null;

  try {
    const db = await readDB();
    const record = db.intenciones.find(
      (r) => r.intencionId === intencionId && r.userId === user.id
    );
    console.log('[INTENCION] getIntencionConfig result →', record ? 'found' : 'not found');
    return record ? recordToConfig(record) : null;
  } catch (error) {
    console.error('[INTENCION] Error al obtener config:', error);
    return null;
  }
}
