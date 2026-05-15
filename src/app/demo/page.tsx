import Link from "next/link";

export const metadata = {
  title: "العرض التجريبي | Blumark24 OS",
};

const demoSections = [
  "لوحة التحكم",
  "التحليلات",
  "إدارة العملاء (CRM)",
  "إدارة المهام",
  "المساعد الذكي",
  "نظرة مالية",
  "نظرة الأتمتة",
];

export default function DemoPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050B16] text-white px-4 py-10 sm:px-6 lg:px-8"
      style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="glass-card border border-[rgba(34,211,238,0.24)] p-4 sm:p-5 mb-6">
          <p className="text-sm sm:text-base font-semibold text-[#22D3EE]">نسخة تجريبية للعرض فقط</p>
          <p className="text-xs sm:text-sm text-[#AAB7C7] mt-1">هذه الصفحة مخصصة للاستعراض البصري فقط دون صلاحيات تعديل أو تنفيذ.</p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {demoSections.map((section) => (
            <article
              key={section}
              className="glass-card border border-white/10 p-5 rounded-2xl bg-[rgba(10,22,40,0.7)]"
            >
              <h2 className="text-lg font-semibold text-white mb-2">{section}</h2>
              <p className="text-sm text-[#AAB7C7] mb-4">عرض واجهات وبيانات توضيحية ضمن تجربة Blumark24 OS.</p>
              <button
                type="button"
                disabled
                className="w-full rounded-xl border border-[rgba(34,211,238,0.26)] bg-white/[0.03] px-3 py-2 text-sm text-[#AAB7C7] cursor-not-allowed"
              >
                هذه نسخة تجريبية للعرض فقط
              </button>
            </article>
          ))}
        </section>
      </div>

      <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
        <Link
          href="/#contact"
          className="inline-flex w-full items-center justify-center rounded-2xl font-medium h-12 px-6 text-[15px] bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 transition"
        >
          اطلب نسختك الخاصة
        </Link>
      </div>
    </main>
  );
}
