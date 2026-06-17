/**
 * Store de Notificaciones — Zustand.
 *
 * Maneja:
 * - Lista de notificaciones
 * - Contador de no leídas (para el badge del navbar)
 * - Conexión SSE para tiempo real
 *
 * El componente solo lee del store. El store se conecta al SSE
 * y actualiza automáticamente cuando llega un evento.
 */

import { create } from 'zustand';
import type { Notification, NotificationSummary } from './notification.types';
import {
  getNotifications as fetchNotifications,
  getUnreadCount as fetchUnreadCount,
  markAsRead as serviceMarkAsRead,
  markAllAsRead as serviceMarkAllAsRead,
  deleteNotification as serviceDeleteNotification,
} from '@/app/actions/notification.actions';

type Status = 'idle' | 'pending' | 'success' | 'error';

interface NotificationStore {
  // State
  status: Status;
  notifications: Notification[];
  unreadCount: number;
  hasUrgent: boolean;
  error: string | null;
  sseConnected: boolean;

  // Actions
  fetchAll: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  setUnreadCount: (count: number) => void;
  setSseConnected: (connected: boolean) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  status: 'idle',
  notifications: [],
  unreadCount: 0,
  hasUrgent: false,
  error: null,
  sseConnected: false,

  fetchAll: async () => {
    set({ status: 'pending', error: null });
    try {
      const result = await fetchNotifications();
      if (result.ok) {
        const data = result.data as Notification[];
        const unread = data.filter((n: Notification) => !n.read).length;
        const urgent = data.some((n: Notification) => !n.read && n.priority === 'urgent');
        set({
          status: 'success',
          notifications: data,
          unreadCount: unread,
          hasUrgent: urgent,
        });
      } else {
        set({ status: 'error', error: result.error.message });
      }
    } catch {
      set({ status: 'error', error: 'Error al cargar notificaciones' });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const result = await fetchUnreadCount();
      if (result.ok) {
        set({ unreadCount: result.data.unreadCount, hasUrgent: result.data.hasUrgent });
      }
    } catch {
      // Silencioso — no bloquear UI por un badge
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    const result = await serviceMarkAsRead(id);
    if (!result.ok) {
      // Revert
      get().fetchAll();
    }
  },

  markAllAsRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
      hasUrgent: false,
    }));

    const result = await serviceMarkAllAsRead();
    if (!result.ok) {
      get().fetchAll();
    }
  },

  deleteNotification: async (id: string) => {
    // Optimistic update
    const prev = get().notifications;
    const target = prev.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: target && !target.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }));

    const result = await serviceDeleteNotification(id);
    if (!result.ok) {
      // Revert
      set({ notifications: prev });
      get().fetchUnreadCount();
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      hasUrgent: state.hasUrgent || notification.priority === 'urgent',
    }));
  },

  setUnreadCount: (count: number) => set({ unreadCount: count }),
  setSseConnected: (connected: boolean) => set({ sseConnected: connected }),
  clear: () => set({ status: 'idle', notifications: [], unreadCount: 0, hasUrgent: false, error: null }),
}));
