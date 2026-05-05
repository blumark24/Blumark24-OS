"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { FUND_DISTRIBUTION, formatCurrency } from "@/lib/utils";
import { DollarSign, Plus, TrendingUp, TrendingDown, X, ArrowUpRight, Edit2, Trash2 } from "lucide-react";
import type { Transaction } from "@/types";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTransactions } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

type FormState = {
  type:        "دخل" | "مصروف";
  amount:      string;
  description: string;
  category:    string;
  date:        string;
};

function emptyForm(): FormState {
  return { type: "دخل", amount: "", description: "", category: "", date: new Date().toISOString().split("T")[0] };
}

function FinanceContent() {
  const { data: transactions, loading, insert, update, remove } = useTransactions();
  const { userRole } = usePermissions();
  const toast = useToast();
  const isAdmin = userRole === "super_admin";

  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const totalIncome  = transactions.filter((t) => t.type === "دخل").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "مصروف").reduce((s, t) => s + t.amount, 0);
  const netProfit    = totalIncome - totalExpense;

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.date || "");
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (tx.type === "دخل") map[key].income += tx.amount;
      else map[key].expense += tx.amount;
    });
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return { month: ARABIC_MONTHS[d.getMonth()], income: map[key]?.income ?? 0, expense: map[key]?.expense ?? 0 };
    });
  }, [transactions]);

  const fundBalances = Object.entries(FUND_DISTRIBUTION).map(([key, config]) => ({
    key, label: config.label, color: config.color, pct: config.pct, balance: totalIncome * config.pct,
  }));

  const donutData = fundBalances.map((f) => ({ name: f.label, value: Math.round(f.pct * 100) }));

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditId(tx.id);
    setForm({ type: tx.type, amount: String(tx.amount), description: tx.description, category: tx.category, date: tx.date });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditId(null); setSaving(false); };

  const handleSave = async () => {
    if (!form.amount || !form.description.trim()) {
      toast.error("المبلغ والوصف مطلوبان");
      return;
    }
    const amount = Number(form.amount);
    if (amount <= 0) { toast.error("يجب أن يكون المبلغ أكبر من صفر"); return; }

    const funds: Transaction["funds"] = form.type === "دخل"
      ? { operations: amount * 0.4, savings: amount * 0.1, taxes: amount * 0.1, salaries: amount * 0.2, marketing: amount * 0.2 }
      : undefined;

    setSaving(true);
    try {
      if (editId) {
        await update(editId, { type: form.type, amount, description: form.description, category: form.category, date: form.date, funds });
        toast.success("تم تحديث المعاملة بنجاح");
      } else {
        await insert({ type: form.type, amount, description: form.description, category: form.category, date: form.date, funds });
        toast.success("تمت إضافة المعاملة بنجاح");
      }
      closeModal();
    } catch (err) {
      toast.error("حدث خطأ أثناء حفظ المعاملة");
      console.error("[Finance Save Error]", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tx: Transaction) => {
    if (!confirm(`هل أنت متأكد من حذف المعاملة "${tx.description}"؟`)) return;
    try {
      await remove(tx.id);
      toast.success("تم حذف المعاملة بنجاح");
    } catch (err) {
      toast.error("حدث خطأ أثناء الحذف");
      console.error("[Finance Delete Error]", err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <DollarSign size={24} className="text-[#22d3ee]" />
              نظام الخزينة المالية
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">إدارة الإيرادات والمصروفات وتوزيع الصناديق</p>
          </div>
          {isAdmin && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              معاملة جديدة
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/20"><TrendingUp size={20} className="text-emerald-400" /></div>
              <span className="text-xs text-emerald-400 flex items-center gap-1"><ArrowUpRight size={12} />+18%</span>
            </div>
            <div className="text-2xl font-heading font-bold text-white">{formatCurrency(totalIncome)}</div>
            <div className="text-sm text-[#8ba3c7] mt-1">إجمالي الدخل</div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          </div>
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-red-500/20"><TrendingDown size={20} className="text-red-400" /></div>
              <span className="text-xs text-red-400 flex items-center gap-1"><ArrowUpRight size={12} />+5%</span>
            </div>
            <div className="text-2xl font-heading font-bold text-white">{formatCurrency(totalExpense)}</div>
            <div className="text-sm text-[#8ba3c7] mt-1">إجمالي المصروف</div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-red-600" />
          </div>
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-cyan-500/20"><DollarSign size={20} className="text-cyan-400" /></div>
              <span className="text-xs text-cyan-400 flex items-center gap-1"><ArrowUpRight size={12} />+24%</span>
            </div>
            <div className="text-2xl font-heading font-bold" style={{ color: netProfit >= 0 ? "#10b981" : "#ef4444" }}>
              {formatCurrency(netProfit)}
            </div>
            <div className="text-sm text-[#8ba3c7] mt-1">صافي الربح</div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500" />
          </div>
        </div>

        {/* Fund Cards */}
        <div>
          <h2 className="text-white font-medium mb-3">
            توزيع الصناديق <span className="text-xs text-[#8ba3c7]">(تلقائي عند إدخال دخل جديد)</span>
          </h2>
          <div className="grid grid-cols-5 gap-3">
            {fundBalances.map((fund) => (
              <div key={fund.key} className="glass-card p-4 relative overflow-hidden">
                <div className="text-lg font-heading font-bold text-white">{formatCurrency(fund.balance)}</div>
                <div className="text-xs text-[#8ba3c7] mt-1">{fund.label}</div>
                <div className="text-xs font-bold mt-2" style={{ color: fund.color }}>{fund.pct * 100}%</div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: fund.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card p-5">
            <h3 className="text-white font-medium mb-4">مقارنة الإيرادات والمصروفات</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                <XAxis dataKey="month" tick={{ fill: "#8ba3c7", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px", color: "#e2e8f0" }} formatter={(v: number) => `${formatCurrency(v)} SAR`} />
                <Legend />
                <Line type="monotone" dataKey="income"  stroke="#10b981" strokeWidth={2.5} dot={false} name="الإيرادات" />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2}   dot={false} name="المصروفات" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-white font-medium mb-4">توزيع الصناديق</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {donutData.map((_, i) => <Cell key={i} fill={fundBalances[i].color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px", color: "#e2e8f0" }} formatter={(v) => `${v}%`} />
                <Legend formatter={(v) => <span className="text-xs text-[#8ba3c7]">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8 text-[#8ba3c7] text-sm">جارٍ تحميل المعاملات...</div>
        )}

        {/* Transactions Table */}
        {!loading && (
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]">
              <h3 className="text-white font-medium">سجل المعاملات</h3>
              <span className="text-xs text-[#8ba3c7]">{transactions.length} معاملة</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["النوع", "الوصف", "الفئة", "التاريخ", "المبلغ", "العمليات", "الادخار", ""].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                    <td className="px-4 py-3">
                      <span className={`badge ${tx.type === "دخل" ? "status-active" : "status-inactive"}`}>
                        {tx.type === "دخل" ? "↑ دخل" : "↓ مصروف"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{tx.description}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{tx.category}</td>
                    <td className="px-4 py-3 text-[#8ba3c7] text-xs">{tx.date}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: tx.type === "دخل" ? "#10b981" : "#ef4444" }}>
                      {tx.type === "دخل" ? "+" : "-"}{formatCurrency(tx.amount)} SAR
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7] text-xs">
                      {tx.funds ? formatCurrency(tx.funds.operations) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7] text-xs">
                      {tx.funds ? formatCurrency(tx.funds.savings) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356] transition-all" title="تعديل">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(tx)} className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-red-400 hover:bg-red-500/10 transition-all" title="حذف">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-[#8ba3c7]">لا توجد معاملات بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-heading font-bold text-lg">
                {editId ? "تعديل المعاملة" : "معاملة مالية جديدة"}
              </h3>
              <button onClick={closeModal} className="text-[#8ba3c7] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">نوع المعاملة</label>
                <div className="flex gap-3">
                  {(["دخل", "مصروف"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${form.type === t ? (t === "دخل" ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "bg-[#1a3356]/50 text-[#8ba3c7]"}`}
                    >
                      {t === "دخل" ? "↑ دخل" : "↓ مصروف"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">المبلغ (SAR)</label>
                <input className="input-dark text-sm" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">الوصف</label>
                <input className="input-dark text-sm" placeholder="وصف المعاملة" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">الفئة</label>
                  <input className="input-dark text-sm" placeholder="رواتب، عقود، ..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-[#8ba3c7] mb-1.5">التاريخ</label>
                  <input className="input-dark text-sm" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              {form.type === "دخل" && form.amount && Number(form.amount) > 0 && (
                <div className="p-3 rounded-xl bg-[#1a3356]/50 border border-[#1e3a5f]">
                  <p className="text-xs text-[#8ba3c7] mb-2">التوزيع التلقائي للصناديق:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {fundBalances.map((f) => (
                      <div key={f.key} className="text-center">
                        <div className="text-xs font-bold" style={{ color: f.color }}>{formatCurrency(Number(form.amount) * f.pct)}</div>
                        <div className="text-[10px] text-[#6b87ab]">{f.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "جارٍ الحفظ..." : editId ? "حفظ التعديلات" : "إضافة"}
              </button>
              <button onClick={closeModal} disabled={saving} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function FinancePage() {
  return (
    <PageGuard permission="manage_finance">
      <FinanceContent />
    </PageGuard>
  );
}
