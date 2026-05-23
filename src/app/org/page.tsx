"use client";

import React, { useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Network, Shield, Swords, Users, ChevronDown,
  Plus, Pencil, Trash2, X, Save, UserCheck, Mail,
  Phone, Briefcase, AlertCircle,
} from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { useBoardMembers } from "@/hooks/useData";
import { TENANT_EMPTY_STATE_MSG, TENANT_EMPTY_STATE_HINT } from "@/lib/features/packageFeatures";
import type { BoardMember } from "@/lib/db";
import {
  WS_PAGE, WS_CARD, WS_GLASS_MODAL, WS_HERO, WS_MUTED, WS_SECTION_TITLE, WS_SUBTEXT,
} from "@/components/ui/workspaceVisual";
import { PageHero, WorkspaceEmpty } from "@/components/ui/workspaceUi";
import { cn } from "@/lib/utils";

const MAX_BOARD = 3;

// ─── Static dept data ─────────────────────────────────────────────────────────

const DEFENSE_DEPTS = [
  { name: "الإدارة",  icon: "🏢", desc: "إدارة الشؤون الداخلية"     },
  { name: "العمليات", icon: "⚙️", desc: "تشغيل وإدارة الأنظمة"      },
  { name: "المالي",   icon: "💰", desc: "الحسابات والخزينة"           },
  { name: "الإبداع",  icon: "✨", desc: "الأفكار والمحتوى"           },
  { name: "التصميم",  icon: "🎨", desc: "الهوية البصرية"             },
  { name: "الحملات",  icon: "📣", desc: "التسويق الداخلي"            },
  { name: "AI Lab",   icon: "🤖", desc: "أبحاث الذكاء الاصطناعي"     },
];

const OFFENSE_DEPTS = [
  { name: "العملاء CRM",       icon: "👥", desc: "إدارة علاقات العملاء"  },
  { name: "المبيعات",           icon: "📈", desc: "تنمية الإيرادات"       },
  { name: "الشراكات",          icon: "🤝", desc: "التوسع والتحالفات"      },
  { name: "خدمة العملاء",      icon: "🎧", desc: "دعم ومتابعة العملاء"   },
  { name: "المتابعة",           icon: "📋", desc: "تتبع الطلبات والعقود"   },
  { name: "العلاقات التجارية", icon: "💼", desc: "بناء شبكة الأعمال"     },
];

// ─── Modals ───────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: "", role: "", email: "", phone: "", status: "نشط" as BoardMember["status"] };

