"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { mockStrategyPhases } from "@/lib/mockData";
import { Map, CheckCircle2, Clock, Target, Lightbulb, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  "مكتملة": { class: "status-completed", color: "#10b981", icon: CheckCircle2 },
  "جارية": { class: "status-pending", color: "#f59e0b", icon: Clock },
  "قادمة": { class: "status-inactive", color: "#8ba3c7", icon: Target },
};

const AI_RECOMMENDATIONS = [
  { icon: "🚀", title: "تسريع النمو", desc: "بناءً على البيانات الحالية، يمكن الوصول لـ25 عميل بتركيز 60% على قطاع المطاعم." },
  { icon: "💡", title: "فرصة مقترحة", desc: "قطاع المقاهي في جدة يشهد نمواً 40%، يُنصح بالدخول خلال الربع القادم." },
  { icon: "⚡", title: "تحسين الكفاءة", desc: "أتمتة متابعة العملاء المحتملين ستوفر 8 ساعات أسبوعياً للفريق." },
  { icon: "📈", title: "توقع الإيرادات", desc: "مع الاستمرار بالوتيرة الحالية، يُتوقع إيراد 3.2M SAR نهاية العام." },
];

export default function StrategyPage() {
  const overallProgress = Math.round(
    mockStrategyPhases.reduce((s, p) => s + p.progress, 0) / mockStrategyPhases.length
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Map size={24} className="text-[#22d3ee]" />
              الخطة الاستراتيجية
            </h1>
            <p className="text-[#8ba3c7] text-sm mt-1">خارطة الطريق الاستراتيجية لـ Blumark24</p>
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

        {/* AI Recommendations */}
        <div className="glass-card p-5 border border-[#22d3ee]/20">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} className="text-[#22d3ee]" />
            <h3 className="text-white font-medium">توصيات الذكاء الاصطناعي</h3>
            <span className="badge bg-[#22d3ee]/20 text-[#22d3ee] text-xs mr-auto">محدّث الآن</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {AI_RECOMMENDATIONS.map((rec) => (
              <div key={rec.title} className="p-3 rounded-xl bg-[#0d1f3c]/60 border border-[#1e3a5f] hover:border-[#22d3ee]/30 transition-all">
                <div className="text-2xl mb-2">{rec.icon}</div>
                <div className="text-sm font-medium text-white mb-1">{rec.title}</div>
                <div className="text-xs text-[#8ba3c7] leading-relaxed">{rec.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute right-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#22d3ee] via-[#1e6fd9] to-[#1e3a5f]" />

          <div className="space-y-6">
            {mockStrategyPhases.map((phase, i) => {
              const statusConf = STATUS_CONFIG[phase.status];
              const Icon = statusConf.icon;
              return (
                <div key={phase.id} className="flex gap-6 relative">
                  {/* Phase indicator */}
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
                    <div className="text-xs text-[#8ba3c7] mt-1">م{phase.id}</div>
                  </div>

                  {/* Phase Card */}
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
                      </div>
                    </div>

                    {/* Progress + Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                        <div className="text-white font-bold text-sm">{i + 1} / {mockStrategyPhases.length}</div>
                      </div>
                    </div>

                    {/* Goals */}
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
      </div>
    </DashboardLayout>
  );
}
