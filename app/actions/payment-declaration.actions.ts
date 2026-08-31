'use server';

/**
 * Server Actions de Declaraciones de Pago — thin wrappers con autenticación.
 *
 * Responsabilidad: validar sesión y delegar al service.
 * NO tiene lógica propia.
 */

import { requireValidSession, requireAdminRole } from './auth.actions';
import * as paymentDeclarationService from '@/modules/payment-declarations/payment-declaration.service';
import type {
  AdminPaymentDeclarationListParams,
  ApprovePaymentDeclarationRequest,
  RejectPaymentDeclarationRequest,
} from '@/modules/payment-declarations';

/**
 * Declara un pago adjuntando comprobantes. formData debe traer:
 * creditId, installmentNo, y por cada voucher (mismo orden): photos, operationNumbers, amounts.
 */
export async function submitPaymentDeclarationAction(formData: FormData) {
  await requireValidSession();
  return paymentDeclarationService.submitPaymentDeclaration(formData);
}

/** Declaraciones de pago del usuario, paginadas, más recientes primero */
export async function listMyPaymentDeclarationsAction(page: number, size: number) {
  await requireValidSession();
  return paymentDeclarationService.listMyPaymentDeclarations(page, size);
}

/** Detalle de una declaración propia */
export async function getMyPaymentDeclarationByIdAction(id: string) {
  await requireValidSession();
  return paymentDeclarationService.getMyPaymentDeclarationById(id);
}

// ── Admin ────────────────────────────────────────────────────────────────────

/** Declaraciones de pago del sistema, paginadas y filtrables — requiere rol ADMIN */
export async function listAdminPaymentDeclarationsAction(params: AdminPaymentDeclarationListParams) {
  await requireAdminRole();
  return paymentDeclarationService.listAdminPaymentDeclarations(params);
}

/** Detalle completo de una declaración, sin chequeo de ownership — requiere rol ADMIN */
export async function getAdminPaymentDeclarationByIdAction(id: string) {
  await requireAdminRole();
  return paymentDeclarationService.getAdminPaymentDeclarationById(id);
}

/** Aprueba una declaración de pago y aplica el pago sobre el crédito — requiere rol ADMIN */
export async function approvePaymentDeclarationAction(id: string, request: ApprovePaymentDeclarationRequest) {
  await requireAdminRole();
  return paymentDeclarationService.approvePaymentDeclaration(id, request);
}

/** Rechaza una declaración de pago — requiere rol ADMIN */
export async function rejectPaymentDeclarationAction(id: string, request: RejectPaymentDeclarationRequest) {
  await requireAdminRole();
  return paymentDeclarationService.rejectPaymentDeclaration(id, request);
}

/**
 * Cuánto se debe hasta una cuota objetivo, con el desglose cuota por cuota.
 * Requiere rol ADMIN. El backend sincroniza la mora antes de calcular, así que conviene
 * pedirla al abrir la pantalla de aprobación y al cambiar la cuota objetivo.
 */
export async function getPaymentQuoteAction(creditId: string, installmentNo: number) {
  await requireAdminRole();
  return paymentDeclarationService.getPaymentQuote(creditId, installmentNo);
}
