"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getMessages,
  markMessageRead,
  markAllMessagesReadInDB,
} from "@/lib/db";

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
  const [messages, setMessages] = useState<AppMessage[]>([]);

  const load = useCallback(async () => {
    const raw = await getMessages();
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

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
