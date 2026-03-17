import { create } from "zustand";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "trade" | "inspection" | "offer" | "system";
  read: boolean;
  tradeId?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;

  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (n) => {
    const notification: AppNotification = {
      ...n,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    const notifications = [notification, ...get().notifications].slice(0, 50);
    set({ notifications, unreadCount: notifications.filter((x) => !x.read).length });
  },

  markRead: (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({ notifications, unreadCount: notifications.filter((x) => !x.read).length });
  },

  markAllRead: () => {
    const notifications = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications, unreadCount: 0 });
  },

  clear: () => set({ notifications: [], unreadCount: 0 }),
}));
