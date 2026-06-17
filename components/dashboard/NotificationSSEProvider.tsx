'use client';

import { useNotificationSSE } from '@/modules/notifications/useNotificationSSE';

/**
 * Componente invisible que inicializa la conexión SSE de notificaciones.
 * Se monta una vez en el dashboard layout.
 */
export function NotificationSSEProvider() {
  useNotificationSSE();
  return null;
}
