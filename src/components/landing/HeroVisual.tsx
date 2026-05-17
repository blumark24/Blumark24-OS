import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bot,
  ClipboardCheck,
  FileBarChart,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

const KPIS = [
  { label: "العملاء النشطون", value: "1,248", delta: "+18%", w: "72%", icon: Users, tone: "cyan" as const },
  { label: "المهام المتأخرة", value: "8", delta: "-12%", w: "22%", icon: ClipboardCheck, tone: "warn" as const },
  { label: "الأتمتة", value: "24", delta: "+6", w: "60%", icon: Zap, tone: "cyan" as const },
  { label: "التقارير الذكية", value: "36", delta: "+9", w: "84%", icon: FileBarChart, tone: "cyan" as const },
];

const BADGES = [
  { label: "AI Business OS", pos: "top-right" as const },
  { label: "Arabic-first SaaS", pos: "bottom-left" as const },
  { label: "Built for Saudi Companies", pos: "middle-right" as const },
];

const ACTIVITY = [
  { label: "تم اعتماد تقرير المبيعات", time: "قبل ٣ دقائق" },
  { label: "اكتمل سير أتمتة المتأخرات", time: "قبل ١٢ دقيقة" },
  { label: "عميل جديد: شركة الواحة", time: "قبل ساعة" },
];

