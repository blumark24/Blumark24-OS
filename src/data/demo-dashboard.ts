import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Briefcase,
  Building2,
  ClipboardList,
  Cpu,
  DollarSign,
  FileBarChart,
  FileText,
  Headphones,
  Home,
  Network,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";

export type DemoNavItem = { icon: LucideIcon; label: string; active?: boolean };
export type DemoKpi = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  accent: "cyan" | "warn";
};
export type DemoSalesPoint = { month: string; current: number; previous: number };
export type DemoUsersPoint = { day: string; users: number };
export type DemoActivity = { icon: LucideIcon; label: string; sub?: string; time: string };
export type DemoProject = {
  name: string;
  client: string;
  progress: number;
  budget: string;
  deadline: string;
  status: "قيد التنفيذ" | "مكتمل";
};
export type DemoFeature = { icon: LucideIcon; label: string; sub?: string };

export const DEMO_NAV: DemoNavItem[] = [
  { icon: Home, label: "الرئيسية", active: true },
  { icon: Building2, label: "المكتب الافتراضي" },
  { icon: Network, label: "الهيكل الإداري" },
  { icon: Users, label: "الموظفين" },
  { icon: ClipboardList, label: "المهام" },
  { icon: Briefcase, label: "العملاء (CRM)" },
  { icon: DollarSign, label: "المالية" },
  { icon: Target, label: "الاستراتيجية" },
  { icon: Bot, label: "المساعد الذكي" },
  { icon: FileBarChart, label: "التقارير" },
  { icon: Settings, label: "الإعدادات" },
];

export const DEMO_KPIS: DemoKpi[] = [
  { label: "الموظفون النشطون", value: "156", delta: "+5.3%", icon: Users, accent: "cyan" },
  { label: "المهام المكتملة", value: "89%", delta: "+8.7%", icon: ClipboardList, accent: "cyan" },
  { label: "إيرادات هذا الشهر", value: "2.45M", delta: "+18.2%", icon: TrendingUp, accent: "warn" },
  { label: "إجمالي العملاء", value: "1,248", delta: "+12.5%", icon: Briefcase, accent: "cyan" },
];

export const DEMO_SALES: DemoSalesPoint[] = [
  { month: "يناير", current: 420000, previous: 320000 },
  { month: "فبراير", current: 480000, previous: 380000 },
  { month: "مارس", current: 550000, previous: 410000 },
  { month: "أبريل", current: 500000, previous: 450000 },
  { month: "مايو", current: 620000, previous: 500000 },
  { month: "يونيو", current: 680000, previous: 480000 },
  { month: "يوليو", current: 600000, previous: 550000 },
  { month: "أغسطس", current: 720000, previous: 580000 },
  { month: "سبتمبر", current: 780000, previous: 620000 },
  { month: "أكتوبر", current: 740000, previous: 660000 },
  { month: "نوفمبر", current: 850000, previous: 700000 },
  { month: "ديسمبر", current: 920000, previous: 750000 },
];

export const DEMO_USERS: DemoUsersPoint[] = [
  { day: "26 يونيو", users: 145 },
  { day: "19 يونيو", users: 110 },
  { day: "12 يونيو", users: 190 },
  { day: "5 يونيو", users: 124 },
  { day: "29 مايو", users: 80 },
];

export const DEMO_ACTIVITIES: DemoActivity[] = [
  { icon: Building2, label: "تم تحديث المكتب الافتراضي", sub: "Office 09", time: "منذ 10 دقائق" },
  { icon: Network, label: "تمت إضافة إدارة جديدة في الهيكل الإداري", sub: "إدارة النمو", time: "منذ 25 دقيقة" },
  { icon: UserPlus, label: "تم إضافة عميل جديد", sub: "منشأة تجارية", time: "منذ 40 دقيقة" },
  { icon: FileText, label: "تم إكمال مهمة تصميم محتوى", time: "منذ 1 ساعة" },
  { icon: Workflow, label: "تم تحديث مسار تشغيل العملاء", time: "منذ 3 ساعات" },
];

export const DEMO_PROJECTS: DemoProject[] = [
  { name: "تفعيل المكتب الافتراضي", client: "منشأة تجارية", progress: 75, budget: "250,000 SAR", deadline: "2026-07-15", status: "قيد التنفيذ" },
  { name: "بناء الهيكل الإداري", client: "شركة تشغيلية", progress: 90, budget: "45,000 SAR", deadline: "2026-07-20", status: "قيد التنفيذ" },
  { name: "أتمتة متابعة العملاء", client: "مركز خدمات", progress: 60, budget: "80,000 SAR", deadline: "2026-08-01", status: "قيد التنفيذ" },
  { name: "تفعيل المساعد الذكي", client: "شركة نمو", progress: 30, budget: "150,000 SAR", deadline: "2026-08-10", status: "قيد التنفيذ" },
  { name: "لوحة التقارير التنفيذية", client: "مؤسسة إدارية", progress: 100, budget: "120,000 SAR", deadline: "2026-06-10", status: "مكتمل" },
];

export const DEMO_BRAND_FEATURES: DemoFeature[] = [
  { icon: Building2, label: "مكتب افتراضي ذكي" },
  { icon: Network, label: "هيكل إداري رقمي" },
  { icon: Bot, label: "مساعد ذكاء اصطناعي" },
  { icon: ShieldCheck, label: "أمان وخصوصية عالية" },
];

export const DEMO_BOTTOM_FEATURES: DemoFeature[] = [
  { icon: Building2, label: "المكتب الافتراضي", sub: "عرض تشغيلي للإدارات والمكاتب" },
  { icon: Network, label: "الهيكل الإداري", sub: "إدارات وصلاحيات واضحة" },
  { icon: FileBarChart, label: "تقارير تنفيذية", sub: "مؤشرات فورية وشاملة" },
  { icon: Cpu, label: "ذكاء اصطناعي", sub: "مساعد ذكي متقدّم" },
  { icon: ShieldCheck, label: "أمن متقدّم", sub: "حماية بمعايير عالمية" },
];

export const DEMO_USER = {
  name: "مدير المنشأة",
  role: "مالك / مدير عام",
  initials: "م",
  greetingFirstName: "مدير المنشأة",
  todayLabel: "اليوم هو 26 يونيو 2026",
};

export const DEMO_SATISFACTION = { value: 95, label: "ممتاز", deltaLabel: "+5%" };

export const DEMO_REFERRAL = { score: 4.8, total: 248 };
