const outcomes = ["تقليل الوقت التشغيلي.","رفع وضوح الأداء.","تحسين متابعة الفريق.","قرارات أسرع مبنية على بيانات.","جاهزية أعلى للنمو."];

export default function LandingBusinessOutcomes() {
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" id="how-it-works"><h2 className="text-2xl font-bold text-white">نتائج أعمال ملموسة</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{outcomes.map((item)=><div key={item} className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-white/85">• {item}</div>)}</div></section>;
}
