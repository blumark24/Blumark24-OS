"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, X } from "lucide-react";
import { CITIES, formatCurrency } from "@/lib/utils";
import type { Client, ClientStatus, PackageType } from "@/types";

const STATUS_CONFIG: Record<ClientStatus, { label: string; class: string }> = {
  محتمل: { label: "محتمل", class: "status-pending" },
  متعاقد: { label: "متعاقد", class: "status-active" },
  نشط: { label: "نشط", class: "status-active" },
  متوقف: { label: "متوقف", class: "status-inactive" },
};

const STATUSES: ClientStatus[] = ["محتمل", "متعاقد", "نشط", "متوقف"];

interface Props {
  clients: Client[];
  loading: boolean;
  canManage: boolean;
  onSelect: (client: Client) => void;
  onInsert: (item: Omit<Client, "id" | "createdAt">) => Promise<void>;
  onUpdate: (id: string, changes: Partial<Client>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function CrmClientsTab({
  clients,
  loading,
  canManage,
  onSelect,
  onInsert,
  onUpdate,
  onRemove,
}: Props) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    businessType: "",
    city: "جدة",
    packageType: "صغيرة" as PackageType,
    contractValue: "",
    status: "محتمل" as ClientStatus,
    accountManagerName: "",
    notes: "",
  });

  const filtered = clients.filter(
    (c) => c.name.includes(search) || c.phone.includes(search),
  );

  const openAdd = () => {
    setEditId(null);
    setForm({
      name: "",
      phone: "",
      businessType: "",
      city: "جدة",
      packageType: "صغيرة",
      contractValue: "",
      status: "محتمل",
      accountManagerName: "",
      notes: "",
    });
    setShowModal(true);
  };

  const openEdit = (c: Client) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      phone: c.phone,
      businessType: c.businessType,
      city: c.city,
      packageType: c.packageType,
      contractValue: String(c.contractValue),
      status: c.status,
      accountManagerName: c.accountManagerName,
      notes: c.notes ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      phone: form.phone,
      businessType: form.businessType,
      city: form.city,
      packageType: form.packageType,
      contractValue: Number(form.contractValue) || 0,
      status: form.status,
      accountManagerId: "",
      accountManagerName: form.accountManagerName,
      notes: form.notes || undefined,
    };
    if (editId) await onUpdate(editId, payload);
    else await onInsert(payload);
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ba3c7]" />
          <input
            className="input-dark w-full pr-10 text-sm"
            placeholder="بحث بالاسم أو الجوال..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canManage && (
          <button type="button" onClick={openAdd} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={14} />
            عميل جديد
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-[#8ba3c7] text-sm text-center py-8">جارٍ التحميل...</p>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e3a5f]">
                {["العميل", "الجوال", "المدينة", "الباقة", "القيمة", "الحالة", ""].map((h) => (
                  <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="table-row border-b border-[#1e3a5f]/40 cursor-pointer hover:bg-white/[0.02]"
                  onClick={() => onSelect(c)}
                >
                  <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-[#8ba3c7]">{c.phone}</td>
                  <td className="px-4 py-3 text-[#8ba3c7]">{c.city}</td>
                  <td className="px-4 py-3 text-[#8ba3c7]">{c.packageType}</td>
                  <td className="px-4 py-3 text-[#22d3ee]">{formatCurrency(c.contractValue)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_CONFIG[c.status].class}`}>
                      {STATUS_CONFIG[c.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEdit(c)} className="text-[#8ba3c7] hover:text-[#22d3ee]">
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`حذف ${c.name}؟`)) void onRemove(c.id);
                          }}
                          className="text-[#8ba3c7] hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-[#8ba3c7] text-sm py-8">لا يوجد عملاء</p>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="text-white font-bold">{editId ? "تعديل عميل" : "عميل جديد"}</h3>
              <button type="button" onClick={() => setShowModal(false)}><X size={18} className="text-[#8ba3c7]" /></button>
            </div>
            <div className="space-y-3">
              <input className="input-dark w-full text-sm" placeholder="الاسم *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input-dark w-full text-sm" placeholder="الجوال" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="input-dark w-full text-sm" placeholder="نوع النشاط" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
              <select className="input-dark w-full text-sm" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                {CITIES.map((city) => <option key={city}>{city}</option>)}
              </select>
              <select className="input-dark w-full text-sm" value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value as PackageType })}>
                <option value="صغيرة">صغيرة</option>
                <option value="متوسطة">متوسطة</option>
                <option value="كبيرة">كبيرة</option>
              </select>
              <input className="input-dark w-full text-sm" type="number" placeholder="قيمة العقد" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })} />
              <select className="input-dark w-full text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
              <textarea className="input-dark w-full text-sm resize-none" rows={2} placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button type="button" className="btn-primary w-full mt-4" onClick={() => void handleSave()}>
              حفظ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
