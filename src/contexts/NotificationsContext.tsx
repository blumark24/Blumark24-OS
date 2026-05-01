"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { mockTasks, mockClients } from "@/lib/mockData";

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

function buildNotifications(): AppNotification[] {
  const now   = new Date();
  const items: AppNotification[] = [];

  // Late tasks
  mockTasks
    .filter((t) => t.status !== "مكتملة" && new Date(t.dueDate) < now)
    .slice(0, 3)
    .forEach((t) => {
      items.push({
        id:    `late-${t.id}`,
        type:  "task_late",
        title: "مهمة متأخرة",
        body:  t.title,
        href:  "/tasks",
        read:  false,
        at:    t.dueDate,
      });
    });

  // Tasks due within 24 h
  mockTasks
    .filter((t) => {
      if (t.status === "مكتملة") return false;
      const due  = new Date(t.dueDate);
      const diff = due.getTime() - now.getTime();
      return diff > 0 && diff < 86_400_000;
    })
    .slice(0, 2)
    .forEach((t) => {
      items.push({
        id:    `due-${t.id}`,
        type:  "task_due",
        title: "مهمة تستحق اليوم",
        body:  t.title,
        href:  "/tasks",
        read:  false,
        at:    t.dueDate,
      });
    });

  // Clients needing follow-up (محتمل with no recent activity mock)
  mockClients
    .filter((c) => c.status === "محتمل")
    .slice(0, 2)
    .forEach((c) => {
      items.push({
        id:    `client-${c.id}`,
        type:  "client_followup",
        title: "متابعة عميل",
        body:  `${c.name} يحتاج متابعة`,
        href:  "/clients",
        read:  false,
        at:    c.createdAt,
      });
    });

  return items;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setNotifications(buildNotifications());
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

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
