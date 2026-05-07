/**
 * Validaciones centralizadas
 * Todas las funciones de validación en un solo lugar
 */

import { PHONE_CONFIG } from './constants';

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida DNI peruano (8 dígitos)
 */
export function isValidDNI(dni: string): boolean {
  const cleaned = dni.trim();
  return /^\d{8}$/.test(cleaned);
}

/**
 * Valida nombres y apellidos (solo letras, espacios y acentos)
 */
export function isValidName(name: string): boolean {
  const cleaned = name.trim();
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(cleaned) && cleaned.length >= 2;
}

/**
 * Valida código de verificación del DNI (3 dígitos)
 */
export function isValidVerificationCode(code: string): boolean {
  const cleaned = code.trim();
  return /^\d{3}$/.test(cleaned);
}

/**
 * Valida número de teléfono peruano (9 dígitos, empieza con 9)
 */
export function isValidPeruvianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');

  // Debe tener exactamente 9 dígitos
  if (digits.length !== PHONE_CONFIG.MIN_LENGTH) {
    return false;
  }

  // Debe empezar con 9 (celulares en Perú)
  return digits.startsWith('9');
}

/**
 * Valida formato de código OTP (6 dígitos)
 */
export function isValidOTPCode(code: string): boolean {
  const cleaned = code.trim();
  return /^\d{6}$/.test(cleaned);
}

/**
 * Valida contraseña (mínimo 8 caracteres)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Calcula fortaleza de contraseña
 * Retorna score de 0-4 y metadata
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  requirements: Array<{ label: string; met: boolean }>;
} {
  let score = 0;
  const requirements = [
    { label: '8+ caracteres', met: password.length >= 8 },
    { label: 'Mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
    { label: 'Símbolo', met: /[^A-Za-z0-9]/.test(password) },
  ];

  requirements.forEach(req => {
    if (req.met) score++;
  });

  const labels = ['', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
  const colors = ['', '#EF4444', '#F59E0B', '#A3E635', '#22C55E'];

  return {
    score,
    label: labels[score] || '',
    color: colors[score] || '',
    requirements,
  };
}

/**
 * Valida CCI (Código de Cuenta Interbancario) - 20 dígitos
 */
export function isValidCCI(cci: string): boolean {
  const cleaned = cci.replace(/\D/g, '');
  return cleaned.length === 20;
}

/**
 * Valida número de cuenta bancaria (generalmente 13-14 dígitos)
 */
export function isValidAccountNumber(accountNumber: string): boolean {
  const cleaned = accountNumber.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 20;
}

// ─── Zod Schemas Reutilizables ───────────────────────────────────────────────
// Usar en formularios: import { dniSchema, phoneSchema } from '@/lib/validation'

import { z } from 'zod';

/** DNI peruano — 8 dígitos exactos */
export const dniSchema = z
  .string()
  .min(1, 'Ingresa tu DNI')
  .regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos');

/** Código de verificación del DNI — 3 dígitos */
export const verificationCodeSchema = z
  .string()
  .min(1, 'Ingresa el código de verificación')
  .regex(/^\d{3}$/, 'El código debe tener 3 dígitos');

/** Nombre o apellido — solo letras, espacios y acentos, mín 2 chars */
export const nameSchema = z
  .string()
  .min(2, 'Mínimo 2 caracteres')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras');

/** Teléfono peruano — 9 dígitos, empieza con 9 */
export const phoneSchema = z
  .string()
  .min(1, 'Ingresa tu número de teléfono')
  .regex(/^9\d{8}$/, 'Debe comenzar con 9 y tener 9 dígitos');

/** CCI — exactamente 20 dígitos */
export const cciSchema = z
  .string()
  .min(1, 'Ingresa tu CCI')
  .regex(/^\d{20}$/, 'El CCI debe tener exactamente 20 dígitos');

/** Email */
export const emailSchema = z
  .string()
  .min(1, 'Ingresa tu email')
  .email('Formato de email inválido');

/** Monto monetario — string que se parsea a número positivo */
export const moneySchema = (fieldName = 'monto') => z
  .string()
  .min(1, `Ingresa el ${fieldName}`)
  .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: `El ${fieldName} debe ser mayor a 0`,
  });

/** RUC peruano — 11 dígitos */
export const rucSchema = z
  .string()
  .min(1, 'Ingresa el RUC')
  .regex(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos');

/** Fecha en formato DD/MM/YYYY */
export const dateSchema = z
  .string()
  .min(1, 'Ingresa la fecha')
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato: DD/MM/YYYY');
