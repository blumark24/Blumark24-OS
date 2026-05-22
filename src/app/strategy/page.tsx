"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import {
  Map, CheckCircle2, Clock, Target, Lightbulb, TrendingUp,
  Edit2, X, Save, Loader2,
} from "lucide-react";

const ROADMAP_PHASES = [
  {
    phase: 0, color: "#22d3ee", title: "التأسيس الذكي",
    desc: "بناء شركة منظمة قبل دخول السوق — أنظمة المهام والفريق وتجربة الخدمات.",
    tags: ["نظام المهام", "بناء الفريق", "Idea Lab"],
  },
  {
    phase: 1, color: "#10b981", title: "إثبات الكفاءة",
    desc: "استهداف أول 10 عملاء عبر Google Maps وواتساب — مواقع ذكية وبوت AI.",
    tags: ["10 عملاء", "Google Maps", "بوت واتساب"],
  },
  {
    phase: 2, color: "#f59e0b", title: "التوسع والنظام",
    desc: "الوصول لـ25 عميل وإطلاق Blumark OS كخدمة SaaS للشركات.",
    tags: ["25 عميل", "Blumark OS", "SaaS"],
  },
  {
    phase: 3, color: "#a855f7", title: "التوسع الذكي",
    desc: "فتح مقر رسمي وخدمة قطاع المطاعم والكافيهات بحلول رقمية هندسية.",
    tags: ["مقر رسمي", "مطاعم & كافيهات", "حلول رقمية"],
  },
  {
    phase: 4, color: "#ff7a3d", title: "الشركاء التنفيذيين",
    desc: "إشراف ذكي على شبكة مقاولين وأتمتة تقارير الجودة والتسليم.",
    tags: ["شبكة مقاولين", "تقارير الجودة", "إشراف AI"],
  },
  {
    phase: 5, color: "#1e6fd9", title: "المشاريع الحكومية",
    desc: "دخول قطاع B2G عبر منصة Furas وتطبيقات AI سيادية مع أتمتة شاملة.",
    tags: ["B2G", "منصة Furas", "AI سيادي"],
  },
];
import type { StrategyPhase } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useStrategyPhases } from "@/hooks/useData";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { TENANT_EMPTY_STATE_MSG } from "@/lib/features/packageFeatures";
import { useToast } from "@/contexts/ToastContext";

const STATUS_CONFIG = {
  "مكتملة": { class: "status-completed", color: "#10b981", icon: CheckCircle2 },
  "جارية":  { class: "status-pending",   color: "#f59e0b", icon: Clock },
  "قادمة":  { class: "status-inactive",  color: "#8ba3c7", icon: Target },
} as const;

// AI recommendations computed from phase data
function buildRecommendations(phases: StrategyPhase[]) {
  const active = phases.find((p) => p.status === "جارية");
  const totalBudget = phases.reduce((s, p) => s + p.budget, 0);
  const overall = phases.length > 0
    ? Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length)
    : 0;
  return [
    {
      icon: "🚀", title: "تسريع النمو",
      desc: active
        ? `المرحلة الجارية "${active.title}" بلغت ${active.progress}% — استهدف إتمامها قبل ${active.endDate}.`
        : "لا توجد مرحلة جارية حالياً. حدّد المرحلة التالية وابدأ تتبعها.",
    },
    {
      icon: "💡", title: "فرصة مقترحة",
      desc: active
        ? `الوصول لـ${active.targetClients} عميل في هذه المرحلة — لديك ${active.currentClients} حالياً.`
        : "راجع أهداف العملاء لكل مرحلة وحدّث البيانات الفعلية.",
    },
    {
      icon: "⚡", title: "الميزانية الإجمالية",
      desc: `إجمالي ميزانية الخطة الاستراتيجية: ${formatCurrency(totalBudget)} SAR عبر ${phases.length} مراحل.`,
    },
    {
      icon: "📈", title: "التقدم الإجمالي",
      desc: `نسبة الإنجاز الكلية: ${overall}%. ${overall >= 50 ? "الشركة على المسار الصحيح." : "تسريع التنفيذ مطلوب."}`,
    },
  ];
}

