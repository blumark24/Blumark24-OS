"use client";

import { useEffect, useState } from "react";
import {
  X, Pencil, User, Mail, Phone, ShieldCheck, Briefcase, Building2,
  CalendarDays, AlertCircle, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useTenantCompanyName } from "@/hooks/useTenantCompanyName";
import { useProfileOrgDepartment } from "@/hooks/useProfileOrgDepartment";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { supabase } from "@/lib/supabase";
import { updateMySelfProfile } from "@/lib/db";
import { withTimeout } from "@/lib/asyncHelpers";

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
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.025]">
      <Icon size={14} className="text-cyan-300/80 shrink-0" />
      <span className="text-[11px] text-[#8ba3c7] shrink-0 w-[88px]">{label}</span>
      <span
        className={cn(
          "text-[13px] font-medium flex-1 truncate text-right",
          muted ? "text-white/40 italic" : "text-white",
          ltr && "text-left",
        )}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function SmartProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, refreshCurrentUser } = useAuth();
  const { name: companyName, logoUrl } = useTenantCompanyName();
  const { display: departmentDisplay } = useProfileOrgDepartment();
  const toast = useToast();

  const [phone, setPhone] = useState<string | null>(null);
  const [publicCode, setPublicCode] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [joinDate, setJoinDate] = useState<string | null>(null);
  const [logoBroken, setLogoBroken] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Load caller's own employee row when modal opens
  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;
    supabase
      .from("employees")
      .select("phone, public_code, job_title, join_date")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setPhone(typeof data?.phone === "string" ? data.phone : null);
        setPublicCode(typeof data?.public_code === "string" ? data.public_code : null);
        setJobTitle(typeof data?.job_title === "string" ? data.job_title : null);
        setJoinDate(typeof data?.join_date === "string" ? data.join_date : null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  // Reset UI state when modal opens/closes
  useEffect(() => {
    if (open) {
      setEditing(false);
      setLogoBroken(false);
    }
  }, [open]);

  const startEdit = () => {
    setEditName(user?.name ?? "");
    setEditPhone(phone ?? "");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error("الاسم مطلوب");
      return;
    }
    setSaving(true);
    try {
      await withTimeout(
        updateMySelfProfile({ name: trimmedName, phone: editPhone.trim() || null }),
        12_000,
        "انتهت مهلة الحفظ",
      );
      await refreshCurrentUser();
      setPhone(editPhone.trim() || null);
      setEditing(false);
      toast.success("تم تحديث بياناتك بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = user?.role ? getTenantRoleLabel(user.role) : null;
  const department = !departmentDisplay.isEmpty ? departmentDisplay.text : null;

  const workDetails = (
    [
      jobTitle ? { icon: Briefcase, label: "المسمى الوظيفي", value: jobTitle } : null,
      department ? { icon: Building2, label: "الجهة المرتبط بها", value: department } : null,
      joinDate ? { icon: CalendarDays, label: "تاريخ الانضمام", value: joinDate, ltr: true } : null,
    ] as const
  ).filter(Boolean) as { icon: React.ElementType; label: string; value: string; ltr?: boolean }[];

  const hasWorkDetails = workDetails.length > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex w-[min(380px,calc(100vw-32px))] max-[380px]:w-[calc(100vw-24px)]",
          "max-h-[76vh] sm:max-w-[440px] sm:max-h-[82vh] flex-col overflow-hidden",
          "rounded-[26px] border border-[rgba(34,211,238,0.18)]",
          "bg-[linear-gradient(155deg,rgba(13,25,48,0.97),rgba(7,15,32,0.98))]",
          "shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7),0_0_28px_rgba(34,211,238,0.05)]",
          "backdrop-blur-[20px]",
        )}
      >
        {/* inner edge highlights */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
        <div className="pointer-events-none absolute inset-0 rounded-[26px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5 border-b border-white/[0.06] shrink-0">
          <h3 className="text-white font-heading font-bold text-[15px]">الملف الشخصي</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-8 w-8 place-items-center rounded-lg text-[#8ba3c7] hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="relative flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5">

          {/* Workspace identity */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 flex items-center gap-3">
            {logoUrl && !logoBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="شعار المنشأة"
                onError={() => setLogoBroken(true)}
                className="w-10 h-10 rounded-xl object-contain border border-white/[0.08] bg-white/[0.04] shrink-0"
              />
            ) : (
              <span className="grid w-10 h-10 place-items-center rounded-xl border border-white/[0.08] bg-cyan-500/10 shrink-0">
                <Building2 size={18} className="text-cyan-300" />
              </span>
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-[#8ba3c7]">المنشأة</div>
              <div className="text-[13px] font-semibold text-white truncate">{companyName}</div>
            </div>
          </div>

          {/* User identity */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 flex items-center gap-3">
            <span className="grid w-10 h-10 place-items-center rounded-xl border border-white/[0.08] bg-[#1a3356]/60 shrink-0 text-sm font-bold text-white select-none">
              {user?.name?.slice(0, 2) ?? "م"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[11px] text-[#8ba3c7] truncate">{user?.email}</div>
            </div>
            {publicCode && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                <Hash size={9} />
                {publicCode}
              </span>
            )}
          </div>

          {/* بياناتي */}
          <div>
            <div className="text-[10px] font-semibold text-[#8ba3c7] uppercase tracking-wider mb-2 px-0.5">بياناتي</div>
            {editing ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] text-[#8ba3c7] mb-1">الاسم</label>
                  <input
                    autoFocus
                    className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/40 transition-colors"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="الاسم الكامل"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8ba3c7] mb-1">رقم الهاتف</label>
                  <input
                    className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/40 transition-colors"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    type="tel"
                  />
                </div>
                <InfoRow icon={Mail} label="البريد الإلكتروني" value={user?.email ?? ""} ltr />
              </div>
            ) : (
              <div className="space-y-1.5">
                <InfoRow icon={User} label="الاسم" value={user?.name || "—"} />
                <InfoRow icon={Phone} label="رقم الهاتف" value={phone || "—"} ltr muted={!phone} />
                <InfoRow icon={Mail} label="البريد الإلكتروني" value={user?.email ?? ""} ltr />
              </div>
            )}
          </div>

          {/* بيانات العمل */}
          <div>
            <div className="text-[10px] font-semibold text-[#8ba3c7] uppercase tracking-wider mb-2 px-0.5">بيانات العمل</div>
            <div className="space-y-1.5">
              {roleLabel && (
                <InfoRow icon={ShieldCheck} label="الدور الإداري" value={roleLabel} />
              )}
              {hasWorkDetails ? (
                workDetails.map((row) => (
                  <InfoRow
                    key={row.label}
                    icon={row.icon}
                    label={row.label}
                    value={row.value}
                    ltr={row.ltr}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-center rounded-2xl border border-white/[0.06] bg-white/[0.015]">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-200">
                    <AlertCircle size={10} />
                    يتطلب استكمال
                  </span>
                  <p className="text-[12px] font-medium text-white/70">بيانات العمل لم تُستكمل بعد</p>
                  <p className="text-[10px] text-[#8ba3c7] max-w-[200px] leading-relaxed">
                    يمكن للمدير تحديث هذه البيانات من قسم الموظفين
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative shrink-0 border-t border-white/[0.06] bg-[rgba(7,15,32,0.65)] px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          {editing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 rounded-xl border border-white/[0.10] bg-white/[0.04] py-2 text-[13px] text-[#8ba3c7] hover:text-white transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl border border-cyan-400/30 bg-cyan-500/15 py-2 text-[13px] font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
              >
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] py-2 text-[13px] text-[#8ba3c7] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Pencil size={14} />
              تعديل بياناتي
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