function FloatingBadge({ label, position }: { label: string; position: "top-right" | "bottom-left" | "middle-right" }) {
  const placement = {
    "top-right": "top-3 right-3 lg:-top-4 lg:-right-4",
    "bottom-left": "bottom-3 left-3 lg:-bottom-4 lg:-left-4",
    "middle-right": "top-1/2 -translate-y-1/2 right-2 lg:-right-6",
  }[position];

  return (
    <span
      aria-hidden="true"
      dir="ltr"
      className={`pointer-events-none absolute z-20 hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-[rgba(10,22,40,0.85)] backdrop-blur-md px-3 py-1.5 text-[11px] font-medium text-[#22D3EE] shadow-[0_8px_24px_-8px_rgba(34,211,238,0.35)] ${placement}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
      {label}
    </span>
  );
}

function KpiCard({ label, value, delta, w, icon: Icon, tone }: (typeof KPIS)[number]) {
  const deltaColor = tone === "warn" ? "text-[#FF7A3D]" : "text-[#22D3EE]";
  const barColor =
    tone === "warn"
      ? "bg-gradient-to-l from-[#FF7A3D] to-[#FFB066]"
      : "bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9]";

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3 lg:p-3.5 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <Icon className="h-3.5 w-3.5 text-[#22D3EE]/80" strokeWidth={1.6} />
        <span className={`text-[10px] font-medium tabular-nums ${deltaColor}`}>{delta}</span>
      </div>
      <div className="text-[10px] sm:text-[11px] text-white/60 truncate mb-0.5">{label}</div>
      <div className="text-[16px] sm:text-[18px] lg:text-[20px] font-semibold text-white tabular-nums">{value}</div>
      <div className="mt-2 h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: w }} />
      </div>
    </div>
  );
}

function MiniAreaChart() {
  return (
    <svg
      viewBox="0 0 480 140"
      preserveAspectRatio="none"
      className="w-full h-[72px] sm:h-[100px] lg:h-[130px]"
      role="img"
      aria-label="مخطط أداء أسبوعي"
    >
      <defs>
        <linearGradient id="hv-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hv-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1E6FD9" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <path
        d="M 0 92 L 40 80 L 80 88 L 120 64 L 160 72 L 200 50 L 240 58 L 280 36 L 320 44 L 360 22 L 400 30 L 440 14 L 480 8 L 480 140 L 0 140 Z"
        fill="url(#hv-area)"
      />
      <path
        d="M 0 92 L 40 80 L 80 88 L 120 64 L 160 72 L 200 50 L 240 58 L 280 36 L 320 44 L 360 22 L 400 30 L 440 14 L 480 8"
        fill="none"
        stroke="url(#hv-line)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="480" cy="8" r="3.5" fill="#22D3EE" />
    </svg>
  );
}

function DashboardMockup() {
  return (
    <div className="relative rounded-[20px] sm:rounded-[24px] border border-white/[0.10] bg-[rgba(10,22,40,0.78)] backdrop-blur-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)_inset] min-h-[320px] sm:min-h-[420px] lg:min-h-[540px] flex flex-col">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-white/[0.06] bg-[rgba(5,8,22,0.7)]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div
          dir="ltr"
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] text-[10px] text-white/60 font-mono"
        >
          blumark24-os.app/dashboard
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.24)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
          <span className="text-[10px] text-[#22D3EE]">مباشر</span>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 lg:p-5 flex flex-col gap-3 lg:gap-4 min-w-0">
        <div className="flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <div className="text-[11px] text-white/60">لوحة التحكم</div>
            <div className="text-[13px] sm:text-sm lg:text-base font-semibold text-white truncate">
              نظرة عامة — Blumark24 OS
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <Sparkles className="h-3 w-3 text-[#22D3EE]" strokeWidth={1.6} />
            <span className="text-[10px] text-white/60">AI</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 lg:gap-3">
          {KPIS.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2.5 lg:gap-3 flex-1 min-w-0">
          <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 lg:p-4 min-w-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] sm:text-[12px] font-medium text-white">أداء الأسبوع</div>
              <div className="hidden sm:flex gap-1">
                <span className="text-[9.5px] px-1.5 py-0.5 rounded text-white/60">أسبوع</span>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[rgba(34,211,238,0.12)] text-[#22D3EE]">شهر</span>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded text-white/60">سنة</span>
              </div>
            </div>
            <div className="flex-1 flex items-end">
              <MiniAreaChart />
            </div>
          </div>

          <div className="hidden sm:block lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 lg:p-4 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11.5px] sm:text-[12px] font-medium text-white">النشاط الأخير</div>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#22D3EE]">
                عرض الكل
                <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
              </span>
            </div>
            <ul className="space-y-1.5">
              {ACTIVITY.map((it) => (
                <li
                  key={it.label}
                  className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.015] px-2.5 py-1.5 min-w-0"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22D3EE] shadow-[0_0_6px_#22D3EE]" />
                  <span className="flex-1 min-w-0 truncate text-[11.5px] text-white/85">{it.label}</span>
                  <span className="shrink-0 text-[10px] text-white/60">{it.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidePanel({
  icon: Icon,
  label,
  primary,
  secondary,
  trailing,
}: {
  icon: typeof Bot;
  label: string;
  primary: string;
  secondary?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl p-3 sm:p-3.5 lg:p-4 overflow-hidden min-w-0 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.55)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.10),transparent_55%)]"
      />
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br from-[rgba(34,211,238,0.18)] via-[rgba(59,130,246,0.10)] to-[rgba(30,111,217,0.10)] text-[#22D3EE]">
          <Icon className="h-4 w-4" strokeWidth={1.6} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] text-white/60 truncate">{label}</div>
          <div className="text-[13px] sm:text-[14px] font-semibold text-white truncate">{primary}</div>
        </div>
        {trailing}
      </div>
      {secondary && (
        <div className="mt-2.5 text-[11px] text-white/65 leading-snug line-clamp-2">{secondary}</div>
      )}
    </div>
  );
}

export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -inset-y-12 -z-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.22),transparent_60%)] blur-2xl"
      />

      {BADGES.map((b) => (
        <FloatingBadge key={b.label} label={b.label} position={b.pos} />
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.4fr] gap-3 sm:gap-4 lg:gap-5 items-start min-w-0">
        <div className="order-2 lg:order-1 grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3 lg:gap-3.5 min-w-0">
          <SidePanel
            icon={Bot}
            label="المساعد الذكي"
            primary="كيف يمكنني مساعدتك؟"
            secondary="حلّل المهام المتأخرة هذا الأسبوع وأعطني ملخصاً."
          />
          <SidePanel
            icon={Workflow}
            label="الأتمتة"
            primary="12 سير عمل نشط"
            secondary="آخر تشغيل: تذكيرات المتأخرات قبل ٤ دقائق."
            trailing={
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(34,211,238,0.12)] text-[#22D3EE]">
                يعمل
              </span>
            }
          />
          <SidePanel
            icon={BarChart3}
            label="التقارير الذكية"
            primary="٣٦ تقرير هذا الشهر"
            secondary="ملخص مالي + أداء فرق + رضا العملاء."
          />
          <SidePanel
            icon={Activity}
            label="نبض النظام"
            primary="99.98% توفر"
            secondary="استقرار ممتاز خلال الـ٢٤ ساعة الماضية."
          />
        </div>
        <div className="order-1 lg:order-2 min-w-0">
          <DashboardMockup />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="mt-3 sm:mt-4 hidden md:flex items-center justify-center gap-2 text-[10.5px] text-white/60"
      >
        <Activity className="h-3 w-3 text-[#22D3EE]" strokeWidth={1.6} />
        <span>عرض حيّ مبسّط — البيانات الفعلية تظهر بعد تسجيل الدخول</span>
      </div>
    </div>
  );
}