interface EditState {
  progress: number;
  currentClients: number;
  status: StrategyPhase["status"];
}

function EditModal({
  phase,
  onSave,
  onClose,
}: {
  phase: StrategyPhase;
  onSave: (changes: Partial<StrategyPhase>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EditState>({
    progress: phase.progress,
    currentClients: phase.currentClients,
    status: phase.status,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative glass-card p-6 w-full max-w-md z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-heading font-bold">تحديث المرحلة</h3>
          <button onClick={onClose} className="text-[#8ba3c7] hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-[#8ba3c7] text-sm mb-5">{phase.title}</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#8ba3c7] mb-1 block">التقدم ({form.progress}%)</label>
            <input
              type="range" min={0} max={100} value={form.progress}
              onChange={(e) => setForm((f) => ({ ...f, progress: +e.target.value }))}
              className="w-full accent-[#22d3ee]"
            />
          </div>
          <div>
            <label className="text-xs text-[#8ba3c7] mb-1 block">العملاء الحاليين</label>
            <input
              type="number" min={0} value={form.currentClients}
              onChange={(e) => setForm((f) => ({ ...f, currentClients: +e.target.value }))}
              className="input-dark w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-[#8ba3c7] mb-1 block">الحالة</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StrategyPhase["status"] }))}
              className="input-dark w-full text-sm"
            >
              <option value="قادمة">قادمة</option>
              <option value="جارية">جارية</option>
              <option value="مكتملة">مكتملة</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function StrategyContent() {
  const { data: phases, loading, error, update } = useStrategyPhases();
  const { userRole } = usePermissions();
  const { isInternal } = useTenantWorkspace();
  const toast = useToast();
  const [editingPhase, setEditingPhase] = useState<StrategyPhase | null>(null);

  const canEdit = userRole === "super_admin" || userRole === "board_member";

  const overallProgress = phases.length > 0
    ? Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length)
    : 0;

  const recommendations = buildRecommendations(phases);

  const handleSave = async (changes: Partial<StrategyPhase>) => {
    if (!editingPhase) return;
    try {
      await update(editingPhase.id, changes);
      toast.success("تم تحديث المرحلة بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تحديث المرحلة");
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
            <Map size={24} className="text-[#22d3ee]" />
            {isInternal ? "الخطة الاستراتيجية" : "استراتيجية المنشأة"}
          </h1>
          <p className="text-[#8ba3c7] text-sm mt-1">
            {isInternal
              ? "خارطة الطريق الاستراتيجية لـ Blumark24"
              : "تخطيط ومتابعة أهداف منشأتك"}
          </p>
        </div>
        <div className="glass-card px-4 py-2">
          <div className="text-xs text-[#8ba3c7] mb-1">التقدم الإجمالي</div>
          <div className="flex items-center gap-2">
            <div className="progress-bar w-32">
              <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
            </div>
            <span className="text-[#22d3ee] font-bold text-sm">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {isInternal && (
      <div className="glass-card p-5 border border-[#1e3a5f]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-[#22d3ee]" />
          <div>
            <h3 className="text-white font-medium">خارطة التحول الاستراتيجي</h3>
            <p className="text-xs text-[#8ba3c7]">من التأسيس إلى المشاريع الكبرى — Blumark24</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {ROADMAP_PHASES.map((rp) => (
            <div key={rp.phase} className="p-3 rounded-xl bg-[#0d1f3c]/60 border border-[#1e3a5f] hover:border-[#22d3ee]/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${rp.color}20`, color: rp.color }}>م{rp.phase}</span>
                <span className="text-xs font-medium text-white">{rp.title}</span>
              </div>
              <p className="text-xs text-[#8ba3c7] leading-relaxed mb-2">{rp.desc}</p>
              <div className="flex flex-wrap gap-1">
                {rp.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1a3356]/60 text-[#6b87ab]">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* AI Recommendations */}
      <div className="glass-card p-5 border border-[#22d3ee]/20">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={18} className="text-[#22d3ee]" />
          <h3 className="text-white font-medium">توصيات الذكاء الاصطناعي</h3>
          <span className="badge bg-[#22d3ee]/20 text-[#22d3ee] text-xs mr-auto">محدّث تلقائياً</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recommendations.map((rec) => (
            <div key={rec.title} className="p-3 rounded-xl bg-[#0d1f3c]/60 border border-[#1e3a5f] hover:border-[#22d3ee]/30 transition-all">
              <div className="text-2xl mb-2">{rec.icon}</div>
              <div className="text-sm font-medium text-white mb-1">{rec.title}</div>
              <div className="text-xs text-[#8ba3c7] leading-relaxed">{rec.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#22d3ee]" />
        </div>
      ) : !isInternal && phases.length === 0 ? (
        <div className="glass-card p-10 text-center border border-[#1e3a5f]">
          <p className="text-[#8ba3c7] text-sm">{TENANT_EMPTY_STATE_MSG}</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute right-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#22d3ee] via-[#1e6fd9] to-[#1e3a5f]" />
          <div className="space-y-6">
            {phases.map((phase, i) => {
              const statusConf = STATUS_CONFIG[phase.status];
              const Icon = statusConf.icon;
              return (
                <div key={phase.id} className="flex gap-6 relative">
                  <div className="flex-shrink-0 w-16 flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center z-10 border-2"
                      style={{
                        background: phase.status === "مكتملة" ? "#10b981" : phase.status === "جارية" ? "#f59e0b" : "#1e3a5f",
                        borderColor: statusConf.color,
                      }}
                    >
                      <Icon size={16} className="text-white" />
                    </div>
                    <div className="text-xs text-[#8ba3c7] mt-1">م{i + 1}</div>
                  </div>

                  <div className={cn("flex-1 glass-card glass-card-hover p-5", phase.status === "جارية" && "border-[#f59e0b]/30")}>
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="text-white font-heading font-bold text-lg">{phase.title}</h3>
                        <p className="text-[#8ba3c7] text-sm mt-0.5">{phase.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${statusConf.class}`}>{phase.status}</span>
                        <span className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-2 py-1 rounded-lg">
                          {phase.startDate} → {phase.endDate}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => setEditingPhase(phase)}
                            aria-label="تعديل المرحلة"
                            className="p-1.5 rounded-lg text-[#8ba3c7] hover:text-[#22d3ee] hover:bg-[#1a3356] transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-[#8ba3c7] mb-1">التقدم</div>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar flex-1">
                            <div className="progress-fill" style={{ width: `${phase.progress}%`, background: statusConf.color }} />
                          </div>
                          <span className="text-sm font-bold" style={{ color: statusConf.color }}>{phase.progress}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#8ba3c7] mb-1">العملاء</div>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={12} className="text-[#22d3ee]" />
                          <span className="text-white font-bold text-sm">{phase.currentClients}</span>
                          <span className="text-[#8ba3c7] text-xs">/ {phase.targetClients}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#8ba3c7] mb-1">الميزانية</div>
                        <div className="text-white font-bold text-sm">{formatCurrency(phase.budget)} SAR</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#8ba3c7] mb-1">المرحلة</div>
                        <div className="text-white font-bold text-sm">{i + 1} / {phases.length}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[#8ba3c7] mb-2">الأهداف الرئيسية:</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {phase.goals.map((goal) => (
                          <div key={goal} className="flex items-center gap-2 text-xs text-[#8ba3c7]">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusConf.color }} />
                            {goal}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingPhase && (
        <EditModal
          phase={editingPhase}
          onSave={handleSave}
          onClose={() => setEditingPhase(null)}
        />
      )}
    </div>
  );
}

export default function StrategyPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="manage_reports">
        <StrategyContent />
      </PageGuard>
    </DashboardLayout>
  );
}
