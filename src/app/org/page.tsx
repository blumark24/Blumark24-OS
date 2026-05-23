"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Network, Shield, Swords, Users, ChevronDown,
  Plus, Pencil, Trash2, X, Save, UserCheck, Mail,
  Phone, Briefcase, AlertCircle, Building2, Crown, Layers,
  Sparkles, RefreshCw, UserPlus, ShieldCheck, Gauge, Check,
  Star, Zap, Boxes, Workflow,
} from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { useBoardMembers, useEmployees } from "@/hooks/useData";
import {
  PLAN_LABELS_AR,
  type PlanSlug,
} from "@/lib/features/packageFeatures";
import type { BoardMember } from "@/lib/db";
import type { Employee } from "@/types";
import { WS_PAGE, WS_CARD, WS_GLASS_MODAL, WS_SURFACE } from "@/components/ui/workspaceVisual";
import { cn } from "@/lib/utils";

const MAX_BOARD = 3;

// ─── Design tokens ──────────────────────────────────────────────────────────────

const ACCENT: Record<string, string> = {
  cyan:    "#22d3ee",
  violet:  "#a855f7",
  sky:     "#38bdf8",
  amber:   "#fbbf24",
  emerald: "#10b981",
  rose:    "#f43f5e",
  blue:    "#1e6fd9",
  orange:  "#ff7a3d",
};

// ─── Package model ──────────────────────────────────────────────────────────────

type LevelKey = "agency" | "mgmt" | "dept" | "team";

interface PlanTier {
  slug: PlanSlug;
  label: string;
  tagline: string;
  cta: string;
  ctaIcon: React.ElementType;
  accent: string;
  chain: string[];
  caps: Record<LevelKey, number>;
}

const PLAN_TIERS: PlanTier[] = [
  {
    slug: "basic",
    label: "بسيط",
    tagline: "هيكل واضح للفرق الصغيرة",
    cta: "بداية مثالية",
    ctaIcon: Sparkles,
    accent: "cyan",
    chain: ["إدارة", "قسم"],
    caps: { agency: 0, mgmt: 5, dept: 15, team: 0 },
  },
  {
    slug: "growth",
    label: "نمو",
    tagline: "وكالات وفِرق لمنشأة تتوسّع",
    cta: "موصى به",
    ctaIcon: Star,
    accent: "violet",
    chain: ["وكالة", "إدارة", "قسم", "فريق"],
    caps: { agency: 2, mgmt: 10, dept: 30, team: 20 },
  },
  {
    slug: "advanced",
    label: "متقدم",
    tagline: "هيكل قيادي كامل بلا حدود تقريبًا",
    cta: "الأكثر مرونة",
    ctaIcon: Zap,
    accent: "amber",
    chain: ["وكالة", "إدارة", "قسم", "فريق"],
    caps: { agency: 5, mgmt: 20, dept: 50, team: 60 },
  },
];

const TIER_BY_SLUG: Record<PlanSlug, PlanTier> =
  Object.fromEntries(PLAN_TIERS.map((t) => [t.slug, t])) as Record<PlanSlug, PlanTier>;

// ─── Role labels (for tenant leadership cards) ──────────────────────────────────

const ROLE_AR: Record<string, string> = {
  super_admin:          "مدير النظام",
  board_member:         "عضو مجلس إدارة",
  owner:                "صاحب الشركة",
  general_manager:      "المدير العام",
  defense_manager:      "مدير وكالة الدفاع",
  attack_manager:       "مدير وكالة الهجوم",
  manager:              "مدير",
  finance_manager:      "المدير المالي",
  sales_manager:        "مدير المبيعات",
  hr_manager:           "مدير الموارد البشرية",
  organization_manager: "مدير المنشأة",
  employee:             "موظف",
};

const LEADERSHIP_ROLES = new Set([
  "owner", "general_manager", "board_member", "organization_manager",
]);

// ─── Internal Blumark24 signature structure ─────────────────────────────────────

const DEFENSE_DEPTS = ["الإدارة", "العمليات", "المالي", "الإبداع", "التصميم", "الحملات", "AI Lab"];
const OFFENSE_DEPTS = ["العملاء CRM", "المبيعات", "الشراكات", "خدمة العملاء", "المتابعة", "العلاقات التجارية"];

// ─── Supporting content ─────────────────────────────────────────────────────────

const SYSTEM_ROLES = [
  { ar: "صاحب الشركة",       desc: "صلاحية كاملة على المنشأة",      accent: "amber"   },
  { ar: "المدير العام",       desc: "إدارة كل الوكالات والإدارات",   accent: "violet"  },
  { ar: "مدير وكالة",          desc: "قيادة وكالة وفِرقها",            accent: "cyan"    },
  { ar: "مدير إدارة",          desc: "إدارة قسم تشغيلي محدد",          accent: "sky"     },
  { ar: "قائد فريق",           desc: "تنسيق مهام فريق صغير",           accent: "emerald" },
  { ar: "موظف",                desc: "تنفيذ المهام والمتابعة",        accent: "rose"    },
];

