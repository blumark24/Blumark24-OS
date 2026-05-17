import Link from "next/link";
import { ArrowLeft, Bot, Briefcase, ChartColumn, CircleDollarSign, ListTodo, Users } from "lucide-react";

const tiles = [
  { icon: Briefcase, label: "CRM" },
  { icon: ListTodo, label: "المهام" },
  { icon: CircleDollarSign, label: "المالية" },
  { icon: ChartColumn, label: "التقارير" },
  { icon: Bot, label: "AI Assistant" },
  { icon: Users, label: "الفريق" },
];

export default function LandingHero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-10 md:grid-cols-2 md:items-center sm:px-6 lg:pt-16" id="home">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">نظام إدارة الأعمال بالذكاء الاصطناعي</h1>
        <p className="mt-5 text-base leading-8 text-white/75 sm:text-lg">منصة سعودية ذكية تساعد المنشآت على إدارة العملاء، الموظفين، المهام، التقارير، والعمليات التشغيلية من تجربة واحدة واضحة.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] px-6 py-3 text-white shadow-[0_10px_30px_-14px_rgba(34,211,238,0.95)]">عرض تجريبي <ArrowLeft size={16} /></Link>
          <Link href="/auth" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-white">تسجيل دخول المنشآت</Link>
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-cyan-400/15 via-blue-500/5 to-orange-400/10 blur-2xl" />
        <div className="relative rounded-3xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="mb-4 h-2 w-28 rounded-full bg-white/20" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-2xl border border-white/15 bg-[#0A1628]/70 p-3 text-center text-white/90">
                <tile.icon className="mx-auto mb-2 text-cyan-300" size={18} />
                <p className="text-xs sm:text-sm">{tile.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
