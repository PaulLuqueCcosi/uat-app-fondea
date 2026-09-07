'use server';

import {
  addAdminAlertRecipient,
  removeAdminAlertRecipient,
  setAdminAlertRecipientActive,
} from '@/modules/admin/admin-notification-recipients.service';
import type { AddAdminAlertRecipientRequest } from '@/modules/admin/admin-notification-recipients.types';

/**
 * Server Actions — correos que reciben alertas operativas del sistema.
 */

export async function addAdminAlertRecipientAction(request: AddAdminAlertRecipientRequest) {
  return addAdminAlertRecipient(request);
}

export async function setAdminAlertRecipientActiveAction(id: string, active: boolean) {
  return setAdminAlertRecipientActive(id, active);
}

export async function removeAdminAlertRecipientAction(id: string) {
  return removeAdminAlertRecipient(id);
}
