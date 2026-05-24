import type { CrmStage } from "./types";

export const DEFAULT_CRM_STAGES: Omit<
  CrmStage,
  "id" | "organization_id"
>[] = [
  { slug: "lead", name: "عميل جديد", sort_order: 0, color: "#8ba3c7", is_closed_won: false, is_closed_lost: false },
  { slug: "contact", name: "تم التواصل", sort_order: 1, color: "#1e6fd9", is_closed_won: false, is_closed_lost: false },
  { slug: "proposal", name: "عرض سعر", sort_order: 2, color: "#f59e0b", is_closed_won: false, is_closed_lost: false },
  { slug: "negotiation", name: "تفاوض", sort_order: 3, color: "#a855f7", is_closed_won: false, is_closed_lost: false },
  { slug: "won", name: "متعاقد", sort_order: 4, color: "#10b981", is_closed_won: true, is_closed_lost: false },
  { slug: "lost", name: "غير محتمل", sort_order: 5, color: "#ef4444", is_closed_won: false, is_closed_lost: true },
];
