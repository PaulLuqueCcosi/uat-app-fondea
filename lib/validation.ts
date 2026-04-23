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
