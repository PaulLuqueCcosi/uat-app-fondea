'use server';

import { KYCData } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import fs from 'fs/promises';
import path from 'path';

// ── Configuración ────────────────────────────────────────────────────────────

const KYC_CONFIG = {
  /** Intentos máximos antes de bloquear */
  maxAttempts: 3,
  /** Horas de bloqueo al agotar intentos */
  lockoutHours: 24,
};

// ── Tipos internos (nunca se exponen al frontend) ────────────────────────────

interface KYCAttemptRecord {
  attempts: number;
  lockedUntil: string | null; // ISO string o null
  lastAttemptAt: string;
}

// ── Respuesta pública al frontend ────────────────────────────────────────────

export interface KYCSaveResult {
  success: boolean;
  /** Mensaje genérico para mostrar al usuario */
  error?: string;
  /** El frontend solo necesita saber si está bloqueado */
  blocked?: boolean;
  /** Horas restantes de bloqueo (solo si blocked=true) */
  blockedHoursLeft?: number;
  /** Intentos restantes antes de bloquearse (solo si success=false y no blocked) */
  attemptsLeft?: number;
}

// ── Paths de archivos mock ───────────────────────────────────────────────────

const KYC_DB_PATH = path.join(process.cwd(), 'mock-db', 'kyc.json');
const ATTEMPTS_DB_PATH = path.join(process.cwd(), 'mock-db', 'kyc-attempts.json');

// ── Helpers de persistencia ──────────────────────────────────────────────────

