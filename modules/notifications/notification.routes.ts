/**
 * Construye la URL de acción en el FRONTEND según el tipo de notificación.
 *
 * El backend NO envía URLs — solo el tipo + metadata.
 * Este archivo centraliza la lógica de navegación.
 */

import type { Notification, NotificationType } from './notification.types';

/**
 * Dada una notificación, devuelve la ruta a la que navegar al hacer click.
 * Retorna null si la notificación no tiene acción navegable.
 */
export function getNotificationRoute(notification: Notification): string | null {
  const meta = notification.metadata ?? {};

  switch (notification.type) {
    // ── Solicitudes ──
    case 'APPLICATION_APPROVED':
    case 'APPLICATION_REJECTED':
    case 'APPLICATION_UPDATE':
      return meta.applicationId
        ? `/solicitudes/${meta.applicationId}`
        : '/dashboard/loans';

    // ── Pagos ──
    case 'PAYMENT_REMINDER':
    case 'PAYMENT_OVERDUE':
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_REJECTED':
      return meta.creditId
        ? `/dashboard/creditos/${meta.creditId}`
        : '/dashboard/creditos';

    // ── Score / Pasaporte ──
    case 'SCORE_UPDATED':
    case 'LEVEL_UP':
      return '/dashboard/pasaporte';

    // ── Referidos ──
    case 'REFERRAL_COMPLETED':
    case 'REFERRAL_REGISTERED':
      return '/dashboard/referidos';

    // ── KYC / Documentos ──
    case 'DOCUMENT_EXPIRED':
    case 'KYC_VERIFIED':
    case 'KYC_REJECTED':
      return '/dashboard/mi-expediente';

    // ── Contrato y desembolso ──
    case 'CONTRACT_READY':
      return meta.applicationId
        ? `/solicitudes/${meta.applicationId}`
        : '/dashboard/loans';

    case 'DISBURSEMENT_COMPLETED':
      return meta.creditId
        ? `/dashboard/creditos/${meta.creditId}`
        : '/dashboard/creditos';

    // ── Constancias ──
    // TODO: no hay vista de cliente para descargar su propia constancia todavía — navega al
    // crédito de origen como mejor aproximación hasta que exista esa pantalla.
    case 'DEBT_CERTIFICATE_READY':
      return meta.creditId
        ? `/dashboard/creditos/${meta.creditId}`
        : '/dashboard/creditos';

    // ── Sistema ──
    case 'SYSTEM_ANNOUNCEMENT':
    default:
      return null;
  }
}
