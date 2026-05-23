"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { FUND_DISTRIBUTION, formatCurrency } from "@/lib/utils";
import { DollarSign, Plus, TrendingUp, TrendingDown, X, ArrowUpRight, Edit2, Trash2, Wallet } from "lucide-react";
import type { Transaction } from "@/types";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { TENANT_EMPTY_STATE_MSG, TENANT_EMPTY_STATE_HINT } from "@/lib/features/packageFeatures";
import { useTransactions } from "@/hooks/useData";
import { useToast } from "@/contexts/ToastContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import {
  WS_PAGE, WS_CARD, WS_GLASS_MODAL, WS_SECTION_TITLE, WS_MUTED, WS_SUBTEXT,
  kpiTheme,
} from "@/components/ui/workspaceVisual";
import { PageHero, GlassPanel, KpiStatCard } from "@/components/ui/workspaceUi";
import { cn } from "@/lib/utils";

const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const TOOLTIP_STYLE = {
  background: "var(--ws-surface-modal)",
  border: "1px solid var(--ws-border-strong)",
  borderRadius: "12px",
  color: "var(--ws-text-primary)",
};

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
  const { isInternal } = useTenantWorkspace();
  const toast = useToast();
  const isAdmin = userRole === "super_admin";
  const showCompanyFund = isInternal;

  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const totalIncome  = transactions.filter((t) => t.type === "دخل").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "مصروف").reduce((s, t) => s + t.amount, 0);
  const netProfit    = totalIncome - totalExpense;

  // Real month-over-month change percentages
  const momChanges = useMemo(() => {
    const now  = new Date();
    const thisM = now.getMonth();
    const thisY = now.getFullYear();
    const lastM = thisM === 0 ? 11 : thisM - 1;
    const lastY = thisM === 0 ? thisY - 1 : thisY;

    let curInc = 0, prevInc = 0, curExp = 0, prevExp = 0;
    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth();
      const y = d.getFullYear();
      if (y === thisY && m === thisM) {
        if (t.type === "دخل") curInc += t.amount;
        else curExp += t.amount;
      } else if (y === lastY && m === lastM) {
        if (t.type === "دخل") prevInc += t.amount;
        else prevExp += t.amount;
      }
    });

    const pct = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? "+100%" : "—";
      const diff = ((cur - prev) / prev) * 100;
      return `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%`;
    };

    return {
      income:  pct(curInc, prevInc),
      expense: pct(curExp, prevExp),
      profit:  pct(curInc - curExp, prevInc - prevExp),
    };
  }, [transactions]);

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
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ المعاملة");
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
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء الحذف");
      console.error("[Finance Delete Error]", err);
    }
  };

  return (
    <DashboardLayout>
      <div className={WS_PAGE}>
        <PageHero
          title={showCompanyFund ? "نظام الخزينة المالية" : "مالية المنشأة"}
          subtitle={
            showCompanyFund
              ? "إدارة الإيرادات والمصروفات وتوزيع صناديق الشركة"
              : "إدارة إيرادات ومصروفات منشأتك"
          }
        >
          {isAdmin && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2 min-h-11 touch-manipulation">
              <Plus size={16} />
              معاملة جديدة
            </button>
          )}
        </PageHero>

        {/* Income / Expense / Net — Crystal accent KPIs.
            Semantic mapping: emerald=income, rose=expense, cyan=net. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0">
          <KpiStatCard
            label="إجمالي الدخل"
            value={`${formatCurrency(totalIncome)}`}
            subtitle="SAR"
            trend={momChanges.income}
            icon={TrendingUp}
            accent="emerald"
            showLive={false}
            showSparkline={false}
          />
          <KpiStatCard
            label="إجمالي المصروف"
            value={`${formatCurrency(totalExpense)}`}
            subtitle="SAR"
            trend={momChanges.expense}
            icon={TrendingDown}
            accent="rose"
            showLive={false}
            showSparkline={false}
          />
          <KpiStatCard
            label="صافي الربح"
            value={`${formatCurrency(netProfit)}`}
            subtitle="SAR"
            trend={momChanges.profit}
            icon={DollarSign}
            accent={netProfit >= 0 ? "cyan" : "rose"}
            showLive={false}
            showSparkline={false}
          />
        </div>

        {showCompanyFund && (
          <div>
            <h2 className={cn(WS_SECTION_TITLE, "text-base mb-3 flex items-center gap-2")}>
              <Wallet size={16} className="text-cyan-300" />
              توزيع الصناديق
              <span className={cn(WS_SUBTEXT, "text-xs font-normal")}>
                (تلقائي عند إدخال دخل جديد)
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 min-w-0">
              {fundBalances.map((fund) => (
                <div key={fund.key} className={cn(WS_CARD, "p-4 relative overflow-hidden")}>
                  <div className="text-lg font-heading font-bold text-[color:var(--ws-text-primary)]">
                    {formatCurrency(fund.balance)}
                  </div>
                  <div className={cn(WS_MUTED, "text-xs mt-1")}>{fund.label}</div>
                  <div className="text-xs font-bold mt-2" style={{ color: fund.color }}>{fund.pct * 100}%</div>
                  <ArrowUpRight
                    className="absolute end-3 top-3 opacity-50"
                    size={14}
                    style={{ color: fund.color }}
                    aria-hidden="true"
                  />
                  <div className="absolute bottom-0 inset-inline-x-0 h-0.5" style={{ background: fund.color }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassPanel title="مقارنة الإيرادات والمصروفات" className={showCompanyFund ? "lg:col-span-2" : "lg:col-span-3"}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ws-border-subtle)" />
                <XAxis dataKey="month" tick={{ fill: "var(--ws-text-secondary)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--ws-text-secondary)", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${formatCurrency(v)} SAR`} />
                <Legend />
                <Line type="monotone" dataKey="income"  stroke="var(--ws-emerald)" strokeWidth={2.5} dot={false} name="الإيرادات" />
                <Line type="monotone" dataKey="expense" stroke="var(--ws-rose)"    strokeWidth={2}   dot={false} name="المصروفات" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </GlassPanel>

          {showCompanyFund && (
            <GlassPanel title="توزيع الصناديق">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {donutData.map((_, i) => <Cell key={i} fill={fundBalances[i].color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
                  <Legend formatter={(v) => <span className={cn(WS_MUTED, "text-xs")}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </GlassPanel>
          )}
        </div>

        {loading && (
          <div className={cn("text-center py-8 text-sm", WS_MUTED)}>جارٍ تحميل المعاملات...</div>
        )}

        {/* Transactions Table */}
        {!loading && (
          <div className={cn(WS_CARD, "overflow-hidden p-0")}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ws-border-subtle)]">
              <h3 className={cn(WS_SECTION_TITLE, "text-base")}>سجل المعاملات</h3>
              <span className={cn(WS_MUTED, "text-xs")}>{transactions.length} معاملة</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)]">
                    {["النوع", "الوصف", "الفئة", "التاريخ", "المبلغ", "العمليات", "الادخار", ""].map((h) => (
                      <th key={h} className="text-start text-[color:var(--ws-text-secondary)] font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isIncome = tx.type === "دخل";
                    return (
                      <tr key={tx.id} className="table-row border-b border-[var(--ws-border-subtle)] last:border-0">
                        <td className="px-4 py-3">
                          <span className={`badge ${isIncome ? "status-active" : "status-inactive"}`}>
                            {isIncome ? "↑ دخل" : "↓ مصروف"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[color:var(--ws-text-primary)]">{tx.description}</td>
                        <td className={cn("px-4 py-3", WS_MUTED)}>{tx.category}</td>
                        <td className={cn("px-4 py-3 text-xs", WS_MUTED)}>{tx.date}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: isIncome ? "var(--ws-emerald)" : "var(--ws-rose)" }}>
                          {isIncome ? "+" : "-"}{formatCurrency(tx.amount)} SAR
                        </td>
                        <td className={cn("px-4 py-3 text-xs", WS_MUTED)}>{tx.funds ? formatCurrency(tx.funds.operations) : "—"}</td>
                        <td className={cn("px-4 py-3 text-xs", WS_MUTED)}>{tx.funds ? formatCurrency(tx.funds.savings) : "—"}</td>
                        <td className="px-4 py-3">
                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(tx)} aria-label="تعديل المعاملة" className="p-1.5 rounded-lg text-[color:var(--ws-text-secondary)] hover:text-cyan-300 hover:bg-[var(--ws-cyan-soft)] transition-all">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={() => handleDelete(tx)} aria-label="حذف المعاملة" className="p-1.5 rounded-lg text-[color:var(--ws-text-secondary)] hover:text-rose-400 hover:bg-[var(--ws-rose-soft)] transition-all">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <div className="flex flex-col items-center justify-center gap-2 text-center py-10 px-4">
                          <span
                            className="grid place-items-center rounded-2xl w-12 h-12 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                            style={kpiTheme("cyan").orb.startsWith("bg-") ? {} : {}}
                          >
                            <DollarSign size={20} className="text-cyan-300" />
                          </span>
                          <p className={cn(WS_SECTION_TITLE, "text-sm")}>
                            {!isInternal ? TENANT_EMPTY_STATE_MSG : "لا توجد معاملات بعد"}
                          </p>
                          {!isInternal && (
                            <p className={cn(WS_SUBTEXT, "text-xs")}>{TENANT_EMPTY_STATE_HINT}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "var(--ws-scrim)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        >
          <div className={cn(WS_GLASS_MODAL, "max-w-md mx-4")}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[color:var(--ws-text-primary)] font-heading font-bold text-lg">
                {editId ? "تعديل المعاملة" : "معاملة مالية جديدة"}
              </h3>
              <button onClick={closeModal} className="text-[color:var(--ws-text-secondary)] hover:text-[color:var(--ws-text-primary)] touch-manipulation" aria-label="إغلاق"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>نوع المعاملة</label>
                <div className="flex gap-3">
                  {(["دخل", "مصروف"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-medium transition-all min-h-[44px] touch-manipulation",
                        form.type === t
                          ? t === "دخل"
                            ? "bg-emerald-500 text-white shadow-[0_8px_22px_-10px_rgba(16,185,129,0.6)]"
                            : "bg-rose-500 text-white shadow-[0_8px_22px_-10px_rgba(244,63,94,0.6)]"
                          : "bg-[var(--ws-surface-2)] text-[color:var(--ws-text-secondary)]",
                      )}
                    >
                      {t === "دخل" ? "↑ دخل" : "↓ مصروف"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>المبلغ (SAR)</label>
                <input className="input-dark text-sm" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>الوصف</label>
                <input className="input-dark text-sm" placeholder="وصف المعاملة" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>الفئة</label>
                  <input className="input-dark text-sm" placeholder="رواتب، عقود، ..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <label className={cn(WS_MUTED, "block text-xs mb-1.5")}>التاريخ</label>
                  <input className="input-dark text-sm" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              {form.type === "دخل" && form.amount && Number(form.amount) > 0 && (
                <div className="p-3 rounded-xl bg-[var(--ws-surface-2)] border border-[var(--ws-border-subtle)]">
                  <p className={cn(WS_MUTED, "text-xs mb-2")}>التوزيع التلقائي للصناديق:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {fundBalances.map((f) => (
                      <div key={f.key} className="text-center">
                        <div className="text-xs font-bold" style={{ color: f.color }}>{formatCurrency(Number(form.amount) * f.pct)}</div>
                        <div className={cn(WS_SUBTEXT, "text-[10px]")}>{f.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? "جارٍ الحفظ..." : editId ? "حفظ التعديلات" : "إضافة"}
              </button>
              <button onClick={closeModal} disabled={saving} className="btn-secondary flex-1 touch-manipulation">إلغاء</button>
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
