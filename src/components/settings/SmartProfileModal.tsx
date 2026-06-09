"use client";

import { useEffect, useState } from "react";
import {
  X, Pencil, User, Mail, Phone, ShieldCheck, Briefcase, Building2,
  Network, UserCog, CalendarDays, Hash, UserX, BadgeCheck, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useTenantCompanyName } from "@/hooks/useTenantCompanyName";
import { useProfileOrgDepartment } from "@/hooks/useProfileOrgDepartment";
import { getTenantRoleLabel, TENANT_JOB_TITLES } from "@/lib/tenant/tenantDisplay";
import type { UserRole } from "@/contexts/PermissionsContext";
import { supabase } from "@/lib/supabase";
import { updateMySelfProfile } from "@/lib/db";
import { withTimeout } from "@/lib/asyncHelpers";

const FALLBACK = "غير محدد";

// Read-only display label for the organizational level, derived from the
// existing job-title tier (employees.job_title → TENANT_JOB_TITLES.level).
// Assigned by the organization manager — never editable here.
const ORG_LEVEL_LABELS: Record<string, string> = {
  agency: "مستوى وكالة",
  management: "مستوى إدارة",
  department: "مستوى قسم",
};
function orgLevelLabel(jobTitle: string): string {
  const tier = TENANT_JOB_TITLES.find((t) => t.value === jobTitle);
  if (!tier) return FALLBACK;
  return tier.level ? ORG_LEVEL_LABELS[tier.level] : "مستوى تنفيذي";
}

