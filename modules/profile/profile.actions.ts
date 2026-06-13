/**
 * Acciones de mutación del perfil.
 *
 * Cada función representa una operación que modifica datos del usuario.
 * Los componentes llaman a estas funciones via server actions.
 *
 * HOY: stubs que simulan latencia.
 * MAÑANA: llamarán a Logto Account API / backend real.
 *
 * IMPORTANTE: estos NO son server actions directamente.
 * Los server actions están en app/actions/profile.actions.ts
 * y delegan aquí. Esto permite testear sin dependencia de React.
 */

import type { ActionResult } from './profile.types';

/**
 * Verifica la identidad del usuario (contraseña o código al email actual).
 * Prerequisito para cambios sensibles (email, phone, password).
 */
export async function verifyIdentity(password: string): Promise<ActionResult> {
  // TODO: POST /account/verify-password (Logto Account API)
  void password;
  return { success: false, error: 'No implementado aún' };
}

/**
 * Envía código de verificación al nuevo email.
 */
export async function sendEmailVerificationCode(newEmail: string): Promise<ActionResult> {
  // TODO: POST /account/verification-codes (Logto Account API)
  void newEmail;
  return { success: false, error: 'No implementado aún' };
}

/**
 * Confirma el cambio de email con el código recibido.
 */
export async function confirmEmailChange(newEmail: string, code: string): Promise<ActionResult> {
  // TODO: PATCH /account/primary-email (Logto Account API)
  void newEmail;
  void code;
  return { success: false, error: 'No implementado aún' };
}

/**
 * Envía código SMS al nuevo número.
 */
export async function sendPhoneVerificationCode(newPhone: string): Promise<ActionResult> {
  // TODO: POST /account/verification-codes (Logto Account API)
  void newPhone;
  return { success: false, error: 'No implementado aún' };
}

/**
 * Confirma el cambio de teléfono con el código SMS.
 */
export async function confirmPhoneChange(newPhone: string, code: string): Promise<ActionResult> {
  // TODO: PATCH /account/primary-phone (Logto Account API)
  void newPhone;
  void code;
  return { success: false, error: 'No implementado aún' };
}

/**
 * Cambia la contraseña del usuario.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<ActionResult> {
  // TODO: POST /account/change-password (Logto Account API)
  void currentPassword;
  void newPassword;
  return { success: false, error: 'No implementado aún' };
}

/**
 * Crea una contraseña (si el usuario solo tiene social login).
 */
export async function createPassword(newPassword: string): Promise<ActionResult> {
  // TODO: POST /account/password (Logto Account API)
  void newPassword;
  return { success: false, error: 'No implementado aún' };
}

/**
 * Desvincula la cuenta de Google.
 * Prerequisito: el usuario debe tener contraseña configurada.
 */
export async function unlinkGoogle(): Promise<ActionResult> {
  // TODO: DELETE /account/identities/google (Logto Account API)
  return { success: false, error: 'No implementado aún' };
}

/**
 * Vincula una cuenta de Google.
 */
export async function linkGoogle(): Promise<ActionResult> {
  // TODO: iniciar flujo OAuth con Google via Logto
  return { success: false, error: 'No implementado aún' };
}

/**
 * Actualiza el avatar del usuario.
 */
export async function updateAvatar(avatarUrl: string): Promise<ActionResult> {
  // TODO: PATCH /account/profile (Logto Account API) o subir a storage
  void avatarUrl;
  return { success: false, error: 'No implementado aún' };
}

/**
 * Elimina la cuenta del usuario permanentemente.
 * Requiere verificación de identidad previa.
 */
export async function deleteAccount(): Promise<ActionResult> {
  // TODO: DELETE /account (Logto Account API) + cleanup en backend
  return { success: false, error: 'No implementado aún' };
}
