'use server';

import { KYCData } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import fs from 'fs/promises';
import path from 'path';

// ── Configuración ────────────────────────────────────────────────────────────

const KYC_CONFIG = {
  /** Intentos máximos antes de bloquear */
  maxAttempts: 3,
  /** Minutos de bloqueo al agotar intentos */
  lockoutMinutes: 30,
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
  /** El frontend solo necesita saber si está bloqueado y cuánto tiempo */
  blocked?: boolean;
  /** Minutos restantes de bloqueo (solo si blocked=true) */
  blockedMinutesLeft?: number;
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

function getBlockedMinutesLeft(record: KYCAttemptRecord): number {
  if (!record.lockedUntil) return 0;
  const msLeft = new Date(record.lockedUntil).getTime() - Date.now();
  return msLeft > 0 ? Math.ceil(msLeft / 60000) : 0;
}

// ── Server Actions públicas ──────────────────────────────────────────────────

/**
 * Obtiene los datos KYC guardados del usuario.
 * También devuelve el estado de bloqueo para que el form lo muestre al cargar.
 */
export async function getKYCData(): Promise<{
  data: KYCData | null;
  blocked: boolean;
  blockedMinutesLeft: number;
  attemptsLeft: number;
}> {
  const user = await requireValidSession();

  try {
    const [kycDB, attemptsDB] = await Promise.all([readKYCDB(), readAttemptsDB()]);

    const kycData = kycDB[user.id] ?? null;
    const attemptRecord = attemptsDB[user.id];

    let blocked = false;
    let blockedMinutesLeft = 0;
    let attemptsLeft = KYC_CONFIG.maxAttempts;

    if (attemptRecord) {
      const minutesLeft = getBlockedMinutesLeft(attemptRecord);
      if (minutesLeft > 0) {
        blocked = true;
        blockedMinutesLeft = minutesLeft;
        attemptsLeft = 0;
      } else {
        // Bloqueo expirado — resetear
        if (attemptRecord.lockedUntil) {
          attemptsDB[user.id] = { attempts: 0, lockedUntil: null, lastAttemptAt: new Date().toISOString() };
          await writeAttemptsDB(attemptsDB);
          attemptsLeft = KYC_CONFIG.maxAttempts;
        } else {
          attemptsLeft = Math.max(0, KYC_CONFIG.maxAttempts - attemptRecord.attempts);
        }
      }
    }

    console.log('[KYC] Estado cargado para usuario:', user.id, { blocked, attemptsLeft });
    return { data: kycData, blocked, blockedMinutesLeft, attemptsLeft };
  } catch (error) {
    console.error('[KYC] Error al leer datos:', error);
    return { data: null, blocked: false, blockedMinutesLeft: 0, attemptsLeft: KYC_CONFIG.maxAttempts };
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
    const minutesLeft = getBlockedMinutesLeft(record);
    if (minutesLeft > 0) {
      return {
        success: false,
        blocked: true,
        blockedMinutesLeft: minutesLeft,
        error: `Demasiados intentos fallidos. Podrás intentarlo nuevamente en ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''}.`,
      };
    }

    // Si el bloqueo expiró, resetear contador
    if (record.lockedUntil && minutesLeft === 0) {
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
    if (!data.verificationCode || !/^\d{3}$/.test(data.verificationCode)) {
      return { success: false, error: 'El código de verificación debe tener 3 dígitos.' };
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
        // Bloquear al usuario
        const lockedUntil = new Date(Date.now() + KYC_CONFIG.lockoutMinutes * 60 * 1000);
        record.lockedUntil = lockedUntil.toISOString();
        attemptsDB[user.id] = record;
        await writeAttemptsDB(attemptsDB);

        console.warn('[KYC] Usuario bloqueado por intentos fallidos:', user.id, { internalReason: reniecResult.reason });

        return {
          success: false,
          blocked: true,
          blockedMinutesLeft: KYC_CONFIG.lockoutMinutes,
          error: `Has agotado todos los intentos. Podrás intentarlo nuevamente en ${KYC_CONFIG.lockoutMinutes} minutos.`,
        };
      }

      attemptsDB[user.id] = record;
      await writeAttemptsDB(attemptsDB);

      console.warn('[KYC] Intento fallido para usuario:', user.id, {
        internalReason: reniecResult.reason, // solo en logs del servidor
        attemptsLeft,
      });

      return {
        success: false,
        attemptsLeft,
        error: `Los datos ingresados no pudieron ser verificados. Revisa que coincidan exactamente con tu DNI físico. Te ${attemptsLeft === 1 ? 'queda 1 intento' : `quedan ${attemptsLeft} intentos`} antes de un bloqueo temporal.`,
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
  if (data.verificationCode === '000') return { valid: false, reason: 'invalid_verification_code' };

  return { valid: true };
}
