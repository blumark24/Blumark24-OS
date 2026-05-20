"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { useEmployees } from "@/hooks/useData";
import {
  Network,
  Building2,
  GitBranch,
  Layers3,
  FolderTree,
  Users,
  UserCheck,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

type NodeKind = "board" | "agency" | "directorate" | "section" | "team";

type OrgNode = {
  id: string;
  name: string;
  kind: NodeKind;
  children?: OrgNode[];
};

const HIERARCHY_TEXT = "مجلس الإدارة → الوكالات → الإدارات → الأقسام → الفرق → الموظفون";

const ORG_PLACEHOLDER_TREE: OrgNode[] = [
  {
    id: "board",
    name: "مجلس الإدارة",
    kind: "board",
    children: [
      {
        id: "agency-defense",
        name: "وكالة الدفاع",
        kind: "agency",
        children: [
          {
            id: "dir-ops",
            name: "إدارة العمليات",
            kind: "directorate",
            children: [
              {
                id: "sec-ops",
                name: "قسم التشغيل",
                kind: "section",
                children: [
                  { id: "team-ops-1", name: "فريق تشغيل 1", kind: "team" },
                  { id: "team-ops-2", name: "فريق تشغيل 2", kind: "team" },
                ],
              },
            ],
          },
          {
            id: "dir-tech",
            name: "إدارة التقنية",
            kind: "directorate",
            children: [
              {
                id: "sec-ai",
                name: "قسم الذكاء الاصطناعي",
                kind: "section",
                children: [{ id: "team-ai", name: "فريق AI", kind: "team" }],
              },
            ],
          },
        ],
      },
      {
        id: "agency-attack",
        name: "وكالة الهجوم",
        kind: "agency",
        children: [
          {
            id: "dir-growth",
            name: "إدارة النمو",
            kind: "directorate",
            children: [
              {
                id: "sec-campaigns",
                name: "قسم الحملات",
                kind: "section",
                children: [{ id: "team-camp", name: "فريق الحملات", kind: "team" }],
              },
            ],
          },
          {
            id: "dir-clients",
            name: "إدارة العملاء",
            kind: "directorate",
            children: [
              {
                id: "sec-support",
                name: "قسم خدمة العملاء",
                kind: "section",
                children: [{ id: "team-support", name: "فريق خدمة العملاء", kind: "team" }],
              },
            ],
          },
        ],
      },
    ],
  },
];

const NODE_META: Record<NodeKind, { label: string; color: string; icon: React.ElementType }> = {
  board: { label: "مجلس الإدارة", color: "#22d3ee", icon: Building2 },
  agency: { label: "الوكالات", color: "#8b5cf6", icon: Network },
  directorate: { label: "الإدارات", color: "#3b82f6", icon: Layers3 },
  section: { label: "الأقسام", color: "#10b981", icon: FolderTree },
  team: { label: "الفرق", color: "#f59e0b", icon: GitBranch },
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#21486f] bg-[#0f263f]/70 px-3 py-2 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[11px] text-[#8ba3c7]">{label}</p>
    </div>
  );
}

