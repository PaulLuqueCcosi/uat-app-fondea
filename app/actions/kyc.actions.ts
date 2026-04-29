'use server';

import { KYCData } from '@/lib/types';
import { requireValidSession } from './auth.actions';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'mock-db', 'kyc.json');

/**
 * Lee la base de datos mock desde el archivo JSON
 */
async function readDB(): Promise<Record<string, KYCData>> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe o está vacío, retornar objeto vacío
    return {};
  }
}

/**
 * Escribe la base de datos mock al archivo JSON
 */
async function writeDB(data: Record<string, KYCData>): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Obtiene los datos KYC guardados del usuario desde el mock DB.
 * Se llama en el server component (page) para pre-rellenar el formulario.
 *
 * Retorna null si el usuario aún no ha completado este paso.
 */
export async function getKYCData(): Promise<KYCData | null> {
  const user = await requireValidSession();

  try {
    const db = await readDB();
    const userData = db[user.id];

    if (!userData) {
      console.log('[KYC] No hay datos guardados para el usuario:', user.id);
      return null;
    }

    console.log('[KYC] Datos cargados para el usuario:', user.id);
    return userData;
  } catch (error) {
    console.error('[KYC] Error al leer datos:', error);
    return null;
  }
}

/**
 * Guarda / actualiza los datos KYC del usuario en el mock DB.
 * Se llama desde el formulario al hacer submit.
 *
 * Implementa upsert: crea si no existe, actualiza si ya existe.
 * Retorna success + los datos guardados, o un error descriptivo.
 */
export async function saveKYCData(
  data: KYCData
): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  const user = await requireValidSession();

  try {
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Validaciones del lado del servidor
    if (!data.dni || data.dni.length !== 8 || !/^\d{8}$/.test(data.dni)) {
      return {
        success: false,
        error: 'El DNI debe tener exactamente 8 dígitos.',
        errorCode: 'invalid_format',
      };
    }

    if (!data.firstName || data.firstName.trim().length < 2) {
      return {
        success: false,
        error: 'El primer nombre es obligatorio y debe tener al menos 2 caracteres.',
        errorCode: 'invalid_name',
      };
    }

    if (!data.firstLastName || data.firstLastName.trim().length < 2) {
      return {
        success: false,
        error: 'El primer apellido es obligatorio y debe tener al menos 2 caracteres.',
        errorCode: 'invalid_lastname',
      };
    }

    if (
      !data.verificationCode ||
      data.verificationCode.length !== 3 ||
      !/^\d{3}$/.test(data.verificationCode)
    ) {
      return {
        success: false,
        error: 'El código de verificación debe tener exactamente 3 dígitos.',
        errorCode: 'invalid_code',
      };
    }

    // Simular validación con RENIEC (casos de error para testing)
    if (data.dni === '00000000') {
      return {
        success: false,
        error: 'No encontramos este DNI en los registros de RENIEC. Verifica que esté correcto.',
        errorCode: 'dni_not_found',
      };
    }

    if (data.dni === '11111111') {
      return {
        success: false,
        error: 'Los datos ingresados no coinciden con los registros oficiales. Revisa que estén exactamente como aparecen en tu DNI.',
        errorCode: 'data_mismatch',
      };
    }

    if (data.verificationCode === '000') {
      return {
        success: false,
        error: 'El código de verificación no coincide con el DNI. Revisa los 3 dígitos en la parte inferior de tu documento.',
        errorCode: 'invalid_verification_code',
      };
    }

    // Normalizar datos antes de guardar
    const normalizedData: KYCData = {
      dni: data.dni,
      firstName: data.firstName.trim().toUpperCase(),
      secondName: data.secondName?.trim().toUpperCase() || undefined,
      firstLastName: data.firstLastName.trim().toUpperCase(),
      secondLastName: data.secondLastName?.trim().toUpperCase() || undefined,
      verificationCode: data.verificationCode,
      // El backend es quien marca como verificado tras validar con RENIEC
      verified: true,
    };

    // Leer DB, hacer upsert, escribir DB
    const db = await readDB();
    db[user.id] = normalizedData;
    await writeDB(db);

    console.log('[KYC] Datos guardados exitosamente para el usuario:', user.id);
    return { success: true };
  } catch (error) {
    console.error('[KYC] Error al guardar datos:', error);
    return {
      success: false,
      error: 'Error al guardar los datos. Inténtalo nuevamente.',
      errorCode: 'server_error',
    };
  }
}
