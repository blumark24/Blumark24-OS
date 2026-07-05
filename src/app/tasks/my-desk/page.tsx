"use client";

import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";

export default function MyTwinDeskPage() {
  return (
    <PageGuard permission="manage_tasks">
      <DashboardLayout>
        <div className="rounded-3xl border border-white/10 bg-[#050b16] p-6 text-white">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">مكتبي الذكي</h1>
              <p className="text-sm text-[#8ba3c7]">My Twin Desk</p>
            </div>
            <Link href="/tasks" className="btn-secondary">رجوع للمهام</Link>
          </div>
          <div className="grid gap-4 xl:grid-cols-[280px_1fr_380px]">
            <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">رادار التنبيهات الذكي</aside>
            <main className="min-h-[440px] rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-6 text-center">
              <div className="text-4xl font-black">BLUMARK24</div>
              <div className="mt-24 rounded-3xl border border-cyan-300/30 bg-black/30 p-10">المكتب الرقمي السينمائي</div>
            </main>
            <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">مهامي اليوم</aside>
          </div>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
}