async function readKYCDB(): Promise<Record<string, KYCData>> {
  try {
    return JSON.parse(await fs.readFile(KYC_DB_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

async function writeKYCDB(data: Record<string, KYCData>): Promise<void> {
  await fs.writeFile(KYC_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function readAttemptsDB(): Promise<Record<string, KYCAttemptRecord>> {
  try {
    return JSON.parse(await fs.readFile(ATTEMPTS_DB_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

async function writeAttemptsDB(data: Record<string, KYCAttemptRecord>): Promise<void> {
  await fs.writeFile(ATTEMPTS_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Helpers de intentos ──────────────────────────────────────────────────────

function getBlockedHoursLeft(record: KYCAttemptRecord): number {
  if (!record.lockedUntil) return 0;
  const msLeft = new Date(record.lockedUntil).getTime() - Date.now();
  return msLeft > 0 ? Math.ceil(msLeft / 3600000) : 0;
}

// ── Server Actions públicas ──────────────────────────────────────────────────

/**
 * Obtiene los datos KYC guardados del usuario.
 * También devuelve el estado de bloqueo para que el form lo muestre al cargar.
 */
export async function getKYCData(): Promise<{
  data: KYCData | null;
  blocked: boolean;
  blockedHoursLeft: number;
  attemptsLeft: number;
}> {
  const user = await requireValidSession();

  try {
    const [kycDB, attemptsDB] = await Promise.all([readKYCDB(), readAttemptsDB()]);

    const kycData = kycDB[user.id] ?? null;
    const attemptRecord = attemptsDB[user.id];

    let blocked = false;
    let blockedHoursLeft = 0;
    let attemptsLeft = KYC_CONFIG.maxAttempts;

    if (attemptRecord) {
      const hoursLeft = getBlockedHoursLeft(attemptRecord);
      if (hoursLeft > 0) {
        blocked = true;
        blockedHoursLeft = hoursLeft;
        attemptsLeft = 0;
      } else {
        if (attemptRecord.lockedUntil) {
          // Bloqueo expirado — resetear
          attemptsDB[user.id] = { attempts: 0, lockedUntil: null, lastAttemptAt: new Date().toISOString() };
          await writeAttemptsDB(attemptsDB);
          attemptsLeft = KYC_CONFIG.maxAttempts;
        } else {
          attemptsLeft = Math.max(0, KYC_CONFIG.maxAttempts - attemptRecord.attempts);
        }
      }
    }

    console.log('[KYC] Estado cargado para usuario:', user.id, { blocked, attemptsLeft });
    return { data: kycData, blocked, blockedHoursLeft, attemptsLeft };
  } catch (error) {
    console.error('[KYC] Error al leer datos:', error);
    return { data: null, blocked: false, blockedHoursLeft: 0, attemptsLeft: KYC_CONFIG.maxAttempts };
  }
}

/**
 * Guarda / valida los datos KYC del usuario.
 *
 * - Controla intentos y bloqueo server-side
 * - El frontend solo recibe: success, blocked, attemptsLeft, mensaje genérico
 * - El motivo real del fallo (RENIEC, mismatch, etc.) nunca sale al frontend
 */
export async function saveKYCData(data: KYCData): Promise<KYCSaveResult> {
  const user = await requireValidSession();

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // simular latencia

    const attemptsDB = await readAttemptsDB();
    const record = attemptsDB[user.id] ?? { attempts: 0, lockedUntil: null, lastAttemptAt: new Date().toISOString() };

    // ── Verificar bloqueo activo ─────────────────────────────────────────
    const hoursLeft = getBlockedHoursLeft(record);
    if (hoursLeft > 0) {
      return {
        success: false,
        blocked: true,
        blockedHoursLeft: hoursLeft,
        error: `Demasiados intentos fallidos. Podrás intentarlo nuevamente en ${hoursLeft} hora${hoursLeft !== 1 ? 's' : ''}.`,
      };
    }

    // Si el bloqueo expiró, resetear contador
    if (record.lockedUntil && hoursLeft === 0) {
      record.attempts = 0;
      record.lockedUntil = null;
    }

    // ── Validaciones de formato (estas sí se pueden mostrar) ─────────────
    if (!data.dni || data.dni.length !== 8 || !/^\d{8}$/.test(data.dni)) {
      return { success: false, error: 'El DNI debe tener exactamente 8 dígitos.' };
    }
    if (!data.firstName?.trim() || data.firstName.trim().length < 2) {
      return { success: false, error: 'El primer nombre es obligatorio.' };
    }
    if (!data.firstLastName?.trim() || data.firstLastName.trim().length < 2) {
      return { success: false, error: 'El primer apellido es obligatorio.' };
    }
    if (!data.verificationCode || !/^\d{1}$/.test(data.verificationCode)) {
      return { success: false, error: 'El código de verificación debe ser 1 dígito.' };
    }
    if (!data.birth_date) {
      return { success: false, error: 'La fecha de nacimiento es obligatoria.' };
    }
    
    // Validar edad entre 21 y 65 años
    const birthDate = new Date(data.birth_date);
    if (isNaN(birthDate.getTime())) {
      return { success: false, error: 'La fecha de nacimiento no es válida.' };
    }
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear()
      - (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);
    if (age < 21 || age > 65) {
      return { success: false, error: 'Debes tener entre 21 y 65 años para solicitar un préstamo.' };
    }

    // ── Validación con RENIEC (mock) ─────────────────────────────────────
    // En producción: llamada real a la API externa
    // El resultado interno (motivo del fallo) NUNCA se expone al frontend
    const reniecResult = await mockReniecValidation(data);

    if (!reniecResult.valid) {
      // Registrar intento fallido
      record.attempts += 1;
      record.lastAttemptAt = new Date().toISOString();

      const attemptsLeft = KYC_CONFIG.maxAttempts - record.attempts;

      if (attemptsLeft <= 0) {
        // Bloquear al usuario por 24 horas
        const lockedUntil = new Date(Date.now() + KYC_CONFIG.lockoutHours * 3600 * 1000);
        record.lockedUntil = lockedUntil.toISOString();
        attemptsDB[user.id] = record;
        await writeAttemptsDB(attemptsDB);

        console.warn('[KYC] Usuario bloqueado por intentos fallidos:', user.id, { internalReason: reniecResult.reason });

        return {
          success: false,
          blocked: true,
          blockedHoursLeft: KYC_CONFIG.lockoutHours,
          error: `Has agotado todos los intentos. Por seguridad, podrás intentarlo nuevamente en ${KYC_CONFIG.lockoutHours} horas.`,
        };
      }

      attemptsDB[user.id] = record;
      await writeAttemptsDB(attemptsDB);

      console.warn('[KYC] Intento fallido para usuario:', user.id, {
        internalReason: reniecResult.reason,
        attemptsLeft,
      });

      const attemptsMsg = attemptsLeft === 1
        ? 'Solo te queda 1 intento antes de un bloqueo de 24 horas'
        : `Te quedan ${attemptsLeft} intentos`;

      return {
        success: false,
        attemptsLeft,
        error: `Los datos no coinciden con los registros. Verifica que sean exactamente como aparecen en tu DNI físico. ${attemptsMsg}.`,
      };
    }

    // ── Validación exitosa ───────────────────────────────────────────────
    // Resetear intentos
    delete attemptsDB[user.id];
    await writeAttemptsDB(attemptsDB);

    // Guardar datos KYC verificados
    const kycDB = await readKYCDB();
    kycDB[user.id] = {
      dni: data.dni,
      firstName: data.firstName.trim().toUpperCase(),
      secondName: data.secondName?.trim().toUpperCase() || undefined,
      firstLastName: data.firstLastName.trim().toUpperCase(),
      secondLastName: data.secondLastName?.trim().toUpperCase() || undefined,
      verificationCode: data.verificationCode,
      birth_date: data.birth_date,
      verified: true,
    };
    await writeKYCDB(kycDB);

    console.log('[KYC] Verificación exitosa para usuario:', user.id);
    return { success: true };

  } catch (error) {
    console.error('[KYC] Error interno:', error);
    return {
      success: false,
      error: 'Error de conexión. Por favor, inténtalo nuevamente.',
    };
  }
}

// ── Mock de validación RENIEC ────────────────────────────────────────────────
// En producción reemplazar por fetch real a la API externa.
// El campo `reason` es solo para logs internos, nunca llega al frontend.

async function mockReniecValidation(data: KYCData): Promise<{ valid: boolean; reason?: string }> {
  // DNIs especiales para testing
  if (data.dni === '00000000') return { valid: false, reason: 'dni_not_found_in_reniec' };
  if (data.dni === '11111111') return { valid: false, reason: 'name_mismatch' };
  if (data.dni === '22222222') return { valid: false, reason: 'dni_flagged' };
  if (data.verificationCode === '0') return { valid: false, reason: 'invalid_verification_code' };

  return { valid: true };
}
