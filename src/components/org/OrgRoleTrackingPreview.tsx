"use client";

import { useMemo, useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const PREVIEW_ROLES = [
  "مدير المنشأة",
  "مدير مالي",
  "موظف",
  "رئيس قسم",
  "مدير إدارة",
  "مدير وكالة",
] as const;

const TRACKING_LEVELS = ["خفيف", "متوسط", "دقيق"] as const;
const OPERATIONAL_GOALS = [
  "ضبط الهيكل",
  "تقليل التأخير",
  "رفع الإنتاجية",
  "متابعة العملاء",
  "تحسين الالتزام",
] as const;
const ALERT_THRESHOLDS = [
  "عند وجود 1 مهمة متأخرة",
  "عند وجود 3 مهام متأخرة",
  "عند وجود 5 مهام متأخرة",
] as const;
const REVIEW_CADENCE = ["أسبوعية", "شهرية", "ربع سنوية"] as const;

export const ORG_TRACKING_PREVIEW_HELPER_AR =
  "إعدادات اختيارية تجريبية تساعد المدير على تصور طريقة متابعة كل دور. هذه المعاينة لا تحفظ البيانات ولا تغيّر صلاحيات الدخول.";

function buildPreviewSentence(
  role: string,
  level: string,
  goal: string,
  alert: string,
  cadence: string,
): string {
  return `سيتم متابعة ${role} بمستوى ${level} بهدف ${goal}، مع تنبيه ${alert} ومراجعة ${cadence}.`;
}

function PreviewField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1 min-w-0">
      <label className="text-[#8ba3c7] text-[10px] block">{label}</label>
      {children}
    </div>
  );
}

const selectClass =
  "input-dark w-full text-[11px] min-h-9 touch-manipulation";

export default function OrgRoleTrackingPreview() {
  const [role, setRole] = useState<string>(PREVIEW_ROLES[2]);
  const [level, setLevel] = useState<string>(TRACKING_LEVELS[1]);
  const [goal, setGoal] = useState<string>(OPERATIONAL_GOALS[1]);
  const [alert, setAlert] = useState<string>(ALERT_THRESHOLDS[1]);
  const [cadence, setCadence] = useState<string>(REVIEW_CADENCE[0]);

  const previewSentence = useMemo(
    () => buildPreviewSentence(role, level, goal, alert, cadence),
    [role, level, goal, alert, cadence],
  );

  const isOrganizationalLabel =
    role === "رئيس قسم" || role === "مدير إدارة" || role === "مدير وكالة";

  return (
    <div
      className="space-y-3 rounded-2xl border border-[#a855f7]/20 p-3 sm:p-4 min-w-0"
      style={{ background: "rgba(88,28,135,0.08)" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal size={14} className="text-[#a855f7] shrink-0" />
        <h4 className="text-white text-xs font-semibold">إعدادات المتابعة الذكية</h4>
        <span className="mr-auto shrink-0 rounded-full border border-[#a855f7]/35 bg-[#a855f7]/10 px-2 py-0.5 text-[10px] text-[#d8b4fe]">
          معاينة فقط
        </span>
      </div>

      <p className="text-[#6b87ab] text-[10px] leading-relaxed">{ORG_TRACKING_PREVIEW_HELPER_AR}</p>

      <p className="text-[#6b87ab] text-[10px] italic">
        هذه الإعدادات غير مفعّلة حاليًا — للتصوّر فقط وليست صلاحيات نطاقية.
      </p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <PreviewField label="الدور">
          <select
            className={selectClass}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="الدور"
          >
            {PREVIEW_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </PreviewField>

        <PreviewField label="مستوى المتابعة">
          <select
            className={selectClass}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            aria-label="مستوى المتابعة"
          >
            {TRACKING_LEVELS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </PreviewField>

        <PreviewField label="الهدف التشغيلي">
          <select
            className={selectClass}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            aria-label="الهدف التشغيلي"
          >
            {OPERATIONAL_GOALS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </PreviewField>

        <PreviewField label="حد التنبيه">
          <select
            className={selectClass}
            value={alert}
            onChange={(e) => setAlert(e.target.value)}
            aria-label="حد التنبيه"
          >
            {ALERT_THRESHOLDS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </PreviewField>

        <PreviewField label="وتيرة المراجعة">
          <select
            className={cn(selectClass, "sm:col-span-2")}
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            aria-label="وتيرة المراجعة"
          >
            {REVIEW_CADENCE.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </PreviewField>
      </div>

      {isOrganizationalLabel && (
        <p className="text-[#8ba3c7] text-[10px] rounded-lg border border-[#1e3a5f]/60 px-2 py-1.5 bg-white/[0.02]">
          «{role}» مسمى تنظيمي — لا يمنح صلاحيات دخول في المعاينة أو في النظام الحالي.
        </p>
      )}

      <div
        className="rounded-xl border border-[#22d3ee]/20 px-3 py-2.5"
        style={{ background: "rgba(34,211,238,0.06)" }}
      >
        <p className="text-[#6b87ab] text-[10px] mb-1">معاينة الجملة</p>
        <p className="text-[#b8cce8] text-[10px] leading-relaxed">{previewSentence}</p>
      </div>
    </div>
  );
}
