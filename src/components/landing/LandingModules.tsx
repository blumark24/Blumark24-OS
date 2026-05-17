import { Bot, Briefcase, ChartColumn, CircleDollarSign, KeyRound, Settings2, Users, ListTodo } from "lucide-react";

const modules = [
  { icon: Briefcase, label: "العملاء CRM" },
  { icon: Users, label: "الموظفين" },
  { icon: ListTodo, label: "المهام" },
  { icon: CircleDollarSign, label: "المالية" },
  { icon: ChartColumn, label: "التقارير" },
  { icon: Bot, label: "المساعد الذكي" },
  { icon: Settings2, label: "الأتمتة" },
  { icon: KeyRound, label: "الصلاحيات" },
];

export default function LandingModules() { return <section id="modules" className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><h2 className="text-2xl font-bold text-white">الوحدات</h2><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">{modules.map((m)=><div key={m.label} className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur-lg"><m.icon className="mb-3 text-cyan-300" size={18}/><p className="text-sm text-white">{m.label}</p></div>)}</div></section>; }
