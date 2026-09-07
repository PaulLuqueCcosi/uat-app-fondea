/**
 * Tipos del módulo Notificaciones.
 *
 * Define los tipos de notificación, prioridad, y estructura
 * que el backend debe enviar via SSE y REST.
 */

// ── Tipos de notificación ─────────────────────────────────────────────────────

export type NotificationType =
  | 'APPLICATION_APPROVED'      // Solicitud aprobada
  | 'APPLICATION_REJECTED'      // Solicitud rechazada
  | 'APPLICATION_UPDATE'        // Cambio de estado en solicitud
  | 'PAYMENT_REMINDER'          // Recordatorio de pago próximo
  | 'PAYMENT_OVERDUE'           // Pago vencido
  | 'PAYMENT_CONFIRMED'         // Pago confirmado
  | 'PAYMENT_REJECTED'          // Comprobante de pago rechazado
  | 'SCORE_UPDATED'             // Puntaje actualizado (subió/bajó de nivel)
  | 'LEVEL_UP'                  // Subió de nivel en pasaporte
  | 'REFERRAL_COMPLETED'        // Un referido completó su préstamo
  | 'REFERRAL_REGISTERED'       // Un referido se registró
  | 'DOCUMENT_EXPIRED'          // Documento por vencer o vencido
  | 'KYC_VERIFIED'              // KYC aprobado
  | 'KYC_REJECTED'              // KYC rechazado
  | 'CONTRACT_READY'            // Contrato listo para firmar
  | 'DISBURSEMENT_COMPLETED'    // Desembolso realizado
  | 'DEBT_CERTIFICATE_READY'    // Constancia de no adeudo lista
  | 'SYSTEM_ANNOUNCEMENT';      // Anuncio del sistema (mantenimiento, etc.)

// ── Prioridad ─────────────────────────────────────────────────────────────────

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// ── Notificación completa ─────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  /** Datos extra según el tipo (ej: applicationId, creditId, etc.) — el frontend construye la URL */
  metadata: Record<string, unknown> | null;
}

// ── Resumen (para el badge del navbar) ────────────────────────────────────────

export interface NotificationSummary {
  unreadCount: number;
  hasUrgent: boolean;
}

// ── Evento SSE ────────────────────────────────────────────────────────────────

/**
 * Estructura de los eventos que llegan via Server-Sent Events.
 * El backend envía estos como `data: {...}` en el stream.
 */
export type SSEEventType =
  | 'notification'     // Nueva notificación
  | 'count_update'     // Solo actualizar el contador (sin notificación nueva)
  | 'heartbeat';       // Keep-alive (ignorar en la UI)

export interface SSEEvent {
  event: SSEEventType;
  data: SSENotificationEvent | SSECountEvent | null;
}

export interface SSENotificationEvent {
  notification: Notification;
  unreadCount: number;
}

export interface SSECountEvent {
  unreadCount: number;
}

// ── Labels para la UI ─────────────────────────────────────────────────────────

export const notificationTypeLabels: Record<NotificationType, string> = {
  APPLICATION_APPROVED: 'Solicitud aprobada',
  APPLICATION_REJECTED: 'Solicitud rechazada',
  APPLICATION_UPDATE: 'Actualización de solicitud',
  PAYMENT_REMINDER: 'Recordatorio de pago',
  PAYMENT_OVERDUE: 'Pago vencido',
  PAYMENT_CONFIRMED: 'Pago confirmado',
  PAYMENT_REJECTED: 'Comprobante rechazado',
  SCORE_UPDATED: 'Puntaje actualizado',
  LEVEL_UP: 'Subiste de nivel',
  REFERRAL_COMPLETED: 'Referido completado',
  REFERRAL_REGISTERED: 'Nuevo referido',
  DOCUMENT_EXPIRED: 'Documento por vencer',
  KYC_VERIFIED: 'Identidad verificada',
  KYC_REJECTED: 'Verificación rechazada',
  CONTRACT_READY: 'Contrato listo',
  DISBURSEMENT_COMPLETED: 'Desembolso realizado',
  DEBT_CERTIFICATE_READY: 'Constancia lista',
  SYSTEM_ANNOUNCEMENT: 'Aviso del sistema',
};

export const notificationPriorityLabels: Record<NotificationPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};
