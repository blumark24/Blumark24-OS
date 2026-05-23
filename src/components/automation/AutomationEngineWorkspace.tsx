"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Zap,
  Plus,
  Play,
  Pause,
  AlertCircle,
  GitBranch,
  History,
  Layers,
} from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAutomationEngine } from "@/hooks/useAutomationEngine";
import { fireAutomationEvent } from "@/lib/automation/client";
import { getTriggerMeta } from "@/lib/automation/catalog";
import WorkflowBuilder from "@/components/automation/WorkflowBuilder";
import type { AutomationWorkflow } from "@/lib/automation/types";
import AutomationLegacyPanel from "@/components/automation/AutomationLegacyPanel";

type Tab = "workflows" | "runs" | "legacy";

export default function AutomationEngineWorkspace() {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const toast = useToast();
  const canManage = hasPermission("manage_automations");
  const engine = useAutomationEngine(canManage);
  const [tab, setTab] = useState<Tab>("workflows");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editWf, setEditWf] = useState<AutomationWorkflow | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const authorName = user?.name?.trim() || "مستخدم";

  const migrationHint =
    engine.error &&
    (engine.error.includes("does not exist") ||
      engine.error.includes("relation") ||
      engine.error.includes("automation_workflows"));

  const handleSave = async (draft: Parameters<typeof engine.create>[0]) => {
    setSaving(true);
    try {
      await engine.create(draft);
      toast.success("تم إنشاء سير العمل");
      setBuilderOpen(false);
      setEditWf(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const testWorkflow = async (wf: AutomationWorkflow) => {
    setTestingId(wf.id);
    try {
      await fireAutomationEvent(wf.trigger_type, {
        test: true,
        workflow_name: wf.name,
        author_name: authorName,
      });
      toast.success("تم إرسال حدث تجريبي");
      await engine.refresh();
    } catch {
      toast.error("فشل التشغيل التجريبي");
    } finally {
      setTestingId(null);
    }
  };

  const TABS: { id: Tab; label: string; icon: typeof GitBranch }[] = [
    { id: "workflows", label: "سير العمل", icon: GitBranch },
    { id: "runs", label: "سجل التنفيذ", icon: History },
    { id: "legacy", label: "قواعد النظام", icon: Layers },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Zap size={24} className="text-[#22d3ee]" />
              محرك الأتمتة
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">
              محفّزات · شروط · إجراءات — بريد، WhatsApp، CRM، مهام، ذكاء اصطناعي
            </p>
          </div>
          {canManage && tab === "workflows" && (
            <button
              type="button"
              className="btn-primary flex items-center gap-2"
              onClick={() => {
                setEditWf(null);
                setBuilderOpen(true);
              }}
            >
              <Plus size={16} />
              سير عمل جديد
            </button>
          )}
        </div>

        {engine.error && (
          <div className="glass-card p-4 flex gap-3 border border-amber-500/30">
            <AlertCircle className="text-amber-400 shrink-0" size={20} />
            <div>
              <p className="text-white text-sm">{engine.error}</p>
              {migrationHint && (
                <p className="text-[#22d3ee] text-xs mt-2">
                  طبّق migration 022_tenant_automation_engine.sql في Supabase.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap ${
                tab === id
                  ? "bg-[#22d3ee] text-[#0a1628]"
                  : "bg-[#1a3356]/50 text-[#8ba3c7]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === "workflows" && (
          <div className="grid gap-3">
            {engine.loading && (
              <p className="text-center text-[#8ba3c7] text-sm py-8">جارٍ التحميل...</p>
            )}
            {!engine.loading &&
              engine.workflows.map((wf) => {
                const meta = getTriggerMeta(wf.trigger_type);
                return (
                  <div key={wf.id} className="glass-card p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{wf.name}</h3>
                        <span
                          className={`badge text-xs ${wf.enabled ? "status-active" : "status-inactive"}`}
                        >
                          {wf.enabled ? "مفعّل" : "موقوف"}
                        </span>
                      </div>
                      {wf.description && (
                        <p className="text-[#8ba3c7] text-xs mt-1">{wf.description}</p>
                      )}
                      <p className="text-[#22d3ee] text-xs mt-2">
                        محفّز: {meta?.label ?? wf.trigger_type} · {wf.actions.length} إجراء ·{" "}
                        {wf.conditions.length} شرط
                      </p>
                      <p className="text-[#6b87ab] text-[10px] mt-1">
                        تنفيذات: {wf.run_count}
                        {wf.last_run_at ? ` · آخر تشغيل: ${wf.last_run_at.slice(0, 16)}` : ""}
                      </p>
                    </div>
                    {canManage && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          className="btn-secondary text-xs px-3"
                          disabled={testingId === wf.id}
                          onClick={() => void testWorkflow(wf)}
                        >
                          <Play size={12} className="inline ml-1" />
                          تجربة
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-xs px-3"
                          onClick={() => {
                            setEditWf(wf);
                            setBuilderOpen(true);
                          }}
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-xs px-3"
                          onClick={() => void engine.toggle(wf.id, !wf.enabled)}
                        >
                          {wf.enabled ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-400 px-2"
                          onClick={() => {
                            if (confirm(`حذف "${wf.name}"؟`)) void engine.remove(wf.id);
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            {!engine.loading && engine.workflows.length === 0 && (
              <p className="text-center text-[#8ba3c7] text-sm py-10">
                لم يتم إعداد سير عمل بعد — أنشئ أول أتمتة (مثل: عند فوز صفقة → بريد + WhatsApp).
              </p>
            )}
          </div>
        )}

        {tab === "runs" && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["الوقت", "السير", "الحدث", "الحالة", "المدة"].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {engine.runs.map((r) => {
                  const wf = engine.workflows.find((w) => w.id === r.workflow_id);
                  return (
                    <tr key={r.id} className="border-b border-[#1e3a5f]/40">
                      <td className="px-4 py-2 text-[#8ba3c7] text-xs">
                        {r.created_at.slice(0, 16)}
                      </td>
                      <td className="px-4 py-2 text-white">{wf?.name ?? r.workflow_id}</td>
                      <td className="px-4 py-2 text-[#8ba3c7] text-xs">{r.trigger_event}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`badge text-xs ${
                            r.status === "success"
                              ? "status-active"
                              : r.status === "failed"
                                ? "status-inactive"
                                : "status-pending"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#8ba3c7]">
                        {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {engine.runs.length === 0 && (
              <p className="text-center text-[#8ba3c7] text-sm py-8">لا يوجد سجل تنفيذ بعد</p>
            )}
          </div>
        )}

        {tab === "legacy" && <AutomationLegacyPanel />}
      </div>

      <WorkflowBuilder
        open={builderOpen}
        workflow={editWf}
        saving={saving}
        onClose={() => {
          setBuilderOpen(false);
          setEditWf(null);
        }}
        onSave={async (draft) => {
          setSaving(true);
          try {
            if (editWf) {
              await engine.save(editWf.id, draft);
              toast.success("تم تحديث سير العمل");
            } else {
              await engine.create({ ...draft, created_by_name: authorName });
              toast.success("تم إنشاء سير العمل");
            }
            setBuilderOpen(false);
            setEditWf(null);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "تعذر الحفظ");
          } finally {
            setSaving(false);
          }
        }}
      />
    </DashboardLayout>
  );
}
