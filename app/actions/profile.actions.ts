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

// ── Verificación de identidad ────────────────────────────────────────────────

export async function verifyIdentity(password: string) {
  await requireValidSession();
  return profileActions.verifyIdentity(password);
}

export async function sendIdentityVerificationCode(email: string) {
  await requireValidSession();
  return profileActions.sendIdentityVerificationCode(email);
}

export async function verifyIdentityCode(email: string, verificationId: string, code: string) {
  await requireValidSession();
  return profileActions.verifyIdentityCode(email, verificationId, code);
}

// ── Email ────────────────────────────────────────────────────────────────────

export async function sendEmailVerificationCode(newEmail: string) {
  await requireValidSession();
  return profileActions.sendEmailVerificationCode(newEmail);
}

export async function verifyEmailCode(newEmail: string, verificationId: string, code: string) {
  await requireValidSession();
  return profileActions.verifyEmailCode(newEmail, verificationId, code);
}

export async function confirmEmailChange(
  newEmail: string,
  identityVerificationId: string,
  emailVerificationId: string,
) {
  await requireValidSession();
  return profileActions.confirmEmailChange(newEmail, identityVerificationId, emailVerificationId);
}

// ── Teléfono ─────────────────────────────────────────────────────────────────

export async function sendPhoneVerificationCode(newPhone: string) {
  await requireValidSession();
  return profileActions.sendPhoneVerificationCode(newPhone);
}

export async function verifyPhoneCode(newPhone: string, verificationId: string, code: string) {
  await requireValidSession();
  return profileActions.verifyPhoneCode(newPhone, verificationId, code);
}

export async function confirmPhoneChange(
  newPhone: string,
  identityVerificationId: string,
  phoneVerificationId: string,
) {
  await requireValidSession();
  return profileActions.confirmPhoneChange(newPhone, identityVerificationId, phoneVerificationId);
}

// ── Contraseña ───────────────────────────────────────────────────────────────

export async function changePassword(newPassword: string, verificationRecordId: string) {
  await requireValidSession();
  return profileActions.changePassword(newPassword, verificationRecordId);
}

export async function createPassword(newPassword: string, verificationRecordId: string) {
  await requireValidSession();
  return profileActions.createPassword(newPassword, verificationRecordId);
}

// ── Google / Social ──────────────────────────────────────────────────────────

export async function unlinkGoogle(verificationRecordId: string) {
  await requireValidSession();
  return profileActions.unlinkGoogle(verificationRecordId);
}

export async function linkGoogle() {
  await requireValidSession();
  return profileActions.linkGoogle();
}

// ── Avatar ───────────────────────────────────────────────────────────────────

export async function updateAvatar(avatarUrl: string) {
  await requireValidSession();
  return profileActions.updateAvatar(avatarUrl);
}

// ── Eliminar cuenta ──────────────────────────────────────────────────────────

export async function deleteAccount() {
  await requireValidSession();
  return profileActions.deleteAccount();
}
