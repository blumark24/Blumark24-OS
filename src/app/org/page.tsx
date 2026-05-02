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
import { useBoardMembers } from "@/hooks/useData";
import type { BoardMember } from "@/lib/db";

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

// ─── Board Member Modal ───────────────────────────────────────────────────────

const EMPTY_FORM = { name: "", role: "", email: "", phone: "", status: "نشط" as BoardMember["status"] };

function BoardMemberModal({
  member,
  onSave,
  onClose,
}: {
  member: BoardMember | null;
  onSave: (data: Omit<BoardMember, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(
    member
      ? { name: member.name, role: member.role, email: member.email, phone: member.phone, status: member.status }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.role.trim()) e.role = "المنصب مطلوب";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="relative w-full max-w-md glass-card p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <UserCheck size={18} className="text-[#22d3ee]" />
            {member ? "تعديل عضو مجلس الإدارة" : "إضافة عضو جديد"}
          </h3>
          <button onClick={onClose} className="text-[#8ba3c7] hover:text-white transition-colors">
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
            <option>أمين السر</option>
            <option>مستشار</option>
          </select>
          {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
        </div>

        <div>
          <label className="block text-xs text-[#8ba3c7] mb-1.5 flex items-center gap-1">
            <Mail size={11} />
            البريد الإلكتروني
          </label>
          <input type="email" className="input-dark text-sm" placeholder="example@blumark24.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs text-[#8ba3c7] mb-1.5 flex items-center gap-1">
            <Phone size={11} />
            رقم الجوال
          </label>
          <input type="tel" className="input-dark text-sm" placeholder="05XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs text-[#8ba3c7] mb-1.5">الحالة</label>
          <div className="flex gap-3">
            {(["نشط", "غير نشط"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({ ...form, status: s })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.status === s ? s === "نشط" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-red-500/50 bg-red-500/10 text-red-400" : "border-[#1e3a5f] text-[#8ba3c7] hover:text-white"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 text-sm">إلغاء</button>
          <button onClick={handleSave} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2">
            <Save size={14} />
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="glass-card p-6 max-w-sm w-full text-center space-y-4">
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

function BoardCard({
  member, canManage, onEdit, onDelete,
}: {
  member: BoardMember; canManage: boolean; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border border-[#22d3ee]/30 bg-[#22d3ee]/10 text-center min-w-[140px] relative group">
      {canManage && (
        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-6 h-6 rounded-lg bg-[#22d3ee]/20 hover:bg-[#22d3ee]/40 flex items-center justify-center transition-colors" title="تعديل">
            <Pencil size={11} className="text-[#22d3ee]" />
          </button>
          <button onClick={onDelete} className="w-6 h-6 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors" title="حذف">
            <Trash2 size={11} className="text-red-400" />
          </button>
        </div>
      )}
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}>
        {member.name.slice(0, 2)}
      </div>
      <div>
        <div className="text-white text-sm font-medium leading-tight">{member.name}</div>
        <div className="text-[#22d3ee] text-[11px] mt-0.5">{member.role}</div>
        {member.email && (
          <div className="text-[#4a6a99] text-[10px] mt-0.5 flex items-center justify-center gap-1">
            <Mail size={9} />
            {member.email}
          </div>
        )}
        {member.phone && (
          <div className="text-[#4a6a99] text-[10px] mt-0.5 flex items-center justify-center gap-1">
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
    <div className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-all hover:-translate-y-0.5"
      style={{ background: `${accentColor}10`, borderColor: `${accentColor}30` }}>
      <span className="text-xl">{icon}</span>
      <div className="text-white text-xs font-medium">{name}</div>
      <div className="text-[10px] leading-tight" style={{ color: `${accentColor}99` }}>{desc}</div>
    </div>
  );
}

function AgencyBlock({ title, subtitle, icon: Icon, accentColor, depts, description }: {
  title: string; subtitle: string; icon: React.ElementType;
  accentColor: string; depts: typeof DEFENSE_DEPTS; description: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border p-5 flex flex-col gap-4"
      style={{ background: `${accentColor}08`, borderColor: `${accentColor}25`, backdropFilter: "blur(12px)" }}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}99)` }}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <div className="text-white font-heading font-bold text-base">{title}</div>
          <div className="text-[11px] mt-0.5" style={{ color: accentColor }}>{subtitle}</div>
        </div>
      </div>
      <p className="text-xs text-[#8ba3c7] leading-relaxed border-t border-[#1e3a5f]/60 pt-3">{description}</p>
      <div className="flex justify-center">
        <div className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full"
          style={{ background: `${accentColor}15`, color: accentColor }}>
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
  const { hasPermission, userRole } = usePermissions();
  const toast = useToast();
  const canManage = userRole === "super_admin";

  const { data: boardMembers, insert, update, remove } = useBoardMembers();
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

  const handleSave = useCallback(async (data: Omit<BoardMember, "id">) => {
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
    } catch {
      toast.error("حدث خطأ أثناء حفظ البيانات");
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
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Network size={24} className="text-[#22d3ee]" />
              الهيكل الإداري
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">المخطط التنظيمي لشركة Blumark24</p>
          </div>
          {canManage && (
            <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2 text-sm" title={boardMembers.length >= MAX_BOARD ? "الحد الأقصى 3 أعضاء" : "إضافة عضو"}>
              <Plus size={16} />
              إضافة عضو مجلس
            </button>
          )}
        </div>

        {canManage && boardMembers.length >= MAX_BOARD && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <AlertCircle size={15} />
            مجلس الإدارة مكتمل — الحد الأقصى {MAX_BOARD} أعضاء
          </div>
        )}

        {/* Level 1: Board */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-full rounded-2xl border p-5"
            style={{ background: "rgba(34,211,238,0.07)", borderColor: "rgba(34,211,238,0.3)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.9" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-white font-heading font-bold text-lg">مجلس الإدارة</div>
                <div className="text-[#22d3ee] text-xs">Board of Directors · {boardMembers.length}/{MAX_BOARD} أعضاء</div>
              </div>
            </div>

            {boardMembers.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase size={32} className="text-[#4a6a99] mx-auto mb-3" />
                <p className="text-[#8ba3c7] text-sm">لا يوجد أعضاء حتى الآن</p>
                {canManage && (
                  <button onClick={handleOpenAdd} className="btn-primary mt-3 text-sm px-4 py-2 flex items-center gap-2 mx-auto">
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

          <div className="flex flex-col items-center gap-0">
            <div className="w-0.5 h-6 bg-gradient-to-b from-[#22d3ee] to-[#1e6fd9]" />
            <ChevronDown size={16} className="text-[#22d3ee]" />
          </div>

          <div className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-3 py-1 rounded-full border border-[#1e3a5f]">
            وكالتان رئيسيتان
          </div>

          <div className="relative w-full flex justify-center">
            <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[#1e6fd9] via-[#22d3ee]/40 to-[#ff7a3d]" />
            <div className="flex justify-between w-1/2 pt-0">
              <ChevronDown size={16} className="text-[#1e6fd9]" />
              <ChevronDown size={16} className="text-[#ff7a3d]" />
            </div>
          </div>
        </div>

        {/* Level 2: Two agencies */}
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
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-6 text-xs text-[#8ba3c7]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22d3ee]" />
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
            <div className="mr-auto text-[11px]">
              إجمالي الأقسام: {DEFENSE_DEPTS.length + OFFENSE_DEPTS.length} قسم
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <BoardMemberModal
          member={editMember}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditMember(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </DashboardLayout>
  );
}
