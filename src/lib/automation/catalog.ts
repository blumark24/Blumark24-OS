import type { AutomationActionType, AutomationTriggerType } from "./types";

export interface CatalogItem {
  type: string;
  label: string;
  description: string;
  category: string;
  configFields?: { key: string; label: string; placeholder?: string; type?: "text" | "textarea" | "select" }[];
}

export const TRIGGER_CATALOG: CatalogItem[] = [
  { type: "schedule.daily", label: "جدولة يومية", description: "تشغيل مرة يومياً (Cron)", category: "جدولة" },
  { type: "schedule.hourly", label: "جدولة كل ساعة", description: "تشغيل كل ساعة", category: "جدولة" },
  { type: "crm.client_created", label: "عميل جديد", description: "عند إضافة عميل في CRM", category: "CRM" },
  { type: "crm.deal_created", label: "صفقة جديدة", description: "عند إنشاء صفقة", category: "CRM" },
  { type: "crm.deal_won", label: "صفقة رابحة", description: "عند نقل صفقة لمرحلة الفوز", category: "CRM" },
  { type: "crm.deal_stage_changed", label: "تغيير مرحلة الصفقة", description: "عند نقل الصفقة بين المراحل", category: "CRM" },
  { type: "crm.contract_signed", label: "عقد جديد", description: "عند تسجيل عقد", category: "CRM" },
  { type: "task.created", label: "مهمة جديدة", description: "عند إنشاء مهمة", category: "المهام" },
  { type: "task.completed", label: "إتمام مهمة", description: "عند إكمال مهمة", category: "المهام" },
  { type: "task.overdue", label: "مهمة متأخرة", description: "عند تأخر موعد المهمة", category: "المهام" },
  { type: "task.assigned", label: "تعيين مهمة", description: "عند تعيين مُكلَّف", category: "المهام" },
  { type: "webhook.incoming", label: "Webhook", description: "استقبال حدث خارجي", category: "تكامل" },
];

export const ACTION_CATALOG: CatalogItem[] = [
  {
    type: "notification.send",
    label: "إشعار داخل النظام",
    description: "إرسال إشعار للمستخدم أو البث",
    category: "إشعارات",
    configFields: [
      { key: "title", label: "العنوان", placeholder: "عنوان الإشعار" },
      { key: "body", label: "المحتوى", placeholder: "نص الإشعار", type: "textarea" },
      { key: "href", label: "رابط", placeholder: "/tasks" },
      { key: "user_id", label: "معرف المستخدم (اختياري)", placeholder: "UUID" },
    ],
  },
  {
    type: "email.send",
    label: "بريد إلكتروني",
    description: "إرسال بريد عبر Resend/SMTP",
    category: "قنوات",
    configFields: [
      { key: "to", label: "إلى", placeholder: "email@example.com" },
      { key: "subject", label: "الموضوع" },
      { key: "body", label: "المحتوى", type: "textarea" },
    ],
  },
  {
    type: "whatsapp.send",
    label: "WhatsApp",
    description: "رسالة واتساب عبر Webhook/Twilio",
    category: "قنوات",
    configFields: [
      { key: "phone", label: "رقم الجوال", placeholder: "9665XXXXXXXX" },
      { key: "message", label: "الرسالة", type: "textarea" },
    ],
  },
  {
    type: "ai.generate",
    label: "أتمتة ذكاء اصطناعي",
    description: "توليد نص/ملخص عبر Claude",
    category: "ذكاء اصطناعي",
    configFields: [
      { key: "prompt", label: "التوجيه", type: "textarea", placeholder: "لخّص بيانات الحدث..." },
      { key: "store_as", label: "حفظ في حقل", placeholder: "summary" },
    ],
  },
  {
    type: "crm.add_note",
    label: "ملاحظة CRM",
    description: "إضافة ملاحظة على العميل",
    category: "CRM",
    configFields: [
      { key: "body", label: "نص الملاحظة", type: "textarea" },
      { key: "author_name", label: "اسم الكاتب", placeholder: "الأتمتة" },
    ],
  },
  {
    type: "crm.log_activity",
    label: "نشاط CRM",
    description: "تسجيل في الجدول الزمني",
    category: "CRM",
    configFields: [
      { key: "title", label: "العنوان" },
      { key: "body", label: "التفاصيل", type: "textarea" },
    ],
  },
  {
    type: "task.create",
    label: "إنشاء مهمة",
    description: "مهمة جديدة تلقائياً",
    category: "المهام",
    configFields: [
      { key: "title", label: "عنوان المهمة" },
      { key: "priority", label: "الأولوية", placeholder: "متوسطة" },
      { key: "due_days", label: "موعد بعد (أيام)", placeholder: "3" },
    ],
  },
  {
    type: "task.set_status",
    label: "تحديث حالة مهمة",
    description: "تغيير حالة مهمة مرتبطة",
    category: "المهام",
    configFields: [{ key: "status", label: "الحالة", placeholder: "قيد_التنفيذ" }],
  },
];

export function getTriggerMeta(type: string): CatalogItem | undefined {
  return TRIGGER_CATALOG.find((t) => t.type === type);
}

export function getActionMeta(type: string): CatalogItem | undefined {
  return ACTION_CATALOG.find((a) => a.type === type);
}

export function isValidTrigger(type: string): type is AutomationTriggerType {
  return TRIGGER_CATALOG.some((t) => t.type === type);
}

export function isValidAction(type: string): type is AutomationActionType {
  return ACTION_CATALOG.some((a) => a.type === type);
}
