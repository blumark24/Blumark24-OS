import Link from "next/link";
import { ArrowLeft, Bot, ChartColumnBig, Bell, Users, CircleDollarSign } from "lucide-react";

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 2 + (i % 4),
  left: 6 + ((i * 11) % 88),
  top: 8 + ((i * 13) % 84),
  delay: `${(i % 6) * 0.7}s`,
  duration: `${8 + (i % 6) * 1.5}s`,
}));

export default function LandingHero() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:pb-24 lg:pt-20" id="home">
      <div className="pointer-events-none absolute inset-0 -z-10">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-cyan-200/60 animate-float-particle"
            style={{ width: p.size, height: p.size, left: `${p.left}%`, top: `${p.top}%`, animationDelay: p.delay, animationDuration: p.duration }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-1.5 text-xs font-medium text-cyan-100">Cinematic AI Business OS</span>
        <h1 className="mt-7 text-4xl font-semibold leading-[1.18] tracking-tight text-white sm:text-5xl lg:text-7xl">
          منصة تشغيل أعمال
          <span className="block bg-gradient-to-l from-cyan-200 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Cinematic Enterprise AI OS</span>
        </h1>
        <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-white/75 sm:text-lg">
          تجربة تشغيل تنفيذية غامرة تجمع CRM، التحليلات، الفريق، والمالية في مشهد واحد حيّ، بوضوح طبقي وذكاء تشغيلي مصمم لصناع القرار.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] px-7 py-3.5 text-white shadow-[0_12px_40px_-20px_rgba(34,211,238,0.95)] transition-all duration-300 hover:-translate-y-1">عرض التجربة <ArrowLeft size={16} /></Link>
          <Link href="/auth" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">تسجيل دخول المنشآت</Link>
        </div>
      </div>

      <div className="relative mt-14 sm:mt-16 lg:mt-20 h-[460px] sm:h-[520px]">
        <div className="absolute inset-x-10 top-8 h-56 rounded-[40px] bg-cyan-400/20 blur-3xl animate-glow-pulse" />
        <div className="absolute left-[8%] top-[18%] w-[34%] rounded-3xl border border-white/20 bg-white/[0.07] p-4 backdrop-blur-2xl shadow-[0_20px_70px_-35px_rgba(34,211,238,0.6)] animate-float-layer">
          <div className="mb-3 flex items-center gap-2 text-cyan-200"><Users size={15} /> CRM Pipeline</div>
          <div className="space-y-2 text-xs text-white/75"><div className="h-2 rounded-full bg-white/15" /><div className="h-2 w-4/5 rounded-full bg-cyan-300/40" /><div className="h-2 w-3/5 rounded-full bg-white/15" /></div>
        </div>

        <div className="absolute right-[10%] top-[9%] w-[30%] rounded-3xl border border-white/20 bg-[rgba(8,20,40,0.72)] p-4 backdrop-blur-2xl shadow-[0_20px_70px_-35px_rgba(56,189,248,0.55)] animate-float-layer" style={{ animationDelay: "1s" }}>
          <div className="mb-3 flex items-center gap-2 text-cyan-200"><Bot size={15} /> AI Assistant</div>
          <p className="text-xs leading-6 text-white/70">تنبيه: معدل التحصيل انخفض ٨٪ هذا الأسبوع. هل تريد خطة استباقية؟</p>
        </div>

        <div className="absolute left-1/2 top-1/2 w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-cyan-200/20 bg-[linear-gradient(180deg,rgba(17,28,51,0.92),rgba(8,14,29,0.84))] p-5 backdrop-blur-3xl shadow-[0_35px_120px_-45px_rgba(34,211,238,0.62)]">
          <div className="mb-4 flex items-center justify-between text-xs text-white/65"><span>Executive Analytics Layer</span><span className="text-cyan-300">Live</span></div>
          <div className="h-40 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_25%_15%,rgba(34,211,238,0.20),transparent_40%),rgba(255,255,255,0.02)] p-3">
            <div className="flex h-full items-end gap-2">{[34, 58, 46, 70, 61, 82, 73].map((h, i) => <span key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-cyan-400/35 to-cyan-300/70" style={{ height: `${h}%` }} />)}</div>
          </div>
        </div>

        <div className="absolute left-[14%] bottom-[8%] w-[26%] rounded-2xl border border-white/20 bg-white/[0.08] p-4 backdrop-blur-xl animate-float-layer" style={{ animationDelay: "1.8s" }}>
          <div className="mb-2 flex items-center gap-2 text-cyan-200"><CircleDollarSign size={14} /> Finance</div>
          <div className="text-xl font-semibold text-white">+ 2.4M SAR</div>
          <p className="text-xs text-white/65">Cashflow growth 14.2%</p>
        </div>

        <div className="absolute right-[15%] bottom-[7%] w-[28%] rounded-2xl border border-white/20 bg-white/[0.08] p-4 backdrop-blur-xl animate-float-layer" style={{ animationDelay: "2.3s" }}>
          <div className="mb-2 flex items-center gap-2 text-cyan-200"><Bell size={14} /> Notifications</div>
          <ul className="space-y-1.5 text-xs text-white/75"><li>• موافقة المدير على خطة الربع القادم</li><li>• إغلاق 3 فرص CRM</li><li>• تحديث نشاط الفريق الآن</li></ul>
        </div>

        <div className="absolute right-[36%] bottom-[2%] w-[22%] rounded-2xl border border-white/20 bg-white/[0.08] p-4 backdrop-blur-xl animate-float-layer" style={{ animationDelay: "2.7s" }}>
          <div className="mb-2 flex items-center gap-2 text-cyan-200"><ChartColumnBig size={14} /> Team Activity</div>
          <p className="text-xs text-white/70">27 مهمة أُنجزت اليوم • 91% productivity</p>
        </div>
      </div>
    </section>
  );
}
