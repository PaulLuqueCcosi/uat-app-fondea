'use server';

import { requireValidSession } from './auth.actions';
import * as notificationService from '@/modules/notifications/notification.service';

export async function getNotifications() {
  await requireValidSession();
  return notificationService.getNotifications();
}

export async function getUnreadCount() {
  await requireValidSession();
  return notificationService.getUnreadCount();
}

export async function markAsRead(notificationId: string) {
  await requireValidSession();
  return notificationService.markAsRead(notificationId);
}

export async function markAllAsRead() {
  await requireValidSession();
  return notificationService.markAllAsRead();
}

export async function deleteNotification(notificationId: string) {
  await requireValidSession();
  return notificationService.deleteNotification(notificationId);
}
