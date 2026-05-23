"use client";

import { useMemo, useState } from "react";
import { Plus, GripVertical } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Client } from "@/types";
import type { CrmDeal, CrmSnapshot, CrmStage } from "@/lib/crm/types";

interface Props {
  snapshot: CrmSnapshot;
  clients: Client[];
  canManage: boolean;
  authorName: string;
  onMoveDeal: (deal: CrmDeal, stage: CrmStage) => Promise<void>;
  onCreateDeal: (input: {
    client_id: string;
    stage_id: string;
    title: string;
    value: number;
  }) => Promise<void>;
  onSelectClient: (clientId: string) => void;
}

export default function DealPipeline({
  snapshot,
  clients,
  canManage,
  authorName,
  onMoveDeal,
  onCreateDeal,
  onSelectClient,
}: Props) {
  const [dragDealId, setDragDealId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newClientId, setNewClientId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newStageId, setNewStageId] = useState(snapshot.stages[0]?.id ?? "");

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const dealsByStage = useMemo(() => {
    const map = new Map<string, CrmDeal[]>();
    snapshot.stages.forEach((s) => map.set(s.id, []));
    snapshot.deals.forEach((d) => {
      const list = map.get(d.stage_id) ?? [];
      list.push(d);
      map.set(d.stage_id, list);
    });
    return map;
  }, [snapshot]);

  const handleDrop = async (stage: CrmStage) => {
    if (!dragDealId || !canManage) return;
    const deal = snapshot.deals.find((d) => d.id === dragDealId);
    if (!deal || deal.stage_id === stage.id) {
      setDragDealId(null);
      return;
    }
    await onMoveDeal(deal, stage);
    setDragDealId(null);
  };

  const handleCreate = async () => {
    if (!newClientId || !newTitle.trim() || !newStageId) return;
    await onCreateDeal({
      client_id: newClientId,
      stage_id: newStageId,
      title: newTitle.trim(),
      value: Number(newValue) || 0,
    });
    setShowNew(false);
    setNewTitle("");
    setNewValue("");
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button type="button" onClick={() => setShowNew(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={14} />
            صفقة جديدة
          </button>
        </div>
      )}

      {showNew && (
        <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select className="input-dark text-sm" value={newClientId} onChange={(e) => setNewClientId(e.target.value)}>
            <option value="">اختر عميلاً</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input className="input-dark text-sm" placeholder="عنوان الصفقة" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <input className="input-dark text-sm" type="number" placeholder="القيمة" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
          <select className="input-dark text-sm" value={newStageId} onChange={(e) => setNewStageId(e.target.value)}>
            {snapshot.stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button type="button" className="btn-primary text-sm sm:col-span-2 lg:col-span-4" onClick={() => void handleCreate()}>
            إنشاء الصفقة
          </button>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {snapshot.stages.map((stage) => {
          const deals = dealsByStage.get(stage.id) ?? [];
          const total = deals.reduce((s, d) => s + Number(d.value), 0);
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-[min(85vw,280px)] snap-start"
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={() => void handleDrop(stage)}
            >
              <div
                className="rounded-t-xl px-3 py-2 border border-b-0 border-[#1e3a5f]"
                style={{ background: `${stage.color}18` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">{stage.name}</span>
                  <span className="text-[#8ba3c7] text-xs">{deals.length}</span>
                </div>
                <div className="text-[11px] mt-1" style={{ color: stage.color }}>
                  {formatCurrency(total)} SAR
                </div>
              </div>
              <div className="min-h-[320px] rounded-b-xl border border-[#1e3a5f] bg-[#0d1f3c]/50 p-2 space-y-2">
                {deals.map((deal) => {
                  const client = clientMap.get(deal.client_id);
                  return (
                    <div
                      key={deal.id}
                      draggable={canManage}
                      onDragStart={() => setDragDealId(deal.id)}
                      onDragEnd={() => setDragDealId(null)}
                      onClick={() => onSelectClient(deal.client_id)}
                      className="glass-card p-3 cursor-pointer hover:border-[#22d3ee]/40 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        {canManage && <GripVertical size={14} className="text-[#6b87ab] mt-0.5 flex-shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <div className="text-white text-sm font-medium truncate">{deal.title}</div>
                          <div className="text-[#8ba3c7] text-xs truncate">{client?.name ?? "عميل"}</div>
                          <div className="text-[#22d3ee] text-xs font-bold mt-1">
                            {formatCurrency(deal.value)} SAR
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
