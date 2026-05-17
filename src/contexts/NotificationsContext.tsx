"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  getNotifications,
  markNotificationReadInDB,
  markAllNotificationsReadInDB,
  type DBNotification,
} from "@/lib/db";
import { useAuth } from "./AuthContext";
import { withSoftTimeout } from "@/lib/asyncHelpers";

// Background fetch must never hang the Header dropdown.
const NOTIF_LOAD_TIMEOUT = 6_000;

export interface AppNotification {
  id: string;
  type: "task_due" | "task_late" | "client_followup" | "invoice_due";
  title: string;
  body: string;
  href: string;
  read: boolean;
  at: string;
}

interface NotifContextValue {
  notifications: AppNotification[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotifContext = createContext<NotifContextValue>({
  notifications: [],
  unread: 0,
  markRead: () => {},
  markAllRead: () => {},
});

function mapDBToApp(n: DBNotification): AppNotification {
  return {
    id:    n.id,
    type:  n.type,
    title: n.title,
    body:  n.body,
    href:  n.href,
    read:  n.read,
    at:    n.created_at,
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const raw = await withSoftTimeout(getNotifications(user.id), NOTIF_LOAD_TIMEOUT);
      if (raw) setNotifications(raw.map(mapDBToApp));
    } catch {
      // silently keep empty on error
    }
  }, [user?.id]);

  // Only fetch and subscribe once we have a user — avoids work on
  // landing/auth pages and prevents queries during initial auth resolve.
  useEffect(() => { if (user?.id) load(); }, [user?.id, load]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, load]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markNotificationReadInDB(id).catch(console.error);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsReadInDB(user?.id).catch(console.error);
  }, [user?.id]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <NotifContext.Provider value={{ notifications, unread, markRead, markAllRead }}>
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotifContext);
}
