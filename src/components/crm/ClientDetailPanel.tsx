"use client";

import { useState } from "react";
import { X, Clock, FileText, Bell, FileSignature, Package, ListTodo } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Client, Task } from "@/types";
import type { CrmSnapshot } from "@/lib/crm/types";

type Tab = "timeline" | "notes" | "tasks" | "reminders" | "contracts" | "package";

interface Props {
  client: Client;
  snapshot: CrmSnapshot;
  tasks: Task[];
  canManage: boolean;
  authorName: string;
  onClose: () => void;
  onAddNote: (body: string) => Promise<void>;
  onAddReminder: (title: string, dueAt: string) => Promise<void>;
  onToggleReminder: (id: string, done: boolean) => Promise<void>;
  onAddContract: (input: {
    title: string;
    package_type: string;
    contract_value: number;
  }) => Promise<void>;
}

export default function ClientDetailPanel({
  client,
  snapshot,
  tasks,
  canManage,
  authorName,
  onClose,
  onAddNote,
  onAddReminder,
  onToggleReminder,
  onAddContract,
}: Props) {
  const [tab, setTab] = useState<Tab>("timeline");
  const [noteBody, setNoteBody] = useState("");
  const [remTitle, setRemTitle] = useState("");
  const [remDue, setRemDue] = useState("");
  const [contractTitle, setContractTitle] = useState("");
  const [contractValue, setContractValue] = useState(String(client.contractValue || ""));

  const clientNotes = snapshot.notes.filter((n) => n.client_id === client.id);
  const clientReminders = snapshot.reminders.filter((r) => r.client_id === client.id);
  const clientContracts = snapshot.contracts.filter((c) => c.client_id === client.id);
  const clientActivities = snapshot.activities.filter((a) => a.client_id === client.id);
  const clientDeals = snapshot.deals.filter((d) => d.client_id === client.id);
  const clientTasks = tasks.filter((t) => t.clientId === client.id);
  const clientRevenue = snapshot.revenue.filter((r) => r.client_id === client.id);
  const totalRevenue = clientRevenue.reduce((s, r) => s + Number(r.amount), 0);

  const tabs: { id: Tab; label: string; icon: typeof Clock }[] = [
    { id: "timeline", label: "الجدول الزمني", icon: Clock },
    { id: "notes", label: "ملاحظات", icon: FileText },
    { id: "tasks", label: "مهام", icon: ListTodo },
    { id: "reminders", label: "تذكيرات", icon: Bell },
    { id: "contracts", label: "عقود", icon: FileSignature },
    { id: "package", label: "الباقة", icon: Package },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-[#0a1628] border-r border-[#1e3a5f] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-[#1e3a5f] flex items-start justify-between gap-3">
          <div>
            <h2 className="text-white font-heading font-bold text-lg">{client.name}</h2>
            <p className="text-[#8ba3c7] text-sm">{client.phone} · {client.city}</p>
            <p className="text-[#22d3ee] text-xs mt-1">
              إيراد مسجّل: {formatCurrency(totalRevenue)} SAR
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#8ba3c7] hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex overflow-x-auto gap-1 p-2 border-b border-[#1e3a5f]">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                tab === id ? "bg-[#22d3ee]/20 text-[#22d3ee]" : "text-[#8ba3c7]"
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === "timeline" && (
            clientActivities.length === 0 ? (
              <p className="text-[#8ba3c7] text-sm text-center py-8">لا يوجد نشاط بعد</p>
            ) : (
              clientActivities.map((a) => (
                <div key={a.id} className="glass-card p-3 border-l-2 border-[#22d3ee]/50">
                  <div className="text-white text-sm font-medium">{a.title}</div>
                  {a.body && <p className="text-[#8ba3c7] text-xs mt-1">{a.body}</p>}
                  <div className="text-[#6b87ab] text-[10px] mt-2">
                    {formatDate(a.created_at)} · {a.author_name}
                  </div>
                </div>
              ))
            )
          )}

          {tab === "notes" && (
            <>
              {clientNotes.map((n) => (
                <div key={n.id} className="glass-card p-3">
                  <p className="text-white text-sm">{n.body}</p>
                  <p className="text-[#6b87ab] text-[10px] mt-1">{formatDate(n.created_at)} · {n.author_name}</p>
                </div>
              ))}
              {canManage && (
                <div className="space-y-2">
                  <textarea
                    className="input-dark w-full text-sm resize-none"
                    rows={3}
                    placeholder="ملاحظة جديدة..."
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary w-full text-sm"
                    onClick={() => {
                      if (!noteBody.trim()) return;
                      void onAddNote(noteBody.trim()).then(() => setNoteBody(""));
                    }}
                  >
                    إضافة ملاحظة
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "tasks" && (
            clientTasks.length === 0 ? (
              <p className="text-[#8ba3c7] text-sm">لا مهام مرتبطة — أنشئها من صفحة المهام</p>
            ) : (
              clientTasks.map((t) => (
                <div key={t.id} className="glass-card p-3 flex justify-between gap-2">
                  <span className="text-white text-sm">{t.title}</span>
                  <span className="text-xs text-[#8ba3c7]">{t.status}</span>
                </div>
              ))
            )
          )}

          {tab === "reminders" && (
            <>
              {clientReminders.map((r) => (
                <label key={r.id} className="glass-card p-3 flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={r.is_done}
                    onChange={(e) => void onToggleReminder(r.id, e.target.checked)}
                    disabled={!canManage}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={r.is_done ? "text-[#8ba3c7] line-through text-sm" : "text-white text-sm"}>
                      {r.title}
                    </div>
                    <div className="text-[#6b87ab] text-xs">{formatDate(r.due_at)}</div>
                  </div>
                </label>
              ))}
              {canManage && (
                <div className="space-y-2">
                  <input className="input-dark w-full text-sm" placeholder="عنوان التذكير" value={remTitle} onChange={(e) => setRemTitle(e.target.value)} />
                  <input className="input-dark w-full text-sm" type="datetime-local" value={remDue} onChange={(e) => setRemDue(e.target.value)} />
                  <button
                    type="button"
                    className="btn-primary w-full text-sm"
                    onClick={() => {
                      if (!remTitle.trim() || !remDue) return;
                      void onAddReminder(remTitle.trim(), remDue).then(() => {
                        setRemTitle("");
                        setRemDue("");
                      });
                    }}
                  >
                    إضافة تذكير
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "contracts" && (
            <>
              {clientContracts.map((c) => (
                <div key={c.id} className="glass-card p-3">
                  <div className="text-white text-sm font-medium">{c.title}</div>
                  <div className="text-[#22d3ee] text-xs mt-1">{formatCurrency(c.contract_value)} SAR · {c.status}</div>
                  <div className="text-[#6b87ab] text-[10px] mt-1">باقة: {c.package_type}</div>
                </div>
              ))}
              {canManage && (
                <div className="space-y-2">
                  <input className="input-dark w-full text-sm" placeholder="عنوان العقد" value={contractTitle} onChange={(e) => setContractTitle(e.target.value)} />
                  <input className="input-dark w-full text-sm" type="number" placeholder="قيمة العقد" value={contractValue} onChange={(e) => setContractValue(e.target.value)} />
                  <button
                    type="button"
                    className="btn-primary w-full text-sm"
                    onClick={() => {
                      if (!contractTitle.trim()) return;
                      void onAddContract({
                        title: contractTitle.trim(),
                        package_type: client.packageType,
                        contract_value: Number(contractValue) || 0,
                      }).then(() => setContractTitle(""));
                    }}
                  >
                    إضافة عقد
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "package" && (
            <div className="space-y-3">
              <div className="glass-card p-4">
                <div className="text-[#8ba3c7] text-xs">الباقة الحالية</div>
                <div className="text-white text-lg font-bold mt-1">{client.packageType}</div>
                <div className="text-[#22d3ee] text-sm mt-2">
                  قيمة العقد في الملف: {formatCurrency(client.contractValue)} SAR
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="text-[#8ba3c7] text-xs mb-2">الصفقات ({clientDeals.length})</div>
                {clientDeals.map((d) => {
                  const stage = snapshot.stages.find((s) => s.id === d.stage_id);
                  return (
                    <div key={d.id} className="text-sm text-white/90 py-1 border-b border-[#1e3a5f]/50 last:border-0">
                      {d.title} — {stage?.name} — {formatCurrency(d.value)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
