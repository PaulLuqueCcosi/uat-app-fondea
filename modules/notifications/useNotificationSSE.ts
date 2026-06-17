'use client';

/**
 * Hook SSE — conecta al proxy local /api/notifications/stream.
 *
 * No necesita token del lado del cliente — la API route lo maneja server-side.
 * Solo montar UNA VEZ en el dashboard layout.
 */

import { useEffect, useRef } from 'react';
import { useNotificationStore } from './notification.store';
import { mapNotificationFromBackend } from './notification.mapper';

const RECONNECT_DELAY_MS = 5000;

export function useNotificationSSE() {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const setSseConnected = useNotificationStore((s) => s.setSseConnected);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function connect() {
      const url = '/api/notifications/stream';
      console.log('[SSE] Conectando...');

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        console.log('[SSE] ✅ Conectado');
        setSseConnected(true);
      };

      // Evento: nueva notificación
      es.addEventListener('notification', (event) => {
        try {
          const data = JSON.parse(event.data);
          const notification = mapNotificationFromBackend(data.notification);
          addNotification(notification);
          if (data.unread_count != null || data.unreadCount != null) {
            setUnreadCount(data.unread_count ?? data.unreadCount);
          }
        } catch (err) {
          console.error('[SSE] Error parseando notification:', err);
        }
      });

      // Evento: actualización de contador
      es.addEventListener('count_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          setUnreadCount(data.unread_count ?? data.unreadCount ?? 0);
        } catch (err) {
          console.error('[SSE] Error parseando count_update:', err);
        }
      });

      // Heartbeat (ignorar — solo keep-alive)
      es.addEventListener('heartbeat', () => {});

      es.onerror = () => {
        console.warn('[SSE] ⚠️ Conexión perdida — reconectando en', RECONNECT_DELAY_MS, 'ms');
        setSseConnected(false);
        es.close();
        eventSourceRef.current = null;
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setSseConnected(false);
    };
  }, [addNotification, setUnreadCount, setSseConnected]);
}
