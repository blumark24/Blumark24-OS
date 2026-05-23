"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { ACTION_CATALOG, TRIGGER_CATALOG } from "@/lib/automation/catalog";
import type {
  AutomationAction,
  AutomationCondition,
  AutomationTriggerType,
  AutomationWorkflow,
} from "@/lib/automation/types";

function newAction(): AutomationAction {
  return {
    id: crypto.randomUUID(),
    type: "notification.send",
    config: { title: "إشعار", body: "{{title}}", href: "/" },
  };
}

interface Props {
  open: boolean;
  workflow: AutomationWorkflow | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: {
    name: string;
    description: string;
    trigger_type: AutomationTriggerType;
    conditions: AutomationCondition[];
    actions: AutomationAction[];
  }) => Promise<void>;
}

export default function WorkflowBuilder({
  open,
  workflow,
  saving,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>("task.created");
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([newAction()]);

  useEffect(() => {
    if (!open) return;
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description);
      setTriggerType(workflow.trigger_type);
      setConditions(workflow.conditions ?? []);
      setActions(workflow.actions?.length ? workflow.actions : [newAction()]);
    } else {
      setName("");
      setDescription("");
      setTriggerType("task.created");
      setConditions([]);
      setActions([newAction()]);
    }
  }, [open, workflow]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/65">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between mb-4">
          <h3 className="text-white font-bold text-lg">
            {workflow ? "تعديل سير العمل" : "سير عمل جديد"}
          </h3>
          <button type="button" onClick={onClose}>
            <X size={18} className="text-[#8ba3c7]" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            className="input-dark w-full text-sm"
            placeholder="اسم السير *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="input-dark w-full text-sm resize-none"
            rows={2}
            placeholder="الوصف"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <label className="text-xs text-[#8ba3c7] mb-1 block">المحفّز (Trigger)</label>
            <select
              className="input-dark w-full text-sm"
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)}
            >
              {TRIGGER_CATALOG.map((t) => (
                <option key={t.type} value={t.type}>
                  [{t.category}] {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#8ba3c7]">الشروط (Conditions)</span>
              <button
                type="button"
                className="text-xs text-[#22d3ee] flex items-center gap-1"
                onClick={() =>
                  setConditions([
                    ...conditions,
                    { field: "priority", operator: "eq", value: "عاجلة" },
                  ])
                }
              >
                <Plus size={12} /> شرط
              </button>
            </div>
            {conditions.map((c, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input
                  className="input-dark text-xs"
                  placeholder="حقل (مثال: priority)"
                  value={c.field}
                  onChange={(e) => {
                    const next = [...conditions];
                    next[i] = { ...c, field: e.target.value };
                    setConditions(next);
                  }}
                />
                <select
                  className="input-dark text-xs"
                  value={c.operator}
                  onChange={(e) => {
                    const next = [...conditions];
                    next[i] = { ...c, operator: e.target.value as AutomationCondition["operator"] };
                    setConditions(next);
                  }}
                >
                  <option value="eq">يساوي</option>
                  <option value="neq">لا يساوي</option>
                  <option value="gt">أكبر</option>
                  <option value="gte">أكبر أو يساوي</option>
                  <option value="contains">يحتوي</option>
                  <option value="exists">موجود</option>
                </select>
                <input
                  className="input-dark text-xs"
                  placeholder="قيمة"
                  value={String(c.value ?? "")}
                  onChange={(e) => {
                    const next = [...conditions];
                    next[i] = { ...c, value: e.target.value };
                    setConditions(next);
                  }}
                />
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#8ba3c7]">الإجراءات (Actions)</span>
              <button
                type="button"
                className="text-xs text-[#22d3ee] flex items-center gap-1"
                onClick={() => setActions([...actions, newAction()])}
              >
                <Plus size={12} /> إجراء
              </button>
            </div>
            {actions.map((a, i) => (
              <div key={a.id} className="glass-card p-3 mb-2 space-y-2">
                <div className="flex gap-2">
                  <select
                    className="input-dark flex-1 text-xs"
                    value={a.type}
                    onChange={(e) => {
                      const next = [...actions];
                      next[i] = { ...a, type: e.target.value as AutomationAction["type"] };
                      setActions(next);
                    }}
                  >
                    {ACTION_CATALOG.map((ac) => (
                      <option key={ac.type} value={ac.type}>
                        [{ac.category}] {ac.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setActions(actions.filter((_, j) => j !== i))}
                    className="text-[#8ba3c7] hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {ACTION_CATALOG.find((ac) => ac.type === a.type)?.configFields?.map((f) => (
                  <input
                    key={f.key}
                    className="input-dark w-full text-xs"
                    placeholder={f.label}
                    value={String(a.config[f.key] ?? "")}
                    onChange={(e) => {
                      const next = [...actions];
                      next[i] = {
                        ...a,
                        config: { ...a.config, [f.key]: e.target.value },
                      };
                      setActions(next);
                    }}
                  />
                ))}
                <p className="text-[10px] text-[#6b87ab]">
                  استخدم {"{{field}}"} لقيم الحدث — مثال: {"{{title}}"} أو {"{{client_id}}"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={saving || !name.trim()}
            onClick={() =>
              void onSave({
                name: name.trim(),
                description,
                trigger_type: triggerType,
                conditions,
                actions,
              })
            }
          >
            {saving ? "جارٍ الحفظ..." : "حفظ السير"}
          </button>
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
