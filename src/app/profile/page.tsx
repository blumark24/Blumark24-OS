"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  User, Mail, ShieldCheck, Building2, Briefcase, Network,
  UserCog, Phone, CalendarDays, Pencil, X, UserX,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { useTenantCompanyName } from "@/hooks/useTenantCompanyName";
import { useProfileOrgDepartment } from "@/hooks/useProfileOrgDepartment";
import { supabase } from "@/lib/supabase";
import { updateMySelfProfile } from "@/lib/db";
import { withTimeout } from "@/lib/asyncHelpers";
import { useToast } from "@/contexts/ToastContext";

const FALLBACK = "غير محدد";

function Field({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#1e3a5f] bg-[#0d1f3c]/40 px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-cyan-500/10">
        <Icon size={15} className="text-cyan-300" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] text-[#8ba3c7]">{label}</div>
        <div className={`text-sm font-medium truncate ${muted ? "text-white/40 italic" : "text-white"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  // Scoped to the CURRENT authenticated user only — never another profile.
  const { user, refreshCurrentUser } = useAuth();
  const { name: companyName, isFallback: companyIsFallback } = useTenantCompanyName();
  const { display: departmentDisplay } = useProfileOrgDepartment();
  const toast = useToast();

  // Personal phone lives on the employees row (not profiles); load the current
  // user's own record (RLS returns only the caller's own row by id).
  const [phone, setPhone] = useState<string>("");
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle();
      if (active && data?.phone) setPhone(String(data.phone));
    })();
    return () => { active = false; };
  }, [user?.id]);

  const roleLabel = user?.role ? getTenantRoleLabel(user.role) : FALLBACK;
  const department = departmentDisplay.isEmpty ? FALLBACK : departmentDisplay.text;
  const initials = user?.name?.slice(0, 2) ?? "م";

  // Inactive accounts cannot view or edit their profile — mirrors the
  // WorkspaceRouteGuard block applied to the rest of the Customer Workspace.
  if (user && user.is_active === false) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <UserX size={28} className="text-red-400" />
          </div>
          <h2 className="text-white text-xl font-heading font-bold">الحساب معطّل</h2>
          <p className="text-[#8ba3c7] text-sm max-w-xs leading-relaxed">
            تم تعطيل حسابك داخل هذه المنشأة. يرجى التواصل مع مدير المنشأة.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const openEdit = () => {
    setEditName(user?.name ?? "");
    setEditPhone(phone);
    setShowEdit(true);
  };

  const handleSave = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) { toast.error("الاسم مطلوب"); return; }
    setSaving(true);
    try {
      // Only personal fields are sent; the server ignores everything else and
      // writes strictly to the caller's own id.
      await withTimeout(
        updateMySelfProfile({ name: trimmedName, phone: editPhone.trim() || null }),
        12_000,
        "انتهت مهلة حفظ الملف الشخصي — تحقق من اتصالك بالإنترنت",
      );
      setPhone(editPhone.trim());
      await refreshCurrentUser();
      toast.success("تم تحديث ملفك الشخصي بنجاح");
      setShowEdit(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message.split("\n")[0] : "تعذر حفظ الملف الشخصي");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Identity header */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 ring-1 ring-white/10"
              style={{ background: "linear-gradient(135deg,#ff7a3d,#ff5722)" }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-heading font-bold text-white truncate">{user?.name ?? FALLBACK}</h1>
              <p className="text-[#8ba3c7] text-sm truncate">{user?.email ?? FALLBACK}</p>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] text-cyan-200">
                <ShieldCheck size={11} />
                {roleLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={openEdit}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 shrink-0"
            >
              <Pencil size={12} />
              تعديل
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-white font-medium text-lg flex items-center gap-2">
            <User size={18} className="text-[#22d3ee]" />
            بيانات الملف الشخصي
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field icon={User} label="الاسم" value={user?.name ?? FALLBACK} muted={!user?.name} />
            <Field icon={Mail} label="البريد الإلكتروني" value={user?.email ?? FALLBACK} muted={!user?.email} />
            <Field icon={ShieldCheck} label="الدور" value={roleLabel} />
            <Field icon={Briefcase} label="المسمى الوظيفي" value={department !== FALLBACK ? department : FALLBACK} muted={department === FALLBACK} />
            <Field icon={Building2} label="المنشأة" value={companyName} muted={companyIsFallback} />
            <Field icon={Network} label="الإدارة / القسم" value={department} muted={department === FALLBACK} />
            <Field icon={UserCog} label="المدير المباشر" value={FALLBACK} muted />
            <Field icon={Phone} label="الهاتف" value={phone || FALLBACK} muted={!phone} />
            <Field icon={CalendarDays} label="تاريخ الانضمام" value={FALLBACK} muted />
          </div>
          <p className="text-[11px] text-[#8ba3c7]">
            يمكنك تعديل اسمك ورقم هاتفك فقط. تُدار بقية البيانات (الدور، القسم، الراتب، الحالة) من قِبل مدير المنشأة.
          </p>
        </div>
      </div>

      {/* Personal edit modal — name + phone only */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-heading font-bold text-lg">تعديل بياناتي</h3>
              <button onClick={() => setShowEdit(false)} className="text-[#8ba3c7] hover:text-white" aria-label="إغلاق">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">الاسم</label>
                <input
                  className="input-dark text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="الاسم الكامل"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">رقم الهاتف</label>
                <input
                  className="input-dark text-sm"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  inputMode="tel"
                />
              </div>
              <p className="text-[11px] text-[#8ba3c7] leading-relaxed">
                لا يمكنك تعديل الدور أو الراتب أو الحالة أو القسم من هنا.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <button onClick={() => setShowEdit(false)} disabled={saving} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
