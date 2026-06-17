/**
 * Mapper: respuesta del backend → tipos del frontend.
 *
 * Backend devuelve snake_case, frontend usa camelCase.
 */

import type { Notification, NotificationSummary } from './notification.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapNotificationFromBackend(raw: any): Notification {
  return {
    id: raw.id ?? '',
    type: raw.type ?? 'SYSTEM_ANNOUNCEMENT',
    title: raw.title ?? '',
    message: raw.message ?? '',
    priority: raw.priority ?? 'low',
    read: raw.read ?? raw.is_read ?? false,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    metadata: raw.metadata ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSummaryFromBackend(raw: any): NotificationSummary {
  return {
    unreadCount: raw.unread_count ?? raw.unreadCount ?? 0,
    hasUrgent: raw.has_urgent ?? raw.hasUrgent ?? false,
  };
}
