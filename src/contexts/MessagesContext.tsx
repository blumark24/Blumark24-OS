"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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

const MOCK_MESSAGES: AppMessage[] = [
  { id: "m1", from: "سارة أحمد",  avatar: "سأ", subject: "تحديث عقد شركة الماس",    preview: "تم تجديد العقد بنجاح ويحتاج توقيعك...", at: "2024-05-28T08:30:00", read: false },
  { id: "m2", from: "محمد علي",   avatar: "مع", subject: "تصميم الهوية البصرية",      preview: "انتهيت من المسودة الأولى، أرسلتها للمراجعة", at: "2024-05-27T14:00:00", read: false },
  { id: "m3", from: "فاطمة خالد", avatar: "فخ", subject: "تقرير المالية لشهر مايو",   preview: "الأرقام النهائية جاهزة، صافي الربح +18%",   at: "2024-05-27T10:15:00", read: false },
  { id: "m4", from: "عمر حسن",    avatar: "عح", subject: "متابعة العملاء المحتملين",  preview: "راجعت 15 عميل، 4 منهم مهتمون جداً...",     at: "2024-05-26T16:00:00", read: true  },
  { id: "m5", from: "ريم الشهري", avatar: "رش", subject: "تقرير AI Lab الأسبوعي",    preview: "اكتملت تجارب النموذج الجديد بنتائج ممتازة", at: "2024-05-26T09:00:00", read: true  },
];

const MsgContext = createContext<MsgContextValue>({
  messages: MOCK_MESSAGES,
  unread: MOCK_MESSAGES.filter((m) => !m.read).length,
  markRead: () => {},
  markAllRead: () => {},
});

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<AppMessage[]>(MOCK_MESSAGES);

  const markRead = useCallback((id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  }, []);

  const markAllRead = useCallback(() => {
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
  }, []);

  return (
    <MsgContext.Provider value={{ messages, unread: messages.filter((m) => !m.read).length, markRead, markAllRead }}>
      {children}
    </MsgContext.Provider>
  );
}

export function useMessages() {
  return useContext(MsgContext);
}