const FLEX_RULES = [
  { title: "تدرّج اختياري",   desc: "لست مُلزمًا باستخدام كل المستويات — ابدأ بإدارة وقسم وأضف الوكالات لاحقًا.", icon: Layers },
  { title: "حدود الباقة",     desc: "كل باقة تحدد سقف الوكالات والإدارات والأقسام، مع إمكانية الترقية في أي وقت.", icon: Gauge },
  { title: "عزل تام للبيانات", desc: "هيكل منشأتك معزول رقميًا تمامًا — لا يراه أحد خارج مؤسستك.", icon: ShieldCheck },
  { title: "نمو بلا إعادة بناء", desc: "أضف فِرقًا وموظفين دون إعادة تصميم الهيكل من الصفر.", icon: Workflow },
];

const HIRE_STEPS = [
  { n: 1, title: "حدّد الموقع", desc: "اختر الإدارة أو الفريق الذي سينضم إليه الموظف." },
  { n: 2, title: "أضف الموظف", desc: "سجّل بياناته من صفحة الموظفين ليظهر تلقائيًا في الهيكل." },
  { n: 3, title: "اربط المهام", desc: "تُسند المهام والمتابعة فورًا حسب موقعه في الهيكل." },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

interface Person {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  active: boolean;
}

function boardToPerson(m: BoardMember): Person {
  return { id: m.id, name: m.name, role: m.role, email: m.email, phone: m.phone, active: m.status === "نشط" };
}

function employeeToPerson(e: Employee): Person {
  return {
    id: e.id,
    name: e.name,
    role: ROLE_AR[e.role] ?? e.role ?? "موظف",
    email: e.email ?? "",
    phone: e.phone ?? "",
    active: e.status === "نشط",
  };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] ?? "") + (parts[1][0] ?? "");
}

// ─── Board / Person modal ───────────────────────────────────────────────────────

const EMPTY_FORM = { name: "", role: "", email: "", phone: "", status: "نشط" as BoardMember["status"] };

