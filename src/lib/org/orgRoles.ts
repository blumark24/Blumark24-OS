import type { LucideIcon } from "lucide-react";
import { Crown, Shield, Building2, Network, Users, User } from "lucide-react";

export interface OrgRoleDef {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
}

export const ORG_SYSTEM_ROLES: OrgRoleDef[] = [
  {
    id: "owner",
    title: "مدير مجلس الإدارة / صاحب المنشأة",
    subtitle: "صلاحيات كاملة على الهيكل والموظفين",
    icon: Crown,
    accent: "#f59e0b",
  },
  {
    id: "board_member",
    title: "عضو مجلس إدارة",
    subtitle: "مشاركة في القرارات الاستراتيجية",
    icon: Shield,
    accent: "#22d3ee",
  },
  {
    id: "agency_manager",
    title: "مدير وكالة",
    subtitle: "قيادة الوكالة والأقسام التابعة",
    icon: Building2,
    accent: "#a855f7",
  },
  {
    id: "management_manager",
    title: "مدير إدارة",
    subtitle: "تنسيق الأقسام ضمن الإدارة",
    icon: Network,
    accent: "#10b981",
  },
  {
    id: "department_head",
    title: "رئيس قسم",
    subtitle: "إدارة فريق القسم اليومي",
    icon: Users,
    accent: "#3b82f6",
  },
  {
    id: "employee",
    title: "موظف",
    subtitle: "تنفيذ المهام ضمن القسم",
    icon: User,
    accent: "#8ba3c7",
  },
];

export const ASSIGNMENT_ROLES = [
  { value: "employee", label: "موظف" },
  { value: "department_head", label: "رئيس قسم" },
  { value: "management_manager", label: "مدير إدارة" },
  { value: "agency_manager", label: "مدير وكالة" },
  { value: "board_member", label: "عضو مجلس إدارة" },
];