function BoardMemberModal({
  member,
  onSave,
  onClose,
}: {
  member: BoardMember | null;
  onSave: (data: Omit<BoardMember, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [form,   setForm]   = useState(
    member
      ? { name: member.name, role: member.role, email: member.email, phone: member.phone, status: member.status }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.role.trim()) e.role = "المنصب مطلوب";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--ws-scrim)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
    >
      <div className={cn(WS_GLASS_MODAL, "max-w-md space-y-4")}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[color:var(--ws-text-primary)] font-heading font-bold text-lg flex items-center gap-2">
            <UserCheck size={18} className="text-cyan-300" />
            {member ? "تعديل عضو مجلس الإدارة" : "إضافة عضو جديد"}
          </h3>
          <button onClick={onClose} className="text-[color:var(--ws-text-secondary)] hover:text-[color:var(--ws-text-primary)] transition-colors touch-manipulation" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>الاسم الكامل *</label>
          <input className="input-dark text-sm" placeholder="مثال: عبدالله الشهري" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>المنصب *</label>
          <select className="input-dark text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="">-- اختر المنصب --</option>
            <option>رئيس مجلس الإدارة</option>
            <option>نائب الرئيس</option>
            <option>عضو مجلس الإدارة</option>
            <option>أمين السر</option>
            <option>مستشار</option>
          </select>
          {errors.role && <p className="text-rose-400 text-xs mt-1">{errors.role}</p>}
        </div>

        <div>
          <label className={cn(WS_MUTED, "block text-xs mb-1.5 flex items-center gap-1")}>
            <Mail size={11} />
            البريد الإلكتروني
          </label>
          <input type="email" className="input-dark text-sm" placeholder="example@blumark24.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <label className={cn(WS_MUTED, "block text-xs mb-1.5 flex items-center gap-1")}>
            <Phone size={11} />
            رقم الجوال
          </label>
          <input type="tel" className="input-dark text-sm" placeholder="05XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div>
          <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>الحالة</label>
          <div className="flex gap-3">
            {(["نشط", "غير نشط"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({ ...form, status: s })}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium border transition-all min-h-[44px] touch-manipulation",
                  form.status === s
                    ? s === "نشط"
                      ? "border-emerald-400/55 bg-[var(--ws-emerald-soft)] text-emerald-300"
                      : "border-rose-400/55 bg-[var(--ws-rose-soft)] text-rose-300"
                    : "border-[var(--ws-border-subtle)] text-[color:var(--ws-text-secondary)] hover:text-[color:var(--ws-text-primary)]",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={saving} className="btn-secondary flex-1 py-2 text-sm touch-manipulation">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation">
            {saving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save size={14} />
            }
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--ws-scrim)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
    >
      <div className={cn(WS_GLASS_MODAL, "max-w-sm text-center space-y-4")}>
        <div className="w-14 h-14 rounded-2xl bg-[var(--ws-rose-soft)] flex items-center justify-center mx-auto">
          <Trash2 size={24} className="text-rose-400" />
        </div>
        <div>
          <h3 className="text-[color:var(--ws-text-primary)] font-heading font-bold text-lg">تأكيد الحذف</h3>
          <p className={cn(WS_MUTED, "text-sm mt-2")}>
            هل أنت متأكد من حذف <span className="text-[color:var(--ws-text-primary)] font-medium">{name}</span> من مجلس الإدارة؟
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 text-sm touch-manipulation">إلغاء</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors touch-manipulation">حذف</button>
        </div>
      </div>
    </div>
  );
}

function BoardCard({
  member, canManage, onEdit, onDelete,
}: {
  member: BoardMember; canManage: boolean; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border border-[var(--ws-cyan-ring)] bg-[var(--ws-cyan-soft)] text-center min-w-[140px] relative group">
      {canManage && (
        <div className="absolute top-2 start-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-[var(--ws-cyan-soft)] hover:bg-[var(--ws-cyan-ring)] flex items-center justify-center transition-colors touch-manipulation" title="تعديل" aria-label={`تعديل ${member.name}`}>
            <Pencil size={11} className="text-cyan-300" />
          </button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-[var(--ws-rose-soft)] hover:bg-[var(--ws-rose-ring)] flex items-center justify-center transition-colors touch-manipulation" title="حذف" aria-label={`حذف ${member.name}`}>
            <Trash2 size={11} className="text-rose-400" />
          </button>
        </div>
      )}
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ws-brand-prism">
        {member.name.slice(0, 2)}
      </div>
      <div>
        <div className="text-[color:var(--ws-text-primary)] text-sm font-medium leading-tight">{member.name}</div>
        <div className="text-cyan-300 text-[11px] mt-0.5">{member.role}</div>
        {member.email && (
          <div className={cn(WS_SUBTEXT, "text-[10px] mt-0.5 flex items-center justify-center gap-1")}>
            <Mail size={9} />
            {member.email}
          </div>
        )}
        {member.phone && (
          <div className={cn(WS_SUBTEXT, "text-[10px] mt-0.5 flex items-center justify-center gap-1")}>
            <Phone size={9} />
            {member.phone}
          </div>
        )}
      </div>
      <span className={`badge text-[10px] ${member.status === "نشط" ? "status-active" : "status-inactive"}`}>
        {member.status}
      </span>
    </div>
  );
}

function DeptCard({ name, icon, desc, accentColor }: { name: string; icon: string; desc: string; accentColor: string }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-all hover:-translate-y-0.5"
      style={{
        background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
        borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
      }}
    >
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <div className="text-[color:var(--ws-text-primary)] text-xs font-medium">{name}</div>
      <div className="text-[10px] leading-tight" style={{ color: `color-mix(in srgb, ${accentColor} 80%, var(--ws-text-secondary))` }}>{desc}</div>
    </div>
  );
}

