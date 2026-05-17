import Link from "next/link";

export default function LandingFinalCta() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6">
      <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-8 text-center backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">جاهز تبدأ إدارة منشأتك بذكاء؟</h2>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/demo" className="rounded-xl bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] px-6 py-3 text-white">عرض تجريبي</Link>
          <Link href="/auth" className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-white">تسجيل دخول المنشآت</Link>
        </div>
      </div>
    </section>
  );
}
