/**
 * Types para los correos que reciben alertas operativas del sistema (ej. "hay un comprobante
 * nuevo para revisar") — ver NotificationDispatchListener en el backend.
 */

export interface AdminAlertRecipient {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface AddAdminAlertRecipientRequest {
  email: string;
}
