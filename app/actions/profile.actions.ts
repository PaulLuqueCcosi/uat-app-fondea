'use server';

import { requireValidSession } from './auth.actions';
import * as profileService from '@/modules/profile/profile.service';
import * as profileActions from '@/modules/profile/profile.actions';

// ── Lecturas ─────────────────────────────────────────────────────────────────

export async function getFullProfile() {
  await requireValidSession();
  return profileService.getFullProfile();
}

export async function getProfileSummary() {
  await requireValidSession();
  return profileService.getProfileSummary();
}

// ── Mutaciones ───────────────────────────────────────────────────────────────

export async function verifyIdentity(password: string) {
  await requireValidSession();
  return profileActions.verifyIdentity(password);
}

export async function sendEmailVerificationCode(newEmail: string) {
  await requireValidSession();
  return profileActions.sendEmailVerificationCode(newEmail);
}

export async function confirmEmailChange(newEmail: string, code: string) {
  await requireValidSession();
  return profileActions.confirmEmailChange(newEmail, code);
}

export async function sendPhoneVerificationCode(newPhone: string) {
  await requireValidSession();
  return profileActions.sendPhoneVerificationCode(newPhone);
}

export async function confirmPhoneChange(newPhone: string, code: string) {
  await requireValidSession();
  return profileActions.confirmPhoneChange(newPhone, code);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await requireValidSession();
  return profileActions.changePassword(currentPassword, newPassword);
}

export async function createPassword(newPassword: string) {
  await requireValidSession();
  return profileActions.createPassword(newPassword);
}

export async function unlinkGoogle() {
  await requireValidSession();
  return profileActions.unlinkGoogle();
}

export async function linkGoogle() {
  await requireValidSession();
  return profileActions.linkGoogle();
}

export async function updateAvatar(avatarUrl: string) {
  await requireValidSession();
  return profileActions.updateAvatar(avatarUrl);
}

export async function deleteAccount() {
  await requireValidSession();
  return profileActions.deleteAccount();
}

// ── Wrappers de compatibilidad (para componentes que aún usan la firma anterior) ─

/**
 * @deprecated Usar confirmEmailChange cuando se implemente el flujo completo
 */
export async function updateEmail(newEmail: string) {
  await requireValidSession();
  return profileActions.confirmEmailChange(newEmail, '');
}

/**
 * @deprecated Usar confirmPhoneChange cuando se implemente el flujo completo
 */
export async function updatePhone(newPhone: string) {
  await requireValidSession();
  return profileActions.confirmPhoneChange(newPhone, '');
}
