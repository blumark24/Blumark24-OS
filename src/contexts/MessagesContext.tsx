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
  getMessages,
  markMessageRead,
  markAllMessagesReadInDB,
} from "@/lib/db";
import { useAuth } from "./AuthContext";
import { withSoftTimeout } from "@/lib/asyncHelpers";

// Background fetch must never hang the Header messages dropdown.
const MSG_LOAD_TIMEOUT = 6_000;

export interface AppMessage {
  id: string;
  from: string;
  avatar: string;
  subject: string;
  preview: string;
  at: string;
  read: boolean;
}

interface MsgContextValue {
  messages: AppMessage[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const MsgContext = createContext<MsgContextValue>({
  messages: [],
  unread: 0,
  markRead: () => {},
  markAllRead: () => {},
});

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AppMessage[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const raw = await withSoftTimeout(getMessages(), MSG_LOAD_TIMEOUT);
      if (!raw) return;
      setMessages(
        raw.map((m) => ({
          id:      m.id,
          from:    m.sender_name,
          avatar:  m.sender_avatar,
          subject: m.subject,
          preview: m.content,
          at:      m.created_at,
          read:    m.read,
        }))
      );
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
      .channel("messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, load]);

  const markRead = useCallback((id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    markMessageRead(id).catch(console.error);
  }, []);

  const markAllRead = useCallback(() => {
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    markAllMessagesReadInDB().catch(console.error);
  }, []);

  return (
    <MsgContext.Provider
      value={{
        messages,
        unread: messages.filter((m) => !m.read).length,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </MsgContext.Provider>
  );
}

export function useMessages() {
  return useContext(MsgContext);
}
