"use client";

import React, { useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import {
  Network, Plus, Pencil, Trash2, X, Save, UserCheck, Mail,
  Phone, Briefcase, AlertCircle,
} from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import { useBoardMembers } from "@/hooks/useData";
import { useDepartments } from "@/hooks/useDepartments";
import { departmentColor } from "@/lib/services/departments";
import { TENANT_EMPTY_STATE_HINT } from "@/lib/features/packageFeatures";
import type { BoardMember } from "@/lib/db";
import { WS_PAGE, WS_CARD, WS_GLASS_MODAL, WS_SURFACE } from "@/components/ui/workspaceVisual";
import { PageHero, WorkspaceEmpty } from "@/components/ui/workspaceUi";
import { cn } from "@/lib/utils";
import Link from "next/link";

const MAX_BOARD = 3;

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
  const [form, setForm] = useState(
    member
      ? { name: member.name, role: member.role, email: member.email, phone: member.phone, status: member.status }
      : EMPTY_FORM,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className={cn(WS_GLASS_MODAL, "max-w-md space-y-4")}>
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
          <input className="input-dark text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
          <label className="block text-xs text-[#8ba3c7] mb-1.5">البريد الإلكتروني</label>
          <input type="email" className="input-dark text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-[#8ba3c7] mb-1.5">رقم الجوال</label>
          <input type="tel" className="input-dark text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={saving} className="btn-secondary flex-1 py-2 text-sm">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2 text-sm">حفظ</button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className={cn(WS_GLASS_MODAL, "max-w-sm text-center space-y-4")}>
        <h3 className="text-white font-heading font-bold text-lg">تأكيد الحذف</h3>
        <p className="text-[#8ba3c7] text-sm">حذف {name} من مجلس الإدارة؟</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 text-sm">إلغاء</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-sm bg-red-500 text-white">حذف</button>
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
          <button onClick={onEdit} className="w-6 h-6 rounded-lg bg-[#22d3ee]/20 flex items-center justify-center"><Pencil size={11} className="text-[#22d3ee]" /></button>
          <button onClick={onDelete} className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center"><Trash2 size={11} className="text-red-400" /></button>
        </div>
      )}
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}>
        {member.name.slice(0, 2)}
      </div>
      <div className="text-white text-sm font-medium">{member.name}</div>
      <div className="text-[#22d3ee] text-[11px]">{member.role}</div>
    </div>
  );
}

export default function OrgPage() {
  const { userRole, hasPermission } = usePermissions();
  const toast = useToast();
  const canManageBoard = hasPermission("manage_board") || userRole === "super_admin";
  const { data: boardMembers, insert, update, remove } = useBoardMembers(true);
  const { data: departments, loading: deptLoading } = useDepartments();

  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<BoardMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoardMember | null>(null);

  const handleOpenAdd = () => {
    if (boardMembers.length >= MAX_BOARD) {
      toast.error(`الحد الأقصى ${MAX_BOARD} أعضاء`);
      return;
    }
    setEditMember(null);
    setShowModal(true);
  };

  const handleSave = useCallback(async (data: Omit<BoardMember, "id">) => {
    try {
      if (editMember) {
        await update(editMember.id, data);
        toast.success("تم التحديث");
      } else {
        await insert(data);
        toast.success("تمت الإضافة");
      }
      setShowModal(false);
      setEditMember(null);
    } catch (err) {
      toast.error("تعذر الحفظ");
      throw err;
    }
  }, [editMember, insert, update, toast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      toast.success("تم الحذف");
      setDeleteTarget(null);
    } catch {
      toast.error("تعذر الحذف");
    }
  }, [deleteTarget, remove, toast]);

  const hasAnyStructure = departments.length > 0 || boardMembers.length > 0;

  return (
    <PageGuard permission="view_dashboard">
      <DashboardLayout>
        <div className={cn(WS_PAGE, "max-w-5xl mx-auto")}>
          <PageHero title="الهيكل الإداري" subtitle="أقسام المنشأة ومجلس الإدارة">
            {canManageBoard && (
              <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2 text-sm min-h-11 touch-manipulation">
                <Plus size={16} />
                إضافة عضو مجلس
              </button>
            )}
          </PageHero>

          {deptLoading && (
            <div className={cn(WS_SURFACE, "p-8 text-center text-[#8ba3c7] text-sm")}>جارٍ التحميل...</div>
          )}

          {!deptLoading && !hasAnyStructure && (
            <WorkspaceEmpty
              icon={Network}
              title="لا توجد أقسام بعد"
              subtitle={`${TENANT_EMPTY_STATE_HINT}. أضف الأقسام من الإعدادات.`}
              accent="cyan"
              action={
                <Link href="/settings" className="btn-primary mt-2 inline-flex text-sm min-h-11 items-center px-4">
                  إعدادات المنشأة
                </Link>
              }
            />
          )}

          {!deptLoading && hasAnyStructure && (
            <>
              {canManageBoard && boardMembers.length >= MAX_BOARD && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-4">
                  <AlertCircle size={15} />
                  مجلس الإدارة مكتمل — الحد الأقصى {MAX_BOARD} أعضاء
                </div>
              )}

              {boardMembers.length > 0 && (
                <div className={cn(WS_SURFACE, "w-full p-5 border border-cyan-300/30 mb-6")}>
                  <div className="text-center mb-4">
                    <div className="text-white font-heading font-bold text-lg">مجلس الإدارة</div>
                    <div className="text-[#22d3ee] text-xs">{boardMembers.length}/{MAX_BOARD} أعضاء</div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {boardMembers.map((m) => (
                      <BoardCard
                        key={m.id}
                        member={m}
                        canManage={canManageBoard}
                        onEdit={() => { setEditMember(m); setShowModal(true); }}
                        onDelete={() => setDeleteTarget(m)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className={cn(WS_CARD, "p-5")}>
                <h3 className="text-white font-heading font-bold mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-[#22d3ee]" />
                  أقسام المنشأة ({departments.length})
                </h3>
                {departments.length === 0 ? (
                  <p className="text-[#8ba3c7] text-sm">لا توجد أقسام — أضفها من الإعدادات.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {departments.map((d) => {
                      const accent = departmentColor(d.name);
                      return (
                        <div
                          key={d.id}
                          className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center"
                          style={{ background: `${accent}10`, borderColor: `${accent}30` }}
                        >
                          {d.icon ? <span className="text-xl">{d.icon}</span> : <Briefcase size={20} style={{ color: accent }} />}
                          <div className="text-white text-xs font-medium">{d.name}</div>
                          {d.description && (
                            <div className="text-[10px] text-[#8ba3c7] leading-tight">{d.description}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
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
    </PageGuard>
  );
}