function AgencyBlock({ title, subtitle, icon: Icon, accentColor, depts, description }: {
  title: string; subtitle: string; icon: React.ElementType;
  accentColor: string; depts: typeof DEFENSE_DEPTS; description: string;
}) {
  return (
    <div
      className="flex-1 rounded-2xl border p-5 flex flex-col gap-4"
      style={{
        background: `color-mix(in srgb, ${accentColor} 8%, var(--ws-surface-1))`,
        borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)`,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${accentColor},color-mix(in srgb, ${accentColor} 60%, #0a1628))` }}
        >
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <div className="text-[color:var(--ws-text-primary)] font-heading font-bold text-base">{title}</div>
          <div className="text-[11px] mt-0.5" style={{ color: accentColor }}>{subtitle}</div>
        </div>
      </div>
      <p className={cn(WS_MUTED, "text-xs leading-relaxed border-t border-[var(--ws-border-subtle)] pt-3")}>{description}</p>
      <div className="flex justify-center">
        <div
          className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full"
          style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)`, color: accentColor }}
        >
          <Users size={11} />
          <span>الأقسام التابعة ({depts.length})</span>
        </div>
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
        {depts.map((dept) => <DeptCard key={dept.name} {...dept} accentColor={accentColor} />)}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrgPage() {
  const { userRole } = usePermissions();
  const toast = useToast();
  const { isInternal, loading: wsLoading } = useTenantWorkspace();
  const boardEnabled = !wsLoading && isInternal;
  const canManage = userRole === "super_admin" && isInternal;

  const { data: boardMembers, insert, update, remove } = useBoardMembers(boardEnabled);
  const [showModal,    setShowModal]    = useState(false);
  const [editMember,   setEditMember]   = useState<BoardMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoardMember | null>(null);

  const handleOpenAdd = () => {
    if (boardMembers.length >= MAX_BOARD) {
      toast.error(`لا يمكن إضافة أكثر من ${MAX_BOARD} أعضاء في مجلس الإدارة`);
      return;
    }
    setEditMember(null);
    setShowModal(true);
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

  return (
    <DashboardLayout>
      <div className={cn(WS_PAGE, "max-w-5xl mx-auto")}>
        <PageHero
          title="الهيكل الإداري"
          subtitle={isInternal ? "المخطط التنظيمي لشركة Blumark24" : "المخطط التنظيمي للمنشأة"}
        >
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="btn-primary flex items-center gap-2 text-sm min-h-11 touch-manipulation"
              title={boardMembers.length >= MAX_BOARD ? "الحد الأقصى 3 أعضاء" : "إضافة عضو"}
            >
              <Plus size={16} />
              إضافة عضو مجلس
            </button>
          )}
        </PageHero>

        {wsLoading && (
          <div className={cn(WS_HERO, "p-8 text-center")}>
            <span className={cn(WS_MUTED, "text-sm")}>جارٍ تحميل الهيكل الإداري...</span>
          </div>
        )}

        {!wsLoading && !isInternal && (
          <WorkspaceEmpty
            icon={Network}
            title={TENANT_EMPTY_STATE_MSG}
            subtitle={`${TENANT_EMPTY_STATE_HINT}. سيظهر هنا الهيكل الإداري الخاص بمنشأتك عند إضافته.`}
            accent="cyan"
          />
        )}

        {!wsLoading && isInternal && (
          <>
            {canManage && boardMembers.length >= MAX_BOARD && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{ background: "var(--ws-amber-soft)", border: "1px solid var(--ws-amber-ring)", color: "var(--ws-amber)" }}
                role="status"
              >
                <AlertCircle size={15} />
                مجلس الإدارة مكتمل — الحد الأقصى {MAX_BOARD} أعضاء
              </div>
            )}

            {/* Level 1: Board */}
            <div className="flex flex-col items-center gap-3">
              <div className={cn(WS_HERO, "w-full p-5", "border-[var(--ws-cyan-ring)]")}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_88%_-25%,var(--ws-cyan-soft),transparent_55%)]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center ws-brand-prism">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.9" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className={cn(WS_SECTION_TITLE, "text-lg")}>مجلس الإدارة</div>
                      <div className="text-cyan-300 text-xs">Board of Directors · {boardMembers.length}/{MAX_BOARD} أعضاء</div>
                    </div>
                  </div>

                  {boardMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase size={32} className="text-[color:var(--ws-text-tertiary)] mx-auto mb-3" />
                      <p className={cn(WS_MUTED, "text-sm")}>لا يوجد أعضاء حتى الآن</p>
                      {canManage && (
                        <button onClick={handleOpenAdd} className="btn-primary mt-3 text-sm px-4 py-2 flex items-center gap-2 mx-auto touch-manipulation">
                          <Plus size={14} />
                          إضافة أول عضو
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-3">
                      {boardMembers.map((m) => (
                        <BoardCard
                          key={m.id}
                          member={m}
                          canManage={canManage}
                          onEdit={() => { setEditMember(m); setShowModal(true); }}
                          onDelete={() => setDeleteTarget(m)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Connectors */}
              <div className="flex flex-col items-center gap-0">
                <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-400 to-[#1e6fd9]" />
                <ChevronDown size={16} className="text-cyan-400" />
              </div>

              <div className={cn(WS_MUTED, "text-xs bg-[var(--ws-surface-2)] px-3 py-1 rounded-full border border-[var(--ws-border-subtle)]")}>
                وكالتان رئيسيتان
              </div>

              <div className="relative w-full flex justify-center">
                <div className="absolute top-0 inset-inline-x-1/4 h-0.5 bg-gradient-to-r from-[#1e6fd9] via-[var(--ws-cyan-ring)] to-[#ff7a3d]" />
                <div className="flex justify-between w-1/2 pt-0">
                  <ChevronDown size={16} className="text-[#1e6fd9]" />
                  <ChevronDown size={16} className="text-[#ff7a3d]" />
                </div>
              </div>
            </div>

            {/* Level 2 — internal Blumark24 agency/department scaffold */}
            <div className="flex flex-col lg:flex-row gap-5">
              <AgencyBlock
                title="وكالة الدفاع"
                subtitle="شؤون الشركة الداخلية"
                icon={Shield}
                accentColor="#1e6fd9"
                depts={DEFENSE_DEPTS}
                description="مسؤولة عن شؤون الشركة الداخلية، إدارة ماركتين الشركة، التسويق الداخلي وإدارة العلامة التجارية، وجميع الأقسام التشغيلية والإبداعية."
              />
              <AgencyBlock
                title="وكالة الهجوم"
                subtitle="شؤون الشركة الخارجية"
                icon={Swords}
                accentColor="#ff7a3d"
                depts={OFFENSE_DEPTS}
                description="مسؤولة عن شؤون الشركة الخارجية، اكتساب العملاء والمبيعات والتوسع، وإدارة جميع العلاقات التجارية والشراكات الاستراتيجية."
              />
            </div>

            {/* Legend */}
            <div className={cn(WS_CARD, "p-4")}>
              <div className={cn(WS_MUTED, "flex flex-wrap items-center gap-6 text-xs")}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span>مجلس الإدارة</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#1e6fd9]" />
                  <span>وكالة الدفاع (داخلي)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff7a3d]" />
                  <span>وكالة الهجوم (خارجي)</span>
                </div>
                <div className="ms-auto text-[11px]">
                  إجمالي الأقسام: {DEFENSE_DEPTS.length + OFFENSE_DEPTS.length} قسم
                </div>
              </div>
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
