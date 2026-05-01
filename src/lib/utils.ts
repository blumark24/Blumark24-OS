import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

export const DEPARTMENTS = [
  "الإدارة",
  "الهجوم",
  "الإبداع",
  "التصميم",
  "الحملات",
  "خدمة العملاء",
  "المالي",
  "العمليات",
  "AI Lab",
];

export const CITIES = ["مكة", "جدة", "الرياض", "الطائف", "المدينة"];

export const FUND_DISTRIBUTION = {
  operations: { label: "العمليات", pct: 0.4, color: "#22d3ee" },
  savings: { label: "الادخار", pct: 0.1, color: "#1e6fd9" },
  taxes: { label: "الضرائب", pct: 0.1, color: "#ff7a3d" },
  salaries: { label: "الرواتب", pct: 0.2, color: "#a855f7" },
  marketing: { label: "التسويق", pct: 0.2, color: "#10b981" },
};