/** Compact read-only info row inside the modal. */
function InfoRow({
  icon: Icon,
  label,
  value,
  ltr,
  muted,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  ltr?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] px-3 py-2">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-cyan-500/10">
        <Icon size={12} className="text-cyan-300" />
      </span>
      <span className="text-[11px] text-[#8ba3c7] shrink-0">{label}</span>
      <span
        className={cn("mr-auto text-[13px] font-medium truncate", muted ? "text-white/40 italic" : "text-white")}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Smart user profile modal (Customer Workspace). Centered premium glass modal
 * that surfaces the current org/workspace identity, the signed-in user's
 * identity/role, and read-only work context — plus a safe self-edit of name +
 * phone only (via the existing self-scoped /api/profile/update-self route).
 *
 * No role/permission/security logic lives here; read-only fields cannot be
 * edited and inactive accounts are blocked, mirroring the /profile guard.
 */
export function SmartProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, refreshCurrentUser } = useAuth();
  const { name: companyName, logoUrl } = useTenantCompanyName();
  const { display: departmentDisplay } = useProfileOrgDepartment();
  const toast = useToast();

  const [phone, setPhone] = useState("");
  const [publicCode, setPublicCode] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [logoBroken, setLogoBroken] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Load the caller's own employee row (RLS returns only the user's own record).
  useEffect(() => {
    let active = true;
    if (!open || !user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("phone, employee_code, job_title, join_date")
        .eq("id", user.id)
        .maybeSingle();
      if (!active || !data) return;
      setPhone(data.phone ? String(data.phone) : "");
      setPublicCode(data.employee_code ? String(data.employee_code) : "");
      setJobTitle(data.job_title ? String(data.job_title) : "");
      setJoinDate(data.join_date ? String(data.join_date) : "");
    })();
    return () => { active = false; };
  }, [open, user?.id]);

  useEffect(() => setLogoBroken(false), [logoUrl]);
  // Reset to read view whenever the modal is (re)opened.
  useEffect(() => { if (open) setEditing(false); }, [open]);

  if (!open) return null;

  const roleLabel = user?.role ? getTenantRoleLabel(user.role as UserRole) : FALLBACK;
  const department = departmentDisplay.isEmpty ? FALLBACK : departmentDisplay.text;
  const orgLevel = orgLevelLabel(jobTitle);
  const userInitials = user?.name?.slice(0, 2) ?? "م";
  const companyInitials = companyName?.slice(0, 2) ?? "";
  const isActive = user?.is_active !== false;
  const inactive = user?.is_active === false;

  const openEdit = () => {
    setEditName(user?.name ?? "");
    setEditPhone(phone);
    setEditing(true);
  };

  const handleSave = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) { toast.error("الاسم مطلوب"); return; }
    setSaving(true);
    try {
      await withTimeout(
        updateMySelfProfile({ name: trimmedName, phone: editPhone.trim() || null }),
        12_000,
        "انتهت مهلة حفظ الملف الشخصي — تحقق من اتصالك بالإنترنت",
      );
      setPhone(editPhone.trim());
      await refreshCurrentUser();
      toast.success("تم تحديث ملفك الشخصي بنجاح");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "تعذر حفظ الملف الشخصي");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
      dir="rtl"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex w-[min(380px,calc(100vw-32px))] max-h-[76vh] flex-col overflow-hidden",
          "rounded-[26px] border border-[rgba(34,211,238,0.18)]",
          "bg-[linear-gradient(155deg,rgba(13,25,48,0.97),rgba(7,15,32,0.98))]",
          "shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7),0_0_28px_rgba(34,211,238,0.05)] backdrop-blur-[20px]",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5 border-b border-white/[0.06]">
          <h3 className="text-white font-heading font-bold text-[15px]">
            {editing ? "تعديل بياناتي" : "الملف الشخصي"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="shrink-0 grid h-8 w-8 place-items-center rounded-lg text-[#8ba3c7] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-y-auto px-4 py-3.5 space-y-3">
          {inactive ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10">
                <UserX size={26} className="text-red-400" />
              </span>
              <h4 className="text-white font-heading font-bold text-base">الحساب معطّل</h4>
              <p className="text-[#8ba3c7] text-xs max-w-xs leading-relaxed">
                تم تعطيل حسابك داخل هذه المنشأة. يرجى التواصل مع مدير المنشأة.
              </p>
            </div>
          ) : editing ? (
            <>
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1">الاسم</label>
                <input
                  className="input-dark text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="الاسم الكامل"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1">رقم الهاتف</label>
                <input
                  className="input-dark text-sm"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  inputMode="tel"
                  dir="ltr"
                  style={{ textAlign: "right" }}
                />
              </div>
              <p className="text-[11px] text-[#8ba3c7] leading-relaxed">
                يمكنك تعديل اسمك ورقم هاتفك فقط. تُدار بقية البيانات (الدور، القسم، الحالة) من قِبل مدير المنشأة.
              </p>
            </>
          ) : (
            <>
              {/* Company / workspace identity */}
              <div className="relative overflow-hidden rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(8,18,38,0.55)] p-3.5">
                <div className="pointer-events-none absolute -top-10 -left-10 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-[rgba(34,211,238,0.22)] bg-[#0d1f3c]/60 flex items-center justify-center flex-shrink-0">
                    {logoUrl && !logoBroken ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="شعار المنشأة" className="w-full h-full object-contain" onError={() => setLogoBroken(true)} />
                    ) : companyInitials ? (
                      <span className="text-[#22d3ee] text-base font-bold">{companyInitials}</span>
                    ) : (
                      <Building2 size={22} className="text-[#22d3ee]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-cyan-300/80">مساحة عمل المنشأة</div>
                    <div className="text-white font-bold text-sm truncate">{companyName}</div>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                      <ShieldCheck size={10} />
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* User identity */}
              <div className="flex items-center gap-3 rounded-2xl border border-[rgba(148,163,184,0.10)] bg-[rgba(8,18,38,0.5)] p-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ring-1 ring-white/10"
                  style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}
                >
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-sm truncate">{user?.name ?? FALLBACK}</div>
                  <div className="text-[11px] text-[#8ba3c7] truncate" dir="ltr">{user?.email ?? FALLBACK}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={cn("badge text-[9px]", isActive ? "status-active" : "status-inactive")}>
                      {isActive ? "نشط" : "غير نشط"}
                    </span>
                    {publicCode && (
                      <span className="badge text-[9px] bg-white/[0.06] text-[#8ba3c7] flex items-center gap-0.5">
                        <Hash size={9} />
                        <span dir="ltr">{publicCode}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* بياناتي */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/80 px-1">
                  <BadgeCheck size={12} /> بياناتي
                </div>
                <InfoRow icon={User} label="الاسم" value={user?.name ?? FALLBACK} muted={!user?.name} />
                <InfoRow icon={Mail} label="البريد" value={user?.email ?? FALLBACK} ltr muted={!user?.email} />
                <InfoRow icon={Phone} label="الهاتف" value={phone || FALLBACK} ltr muted={!phone} />
              </div>

              {/* بيانات العمل — كلها للقراءة فقط، يحددها مدير المنشأة */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/80 px-1">
                  <Briefcase size={12} /> بيانات العمل
                </div>
                <InfoRow icon={ShieldCheck} label="الدور الإداري" value={roleLabel} />
                <InfoRow icon={Briefcase} label="المسمى الوظيفي" value={jobTitle || FALLBACK} muted={!jobTitle} />
                <InfoRow icon={Layers} label="المستوى التنظيمي" value={orgLevel} muted={orgLevel === FALLBACK} />
                <InfoRow icon={Network} label="الجهة المرتبط بها" value={department} muted={department === FALLBACK} />
                <InfoRow icon={UserCog} label="المدير المباشر" value={FALLBACK} muted />
                <InfoRow icon={CalendarDays} label="تاريخ الانضمام" value={joinDate || FALLBACK} ltr muted={!joinDate} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!inactive && (
          <div className="relative shrink-0 border-t border-white/[0.06] bg-[rgba(7,15,32,0.65)] px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2 min-h-11"
                >
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </button>
                <button onClick={() => setEditing(false)} disabled={saving} className="btn-secondary flex-1 min-h-11">إلغاء</button>
              </div>
            ) : (
              <button
                onClick={openEdit}
                className="btn-primary w-full flex items-center justify-center gap-2 min-h-11"
              >
                <Pencil size={15} />
                تعديل بياناتي
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