function BoardMemberModal({
  member, onSave, onClose,
}: {
  member: BoardMember | null;
  onSave: (data: Omit<BoardMember, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(
    member
      ? { name: member.name, role: member.role, email: member.email, phone: member.phone, status: member.status }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.role.trim()) e.role = "المنصب مطلوب";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className={cn(WS_GLASS_MODAL, "max-w-md space-y-4")}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <UserCheck size={18} className="text-[#22d3ee]" />
            {member ? "تعديل عضو مجلس الإدارة" : "إضافة عضو جديد"}
          </h3>
          <button onClick={onClose} className="text-[#8ba3c7] hover:text-white transition-colors" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="block text-xs text-[#8ba3c7] mb-1.5">الاسم الكامل *</label>
          <input className="input-dark text-sm" placeholder="مثال: عبدالله الشهري" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs text-[#8ba3c7] mb-1.5">المنصب *</label>
          <select className="input-dark text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="">-- اختر المنصب --</option>
            <option>رئيس مجلس الإدارة</option>
            <option>نائب الرئيس</option>
            <option>عضو مجلس الإدارة</option>
            <option>المدير العام / صاحب الشركة</option>
            <option>أمين السر</option>
            <option>مستشار</option>
          </select>
          {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
        </div>

        <div>
          <label className="block text-xs text-[#8ba3c7] mb-1.5 flex items-center gap-1"><Mail size={11} /> البريد الإلكتروني</label>
          <input type="email" className="input-dark text-sm" placeholder="example@blumark24.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs text-[#8ba3c7] mb-1.5 flex items-center gap-1"><Phone size={11} /> رقم الجوال</label>
          <input type="tel" className="input-dark text-sm" placeholder="05XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs text-[#8ba3c7] mb-1.5">الحالة</label>
          <div className="flex gap-3">
            {(["نشط", "غير نشط"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setForm({ ...form, status: s })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.status === s ? s === "نشط" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-red-500/50 bg-red-500/10 text-red-400" : "border-[#1e3a5f] text-[#8ba3c7] hover:text-white"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} disabled={saving} className="btn-secondary flex-1 py-2 text-sm">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className={cn(WS_GLASS_MODAL, "max-w-sm text-center space-y-4")}>
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
          <Trash2 size={24} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-white font-heading font-bold text-lg">تأكيد الحذف</h3>
          <p className="text-[#8ba3c7] text-sm mt-2">
            هل أنت متأكد من حذف <span className="text-white font-medium">{name}</span> من مجلس الإدارة؟
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 text-sm">إلغاء</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">حذف</button>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable premium primitives ────────────────────────────────────────────────

function SectionHeading({
  icon: Icon, title, subtitle, accent = "cyan", action,
}: {
  icon: React.ElementType; title: string; subtitle?: string; accent?: string; action?: React.ReactNode;
}) {
  const c = ACCENT[accent];
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="grid place-items-center w-10 h-10 rounded-2xl shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
          style={{ background: `${c}1f`, border: `1px solid ${c}45` }}>
          <Icon size={18} style={{ color: c }} />
        </span>
        <div className="min-w-0">
          <h2 className="text-white font-heading font-bold text-base sm:text-lg leading-tight">{title}</h2>
          {subtitle && <p className="text-[#8ba3c7] text-xs sm:text-[13px] mt-0.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function PersonCard({
  person, canManage, onEdit, onDelete,
}: {
  person: Person; canManage?: boolean; onEdit?: () => void; onDelete?: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(150deg,rgba(34,211,238,0.08),rgba(7,15,32,0.6))] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_85%_-20%,rgba(34,211,238,0.16),transparent_55%)]" />
      <div className="relative z-10 flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-[0_8px_22px_-10px_rgba(34,211,238,0.8)]"
          style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}>
          {initials(person.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-white text-sm font-bold leading-tight truncate">{person.name}</h3>
            <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full shrink-0",
              person.active ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", person.active ? "bg-emerald-400" : "bg-red-400")} />
              {person.active ? "نشط" : "غير نشط"}
            </span>
          </div>
          <p className="text-[#22d3ee] text-xs mt-1 truncate">{person.role}</p>
          <div className="mt-2 space-y-1">
            {person.email && (
              <div className="text-[#7e97bd] text-[11px] flex items-center gap-1.5 truncate"><Mail size={11} className="shrink-0" />{person.email}</div>
            )}
            {person.phone && (
              <div className="text-[#7e97bd] text-[11px] flex items-center gap-1.5 truncate" dir="ltr"><Phone size={11} className="shrink-0" />{person.phone}</div>
            )}
          </div>
        </div>
        {canManage && (onEdit || onDelete) && (
          <div className="flex gap-1 shrink-0 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-[#22d3ee]/15 hover:bg-[#22d3ee]/30 flex items-center justify-center transition-colors" aria-label="تعديل">
                <Pencil size={12} className="text-[#22d3ee]" />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-red-500/15 hover:bg-red-500/30 flex items-center justify-center transition-colors" aria-label="حذف">
                <Trash2 size={12} className="text-red-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Package cards ──────────────────────────────────────────────────────────────

function PackageCard({ tier, current }: { tier: PlanTier; current: boolean }) {
  const c = ACCENT[tier.accent];
  const CtaIcon = tier.ctaIcon;
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-4 sm:p-5 flex flex-col gap-4 border"
      style={{
        background: `linear-gradient(160deg, ${c}14, rgba(7,15,32,0.92))`,
        borderColor: current ? `${c}66` : "rgba(255,255,255,0.07)",
        boxShadow: current ? `0 0 0 1px ${c}55, 0 22px 60px -28px ${c}` : undefined,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_110%_at_85%_-18%,rgba(255,255,255,0.06),transparent_55%)]" />
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: `${c}1f`, color: c }}>
          <CtaIcon size={12} /> {tier.cta}
        </span>
        {current && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/15">
            <Check size={11} /> باقتك الحالية
          </span>
        )}
      </div>

      <div className="relative z-10">
        <div className="text-white font-heading font-extrabold text-2xl">{tier.label}</div>
        <p className="text-[#8ba3c7] text-xs mt-1 leading-snug">{tier.tagline}</p>
      </div>

      {/* visual hierarchy chain */}
      <div className="relative z-10 flex flex-wrap items-center gap-1.5">
        {tier.chain.map((lvl, i) => (
          <React.Fragment key={lvl}>
            <span className="text-[11px] font-medium px-2 py-1 rounded-lg text-white/90 border border-white/10 bg-white/[0.04]">{lvl}</span>
            {i < tier.chain.length - 1 && <ChevronDown size={12} className="text-white/30 -rotate-90" />}
          </React.Fragment>
        ))}
      </div>

      {/* usage caps */}
      <div className="relative z-10 mt-auto grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
        {([
          ["وكالة", tier.caps.agency],
          ["إدارة", tier.caps.mgmt],
          ["قسم", tier.caps.dept],
        ] as const).map(([label, cap]) => (
          <div key={label} className="text-center">
            <div className="text-white font-bold text-base tabular-nums">{cap > 0 ? cap : "—"}</div>
            <div className="text-[#7e97bd] text-[10px] mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Availability strip ─────────────────────────────────────────────────────────

function UsageCounter({ label, value, cap, accent }: { label: string; value: number; cap: number; accent: string }) {
  const c = ACCENT[accent];
  const pct = cap > 0 ? Math.min(100, Math.round((value / cap) * 100)) : 0;
  const enabled = cap > 0;
  return (
    <div className="flex-1 min-w-[120px] rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[#8ba3c7] text-xs">{label}</span>
        <span className="text-white text-sm font-bold tabular-nums">
          {enabled ? `${value}/${cap}` : "غير متاح"}
        </span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: enabled ? `linear-gradient(90deg, ${c}, ${c}aa)` : "transparent" }} />
      </div>
    </div>
  );
}

// ─── Org tree ───────────────────────────────────────────────────────────────────

function TreeConnector({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 my-1">
      <div className="w-px h-5 bg-gradient-to-b from-[#22d3ee]/70 to-[#1e6fd9]/40" />
      {label && (
        <span className="text-[10px] text-[#8ba3c7] bg-white/[0.04] border border-white/[0.07] px-2.5 py-0.5 rounded-full">{label}</span>
      )}
      {label && <div className="w-px h-4 bg-gradient-to-b from-[#1e6fd9]/40 to-transparent" />}
    </div>
  );
}

function TreeNode({
  title, levelLabel, accent, icon: Icon, count, countLabel, emphasis,
}: {
  title: string; levelLabel: string; accent: string; icon: React.ElementType;
  count?: number; countLabel?: string; emphasis?: boolean;
}) {
  const c = ACCENT[accent];
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl p-3.5 text-center backdrop-blur-md", emphasis ? "min-w-[180px]" : "min-w-[140px]")}
      style={{ background: `linear-gradient(155deg, ${c}1a, rgba(7,15,32,0.7))`, border: `1px solid ${c}40` }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(120% 120% at 50% -20%, ${c}22, transparent 60%)` }} />
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <span className="grid place-items-center rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
          style={{ width: emphasis ? 44 : 38, height: emphasis ? 44 : 38, background: `linear-gradient(135deg, ${c}, ${c}aa)` }}>
          <Icon size={emphasis ? 20 : 17} className="text-white" />
        </span>
        <div className={cn("text-white font-bold leading-tight", emphasis ? "text-base" : "text-sm")}>{title}</div>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${c}1f`, color: c }}>{levelLabel}</span>
        {typeof count === "number" && (
          <div className="text-[#8ba3c7] text-[11px] flex items-center gap-1 mt-0.5">
            <Users size={10} />{count} {countLabel ?? ""}
          </div>
        )}
      </div>
    </div>
  );
}

// section = department/division node with employees
interface TreeSection { id: string; title: string; accent: string; people: Person[] }
interface TreeAgency { id: string; title: string; subtitle: string; accent: string; icon: React.ElementType; sections: TreeSection[] }

function SectionBlock({ section, showPeople }: { section: TreeSection; showPeople: boolean }) {
  const c = ACCENT[section.accent];
  const [open, setOpen] = useState(false);
  const hasPeople = section.people.length > 0;
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: `${c}33`, background: `linear-gradient(155deg, ${c}0f, rgba(7,15,32,0.55))` }}>
      <button
        type="button"
        onClick={() => showPeople && hasPeople && setOpen((v) => !v)}
        className={cn("w-full flex items-center gap-2.5 text-right", showPeople && hasPeople && "cursor-pointer")}
      >
        <span className="grid place-items-center w-9 h-9 rounded-xl shrink-0" style={{ background: `${c}1f`, border: `1px solid ${c}3d` }}>
          <Layers size={15} style={{ color: c }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-white text-sm font-semibold truncate">{section.title}</div>
          <div className="text-[#8ba3c7] text-[11px] flex items-center gap-1"><Users size={10} /> {section.people.length} موظف</div>
        </div>
        {showPeople && hasPeople && <ChevronDown size={15} className={cn("text-[#8ba3c7] transition-transform shrink-0", open && "rotate-180")} />}
      </button>
      {showPeople && open && hasPeople && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {section.people.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/85">
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}>{initials(p.name)}</span>
              <span className="truncate max-w-[120px]">{p.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AgencyColumn({ agency, showPeople }: { agency: TreeAgency; showPeople: boolean }) {
  const c = ACCENT[agency.accent];
  const Icon = agency.icon;
  const total = agency.sections.reduce((s, sec) => s + sec.people.length, 0);
  return (
    <div className="flex-1 min-w-[260px] rounded-3xl border p-4 flex flex-col gap-3"
      style={{ borderColor: `${c}33`, background: `linear-gradient(160deg, ${c}10, rgba(7,15,32,0.85))` }}>
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-11 h-11 rounded-2xl shrink-0" style={{ background: `linear-gradient(135deg, ${c}, ${c}aa)` }}>
          <Icon size={19} className="text-white" />
        </span>
        <div className="min-w-0">
          <div className="text-white font-heading font-bold text-base truncate">{agency.title}</div>
          <div className="text-[11px] mt-0.5" style={{ color: c }}>{agency.subtitle}</div>
        </div>
        <span className="mr-auto text-[11px] text-[#8ba3c7] flex items-center gap-1 shrink-0"><Users size={11} />{total}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] font-medium self-start px-2.5 py-1 rounded-full" style={{ background: `${c}15`, color: c }}>
        <Boxes size={11} /> {agency.sections.length} إدارة
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {agency.sections.map((sec) => <SectionBlock key={sec.id} section={sec} showPeople={showPeople} />)}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

export default function OrgPage() {
  const router = useRouter();
  const { userRole } = usePermissions();
  const toast = useToast();
  const { isInternal, planSlug, organizationName, isPlatformAdmin, loading: wsLoading } = useTenantWorkspace();

  const boardEnabled = !wsLoading && isInternal;
  const canManageBoard = (userRole === "super_admin") && isInternal;

  const { data: boardMembers, insert, update, remove } = useBoardMembers(boardEnabled);
  const { data: employees, refetch: refetchEmployees } = useEmployees();

  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<BoardMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoardMember | null>(null);

  const tier = TIER_BY_SLUG[planSlug] ?? TIER_BY_SLUG.basic;
  const agencyAllowed = isInternal || tier.caps.agency > 0;
  // employees feature (individual names) — basic plan sees counts only
  const showPeople = isInternal || isPlatformAdmin || planSlug === "growth" || planSlug === "advanced";

  // ── derive real departments from employees ──
  const departments = useMemo(() => {
    const map = new Map<string, Person[]>();
    (employees ?? []).forEach((e) => {
      const d = (e.department || "").trim() || "غير محدد";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(employeeToPerson(e));
    });
    return Array.from(map.entries()).map(([title, people], i) => ({
      id: `dept-${i}`,
      title,
      accent: ["sky", "cyan", "violet", "amber", "emerald", "rose"][i % 6],
      people,
    }));
  }, [employees]);

  // ── tenant leadership (read-only, real, from own employees) ──
  const leadership = useMemo(
    () => (employees ?? []).filter((e) => LEADERSHIP_ROLES.has(e.role)).map(employeeToPerson),
    [employees],
  );

  // ── build agency model ──
  const agencies: TreeAgency[] = useMemo(() => {
    if (isInternal) {
      const attach = (names: string[], accent: string) =>
        names.map((name, i) => ({
          id: `${accent}-${i}`,
          title: name,
          accent,
          people: departments.find((d) => d.title === name)?.people ?? [],
        }));
      return [
        { id: "defense", title: "وكالة الدفاع", subtitle: "شؤون الشركة الداخلية", accent: "blue", icon: Shield, sections: attach(DEFENSE_DEPTS, "sky") },
        { id: "offense", title: "وكالة الهجوم", subtitle: "شؤون الشركة الخارجية", accent: "orange", icon: Swords, sections: attach(OFFENSE_DEPTS, "amber") },
      ];
    }
    if (agencyAllowed && departments.length > 0) {
      return [{
        id: "main",
        title: organizationName ? `وكالة ${organizationName}` : "الوكالة الرئيسية",
        subtitle: "الإدارة التشغيلية للمنشأة",
        accent: "violet",
        icon: Building2,
        sections: departments,
      }];
    }
    return [];
  }, [isInternal, agencyAllowed, departments, organizationName]);

  // ── counts ──
  const counts = useMemo(() => {
    const agencyCount = agencies.length;
    const mgmtCount = isInternal
      ? agencies.reduce((s, a) => s + a.sections.length, 0)
      : departments.length;
    const deptCount = isInternal
      ? agencies.reduce((s, a) => s + a.sections.filter((sec) => sec.people.length > 0).length, 0)
      : 0;
    const employeeCount = (employees ?? []).length;
    return { agencyCount, mgmtCount, deptCount, employeeCount };
  }, [agencies, departments, employees, isInternal]);

  const boardCount = isInternal ? boardMembers.length : leadership.length;

  const heroCounts: { label: string; value: number; icon: React.ElementType; accent: string }[] = [
    { label: "وكالة", value: counts.agencyCount, icon: Building2, accent: "violet" },
    { label: "إدارة", value: counts.mgmtCount, icon: Layers, accent: "sky" },
    isInternal
      ? { label: "قسم", value: counts.deptCount, icon: Boxes, accent: "amber" }
      : { label: "موظف", value: counts.employeeCount, icon: Boxes, accent: "amber" },
  ];

  // ── handlers ──
  const handleOpenAdd = () => {
    if (!canManageBoard) {
      router.push("/employees");
      toast.info("تُدار قيادة منشأتك من صفحة الموظفين");
      return;
    }
    if (boardMembers.length >= MAX_BOARD) {
      toast.error(`لا يمكن إضافة أكثر من ${MAX_BOARD} أعضاء في مجلس الإدارة`);
      return;
    }
    setEditMember(null);
    setShowModal(true);
  };

  const handleStructuralAdd = (level: string) => {
    if (level === "وكالة") {
      toast.info("الوكالة هي أعلى مستوى تنظيمي — تُفعّل وتُدار حسب باقتك");
      return;
    }
    toast.info(`لإضافة ${level}، عيّن موظفًا وحدّد ${level === "موظف" ? "بياناته" : level + " الخاص به"} من صفحة الموظفين`);
    router.push("/employees");
  };

  const handleRefresh = () => {
    void refetchEmployees();
    toast.success("تم تحديث الهيكل الإداري");
  };

  const handleSave = useCallback(async (data: Omit<BoardMember, "id">): Promise<void> => {
    try {
      if (editMember) {
        await update(editMember.id, data);
        toast.success(`تم تحديث بيانات ${data.name} بنجاح`);
      } else {
        await insert(data);
        toast.success(`تمت إضافة ${data.name} إلى مجلس الإدارة`);
      }
      setShowModal(false);
      setEditMember(null);
    } catch (err) {
      toast.error("حدث خطأ أثناء حفظ البيانات");
      console.error("[Board Member Save Error]", err);
      throw err;
    }
  }, [editMember, insert, update, toast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      toast.success(`تم حذف ${deleteTarget.name} من مجلس الإدارة`);
      setDeleteTarget(null);
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  }, [deleteTarget, remove, toast]);

  // ── toolbar actions ──
  const toolbarActions = [
    { label: "وكالة", icon: Building2, accent: "violet", onClick: () => handleStructuralAdd("وكالة"), add: true },
    { label: "إدارة", icon: Layers, accent: "sky", onClick: () => handleStructuralAdd("إدارة"), add: true },
    { label: "قسم", icon: Boxes, accent: "amber", onClick: () => handleStructuralAdd("قسم"), add: true },
    { label: "موظف", icon: UserPlus, accent: "rose", onClick: () => { router.push("/employees"); }, add: true },
    { label: "فريق", icon: Users, accent: "emerald", onClick: () => handleStructuralAdd("فريق"), add: true },
    { label: "تحديث", icon: RefreshCw, accent: "cyan", onClick: handleRefresh, add: false },
  ];

  const loading = wsLoading;
  const boardSectionPeople: Person[] = isInternal ? boardMembers.map(boardToPerson) : leadership;

  return (
    <DashboardLayout>
      <div className={cn(WS_PAGE, "max-w-6xl mx-auto")}>

        {/* ── 1. Hero ── */}
        <section className={cn(WS_SURFACE, "p-5 sm:p-6 lg:p-7")}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_130%_at_88%_-25%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(120%_130%_at_5%_125%,rgba(168,85,247,0.16),transparent_55%),radial-gradient(90%_120%_at_50%_140%,rgba(255,122,61,0.1),transparent_55%)]" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full bg-[#22d3ee]/12 text-[#22d3ee] border border-[#22d3ee]/30">
                <ShieldCheck size={12} /> هيكل رقمي معزول
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full bg-white/[0.05] text-white/85 border border-white/10">
                <Crown size={12} className="text-amber-300" /> باقة {PLAN_LABELS_AR[planSlug]}
              </span>
            </div>

            <h1 className="text-white font-heading font-extrabold text-2xl sm:text-3xl lg:text-[34px] leading-tight">
              الهيكل الإداري الذكي
            </h1>
            <p className="text-[#9db1cf] text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              صمّم مؤسستك رقميًا بمستويات قيادية واضحة — من مجلس الإدارة وحتى الموظف — بتجربة تنفيذية متكاملة ومعزولة بالكامل.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/90">
                <Building2 size={13} className="text-[#22d3ee]" />
                {organizationName ?? (isInternal ? "Blumark24" : "منشأتك")}
              </span>
            </div>

            {/* counts summary */}
            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:max-w-lg">
              {heroCounts.map((s) => {
                const Icon = s.icon;
                const c = ACCENT[s.accent];
                return (
                  <div key={s.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
                    <Icon size={16} className="mx-auto mb-1" style={{ color: c }} />
                    <div className="text-white font-bold text-xl tabular-nums">{s.value}</div>
                    <div className="text-[#8ba3c7] text-[11px] mt-0.5">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {loading ? (
          <div className={cn(WS_SURFACE, "p-10 text-center text-[#8ba3c7] text-sm")}>
            <div className="w-6 h-6 border-2 border-[#22d3ee]/30 border-t-[#22d3ee] rounded-full animate-spin mx-auto mb-3" />
            جارٍ تحميل الهيكل الإداري...
          </div>
        ) : (
          <>
            {/* ── 2. Package cards ── */}
            <section>
              <SectionHeading icon={Crown} title="باقات الهيكل التنظيمي" subtitle="اختر مستوى التدرّج الإداري المناسب لنمو مؤسستك" accent="amber" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {PLAN_TIERS.map((t) => <PackageCard key={t.slug} tier={t} current={t.slug === planSlug} />)}
              </div>
            </section>

            {/* ── 3. Availability strip ── */}
            <section className={cn(WS_CARD, "p-4 sm:p-5")}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-white text-sm font-semibold">المستويات المتاحة في باقتك:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {tier.chain.map((lvl, i) => (
                    <React.Fragment key={lvl}>
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#22d3ee]/12 text-[#22d3ee] border border-[#22d3ee]/25">{lvl}</span>
                      {i < tier.chain.length - 1 && <span className="text-white/30 text-xs">·</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <UsageCounter label="وكالة" value={counts.agencyCount} cap={tier.caps.agency} accent="violet" />
                <UsageCounter label="إدارة" value={counts.mgmtCount} cap={tier.caps.mgmt} accent="sky" />
                <UsageCounter label="قسم" value={isInternal ? counts.deptCount : 0} cap={tier.caps.dept} accent="amber" />
                <UsageCounter label="موظف" value={counts.employeeCount} cap={Math.max(tier.caps.dept * 4, 50)} accent="rose" />
              </div>
            </section>

            {/* ── 4. Action toolbar ── */}
            <section className={cn(WS_CARD, "p-4 sm:p-5")}>
              <SectionHeading icon={Sparkles} title="إجراءات سريعة" subtitle="أضف عناصر الهيكل أو حدّث البيانات" accent="cyan" />
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {toolbarActions.map((a) => {
                  const c = ACCENT[a.accent];
                  return (
                    <button
                      key={a.label}
                      type="button"
                      onClick={a.onClick}
                      className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 min-h-[78px] transition-colors hover:bg-white/[0.06] active:scale-[0.98] touch-manipulation"
                    >
                      <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: `${c}1f`, border: `1px solid ${c}3d` }}>
                        <a.icon size={18} style={{ color: c }} />
                      </span>
                      <span className="text-[11.5px] font-medium text-white/90 leading-none flex items-center gap-0.5">
                        {a.add && <Plus size={11} className="text-white/50" />}{a.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── 5. Board members ── */}
            <section className={cn(WS_CARD, "p-4 sm:p-5")}>
              <SectionHeading
                icon={Crown}
                title="مجلس الإدارة"
                subtitle="الطبقة العليا — قيادة المنشأة وصناعة القرار"
                accent="cyan"
                action={
                  <button onClick={handleOpenAdd}
                    className="btn-primary flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 min-h-10 touch-manipulation"
                    title={canManageBoard && boardMembers.length >= MAX_BOARD ? "الحد الأقصى 3 أعضاء" : "إضافة عضو"}>
                    <Plus size={15} /> {canManageBoard ? "إضافة عضو" : "إدارة القيادة"}
                  </button>
                }
              />

              {isInternal && canManageBoard && boardMembers.length >= MAX_BOARD && (
                <div className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <AlertCircle size={15} /> مجلس الإدارة مكتمل — الحد الأقصى {MAX_BOARD} أعضاء
                </div>
              )}

              {boardSectionPeople.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.02]">
                  <span className="grid place-items-center w-14 h-14 rounded-2xl bg-[#22d3ee]/10 mx-auto mb-3">
                    <Briefcase size={24} className="text-[#22d3ee]" />
                  </span>
                  <p className="text-white text-sm font-medium">
                    {isInternal ? "لا يوجد أعضاء في المجلس بعد" : "لم تُحدَّد قيادة المنشأة بعد"}
                  </p>
                  <p className="text-[#8ba3c7] text-xs mt-1 max-w-sm mx-auto">
                    {isInternal
                      ? "أضف أعضاء مجلس الإدارة لتظهر في أعلى الهيكل القيادي."
                      : "عيّن مدراء بأدوار قيادية (صاحب الشركة، المدير العام) من صفحة الموظفين لتظهر هنا."}
                  </p>
                  <button onClick={handleOpenAdd} className="btn-primary mt-4 text-sm px-4 py-2 inline-flex items-center gap-2 mx-auto">
                    <Plus size={14} /> {isInternal ? "إضافة أول عضو" : "إدارة الموظفين"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {boardSectionPeople.map((p) => {
                    const original = isInternal ? boardMembers.find((m) => m.id === p.id) ?? null : null;
                    return (
                      <PersonCard
                        key={p.id}
                        person={p}
                        canManage={canManageBoard && isInternal}
                        onEdit={original ? () => { setEditMember(original); setShowModal(true); } : undefined}
                        onDelete={original ? () => setDeleteTarget(original) : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── 6. Digital org tree ── */}
            <section className={cn(WS_SURFACE, "p-4 sm:p-6")}>
              <SectionHeading icon={Network} title="الشجرة التنظيمية الرقمية" subtitle="هرم القيادة الكامل لمؤسستك — قابل للتصفّح" accent="violet" />

              <div className="overflow-x-auto -mx-1 px-1 pb-1">
                <div className="min-w-[300px] flex flex-col items-center">
                  {/* board node */}
                  <TreeNode title="مجلس الإدارة" levelLabel="القيادة العليا" accent="cyan" icon={Crown} count={boardCount} countLabel="عضو" emphasis />

                  {agencies.length > 0 ? (
                    <>
                      <TreeConnector label={isInternal ? "الوكالات الرئيسية" : "الوكالة"} />
                      <div className="w-full flex flex-col lg:flex-row gap-4 justify-center">
                        {agencies.map((a) => <AgencyColumn key={a.id} agency={a} showPeople={showPeople} />)}
                      </div>
                    </>
                  ) : departments.length > 0 ? (
                    <>
                      <TreeConnector label="الإدارات" />
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {departments.map((sec) => <SectionBlock key={sec.id} section={sec} showPeople={showPeople} />)}
                      </div>
                    </>
                  ) : (
                    <>
                      <TreeConnector />
                      <div className="w-full text-center py-8 px-4 rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.02]">
                        <span className="grid place-items-center w-12 h-12 rounded-2xl bg-violet-500/10 mx-auto mb-3">
                          <Layers size={22} className="text-violet-300" />
                        </span>
                        <p className="text-white text-sm font-medium">لم تُضَف إدارات أو فِرق بعد</p>
                        <p className="text-[#8ba3c7] text-xs mt-1 max-w-sm mx-auto">
                          ابدأ بإضافة موظفين وتحديد إداراتهم من صفحة الموظفين لبناء شجرة منشأتك تلقائيًا.
                        </p>
                        <button onClick={() => router.push("/employees")} className="btn-primary mt-4 text-sm px-4 py-2 inline-flex items-center gap-2 mx-auto">
                          <UserPlus size={14} /> إضافة موظف
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* legend */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#8ba3c7]">
                {[
                  ["مجلس الإدارة", "cyan"],
                  ["وكالة", "violet"],
                  ["إدارة", "sky"],
                  ["قسم", "amber"],
                  ["فريق", "emerald"],
                  ["موظف", "rose"],
                ].map(([label, accent]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT[accent] }} />{label}
                  </span>
                ))}
              </div>
            </section>

            {/* ── 7. Supporting panels ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* roles */}
              <section className={cn(WS_CARD, "p-4 sm:p-5")}>
                <SectionHeading icon={UserCheck} title="الأدوار المتاحة" subtitle="مستويات الصلاحيات في النظام" accent="cyan" />
                <div className="space-y-2">
                  {SYSTEM_ROLES.map((r) => {
                    const c = ACCENT[r.accent];
                    return (
                      <div key={r.ar} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <span className="w-2 h-8 rounded-full shrink-0" style={{ background: `linear-gradient(${c}, ${c}55)` }} />
                        <div className="min-w-0">
                          <div className="text-white text-sm font-medium leading-tight">{r.ar}</div>
                          <div className="text-[#8ba3c7] text-[11px] mt-0.5">{r.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* flexibility */}
              <section className={cn(WS_CARD, "p-4 sm:p-5")}>
                <SectionHeading icon={Gauge} title="قواعد المرونة" subtitle="كيف يتكيّف الهيكل مع نموك" accent="violet" />
                <div className="space-y-2.5">
                  {FLEX_RULES.map((f) => (
                    <div key={f.title} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <span className="grid place-items-center w-9 h-9 rounded-xl bg-violet-500/12 border border-violet-400/25 shrink-0">
                        <f.icon size={15} className="text-violet-300" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium leading-tight">{f.title}</div>
                        <div className="text-[#8ba3c7] text-[11px] mt-0.5 leading-snug">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* hire experience */}
              <section className={cn(WS_CARD, "p-4 sm:p-5")}>
                <SectionHeading icon={UserPlus} title="تعيين موظف جديد" subtitle="ثلاث خطوات لإضافته للهيكل" accent="emerald" />
                <div className="space-y-3">
                  {HIRE_STEPS.map((s, i) => (
                    <div key={s.n} className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <span className="grid place-items-center w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-sm font-bold">{s.n}</span>
                        {i < HIRE_STEPS.length - 1 && <span className="w-px h-6 bg-emerald-400/20 mt-1" />}
                      </div>
                      <div className="min-w-0 pt-1">
                        <div className="text-white text-sm font-medium leading-tight">{s.title}</div>
                        <div className="text-[#8ba3c7] text-[11px] mt-0.5 leading-snug">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/employees")} className="btn-primary w-full mt-4 text-sm py-2 inline-flex items-center justify-center gap-2">
                  <UserPlus size={15} /> ابدأ تعيين موظف
                </button>
              </section>
            </div>
          </>
        )}
      </div>

      {isInternal && showModal && (
        <BoardMemberModal
          member={editMember}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditMember(null); }}
        />
      )}
      {isInternal && deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </DashboardLayout>
  );
}
