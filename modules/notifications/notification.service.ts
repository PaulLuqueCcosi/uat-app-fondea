/**
 * Service de Notificaciones.
 *
 * REST endpoints:
 * - GET /api/v1/notifications → lista de notificaciones
 * - GET /api/v1/notifications/unread-count → { unread_count, has_urgent }
 * - PATCH /api/v1/notifications/{id}/read → marcar como leída
 * - PATCH /api/v1/notifications/read-all → marcar todas como leídas
 *
 * SSE endpoint:
 * - GET /api/v1/notifications/stream → Server-Sent Events (tiempo real)
 */

import type { Result } from '@/modules/shared/result';
import type { Notification, NotificationSummary } from './notification.types';
import type { NotificationError } from './notification.errors';
import { errors } from './notification.errors';
import { backendFetch } from '@/lib/backend-fetch';
import { mapNotificationFromBackend, mapSummaryFromBackend } from './notification.mapper';

type NotifResult<T> = Result<T> & (
  | { ok: true; data: T }
  | { ok: false; error: NotificationError }
);

// ── GET: Lista de notificaciones ──────────────────────────────────────────────

export async function getNotifications(): Promise<NotifResult<Notification[]>> {
  try {
    const res = await backendFetch('/api/v1/notifications', { context: 'NOTIFICATIONS' });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: true, data: [] };
    if (!res.ok) return { ok: false, error: errors.unavailable(`HTTP ${res.status}`) };

    const raw = await res.json();
    const list = (Array.isArray(raw) ? raw : raw.content ?? []).map(mapNotificationFromBackend);

    return { ok: true, data: list };
  } catch (err) {
    console.error('[NOTIFICATIONS] getNotifications → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ── GET: Contador de no leídas ────────────────────────────────────────────────

export async function getUnreadCount(): Promise<NotifResult<NotificationSummary>> {
  try {
    const res = await backendFetch('/api/v1/notifications/unread-count', { context: 'NOTIFICATIONS' });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    const raw = await res.json();
    return { ok: true, data: mapSummaryFromBackend(raw) };
  } catch (err) {
    console.error('[NOTIFICATIONS] getUnreadCount → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ── PATCH: Marcar como leída ──────────────────────────────────────────────────

export async function markAsRead(notificationId: string): Promise<NotifResult<void>> {
  try {
    const res = await backendFetch(`/api/v1/notifications/${notificationId}/read`, {
      method: 'PATCH',
      context: 'NOTIFICATIONS',
    });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    return { ok: true, data: undefined };
  } catch (err) {
    console.error('[NOTIFICATIONS] markAsRead → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ── PATCH: Marcar todas como leídas ───────────────────────────────────────────

export async function markAllAsRead(): Promise<NotifResult<void>> {
  try {
    const res = await backendFetch('/api/v1/notifications/read-all', {
      method: 'PATCH',
      context: 'NOTIFICATIONS',
    });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    return { ok: true, data: undefined };
  } catch (err) {
    console.error('[NOTIFICATIONS] markAllAsRead → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ── DELETE: Eliminar notificación ─────────────────────────────────────────────

export async function deleteNotification(notificationId: string): Promise<NotifResult<void>> {
  try {
    const res = await backendFetch(`/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
      context: 'NOTIFICATIONS',
    });

    if (res.status === 401) return { ok: false, error: errors.sessionExpired() };
    if (res.status === 404) return { ok: true, data: undefined }; // Ya no existe, ok
    if (!res.ok) return { ok: false, error: errors.serverError(res.status) };

    return { ok: true, data: undefined };
  } catch (err) {
    console.error('[NOTIFICATIONS] deleteNotification → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}