function TreeNode({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const meta = NODE_META[node.kind];
  const Icon = meta.icon;
  const hasChildren = Boolean(node.children?.length);

  return (
    <li className="w-full min-w-0">
      <div
        className="rounded-2xl border p-3 sm:p-4"
        style={{
          borderColor: `${meta.color}66`,
          background: "linear-gradient(135deg, rgba(10,22,40,0.92), rgba(12,31,54,0.68))",
          boxShadow: `0 8px 26px -16px ${meta.color}3a`,
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-[#8ba3c7]">{meta.label}</p>
            <h3 className="text-sm sm:text-base text-white font-semibold leading-relaxed break-words">{node.name}</h3>
          </div>
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}24`, color: meta.color }}>
            <Icon size={15} />
          </span>
        </div>
      </div>

      {hasChildren && (
        <>
          <div className="h-5 w-px bg-[#2c4d73] mx-auto my-1" />
          <ul className={`grid gap-2 sm:gap-3 w-full ${depth < 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
            {node.children?.map((child) => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </ul>
        </>
      )}
    </li>
  );
}

export default function OrgPage() {
  const { data: employees, loading } = useEmployees();

  const { employeesByDepartment, activeEmployees } = React.useMemo(() => {
    const map = new Map<string, { total: number; active: number }>();
    let activeCount = 0;

    employees.forEach((emp) => {
      const dept = (emp.department || "غير محدد").trim() || "غير محدد";
      const isActive = emp.status === "نشط";
      const current = map.get(dept) ?? { total: 0, active: 0 };

      if (isActive) activeCount += 1;

      map.set(dept, {
        total: current.total + 1,
        active: current.active + (isActive ? 1 : 0),
      });
    });

    const sortedDepartments = Array.from(map.entries())
      .map(([department, counts]) => ({ department, ...counts }))
      .sort((a, b) => b.total - a.total);

    return { employeesByDepartment: sortedDepartments, activeEmployees: activeCount };
  }, [employees]);

  return (
    <PageGuard permission="view_dashboard">
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6" dir="rtl">
          <section className="rounded-2xl border border-[#1f4168] bg-[linear-gradient(135deg,rgba(10,22,40,0.96),rgba(12,31,54,0.74))] p-4 sm:p-6 shadow-[0_22px_60px_-40px_rgba(34,211,238,0.4)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-white flex items-center gap-2">
                  <Network size={22} className="text-[#22d3ee]" />
                  الهيكل التنظيمي
                </h1>
                <p className="text-xs sm:text-sm text-[#8ba3c7] mt-1 leading-relaxed">{HIERARCHY_TEXT}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#22d3ee]/30 bg-[#22d3ee]/10 text-[#22d3ee] text-[11px] sm:text-xs w-fit">
                <Sparkles size={12} />
                نموذج هيكل تنظيمي — المرحلة الأولى
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-[#1f4168] bg-[#0c1f36]/80 p-4 sm:p-5 overflow-x-auto">
            <h2 className="text-sm sm:text-base text-white font-semibold mb-3">التسلسل الهرمي</h2>
            {ORG_PLACEHOLDER_TREE.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#2a4c75] bg-[#0a1628]/50 p-6 text-center text-[#8ba3c7] text-sm">
                لا توجد بيانات هيكل تنظيمي متاحة حالياً.
              </div>
            ) : (
              <ul className="space-y-1 w-full min-w-0">
                {ORG_PLACEHOLDER_TREE.map((node) => (
                  <TreeNode key={node.id} node={node} />
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-[#1f4168] bg-[#0c1f36]/80 p-4 sm:p-5">
            <h2 className="text-sm sm:text-base text-white font-semibold mb-3">توزيع الموظفين</h2>

            {loading ? (
              <div className="rounded-xl border border-dashed border-[#2a4c75] bg-[#0a1628]/50 p-4 text-center text-sm text-[#8ba3c7] mb-4">
                جارٍ التحميل...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                <StatCard label="إجمالي الموظفين" value={employees.length} />
                <StatCard label="الموظفون النشطون" value={activeEmployees} />
                <StatCard label="عدد الأقسام الحالية" value={employeesByDepartment.length} />
              </div>
            )}

            <h3 className="text-xs sm:text-sm text-[#8ba3c7] mb-2">عدد الموظفين حسب الإدارة الحالية</h3>
            {loading ? (
              <p className="text-sm text-[#8ba3c7]">جارٍ تحميل بيانات الموظفين...</p>
            ) : employeesByDepartment.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#2a4c75] bg-[#0a1628]/50 p-6 text-center text-[#8ba3c7] text-sm">
                لا توجد بيانات موظفين حالياً لعرض توزيع الأقسام الحالية.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {employeesByDepartment.map((item) => (
                  <article key={item.department} className="rounded-xl border border-[#25496f] bg-[#102742]/70 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-white break-words">{item.department}</p>
                      <p className="text-xs text-[#8ba3c7]">{item.total} موظف</p>
                    </div>
                    <p className="text-[11px] text-[#6fa8d9] mt-1 flex items-center gap-1">
                      <UserCheck size={12} />
                      النشطون: {item.active}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#29567c] bg-[#0b223a]/85 p-4">
            <p className="text-xs sm:text-sm text-[#b4c7df] leading-relaxed flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#22d3ee]" />
              هذه نسخة عرض أولية لا تغيّر قاعدة البيانات ولا تؤثر على الموظفين الحاليين.
            </p>
          </section>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
}
